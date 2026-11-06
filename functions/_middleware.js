// 全站中间件：管理页别名鉴权 + 静态路径默认拒绝 + 页面 PV 攒批
// Pages 会把 admin.html 同时映射为 /admin，仅靠 functions/admin.html.js 会被绕过
import { readSession } from '../lib/auth.js';
import { withSecurity, isAllowedStatic } from '../lib/security.js';
import { recordVisit } from '../lib/store.js';

const ADMIN_ALIASES = new Set(['/admin', '/admin.html']);
const PAGE_ALIASES = new Set(['/', '/index', '/index.html', '/login', '/login.html']);

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const raw = url.pathname;
    const path = raw.length > 1 ? raw.replace(/\/+$/, '') : raw;
    const method = context.request.method;

    // 1) 管理页所有别名统一鉴权（含 Pages 自动映射的 /admin）
    const isAdminPath = ADMIN_ALIASES.has(path) || /^\/admin\//i.test(path);
    let adminSession = null;
    if (isAdminPath) {
        adminSession = await readSession(context.request, context.env.SESSION_SECRET).catch(() => null);
        if (!adminSession) {
            return withSecurity(
                new Response(null, {
                    status: 302,
                    headers: { Location: '/login.html', 'Cache-Control': 'no-store' }
                }),
                url.href
            );
        }
    }

    // 2) 非 API 路径默认拒绝，避免 SPA fallback 把任意路径渲染成 200 首页
    if (method === 'GET' && !path.startsWith('/api/')) {
        if (!isAllowedStatic(path) && !isAdminPath && !PAGE_ALIASES.has(path)) {
            return withSecurity(
                new Response('Not found', {
                    status: 404,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
                }),
                url.href
            );
        }
    }

    const response = await context.next();

    // 3) 页面 PV 写入独立 KV key，不触碰 site:state
    if (method === 'GET' && (path === '/' || path === '/index' || path === '/index.html')) {
        context.waitUntil(recordVisit(context.env));
    }

    // 4) 管理页登录后动态注入 jsadd token：凭据只来自环境变量，绝不进入仓库或静态产物
    //    clone().text() 避免在不注入时消费掉原响应体
    if (method === 'GET' && isAdminPath && adminSession && context.env.JSADD_TOKEN &&
        /text\/html/i.test(response.headers.get('content-type') || '')) {
        const html = await response.clone().text();
        if (!html.includes('__JSADD_TOKEN__')) {
            const literal = JSON.stringify(context.env.JSADD_TOKEN).replace(/</g, '\\u003c');
            const tag = '<script>window.__JSADD_TOKEN__=' + literal + ';</script>';
            const out = html.includes('</head>') ? html.replace('</head>', tag + '</head>') : tag + html;
            const headers = new Headers(response.headers);
            headers.delete('content-length');
            headers.set('Cache-Control', 'no-store');
            return withSecurity(new Response(out, { status: response.status, headers }), url.href);
        }
    }
    return response;
}
