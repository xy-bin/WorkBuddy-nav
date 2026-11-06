// Pages + KV 状态层：dispatch 逻辑源自 cf/src/state.js，存储后端由 Durable Object 换成 Workers KV
// 修改路由逻辑时请同步 cf/src/state.js 与 pages/lib/store.js
import seed from './seed.js';
import { json, fail, escHtml, safeHref, PUBLIC_SETTING_KEYS, fetchUrlSafe, isSafeOutboundUrl } from './security.js';
import { readSession } from './auth.js';

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const int = v => { const n = parseInt(v, 10); return Number.isInteger(n) ? n : null; };
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const bySort = (a, b) => num(a.sort) - num(b.sort);
const clone = v => JSON.parse(JSON.stringify(v));

const DEFAULT_SETTINGS = {
    site_title: '导航站', site_logo: '', site_keywords: '', site_description: '',
    site_copyright: '', site_icp: '', site_footer: '', site_footer_custom: ''
};

function maxId(rows, key) {
    return rows.reduce((m, r) => Math.max(m, Number(r[key]) || 0), 0);
}

export function buildInitialState() {
    return {
        version: 1,
        counters: {
            category: maxId(seed.categories, 'category_id'),
            link: maxId(seed.links, 'link_id'),
            engine: maxId(seed.search_engines, 'search_engine_id'),
            announcement: maxId(seed.announcements, 'id'),
            pending: maxId(seed.pending_bookmarks, 'id'),
            image: maxId(seed.image_sources || [], 'id')
        },
        categories: clone(seed.categories || []),
        links: clone(seed.links || []),
        search_engines: clone(seed.search_engines || []),
        announcements: clone(seed.announcements || []),
        pending_bookmarks: clone(seed.pending_bookmarks || []),
        image_sources: clone(seed.image_sources || []),
        settings: { ...DEFAULT_SETTINGS, ...clone(seed.website_settings || {}) },
        visits: clone(seed.visits || {})
    };
}

// 只含公开字段：提交者联系方式、未激活公告、非公开设置一律不进 KV
export function buildSnapshot(s) {
    const settings = {};
    for (const [k, v] of Object.entries(s.settings)) {
        if (PUBLIC_SETTING_KEYS.has(k)) settings[k] = v;
    }
    return {
        v: s.version,
        t: now(),
        categories: s.categories.slice().sort(bySort),
        links: s.links.slice().sort(bySort),
        search_engines: s.search_engines.slice().sort(bySort),
        announcements: s.announcements.filter(a => Number(a.is_active) === 1),
        settings
    };
}

function toBookmark(link, s) {
    const cat = s.categories.find(c => Number(c.category_id) === Number(link.category_id));
    return {
        bookmark_id: link.link_id,
        bookmark_name: link.link_name,
        bookmark_url: link.link_url,
        bookmark_icon: link.link_icon,
        bookmark_description: link.link_desc,
        sort: link.sort,
        category_name: cat ? cat.category_name : '未分类',
        category_id: link.category_id || 0
    };
}

function pickName(b) { return String(b.bookmark_name || b.link_name || b.name || '').trim(); }
function pickUrl(b) { return String(b.bookmark_url || b.link_url || b.url || '').trim(); }
function pickDesc(b) { return String(b.bookmark_description || b.link_desc || b.description || ''); }
function pickIcon(b) { return String(b.bookmark_icon || b.link_icon || b.icon || 'fa fa-link'); }

export const STATE_KEY = 'site:state';
let fresh = null;

function getFresh() {
    return fresh && Date.now() - fresh.t < 60000 ? fresh.state : null;
}
function setFresh(s) {
    fresh = { t: Date.now(), state: JSON.parse(JSON.stringify(s)) };
}

function normalizeState(s) {
    const base = buildInitialState();
    return {
        version: Number(s.version) || 1,
        counters: Object.assign({}, base.counters, s.counters || {}),
        categories: Array.isArray(s.categories) ? s.categories : base.categories,
        links: Array.isArray(s.links) ? s.links : base.links,
        search_engines: Array.isArray(s.search_engines) ? s.search_engines : base.search_engines,
        announcements: Array.isArray(s.announcements) ? s.announcements : base.announcements,
        pending_bookmarks: Array.isArray(s.pending_bookmarks) ? s.pending_bookmarks : base.pending_bookmarks,
        image_sources: Array.isArray(s.image_sources) ? s.image_sources : base.image_sources,
        settings: Object.assign({}, DEFAULT_SETTINGS, s.settings || {}),
        visits: s.visits || {}
    };
}

// PV 用独立 key，避免与 state 争抢同 key 1 写/秒配额；攒批 + 节流，统计为近似值
let pvPending = 0;
let pvLast = 0;
export async function recordVisit(env) {
    if (!env.NAV_KV) return;
    pvPending += 1;
    const t = Date.now();
    if (pvPending < 20 && t - pvLast < 30000) return;
    if (t - pvLast < 1200) return;
    const delta = pvPending;
    pvPending = 0;
    pvLast = t;
    try {
        const key = 'visits:' + today();
        const cur = Number(await env.NAV_KV.get(key)) || 0;
        await env.NAV_KV.put(key, String(cur + delta));
    } catch (_) { pvPending += delta; }
}

export async function readVisits(env) {
    const out = {};
    if (!env.NAV_KV) return out;
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
        const day = new Date(d.getTime() - i * 86400000).toISOString().slice(0, 10);
        try { out[day] = Number(await env.NAV_KV.get('visits:' + day)) || 0; } catch (_) { out[day] = 0; }
    }
    return out;
}

export class KVStore {
    constructor(env) {
        this.env = env;
        this.state = null;
        this.rate = new Map();
    }

    async ensure() {
        if (this.state) return this.state;
        const cached = getFresh();
        if (cached) { this.state = cached; return cached; }
        let stored = null;
        try { stored = await this.env.NAV_KV.get(STATE_KEY, 'json', { cacheTtl: 30 }); } catch (_) {}
        if (!stored || !Array.isArray(stored.categories) || !Array.isArray(stored.links)) {
            this.state = buildInitialState();
            await this.persist();
        } else {
            this.state = normalizeState(stored);
        }
        return this.state;
    }

    async persist() {
        // 只有 KV 写入成功才更新模块级缓存。否则写入失败前的脏 state 会被同 isolate
        // 当成已持久化数据，表现为接口间歇性 200/500，掩盖「KV 未绑定」的真实故障。
        const snapshot = JSON.stringify(this.state);
        const put = () => this.env.NAV_KV.put(STATE_KEY, snapshot);
        try { await put(); }
        catch (_) { await new Promise(r => setTimeout(r, 1200)); await put(); }
        setFresh(this.state);
    }

    rateOk(key, limit, windowMs) {
        const t = Date.now();
        let rec = this.rate.get(key);
        if (!rec || rec.resetAt <= t) { rec = { count: 0, resetAt: t + windowMs }; this.rate.set(key, rec); }
        rec.count += 1;
        if (this.rate.size > 3000) { for (const [k, v] of this.rate) if (v.resetAt <= t) this.rate.delete(k); }
        return rec.count <= limit;
    }

    async fetch(request) {
        await this.ensure();
        const url = new URL(request.url);
        const p = url.pathname;
        const method = request.method;
        const session = await readSession(request, this.env.SESSION_SECRET).catch(() => null);
        const isAdmin = !!session;
        const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

        if (p === '/internal/snapshot' && method === 'GET') return json(buildSnapshot(this.state));
        if (p === '/internal/visit' && method === 'POST') return json({ success: true });

        let body = {};
        if (method === 'POST' || method === 'PUT') {
            try { body = await request.json(); } catch (_) { body = {}; }
        }

        const ctx = {
            s: this.state, request, url, body, env: this.env, isAdmin, ip,
            dirty: false,
            commit: mutator => {
                const result = mutator(this.state);
                if (result && result.__reject) return result.__reject;
                this.state.version += 1;
                ctx.dirty = true;
                return result;
            }
        };

        let response;
        try { response = await this.dispatch(ctx, method, p, url); }
        catch (error) { console.error('dispatch error', error); response = fail('服务器内部错误: ' + error.message, 500); }

        if (ctx.dirty) await this.persist();
        return response;
    }
    async dispatch(ctx, method, p, url) {
        const { s, body, isAdmin, ip, env } = ctx;
        const m = re => (p.match(re) || []).slice(1).map(decodeURIComponent);
        const needAdmin = () => { if (!isAdmin) return fail('未登录', 401); return null; };
        const ok = (data, extra) => json({ success: true, data, ...(extra || {}) });
        const notFound = () => fail('记录不存在', 404);
        const denied = needAdmin();

        // ---- 公开：投稿（限流 5 次/分钟/IP） ----
        if (p === '/api/pending-bookmarks' && method === 'POST') {
            if (!this.rateOk('submit:' + ip, 5, 60000)) return fail('提交过于频繁，请稍后再试', 429);
            const name = pickName(body), target = pickUrl(body);
            if (!name || !target || !String(body.submitter_name || '').trim()) return fail('缺少必填字段');
            if (!/^https?:\/\//i.test(target) || target.length > 2048) return fail('URL 不合法');
            if (s.links.some(l => l.link_url === target)) return fail('该网址已存在');
            if (s.pending_bookmarks.some(x => x.link_url === target && Number(x.status) === 0)) return fail('该网址已在待审核列表');
            const t = now();
            const record = {
                id: ++s.counters.pending,
                link_name: String(name).slice(0, 200),
                link_url: target,
                link_icon: String(body.link_icon || '').slice(0, 300),
                link_desc: String(pickDesc(body)).slice(0, 500),
                category_id: int(body.category_id),
                submitter_name: String(body.submitter_name).slice(0, 100),
                submitter_contact: String(body.submitter_contact || '').slice(0, 200),
                status: 0, created_at: t, updated_at: t
            };
            return ctx.commit(st => {
                st.pending_bookmarks.push(record);
                return json({ success: true, message: '提交成功，等待审核' });
            });
        }

        // ---- 公开：一键添加书签（token 校验，转义输出） ----
        if (p === '/api/v1/jsadd' && method === 'GET') {
            const token = url.searchParams.get('token') || '';
            if (!env.JSADD_TOKEN || token !== env.JSADD_TOKEN) return new Response('未授权', { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
            const name = String(url.searchParams.get('name') || '').slice(0, 200);
            const target = String(url.searchParams.get('url') || '').slice(0, 2048);
            if (!name || !isSafeOutboundUrl(target)) return fail('参数不合法');
            if (s.links.some(l => l.link_url === target)) return this.jsaddPage('该网址已存在', name, target, false);
            let info = { desc: '', icon: '' };
            try {
                const html = await fetchUrlSafe(target);
                const d = html.match(/<meta[^>]*name=["'](?:description|Description)["'][^>]*content=["']([^"']+)["']/i)
                    || html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
                info.desc = (d && d[1] ? d[1] : '').slice(0, 200);
            } catch (_) { /* 抓取失败不阻断添加 */ }
            const catId = s.categories.length ? Number(s.categories[0].category_id) : 1;
            return ctx.commit(st => {
                st.links.push({
                    link_id: ++st.counters.link, category_id: catId,
                    link_name: name, link_url: target, link_icon: info.icon,
                    link_desc: info.desc, sort: 0
                });
                return this.jsaddPage('添加成功', name, target, true);
            });
        }

        if (denied) return denied;

        // ---- 书签（管理端视图使用 bookmark_* 别名） ----
        if (p === '/api/bookmarks' && method === 'GET') {
            return ok(s.links.slice().sort(bySort).map(l => toBookmark(l, s)));
        }
        if (p === '/api/bookmarks' && method === 'POST') {
            const name = pickName(body), target = pickUrl(body);
            if (!name || !target) return fail('名称和网址不能为空');
            if (!/^https?:\/\//i.test(target)) return fail('URL 不合法');
            if (s.links.some(l => l.link_url === target)) return fail('该网址已存在');
            const catId = int(body.category_id) || (s.categories[0] && Number(s.categories[0].category_id)) || 1;
            return ctx.commit(st => {
                const link = {
                    link_id: ++st.counters.link, category_id: catId,
                    link_name: String(name).slice(0, 200), link_url: target,
                    link_icon: pickIcon(body).slice(0, 300), link_desc: pickDesc(body).slice(0, 500),
                    sort: num(body.sort)
                };
                st.links.push(link);
                return ok(toBookmark(link, st), { message: '添加成功' });
            });
        }
        let g = m(/^\/api\/bookmarks\/(\d+)$/);
        if (g.length && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
            const id = Number(g[0]);
            const link = s.links.find(l => Number(l.link_id) === id);
            if (!link) return notFound();
            if (method === 'GET') return ok(toBookmark(link, s));
            if (method === 'DELETE') {
                return ctx.commit(st => {
                    st.links = st.links.filter(l => Number(l.link_id) !== id);
                    return ok(null, { message: '删除成功' });
                });
            }
            const target = pickUrl(body) || link.link_url;
            if (!/^https?:\/\//i.test(target)) return fail('URL 不合法');
            return ctx.commit(st => {
                const l = st.links.find(x => Number(x.link_id) === id);
                l.link_name = (pickName(body) || l.link_name).slice(0, 200);
                l.link_url = target;
                l.link_icon = pickIcon(body).slice(0, 300);
                l.link_desc = pickDesc(body).slice(0, 500);
                l.category_id = int(body.category_id) || l.category_id;
                l.sort = body.sort === undefined ? l.sort : num(body.sort);
                return ok(toBookmark(l, st), { message: '更新成功' });
            });
        }

        // ---- 分类 ----
        if (p === '/api/categories' && method === 'POST') {
            const cname = String(body.category_name || '').trim();
            if (!cname) return fail('分类名称不能为空');
            if (s.categories.some(c => c.category_name === cname)) return fail('分类名称已存在');
            return ctx.commit(st => {
                const cat = { category_id: ++st.counters.category, category_name: cname.slice(0, 100), category_icon: String(body.category_icon || '').slice(0, 200), sort: num(body.sort) };
                st.categories.push(cat);
                return ok(cat, { message: '添加成功' });
            });
        }
        g = m(/^\/api\/categories\/(\d+)\/sort$/);
        if (g.length && method === 'PUT') {
            const id = Number(g[0]);
            if (!s.categories.some(c => Number(c.category_id) === id)) return notFound();
            return ctx.commit(st => {
                st.categories.find(c => Number(c.category_id) === id).sort = num(body.sort);
                return ok(null, { message: '排序已更新' });
            });
        }
        g = m(/^\/api\/categories\/(\d+)\/links$/);
        if (g.length && method === 'GET') {
            // 管理端 loadBookmarks() 渲染的是 bookmark_* 别名，必须与 /api/bookmarks 保持一致，
            // 否则按分类筛选时 ID / 名称 / URL 三列会全部空白。
            return ok(s.links
                .filter(l => Number(l.category_id) === Number(g[0]))
                .sort(bySort)
                .map(l => toBookmark(l, s)));
        }
        if (g.length && method === 'POST') {
            const catId = Number(g[0]);
            if (!s.categories.some(c => Number(c.category_id) === catId)) return notFound();
            const name = pickName(body), target = pickUrl(body);
            if (!name || !/^https?:\/\//i.test(target)) return fail('参数不合法');
            return ctx.commit(st => {
                const link = { link_id: ++st.counters.link, category_id: catId, link_name: name.slice(0, 200), link_url: target, link_icon: pickIcon(body).slice(0, 300), link_desc: pickDesc(body).slice(0, 500), sort: num(body.sort) };
                st.links.push(link);
                return ok(link, { message: '添加成功' });
            });
        }
        g = m(/^\/api\/categories\/(\d+)$/);
        if (g.length && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
            const id = Number(g[0]);
            const cat = s.categories.find(c => Number(c.category_id) === id);
            if (!cat) return notFound();
            if (method === 'GET') return ok({ ...cat, link_count: s.links.filter(l => Number(l.category_id) === id).length });
            if (method === 'DELETE') {
                return ctx.commit(st => {
                    st.categories = st.categories.filter(c => Number(c.category_id) !== id);
                    return ok(null, { message: '删除成功' });
                });
            }
            const cname = String(body.category_name || '').trim();
            if (!cname) return fail('分类名称不能为空');
            if (s.categories.some(c => c.category_name === cname && Number(c.category_id) !== id)) return fail('分类名称已存在');
            return ctx.commit(st => {
                const c = st.categories.find(x => Number(x.category_id) === id);
                c.category_name = cname.slice(0, 100);
                c.category_icon = String(body.category_icon || c.category_icon || '').slice(0, 200);
                c.sort = body.sort === undefined ? c.sort : num(body.sort);
                return ok(c, { message: '更新成功' });
            });
        }

        // ---- 链接排序与直改 ----
        g = m(/^\/api\/links\/(\d+)\/sort$/);
        if (g.length && method === 'PUT') {
            const id = Number(g[0]);
            if (!s.links.some(l => Number(l.link_id) === id)) return notFound();
            return ctx.commit(st => {
                st.links.find(l => Number(l.link_id) === id).sort = num(body.sort);
                return ok(null, { message: '排序已更新' });
            });
        }
        g = m(/^\/api\/links\/(\d+)$/);
        if (g.length && (method === 'PUT' || method === 'DELETE')) {
            const id = Number(g[0]);
            const link = s.links.find(l => Number(l.link_id) === id);
            if (!link) return notFound();
            if (method === 'DELETE') {
                return ctx.commit(st => { st.links = st.links.filter(l => Number(l.link_id) !== id); return ok(null, { message: '删除成功' }); });
            }
            if (body.link_url && !/^https?:\/\//i.test(String(body.link_url))) return fail('URL 不合法');
            return ctx.commit(st => {
                const l = st.links.find(x => Number(x.link_id) === id);
                ['link_name', 'link_url', 'link_icon', 'link_desc'].forEach(k => { if (body[k] !== undefined) l[k] = String(body[k]).slice(0, k === 'link_desc' ? 500 : 300); });
                if (body.category_id !== undefined) l.category_id = num(body.category_id);
                if (body.sort !== undefined) l.sort = num(body.sort);
                return ok(l, { message: '更新成功' });
            });
        }

        // ---- 仪表盘 ----
        if (p === '/api/dashboard' && method === 'GET') {
            const trend = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(); d.setUTCDate(d.getUTCDate() - i);
                const key = d.toISOString().slice(0, 10);
                trend.push({ date: (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日', visits: s.visits[key] || 0 });
            }
            const total = Object.values(s.visits).reduce((a, b) => a + num(b), 0);
            return ok({
                total_bookmarks: s.links.length,
                total_categories: s.categories.length,
                active_users: 1,
                today_visits: s.visits[today()] || 0,
                total_visits: total,
                visit_trend: trend
            });
        }

        // ---- 公告 ----
        if (p === '/api/announcements' && method === 'POST') {
            const title = String(body.title || '').trim();
            if (!title) return fail('标题不能为空');
            return ctx.commit(st => {
                const a = { id: ++st.counters.announcement, title: title.slice(0, 200), content: String(body.content || '').slice(0, 20000), time: String(body.time || now()).slice(0, 50), is_active: body.is_active === undefined ? 1 : num(body.is_active), created_at: now(), updated_at: now() };
                st.announcements.push(a);
                return ok(a, { message: '添加成功' });
            });
        }
        g = m(/^\/api\/announcements\/(\d+)$/);
        if (g.length && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
            const id = Number(g[0]);
            const a = s.announcements.find(x => Number(x.id) === id);
            if (!a) return notFound();
            if (method === 'GET') return ok(a);
            if (method === 'DELETE') {
                return ctx.commit(st => { st.announcements = st.announcements.filter(x => Number(x.id) !== id); return ok(null, { message: '删除成功' }); });
            }
            return ctx.commit(st => {
                const x = st.announcements.find(y => Number(y.id) === id);
                if (body.title !== undefined) x.title = String(body.title).slice(0, 200);
                if (body.content !== undefined) x.content = String(body.content).slice(0, 20000);
                if (body.time !== undefined) x.time = String(body.time).slice(0, 50);
                if (body.is_active !== undefined) x.is_active = num(body.is_active);
                x.updated_at = now();
                return ok(x, { message: '更新成功' });
            });
        }

        if (p === '/api/clear-all-data' && method === 'DELETE') {
            return ctx.commit(st => {
                st.links = [];
                st.pending_bookmarks = [];
                return ok(null, { message: '已清空书签与待审核记录（分类、设置、搜索引擎保留）' });
            });
        }

        // ---- 图片源 ----
        if (p === '/api/image-sources' && method === 'GET') return ok(s.image_sources);
        if (p === '/api/image-sources' && method === 'POST') {
            if (!String(body.name || '').trim()) return fail('名称不能为空');
            return ctx.commit(st => {
                const item = { ...body, id: ++st.counters.image, created_at: now() };
                st.image_sources.push(item);
                return ok(item, { message: '添加成功' });
            });
        }
        g = m(/^\/api\/image-sources\/(\d+)$/);
        if (g.length && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
            const id = Number(g[0]);
            const item = s.image_sources.find(x => Number(x.id) === id);
            if (!item) return notFound();
            if (method === 'GET') return ok(item);
            if (method === 'DELETE') {
                return ctx.commit(st => { st.image_sources = st.image_sources.filter(x => Number(x.id) !== id); return ok(null, { message: '删除成功' }); });
            }
            return ctx.commit(st => {
                const x = st.image_sources.find(y => Number(y.id) === id);
                Object.assign(x, body, { id, updated_at: now() });
                return ok(x, { message: '更新成功' });
            });
        }

        // ---- 搜索引擎 ----
        if (p === '/api/search-engines' && method === 'POST') {
            const key = String(body.engine_key || '').trim();
            if (!key || !body.engine_name || !body.engine_url) return fail('缺少必填字段');
            if (s.search_engines.some(e => e.engine_key === key)) return fail('引擎标识已存在');
            return ctx.commit(st => {
                const e = { search_engine_id: ++st.counters.engine, engine_name: String(body.engine_name).slice(0, 100), engine_key: key.slice(0, 100), engine_url: String(body.engine_url).slice(0, 500), sort: num(body.sort) };
                st.search_engines.push(e);
                return ok(e, { message: '添加成功' });
            });
        }
        g = m(/^\/api\/search-engines\/(\d+)$/);
        if (g.length && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
            const id = Number(g[0]);
            const e = s.search_engines.find(x => Number(x.search_engine_id) === id);
            if (!e) return notFound();
            if (method === 'GET') return ok(e);
            if (method === 'DELETE') {
                return ctx.commit(st => { st.search_engines = st.search_engines.filter(x => Number(x.search_engine_id) !== id); return ok(null, { message: '删除成功' }); });
            }
            const key = String(body.engine_key || e.engine_key).trim();
            if (s.search_engines.some(x => x.engine_key === key && Number(x.search_engine_id) !== id)) return fail('引擎标识已存在');
            return ctx.commit(st => {
                const x = st.search_engines.find(y => Number(y.search_engine_id) === id);
                Object.assign(x, {
                    engine_name: String(body.engine_name || x.engine_name).slice(0, 100),
                    engine_key: key.slice(0, 100),
                    engine_url: String(body.engine_url || x.engine_url).slice(0, 500),
                    sort: body.sort === undefined ? x.sort : num(body.sort)
                });
                return ok(x, { message: '更新成功' });
            });
        }

        // ---- 待审核 ----
        if (p === '/api/pending-bookmarks' && method === 'GET') {
            const list = s.pending_bookmarks.filter(x => Number(x.status) === 0).map(x => ({
                ...x,
                category_name: (s.categories.find(c => Number(c.category_id) === Number(x.category_id)) || {}).category_name || '未分类'
            })).sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
            return ok(list);
        }
        g = m(/^\/api\/pending-bookmarks\/(\d+)\/(approve|reject)$/);
        if (g.length && method === 'PUT') {
            const id = Number(g[0]), action = g[1];
            const item = s.pending_bookmarks.find(x => Number(x.id) === id);
            if (!item) return notFound();
            if (action === 'reject') {
                return ctx.commit(st => {
                    st.pending_bookmarks = st.pending_bookmarks.filter(x => Number(x.id) !== id);
                    return ok(null, { message: '已拒绝' });
                });
            }
            if (s.links.some(l => l.link_url === item.link_url)) return fail('该网址已存在');
            return ctx.commit(st => {
                st.links.push({
                    link_id: ++st.counters.link,
                    category_id: int(item.category_id) || (st.categories[0] && Number(st.categories[0].category_id)) || 1,
                    link_name: item.link_name, link_url: item.link_url,
                    link_icon: item.link_icon || '', link_desc: item.link_desc || '', sort: 0
                });
                st.pending_bookmarks = st.pending_bookmarks.filter(x => Number(x.id) !== id);
                return ok(null, { message: '已通过' });
            });
        }

        // ---- 网站设置 ----
        if (p === '/api/website-settings' && method === 'POST') {
            const input = (body && typeof body === 'object') ? body : {};
            const allowed = {};
            for (const [k, v] of Object.entries(input)) {
                if (PUBLIC_SETTING_KEYS.has(k)) allowed[k] = String(v == null ? '' : v).slice(0, 20000);
            }
            if (!Object.keys(allowed).length) return fail('没有可更新的设置项');
            return ctx.commit(st => {
                Object.assign(st.settings, allowed);
                return ok(st.settings, { message: '保存成功' });
            });
        }

        // ---- 备份 / 恢复（管理端，用于 DO 数据迁移与灾备） ----
        if (p === '/api/backup' && method === 'GET') {
            return json({ success: true, data: s, version: s.version, exported_at: now() });
        }
        if (p === '/api/restore' && method === 'POST') {
            const incoming = body && body.state;
            if (!incoming || !Array.isArray(incoming.categories) || !Array.isArray(incoming.links)) return fail('备份格式不合法');
            return ctx.commit(st => {
                const restored = buildInitialState();
                Object.assign(restored, {
                    categories: clone(incoming.categories), links: clone(incoming.links),
                    search_engines: clone(incoming.search_engines || []),
                    announcements: clone(incoming.announcements || []),
                    pending_bookmarks: clone(incoming.pending_bookmarks || []),
                    image_sources: clone(incoming.image_sources || []),
                    settings: { ...DEFAULT_SETTINGS, ...clone(incoming.settings || {}) },
                    visits: clone(incoming.visits || {})
                });
                restored.counters = {
                    category: maxId(restored.categories, 'category_id'), link: maxId(restored.links, 'link_id'),
                    engine: maxId(restored.search_engines, 'search_engine_id'), announcement: maxId(restored.announcements, 'id'),
                    pending: maxId(restored.pending_bookmarks, 'id'), image: maxId(restored.image_sources, 'id')
                };
                Object.keys(st).forEach(k => delete st[k]);
                Object.assign(st, restored);
                return ok(null, { message: '恢复完成' });
            });
        }

        return fail('接口不存在: ' + method + ' ' + p, 404);
    }

    jsaddPage(title, name, target, success) {
        return new Response(
            '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escHtml(title) + '</title>' +
            '<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f8fa;color:#1f2329}' +
            '.card{background:#fff;padding:32px 40px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.06);max-width:420px}' +
            'h1{font-size:18px;margin:0 0 16px}.row{margin:8px 0;font-size:14px;word-break:break-all;color:#4e5969}</style></head>' +
            '<body><div class="card"><h1>' + escHtml(title) + '</h1>' +
            '<div class="row">名称：' + escHtml(name) + '</div>' +
            '<div class="row">网址：' + escHtml(target) + '</div>' +
            (success ? '<div class="row"><a href="' + safeHref(target) + '">打开该网站</a></div>' : '') +
            '</div></body></html>',
            { status: success ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
}

