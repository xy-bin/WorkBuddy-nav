// 访问量原子计数器（Durable Object）
// 用 DO 自带的 SQLite storage 存每日计数，完全不占用 KV 每日写入配额（根治 429）。
// 部署后在 Cloudflare 后台配置绑定：
//   Pages 项目 → 设置 → 函数 → Durable Object 绑定
//   变量名 NAV_VISIT_DO，类名称 VisitCounter（与下方 export class 同名）
// 未绑定前代码会自动回落到 KV，站点照常运行。

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export class VisitCounter {
    constructor(state, env) {
        this.state = state;   // Durable Object 私有 storage，单实例串行处理，自增天然原子
        this.env = env;
    }

    async fetch(request) {
        const url = new URL(request.url);
        const p = url.pathname;

        // POST /increment —— 自增当日计数，返回最新值
        if (p === '/increment' && request.method === 'POST') {
            const day = dayKey();
            const cur = Number(await this.state.storage.get(day)) || 0;
            const next = cur + 1;
            await this.state.storage.put(day, next);
            return json({ day, count: next });
        }

        // GET /range?days=N —— 读取最近 N 天每日计数
        if (p === '/range' && request.method === 'GET') {
            let days = parseInt(url.searchParams.get('days') || '7', 10);
            if (!Number.isFinite(days)) days = 7;
            days = Math.min(Math.max(days, 1), 60);
            const out = {};
            const base = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(base.getTime() - i * 86400000);
                const k = dayKey(d);
                out[k] = Number(await this.state.storage.get(k)) || 0;
            }
            return json(out);
        }

        return new Response('Not found', { status: 404 });
    }
}

function json(data) {
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}
