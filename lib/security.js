// 共享安全工具：转义、URL 白名单、静态资源默认拒绝、安全响应头、受限外链抓取

export const PUBLIC_SETTING_KEYS = new Set([
    'site_title', 'site_logo', 'site_keywords', 'site_description',
    'site_copyright', 'site_icp', 'site_footer', 'site_footer_custom'
]);

export function escHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function safeHref(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!/^https?:\/\//i.test(raw)) return '#';
    try {
        const u = new URL(raw);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return '#';
        return u.href;
    } catch (_) {
        return '#';
    }
}

// 轻量富文本净化：移除可执行标签、事件属性与危险协议。前端 security-utils.js 会再做一次。
export function sanitizeRichHtml(value) {
    return String(value == null ? '' : value)
        .replace(/<\s*(script|iframe|object|embed|link|meta|style|form|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/<\s*(script|iframe|object|embed|link|meta|style|form|base)\b[^>]*\/?>/gi, '')
        .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/(href|src)\s*=\s*(?:"|')\s*javascript:[^"']*(?:"|')/gi, '$1="#"')
        .replace(/javascript\s*:/gi, '');
}

const STATIC_ALLOW = [
    /^\/$/i,
    /^\/index\.html$/i,
    /^\/login\.html$/i,
    /^\/favicon\.ico$/i,
    /^\/robots\.txt$/i,
    /^\/sitemap\.xml$/i,
    /^\/js\/[a-z0-9_\-/.]+\.(js|css)$/i,
    /^\/res\/[a-z0-9_\-/.]+\.(ico|png|jpe?g|svg|webp|gif|css|js|woff2?)$/i,
    /^\/vendor\/jquery\/dist\/jquery\.min\.js$/i,
    /^\/vendor\/jquery-ui\/dist\/jquery-ui\.min\.js$/i,
    /^\/vendor\/jquery-ui\/dist\/themes\/base\/jquery-ui\.min\.css$/i,
    /^\/vendor\/chart\.js\/dist\/chart\.umd\.min\.js$/i,
    /^\/vendor\/font-awesome\/css\/font-awesome\.min\.css$/i,
    /^\/vendor\/font-awesome\/fonts\/[a-z0-9_\-.]+\.(woff2?|ttf|eot|svg|otf)$/i
];

function normalizePosix(input) {
    const parts = [];
    for (const seg of input.split('/')) {
        if (!seg || seg === '.') continue;
        if (seg === '..') parts.pop();
        else parts.push(seg);
    }
    return '/' + parts.join('/');
}

// 双重解码，防止 %2564ata / ..%2f 之类绕过
export function isAllowedStatic(rawPath) {
    let decoded;
    try {
        decoded = decodeURIComponent(rawPath);
        const twice = decodeURIComponent(decoded);
        if (twice !== decoded) decoded = twice;
    } catch (_) {
        return false;
    }
    if (decoded.includes('\0') || decoded.includes('\\')) return false;
    const normalized = normalizePosix(decoded);
    return STATIC_ALLOW.some(re => re.test(normalized));
}

export function isJsaddPath(url) {
    try { return (url ? new URL(url).pathname : '/') === '/api/v1/jsadd'; }
    catch (_) { return false; }
}

export function securityHeaders(url) {
    const isJsadd = isJsaddPath(url);
    const h = {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "img-src 'self' data: https:",
            "font-src 'self' data: https://cdnjs.cloudflare.com",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            // 一键添加书签的结果页需被任意站点以 iframe 嵌入
            isJsadd ? 'frame-ancestors *' : "frame-ancestors 'self'"
        ].join('; ')
    };
    if (!isJsadd) h['X-Frame-Options'] = 'SAMEORIGIN';
    return h;
}

export function withSecurity(response, url) {
    const headers = new Headers(response.headers);
    const isJsadd = isJsaddPath(url);
    // 静态 _headers 里 /* 有 SAMEORIGIN，平台层可能合并进 Functions 响应，需显式移除
    if (isJsadd) headers.delete('X-Frame-Options');
    Object.entries(securityHeaders(url)).forEach(([k, v]) => {
        if (isJsadd && k === 'Content-Security-Policy') headers.set(k, v);
        else if (!headers.has(k)) headers.set(k, v);
    });
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...extraHeaders
        }
    });
}

export function fail(message, status = 400) {
    return json({ success: false, message }, status);
}

// 只放行公网 http/https 字面量；Cloudflare Workers 的 fetch 本身拒绝私网地址，这里再做一层显式拦截
export function isSafeOutboundUrl(raw) {
    let u;
    try { u = new URL(String(raw || '')); } catch (_) { return false; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (u.username || u.password) return false;
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
        const oct = host.split('.').map(Number);
        if (oct[0] === 0 || oct[0] === 10 || oct[0] === 127 ||
            (oct[0] === 169 && oct[1] === 254) ||
            (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31) ||
            (oct[0] === 192 && oct[1] === 168) ||
            (oct[0] === 100 && oct[1] >= 64 && oct[1] <= 127) ||
            oct[0] >= 224) return false;
    }
    if (host.startsWith('[') || host.includes(':')) return false;
    if (/^(metadata|instance-data)\./i.test(host)) return false;
    return true;
}

// 受限抓取：禁重定向、总大小上限、整体超时（含响应流）
export async function fetchUrlSafe(raw, { maxBytes = 512 * 1024, timeoutMs = 5000 } = {}) {
    if (!isSafeOutboundUrl(raw)) throw new Error('目标地址不被允许');
    const res = await fetch(raw, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NavBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml'
        }
    });
    if (res.status >= 300 && res.status < 400) throw new Error('不允许重定向');
    if (!res.ok) throw new Error('远端返回 ' + res.status);
    const ct = res.headers.get('content-type') || '';
    if (ct && !/text\/html|application\/xhtml|text\/plain|application\/xml/i.test(ct)) throw new Error('不支持的响应类型');
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new Error('响应体过大');
    if (!res.body) return '';
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > maxBytes) { await reader.cancel(); throw new Error('响应体超过上限'); }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(await new Blob(chunks).arrayBuffer());
}
