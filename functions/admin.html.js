// Pages 静态层会直接返回 admin.html，必须用同名 Functions 路由拦一层鉴权
import { readSession } from '../lib/auth.js';
import { withSecurity } from '../lib/security.js';

export async function onRequestGet(context) {
    const session = await readSession(context.request, context.env.SESSION_SECRET).catch(() => null);
    if (!session) {
        return withSecurity(
            new Response(null, { status: 302, headers: { Location: '/login.html', 'Cache-Control': 'no-store' } }),
            context.request.url
        );
    }
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store');
    return withSecurity(new Response(response.body, { status: response.status, headers }), context.request.url);
}
