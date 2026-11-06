// 按白名单把前端资源复制到 pages/public/
// 绝不复制 .db / server.js / package.json / lib / 全量 node_modules
import { existsSync, mkdirSync, copyFileSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.resolve(here, '../public');

const FILES = [
    'index.html', 'admin.html', 'login.html', 'robots.txt', 'sitemap.xml',
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/jquery-ui/dist/jquery-ui.min.js',
    'node_modules/jquery-ui/dist/themes/base/jquery-ui.min.css',
    'node_modules/chart.js/dist/chart.umd.min.js',
    'node_modules/font-awesome/css/font-awesome.min.css'
];

const DIRS = ['js', 'js/theme', 'res', 'node_modules/font-awesome/fonts'];
const SAFE_EXT = new Set(['.js', '.css', '.ico', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.woff', '.woff2', '.ttf', '.eot', '.otf']);

// Cloudflare Pages 默认不上传 node_modules 目录，vendor 资源必须换个目录名。
// 源 HTML 由 Node 版共用（其静态白名单仍放行 node_modules/），故只在产物里重写引用。
const VENDOR_SRC = 'node_modules/';
function destFor(rel) {
    return rel.startsWith(VENDOR_SRC) ? 'vendor/' + rel.slice(VENDOR_SRC.length) : rel;
}

// Pages 静态资源安全头（API 响应由 Functions 的 withSecurity 添加）
const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' data: https://cdnjs.cloudflare.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/js/*
  Cache-Control: public, max-age=3600

/res/*
  Cache-Control: public, max-age=3600

/vendor/*
  Cache-Control: public, max-age=86400
`;

// public 是本次构建产物目录，仅清理此目录
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let count = 0;
function copy(rel) {
    const src = path.join(root, rel);
    if (!existsSync(src) || !statSync(src).isFile()) {
        console.warn('跳过（不存在）:', rel);
        return;
    }
    const dst = path.join(out, destFor(rel));
    mkdirSync(path.dirname(dst), { recursive: true });
    if (rel.endsWith('.html')) {
        // 只改 HTML 里的 src/href 引用，Node 版源文件保持不动
        const html = readFileSync(src, 'utf8').replace(/(["'])node_modules\//g, '$1vendor/');
        writeFileSync(dst, html, 'utf8');
    } else {
        copyFileSync(src, dst);
    }
    count += 1;
}

FILES.forEach(copy);
for (const dir of DIRS) {
    const abs = path.join(root, dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs)) {
        const rel = path.join(dir, name).replace(/\\/g, '/');
        if (!statSync(path.join(root, rel)).isFile()) continue;
        if (!SAFE_EXT.has(path.extname(name).toLowerCase())) continue;
        copy(rel);
    }
}
writeFileSync(path.join(out, '_headers'), HEADERS, 'utf8');

console.log('静态资源构建完成: ' + (count + 1) + ' 个文件 -> ' + out);
if (existsSync(path.join(out, 'node_modules'))) {
    console.error('错误：产物仍含 node_modules 目录，Cloudflare Pages 会默认忽略导致前端资源 404');
    process.exit(1);
}
const forbidden = ['navxybintop.db', 'server.js', 'package.json', 'wrangler.toml', 'seed.js', 'store.js', 'auth.js'];
const leaked = forbidden.filter(f => existsSync(path.join(out, f)));
if (leaked.length) {
    console.error('错误：产物中包含敏感文件', leaked);
    process.exit(1);
}
console.log('敏感文件检查通过：.db / 服务端源码 / 种子数据均未进入产物');
