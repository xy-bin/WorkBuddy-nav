// Pages + KV 回归测试：纯内存 mock，无需 Cloudflare 账号
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { onRequest } from '../functions/api/[[path]].js';
import { onRequest as middleware } from '../functions/_middleware.js';
import { onRequestGet as adminPage } from '../functions/admin.html.js';
import { hashPassword, getJsaddToken } from '../lib/auth.js';
import { STATE_KEY } from '../lib/store.js';

const ORIGIN = 'https://nav.test';

class MockKV {
    constructor() { this.map = new Map(); this.writes = 0; }
    async get(key, type) {
        const v = this.map.get(key);
        if (v === undefined) return null;
        return type === 'json' ? JSON.parse(v) : String(v);
    }
    async put(key, value) { this.writes += 1; this.map.set(key, String(value)); }
    raw(key) { const v = this.map.get(key); return v ? JSON.parse(v) : null; }
}

const kv = new MockKV();
const env = {
    NAV_KV: kv,
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD_HASH: await hashPassword('test-pass'),
    SESSION_SECRET: 'test-session-secret-0123456789',
    JSADD_TOKEN: 'test-jsadd-token'
};

function context(method, path, opts = {}) {
    const headers = new Headers(opts.headers || {});
    if (!headers.has('Origin')) headers.set('Origin', ORIGIN);
    if (opts.cookie) headers.set('Cookie', opts.cookie);
    if (opts.ip) headers.set('CF-Connecting-IP', opts.ip);
    const init = { method, headers };
    if (opts.body !== undefined) {
        headers.set('Content-Type', 'application/json');
        init.body = JSON.stringify(opts.body);
    }
    const request = new Request(ORIGIN + path, init);
    return {
        request, env: opts.env || env, params: {},
        waitUntil: () => {},
        next: async () => new Response('static-ok', { status: 200 })
    };
}

async function api(method, path, opts = {}) {
    const res = await onRequest(context(method, path, opts));
    let data = null;
    try { data = await res.clone().json(); } catch (_) { /* 非 JSON 响应 */ }
    return { res, data };
}

let passed = 0;
let failed = 0;
async function test(name, fn) {
    try { await fn(); passed += 1; console.log('PASS  ' + name); }
    catch (e) { failed += 1; console.log('FAIL  ' + name + ' -> ' + e.message); }
}

let cookie = '';

await test('首次 /api/data 自动用种子初始化 KV，返回分组数据', async () => {
    const { res, data } = await api('GET', '/api/data');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(data) && data.length >= 6);
    assert.ok(Array.isArray(data[0].links));
    assert.ok(kv.raw(STATE_KEY), 'KV 中应已写入 site:state');
});

await test('ETag 命中返回 304', async () => {
    const first = await api('GET', '/api/data');
    const etag = first.res.headers.get('ETag');
    assert.ok(etag);
    const second = await onRequest(context('GET', '/api/data', { headers: { 'If-None-Match': etag } }));
    assert.equal(second.status, 304);
});

await test('公开快照不含私有字段与未激活公告', async () => {
    const { data } = await api('GET', '/api/data');
    assert.ok(!JSON.stringify(data).includes('submitter_contact'));
    const ann = await api('GET', '/api/announcements');
    assert.ok(Array.isArray(ann.data));
    assert.ok(ann.data.every(a => Number(a.is_active) === 1), '匿名不得看到未激活公告');
});

await test('公开读带安全响应头', async () => {
    const { res } = await api('GET', '/api/data');
    assert.ok(res.headers.get('Content-Security-Policy'));
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
});

await test('未知 API 路径 404，不穿透到状态层', async () => {
    const { res } = await api('GET', '/api/not-exists');
    assert.equal(res.status, 404);
});

await test('未登录访问管理端接口 401', async () => {
    const { res } = await api('GET', '/api/dashboard');
    assert.equal(res.status, 401);
});

await test('跨站写操作被 CSRF 拦截 403', async () => {
    const { res } = await api('POST', '/api/categories', {
        headers: { Origin: 'https://evil.test' },
        body: { category_name: 'hack' }
    });
    assert.equal(res.status, 403);
});

await test('登录：错误口令 401，正确口令下发 HttpOnly 签名 Cookie', async () => {
    const bad = await api('POST', '/api/login', { ip: 'ip-a', body: { username: 'admin', password: 'wrong' } });
    assert.equal(bad.res.status, 401);
    const good = await api('POST', '/api/login', { ip: 'ip-b', body: { username: 'admin', password: 'test-pass' } });
    assert.equal(good.res.status, 200);
    const setCookie = good.res.headers.get('Set-Cookie');
    assert.ok(setCookie && setCookie.includes('HttpOnly'));
    cookie = setCookie.split(';')[0];
});

await test('check-login 识别有效 Cookie', async () => {
    const { data } = await api('GET', '/api/check-login', { cookie });
    assert.equal(data.loggedIn, true);
});

await test('管理端读完整公告（含未激活）', async () => {
    const { res, data } = await api('GET', '/api/announcements', { cookie });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(data.data || data));
});

await test('管理端 CRUD：新增分类后立即可读（写后一致）', async () => {
    const add = await api('POST', '/api/categories', { cookie, body: { category_name: '测试分类', category_icon: 'fa fa-star', sort: 99 } });
    assert.equal(add.res.status, 200);
    assert.equal(add.data.success, true);
    const list = await api('GET', '/api/categories', { cookie });
    assert.ok(JSON.stringify(list.data).includes('测试分类'));
});

await test('匿名投稿：XSS payload 原样入库但不执行', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { res } = await api('POST', '/api/pending-bookmarks', {
        ip: 'ip-submit-1',
        body: { link_name: payload, link_url: 'https://xss.test/', submitter_name: 'tester', submitter_contact: 'private-phone' }
    });
    assert.equal(res.status, 200);
    const state = kv.raw(STATE_KEY);
    assert.ok(state.pending_bookmarks.some(p => p.link_name === payload));
    const pub = await api('GET', '/api/data');
    assert.ok(!JSON.stringify(pub.data).includes('private-phone'));
});

await test('SQL 注入串作为 URL 不破坏数据', async () => {
    const { res } = await api('POST', '/api/pending-bookmarks', {
        ip: 'ip-submit-2',
        body: { link_name: 'inject', link_url: "https://e.test/'; DROP TABLE links;--", submitter_name: 'tester' }
    });
    assert.equal(res.status, 200);
    const after = await api('GET', '/api/data');
    assert.equal(after.res.status, 200);
    assert.ok(Array.isArray(after.data) && after.data.length >= 6);
});

await test('投稿限流：同一 IP 第 6 次 429', async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
        const r = await api('POST', '/api/pending-bookmarks', {
            ip: 'ip-flood',
            body: { link_name: 'n' + i, link_url: 'https://flood.test/' + i, submitter_name: 't' }
        });
        last = r.res.status;
    }
    assert.equal(last, 429);
});

await test('管理员审核通过后，链接出现在公开 /api/data', async () => {
    const pending = await api('GET', '/api/pending-bookmarks', { cookie });
    const items = pending.data.data || pending.data;
    assert.ok(Array.isArray(items) && items.length > 0);
    const target = items.find(x => x.link_url === 'https://xss.test/');
    assert.ok(target);
    const approve = await api('PUT', '/api/pending-bookmarks/' + target.id + '/approve', { cookie });
    assert.equal(approve.res.status, 200);
    const pub = await api('GET', '/api/data');
    assert.ok(JSON.stringify(pub.data).includes('https://xss.test/'));
});

await test('website-settings 只接受公开键白名单', async () => {
    const { res } = await api('POST', '/api/website-settings', {
        cookie, body: { site_title: '我的导航', admin_secret: 'should-not-store' }
    });
    assert.equal(res.status, 200);
    const state = kv.raw(STATE_KEY);
    assert.equal(state.settings.site_title, '我的导航');
    assert.ok(!('admin_secret' in state.settings));
});

await test('管理页 /admin.html 未登录 302，已登录放行', async () => {
    const anon = await adminPage(context('GET', '/admin.html'));
    assert.equal(anon.status, 302);
    assert.equal(anon.headers.get('Location'), '/login.html');
    const auth = await adminPage(context('GET', '/admin.html', { cookie }));
    assert.equal(auth.status, 200);
});

await test('登录限流：第 11 次 429', async () => {
    let last = 0;
    for (let i = 0; i < 11; i++) {
        const r = await api('POST', '/api/login', { ip: 'ip-login-flood', body: { username: 'admin', password: 'x' } });
        last = r.res.status;
    }
    assert.equal(last, 429);
});

await test('中间件：/admin 别名未登录一律 302，登录后放行', async () => {
    for (const p of ['/admin', '/admin/', '/admin.html']) {
        const anon = await middleware(context('GET', p));
        assert.equal(anon.status, 302, p + ' 未登录应跳登录页');
        const auth = await middleware(context('GET', p, { cookie }));
        assert.equal(auth.status, 200, p + ' 已登录应放行');
    }
});

await test('中间件：敏感路径与编码绕过 404，合法静态放行', async () => {
    for (const p of ['/server.js', '/data/navxybintop.db', '/lib/auth.js', '/seed.js', '/%64ata/navxybintop.db', '/functions/api/x.js']) {
        const r = await middleware(context('GET', p));
        assert.equal(r.status, 404, p + ' 应被默认拒绝');
    }
    assert.equal((await middleware(context('GET', '/js/main.js'))).status, 200);
    assert.equal((await middleware(context('GET', '/vendor/jquery/dist/jquery.min.js'))).status, 200);
    assert.equal((await middleware(context('GET', '/vendor/font-awesome/fonts/fontawesome-webfont.woff2'))).status, 200);
    assert.equal((await middleware(context('GET', '/node_modules/jquery/dist/jquery.min.js'))).status, 404);
    assert.equal((await middleware(context('GET', '/'))).status, 200);
    assert.equal((await middleware(context('GET', '/api/data'))).status, 200);
});

await test('Pages 产物不含 node_modules 目录且 HTML 引用 vendor/', async () => {
    const root = new URL('../public/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    assert.ok(!existsSync(join(root, 'node_modules')), 'node_modules 会被 Pages 忽略，产物不得包含');
    assert.ok(existsSync(join(root, 'vendor/jquery/dist/jquery.min.js')), 'vendor 目录必须存在');
    for (const name of ['index.html', 'admin.html', 'login.html']) {
        const html = readFileSync(join(root, name), 'utf8');
        assert.ok(!html.includes('node_modules/'), name + ' 仍引用了会被忽略的路径');
    }
});

await test('jsadd token 仅在已登录管理页动态注入', async () => {
    const html = '<html><head><title>admin</title></head><body>ok</body></html>';
    const mk = (p, withCookie) => {
        const c = context('GET', p, withCookie ? { cookie } : {});
        c.next = async () => new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        return c;
    };
    const anonBody = await (await middleware(mk('/admin', false))).text();
    assert.ok(!anonBody.includes('__JSADD_TOKEN__'), '未登录绝不能注入 token');

    const auth = await middleware(mk('/admin', true));
    const body = await auth.text();
    assert.ok(body.includes('window.__JSADD_TOKEN__='), '已登录管理页应注入 token');
    assert.ok(body.includes(env.JSADD_TOKEN), '注入值应来自环境变量');
    assert.ok(body.indexOf('__JSADD_TOKEN__') < body.indexOf('</head>'), '注入脚本须在 head 内、业务脚本之前');
    assert.equal(auth.headers.get('Cache-Control'), 'no-store');

    const publicPage = context('GET', '/index.html');
    publicPage.next = async () => new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
    assert.ok(!(await (await middleware(publicPage)).text()).includes('__JSADD_TOKEN__'), '公开页不应注入');
});

await test('仓库内所有文件均不含硬编码凭据字面量', async () => {
    const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const bad = [];
    const patterns = [
        /const\s+token\s*=\s*['"][A-Za-z0-9_\-]{16,}['"]/,
        /jsAddToken\s*=\s*['"][A-Za-z0-9_\-]{16,}['"]/,
        /SESSION_SECRET\s*=\s*['"][A-Za-z0-9_\-]{24,}['"]/
    ];
    function walk(dir) {
        for (const name of readdirSync(dir)) {
            if (['node_modules', '.git', '.wrangler', 'dist'].includes(name)) continue;
            const p = join(dir, name);
            if (statSync(p).isDirectory()) { walk(p); continue; }
            if (/\.(woff2?|ttf|eot|otf|png|jpe?g|gif|ico)$/i.test(p)) continue;
            const s = readFileSync(p, 'utf8');
            if (patterns.some(re => re.test(s))) bad.push(p.replace(root, ''));
        }
    }
    walk(root);
    assert.deepEqual(bad, [], '发现硬编码凭据: ' + bad.join(', '));
});

await test('按分类筛选与单条书签均返回 bookmark_* 字段（后台表格不会空白）', async () => {
    const all = await api('GET', '/api/bookmarks', { cookie });
    assert.equal(all.res.status, 200);
    assert.ok(all.data.data.length > 0);
    const first = all.data.data[0];
    const one = await api('GET', '/api/bookmarks/' + first.bookmark_id, { cookie });
    const byCat = await api('GET', '/api/categories/' + first.category_id + '/links', { cookie });
    assert.equal(one.res.status, 200);
    assert.equal(byCat.res.status, 200);
    assert.ok(byCat.data.data.length > 0, '分类筛选应返回书签');
    for (const [label, list] of [['单条', [one.data.data]], ['分类筛选', byCat.data.data]]) {
        for (const b of list) {
            assert.ok(b.bookmark_id !== undefined && b.bookmark_id !== '', label + ': 缺 bookmark_id');
            assert.ok(b.bookmark_name, label + ': 缺 bookmark_name');
            assert.ok(/^https?:\/\//.test(b.bookmark_url || ''), label + ': 缺 bookmark_url');
            assert.equal(b.link_id, undefined, label + ': 不应残留 link_* 字段');
        }
    }
});

await test('KV 未绑定时稳定返回明确提示，不出现 TypeError 或间歇性 200', async () => {
    const noKv = { ...env, NAV_KV: undefined };
    for (let i = 0; i < 3; i++) {
        const res = await onRequest(context('GET', '/api/data', { env: noKv }));
        const body = await res.clone().json();
        assert.equal(res.status, 500, '第 ' + (i + 1) + ' 次请求应为 500');
        assert.ok(String(body.message).includes('NAV_KV'), '错误信息应指出缺失的绑定名');
        assert.ok(!String(body.message).includes('undefined'), '不应泄漏 TypeError 文案');
    }
});

await test('搜索引擎：种子与公开接口都带 is_active，默认全部启用', async () => {
    const { res, data } = await api('GET', '/api/search-engines');
    assert.equal(res.status, 200);
    const list = data.data.search_engines;
    assert.ok(list.length >= 5);
    assert.ok(list.every(e => e.is_active === 1), '旧数据缺字段时也应归一化为启用');
});

await test('搜索引擎：批量启停需登录，匿名 401', async () => {
    const { res } = await api('PUT', '/api/search-engines/active', { body: { active: 0 } });
    assert.equal(res.status, 401);
});

await test('搜索引擎：全部停用后公开接口仍返回完整列表（后台可管理）', async () => {
    const put = await api('PUT', '/api/search-engines/active', { cookie, body: { active: 0 } });
    assert.equal(put.res.status, 200);
    assert.ok(put.data.data.every(e => e.is_active === 0));
    const { data } = await api('GET', '/api/search-engines');
    assert.equal(data.data.search_engines.length, put.data.data.length);
    assert.ok(data.data.search_engines.every(e => e.is_active === 0));
});

await test('搜索引擎：states 精确批量更新，未列出的引擎保持不变', async () => {
    const first = await api('PUT', '/api/search-engines/active', { cookie, body: { states: { 1: 1, 2: 0 } } });
    assert.equal(first.res.status, 200);
    const byId = Object.fromEntries(first.data.data.map(e => [e.search_engine_id, e.is_active]));
    assert.equal(byId[1], 1);
    assert.equal(byId[2], 0);
    assert.equal(byId[3], 0);
    const { data } = await api('GET', '/api/search-engines');
    const got = Object.fromEntries(data.data.search_engines.map(e => [e.search_engine_id, e.is_active]));
    assert.equal(got[1], 1);
    assert.equal(got[2], 0);
});

await test('搜索引擎：单条只改 is_active 时不清空名称与 URL', async () => {
    const before = (await api('GET', '/api/search-engines')).data.data.search_engines.find(e => e.search_engine_id === 1);
    const put = await api('PUT', '/api/search-engines/1', { cookie, body: { is_active: 0 } });
    assert.equal(put.res.status, 200);
    const after = (await api('GET', '/api/search-engines')).data.data.search_engines.find(e => e.search_engine_id === 1);
    assert.equal(after.is_active, 0);
    assert.equal(after.engine_name, before.engine_name);
    assert.equal(after.engine_url, before.engine_url);
    assert.equal(after.engine_key, before.engine_key);
});

await test('搜索引擎：非法参数被拒绝；新增引擎默认启用；最后恢复全部开启', async () => {
    const bad = await api('PUT', '/api/search-engines/active', { cookie, body: {} });
    assert.notEqual(bad.res.status, 200);
    const added = await api('POST', '/api/search-engines', {
        cookie, body: { engine_name: '测试引擎', engine_key: 'test-engine', engine_url: 'https://example.com/s?q=', sort: 99 }
    });
    assert.equal(added.res.status, 200);
    assert.equal(added.data.data.is_active, 1);
    const id = added.data.data.search_engine_id;
    const removed = await api('DELETE', '/api/search-engines/' + id, { cookie });
    assert.equal(removed.res.status, 200);
    const all = await api('PUT', '/api/search-engines/active', { cookie, body: { active: 1 } });
    assert.equal(all.res.status, 200);
    assert.ok(all.data.data.every(e => e.is_active === 1));
});

await test('KV 写入次数受控：无 Alarm、无逐 PV 写盘', async () => {
    assert.ok(kv.writes > 0);
    assert.ok(kv.writes < 50, '单次会话内 KV 写入不应失控，实际 ' + kv.writes);
});

await test('一键添加：未配 JSADD_TOKEN 时由 SESSION_SECRET 派生令牌，登录页注入且接口可用', async () => {
    const derivedEnv = { ...env, JSADD_TOKEN: undefined };
    const expected = await getJsaddToken(derivedEnv);
    assert.match(expected, /^[0-9a-f]{64}$/, '应派生 64 位十六进制令牌');
    assert.notEqual(expected, derivedEnv.SESSION_SECRET, '不得直接暴露会话密钥');

    const html = '<html><head><title>admin</title></head><body>ok</body></html>';
    const ctx = context('GET', '/admin', { cookie, env: derivedEnv });
    ctx.next = async () => new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    const body = await (await middleware(ctx)).text();
    assert.ok(body.includes('window.__JSADD_TOKEN__="' + expected + '"'), '已登录管理页应注入派生令牌');

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(
        '<html><head><meta name="description" content="测试描述"><link rel="icon" href="/favicon.ico"></head></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
    let res;
    try {
        const target = encodeURIComponent('https://example.com/jsadd-probe');
        res = await onRequest(context('GET', '/api/v1/jsadd?token=' + expected + '&name=' + encodeURIComponent('测试站点') + '&url=' + target, {
            env: derivedEnv
        }));
    } finally {
        globalThis.fetch = originalFetch;
    }
    assert.equal(res.status, 200);
    const page = await res.text();
    assert.ok(page.includes('添加成功'), '应显示成功结果页');
    assert.ok(page.includes('nav-jsadd-close'), '结果页应支持关闭弹层');
    assert.equal(res.headers.get('X-Frame-Options'), null, '结果页不得带 SAMEORIGIN，否则 iframe 无法嵌入');
    assert.ok((res.headers.get('Content-Security-Policy') || '').includes('frame-ancestors *'));
});

await test('一键添加：错误令牌 401 友好页，且响应不泄露令牌', async () => {
    const target = encodeURIComponent('https://example.com/another');
    const res = await onRequest(context('GET', '/api/v1/jsadd?token=wrong&name=x&url=' + target));
    assert.equal(res.status, 401);
    const body = await res.text();
    assert.ok(body.includes('添加令牌无效'));
    assert.ok(!body.includes(env.JSADD_TOKEN));
});

await test('一键添加：已存在网址与非法地址不会写入 KV', async () => {
    const before = kv.writes;
    const link = kv.raw(STATE_KEY).links.find(l => /^https?:\/\//.test(l.link_url));
    assert.ok(link, '种子数据应有可测试的网址');
    const dup = await onRequest(context('GET', '/api/v1/jsadd?token=' + env.JSADD_TOKEN + '&name=duplicate&url=' + encodeURIComponent(link.link_url)));
    assert.equal(dup.status, 400);
    assert.ok((await dup.text()).includes('该网址已存在'));
    const bad = await onRequest(context('GET', '/api/v1/jsadd?token=' + env.JSADD_TOKEN + '&name=bad&url=' + encodeURIComponent('http://127.0.0.1/')));
    assert.equal(bad.status, 400);
    assert.ok((await bad.text()).includes('参数不合法'));
    assert.equal(kv.writes, before, '失败路径不得产生 KV 写入');
});

await test('批量导入：单次请求只写 1 次 KV，按 URL 去重且幂等可重入', async () => {
    const before = kv.writes;
    const items = [
        { bookmark_name: '批量测试A', bookmark_url: 'https://example.com/bulk-a', category_name: '批量测试类' },
        { bookmark_name: '批量测试B', bookmark_url: 'https://example.com/bulk-b', category_name: '批量测试类' },
        { bookmark_name: '批量测试C', bookmark_url: 'https://example.com/bulk-a', category_name: '批量测试类' } // 重复 URL
    ];
    const r1 = await api('POST', '/api/import-bulk', { cookie, body: { items } });
    assert.equal(r1.res.status, 200, '应成功');
    assert.equal(r1.data.success, true);
    assert.equal(r1.data.data.imported, 2, '去重后应导入 2 条');
    assert.equal(r1.data.data.createdCategories, 1, '应创建 1 个新分类');
    assert.equal(r1.data.data.skipped, 1, '重复 URL 应跳过 1 条');
    assert.equal(kv.writes, before + 1, '批量导入只应写 1 次 KV（规避同 key 1 写/秒限速）');
    // 幂等：再次导入相同数据应全部跳过，不再新增、不报错
    const before2 = kv.writes;
    const r2 = await api('POST', '/api/import-bulk', { cookie, body: { items } });
    assert.equal(r2.data.data.imported, 0, '重复导入不应新增');
    assert.equal(r2.data.data.skipped, 3, '第二次应全部跳过');
    assert.equal(kv.writes, before2 + 1, '第二次也只写 1 次 KV');
});

console.log('\n通过 ' + passed + ' 项，失败 ' + failed + ' 项；KV 写入 ' + kv.writes + ' 次');
if (failed) process.exit(1);
