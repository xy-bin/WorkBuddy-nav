// 无状态鉴权：WebCrypto PBKDF2 口令校验 + HMAC-SHA256 签名 Cookie + 同源校验 + 粗粒度限流

export const COOKIE_NAME = 'nav_session';
const SESSION_TTL = 12 * 60 * 60;
const PBKDF2_ITER = 100000;

const enc = new TextEncoder();

function b64url(bytes) {
    let s = '';
    for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(str) {
    const s = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '='.repeat((4 - s.length % 4) % 4));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function hmacKey(secret) {
    if (!secret || secret.length < 16) throw new Error('SESSION_SECRET 未配置或过短');
    return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

// 生成格式：pbkdf2$<iter>$<saltB64>$<hashB64>
export async function hashPassword(password, saltHex) {
    const salt = saltHex ? unb64url(saltHex) : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITER }, key, 256);
    return 'pbkdf2$' + PBKDF2_ITER + '$' + b64url(salt) + '$' + b64url(bits);
}

export async function verifyPassword(password, stored) {
    if (typeof stored !== 'string') return false;
    if (stored.startsWith('$2')) {
        throw new Error('检测到 bcrypt 哈希：Workers 版本需重新生成 PBKDF2 哈希，请运行 scripts/hash-password.mjs');
    }
    const parts = stored.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iter = Number(parts[1]);
    if (!Number.isInteger(iter) || iter < 10000 || iter > 1000000) return false;
    const salt = unb64url(parts[2]);
    const expected = unb64url(parts[3]);
    const key = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
    if (bits.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
    return diff === 0;
}

export async function signSession(username, secret) {
    const payload = b64url(enc.encode(JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL * 1000 })));
    const key = await hmacKey(secret);
    const sig = b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
    return payload + '.' + sig;
}

export async function readSession(request, secret) {
    const header = request.headers.get('Cookie') || '';
    const match = header.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
    if (!match) return null;
    const [payload, sig] = match[1].split('.');
    if (!payload || !sig) return null;
    try {
        const key = await hmacKey(secret);
        const ok = await crypto.subtle.verify('HMAC', key, unb64url(sig), enc.encode(payload));
        if (!ok) return null;
        const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
        if (!data || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
        return { username: String(data.u || '') };
    } catch (_) {
        return null;
    }
}

export function sessionCookie(value) {
    return COOKIE_NAME + '=' + value + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + SESSION_TTL;
}

export function clearCookie() {
    return COOKIE_NAME + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

// 写操作必须来自本站，防止跨站 POST / CSRF
export function sameOriginOk(request) {
    const origin = request.headers.get('Origin');
    if (origin) {
        try { return new URL(origin).host === new URL(request.url).host; } catch (_) { return false; }
    }
    const referer = request.headers.get('Referer');
    if (referer) {
        try { return new URL(referer).host === new URL(request.url).host; } catch (_) { return false; }
    }
    // 无 Origin/Referer 的同源导航（如 bookmarklet）按来源类型保守放行
    const secFetch = request.headers.get('Sec-Fetch-Site');
    return secFetch === 'same-origin' || secFetch === 'none';
}

export function clientIp(request) {
    return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

// 每个 isolate 独立的粗粒度限流；精确限流在 Durable Object 内（单线程串行）
export class RateLimiter {
    constructor() { this.buckets = new Map(); }

    check(key, limit, windowMs) {
        const now = Date.now();
        let rec = this.buckets.get(key);
        if (!rec || rec.resetAt <= now) {
            rec = { count: 0, resetAt: now + windowMs };
            this.buckets.set(key, rec);
        }
        rec.count += 1;
        if (this.buckets.size > 5000) {
            for (const [k, v] of this.buckets) if (v.resetAt <= now) this.buckets.delete(k);
        }
        return rec.count <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
    }
}
