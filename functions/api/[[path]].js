// Cloudflare Pages Functions：所有 /api/* 统一入口
// 数据只存一份 KV（site:state）；匿名读走字段白名单快照，管理端读写走完整 state
import { json, fail, withSecurity, fetchUrlSafe, safeHref } from '../../lib/security.js';
import {
    readSession, signSession, verifyPassword, sessionCookie, clearCookie,
    sameOriginOk, clientIp, RateLimiter
} from '../../lib/auth.js';
import { KVStore, buildSnapshot, readVisits } from '../../lib/store.js';

const limiter = new RateLimiter();

const PUBLIC_GET = new Set([
    '/api/data', '/api/categories', '/api/public/categories',
    '/api/search-engines', '/api/announcements', '/api/announcements/active',
    '/api/website-settings'
]);
// 允许进入状态层的路径；未命中直接 404，避免任意路径探测
const API_ROUTES = [
    /^\/api\/bookmarks(\/\d+)?$/,
    /^\/api\/categories(\/\d+(\/(sort|links))?)?$/,
    /^\/api\/links\/\d+(\/sort)?$/,
    /^\/api\/dashboard$/,
    /^\/api\/announcements(\/\d+)?$/,
    /^\/api\/clear-all-data$/,
    /^\/api\/image-sources(\/\d+)?$/,
    /^\/api\/search-engines(\/\d+|\/active)?$/,
    /^\/api\/pending-bookmarks(\/\d+\/(approve|reject))?$/,
    /^\/api\/website-settings$/,
    /^\/api\/v1\/jsadd$/,
    /^\/api\/backup$/,
    /^\/api\/restore$/,
    /^\/api\/import-bulk$/
];

function publicData(snap) {
    const grouped = new Map();
    for (const link of snap.links) {
        const key = Number(link.category_id);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(link);
    }
    return snap.categories.map(c => ({ ...c, links: grouped.get(Number(c.category_id)) || [] }));
}

function publicResponse(path, snap, request) {
    const version = '"v' + Number(snap.v || 0) + '"';
    const headers = { ETag: version, 'Cache-Control': 'public, max-age=0, must-revalidate' };
    if (request.headers.get('If-None-Match') === version) {
        return new Response(null, { status: 304, headers });
    }
    switch (path) {
        case '/api/data':
            return json(publicData(snap), 200, headers);
        case '/api/categories':
            return json({
                success: true,
                data: snap.categories.map(c => ({
                    ...c,
                    link_count: snap.links.filter(l => Number(l.category_id) === Number(c.category_id)).length
                }))
            }, 200, headers);
        case '/api/public/categories':
            return json({ success: true, data: snap.categories }, 200, headers);
        case '/api/search-engines':
            return json({ success: true, data: { search_engines: snap.search_engines, categories: snap.categories } }, 200, headers);
        case '/api/announcements':
        case '/api/announcements/active':
            return json(snap.announcements, 200, headers);
        case '/api/website-settings':
            return json({ success: true, data: snap.settings }, 200, headers);
        default:
            return fail('接口不存在', 404);
    }
}

async function handleWebsiteDescription(request, env, url, ip) {
    const session = await readSession(request, env.SESSION_SECRET);
    if (!session) return fail('未登录', 401);
    if (!limiter.check('desc:' + ip, 20, 60000).ok) return fail('请求过于频繁', 429);
    const target = url.searchParams.get('url') || '';
    try {
        const html = await fetchUrlSafe(target);
        const d = html.match(/<meta[^>]*name=["'](?:description|Description)["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const i = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i);
        let icon = i && i[1] ? i[1] : '';
        if (icon && !/^https?:\/\//i.test(icon)) {
            try { icon = new URL(icon, target).href; } catch (_) { icon = ''; }
        }
        return json({ success: true, description: (d && d[1] ? d[1] : '').slice(0, 500), icon: icon ? safeHref(icon) : '' });
    } catch (error) {
        return json({ success: false, description: '', icon: '', message: error.message });
    }
}

async function handle(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    // 对齐 Express 非 strict routing，容忍尾斜杠
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    const method = request.method;
    const ip = clientIp(request);

    // CSRF：所有非幂等 API 必须来自本站
    if (path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !sameOriginOk(request)) {
        return fail('跨站请求被拒绝', 403);
    }

    // Pages Functions 无状态，投稿限流放在模块级（store 内的实例级限流仅作同 isolate 补充）
    if (path === '/api/pending-bookmarks' && method === 'POST'
        && !limiter.check('submit:' + ip, 5, 60000).ok) {
        return fail('提交过于频繁，请稍后再试', 429);
    }

    if (path === '/api/login' && method === 'POST') {
        if (!limiter.check('login:' + ip, 10, 60000).ok) return fail('尝试过于频繁，请稍后再试', 429);
        let body = {};
        try { body = await request.json(); } catch (_) { /* 空 body */ }
        const username = env.ADMIN_USERNAME || 'admin';
        const userOk = String(body.username || '') === username;
        const passOk = userOk && env.ADMIN_PASSWORD_HASH && await verifyPassword(String(body.password || ''), env.ADMIN_PASSWORD_HASH);
        if (!passOk) return fail('用户名或密码错误', 401);
        if (!env.SESSION_SECRET) return fail('服务端未配置 SESSION_SECRET', 500);
        const token = await signSession(username, env.SESSION_SECRET);
        return json({ success: true, message: '登录成功' }, 200, { 'Set-Cookie': sessionCookie(token) });
    }
    if (path === '/api/logout' && method === 'POST') {
        return json({ success: true, message: '已退出' }, 200, { 'Set-Cookie': clearCookie() });
    }
    if (path === '/api/check-login' && method === 'GET') {
        const session = await readSession(request, env.SESSION_SECRET);
        return session
            ? json({ success: true, loggedIn: true, username: session.username })
            : json({ success: true, loggedIn: false });
    }
    if (path === '/api/test' || path === '/api/simple-test') {
        return json({ success: true, message: 'ok', runtime: 'cloudflare-pages', version: Date.now() });
    }

    // KV 绑定缺失时直接给出可操作的提示，避免 TypeError 与脏缓存造成"时好时坏"的假象
    if (!env.NAV_KV) return fail('服务端未配置 KV 绑定 NAV_KV：请在项目「设置 → 绑定」添加后重新部署', 500);

    const store = new KVStore(env);
    await store.ensure();
    const session = await readSession(request, env.SESSION_SECRET).catch(() => null);

    // 公开读走快照 + ETag；管理员额外拿到未激活公告与完整设置（写后即时可见）
    if (method === 'GET' && PUBLIC_GET.has(path)) {
        const base = buildSnapshot(store.state);
        const snap = session
            ? { ...base, announcements: store.state.announcements, settings: { ...store.state.settings } }
            : base;
        const response = publicResponse(path, snap, request);
        if (!session) return response;
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'private, no-store');
        return new Response(response.body, { status: response.status, headers });
    }

    if (path === '/api/website-description' && method === 'GET') {
        return handleWebsiteDescription(request, env, url, ip);
    }

    if (!path.startsWith('/api/')) return fail('接口不存在', 404);
    if (!API_ROUTES.some(re => re.test(path))) return fail('接口不存在', 404);

    // 仪表盘展示近 7 天 PV（优先 D1，未绑定时回落 KV；不回写 site:state）
    if (path === '/api/dashboard' && method === 'GET') {
        const recent = await readVisits(env);
        for (const [day, count] of Object.entries(recent)) {
            if (count) store.state.visits[day] = count;
        }
    }

    return store.fetch(request);
}

export async function onRequest(context) {
    let response;
    try {
        response = await handle(context);
    } catch (error) {
        console.error('Pages API error', error);
        response = fail('服务器内部错误: ' + error.message, 500);
    }
    return withSecurity(response, context.request.url);
}
