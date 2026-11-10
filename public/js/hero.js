/* ============================================================
   首页 Hero 交互
   - 刷新：重排纯 CSS 背景光斑（零外部图片依赖）
   - 随机：随机打开导航里的一个网址（始终新标签，本页保持不变）
   - 依赖 jQuery 与首页 DOM，非首页自动跳过
   ============================================================ */
(function () {
    'use strict';

    var $hero = $('#hero');
    if (!$hero.length) return;

    /* ---------------- 背景光斑 ---------------- */
    function shuffleSpots() {
        var pct = function (min, max) {
            return (min + Math.random() * (max - min)).toFixed(1) + '%';
        };
        var style = document.body.style;
        style.setProperty('--gx', pct(8, 38));
        style.setProperty('--gy', pct(4, 34));
        style.setProperty('--hx', pct(66, 96));
        style.setProperty('--hy', pct(58, 94));
    }

    function flash() {
        $hero.removeClass('hero-flash');
        void $hero[0].offsetWidth;              // 强制重排，连续点击也能重播动画
        $hero.addClass('hero-flash');
        window.setTimeout(function () { $hero.removeClass('hero-flash'); }, 450);
    }

    shuffleSpots();

    /* ---------------- 随机打开站内网址 ---------------- */
    var links = [];
    var loading = false;
    var lastUrl = '';
    var tipTimer = null;

    // 只允许 http/https，杜绝 javascript: / data: 之类的伪协议
    function safeUrl(raw) {
        if (typeof raw !== 'string' || !raw.trim()) return '';
        var v = raw.trim();
        if (!/^https?:\/\//i.test(v)) return '';
        try {
            var u = new URL(v);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
            return u.href;
        } catch (_) { return ''; }
    }

    function uniqueByName(list) {
        var seen = Object.create(null);
        return list.filter(function (item) {
            if (!item.url || seen[item.url]) return false;
            seen[item.url] = true;
            return true;
        });
    }

    function fromApi(data) {
        var out = [];
        if (!Array.isArray(data)) return out;
        data.forEach(function (cat) {
            var children = (cat && (cat.links || cat.bookmarks)) || [];
            children.forEach(function (l) {
                var url = safeUrl(l.link_url || l.bookmark_url || l.url);
                if (url) out.push({ name: l.link_name || l.bookmark_name || '', url: url });
            });
        });
        return uniqueByName(out);
    }

    // 兜底：接口不可用时直接从已渲染的分类卡片取链接
    function fromDom() {
        var out = [];
        $('#category-container a[href]').each(function () {
            var url = safeUrl(this.getAttribute('href'));
            if (url) out.push({ name: $(this).text().trim(), url: url });
        });
        return uniqueByName(out);
    }

    function loadLinks(done) {
        if (loading) { done(); return; }
        loading = true;
        $.getJSON('/api/data', function (data) {
            links = fromApi(data);
            if (!links.length) links = fromDom();
        }).always(function () {
            loading = false;
            if (!links.length) links = fromDom();
            done();
        });
    }

    // 轻量提示，避免新标签被拦截时按钮看起来「没反应」
    function showTip(text) {
        var $tip = $('#hero-tip');
        if (!$tip.length) return;
        $tip.text(text).addClass('is-visible');
        window.clearTimeout(tipTimer);
        tipTimer = window.setTimeout(function () { $tip.removeClass('is-visible'); }, 2600);
    }

    function openRandom(win) {
        if (!links.length) {
            if (win && !win.closed) win.close();
            showTip('暂时没有可打开的网址');
            return;
        }
        var pool = links;
        if (links.length > 1 && lastUrl) {
            pool = links.filter(function (l) { return l.url !== lastUrl; });
        }
        var pick = pool[Math.floor(Math.random() * pool.length)];
        lastUrl = pick.url;

        // 始终在新标签打开，本页保持不变；弹窗被拦截时仅提示，绝不跳转当前页
        if (win && !win.closed) {
            win.location.replace(pick.url);
        } else {
            var opened = window.open(pick.url, '_blank', 'noopener,noreferrer');
            if (!opened) {
                showTip('浏览器拦截了新窗口，请允许弹窗后重试');
                return; // 弹窗被拦截：保持本页不变
            }
        }
        showTip(pick.name ? '已在新标签打开：' + pick.name : '已在新标签打开一个网址');
    }

    // 进入页面就预取，保证点击时能同步打开新标签
    loadLinks(function () { /* 静默缓存 */ });
    // 分类卡片由 main.js 稍后渲染，DOM 就绪后再补一次兜底
    $(function () { if (!links.length) links = fromDom(); });

    $('#hero-refresh-btn').on('click', function () {
        shuffleSpots();
        flash();
    });

    $('#hero-random-btn').on('click', function () {
        if (!links.length) links = fromDom();
        if (links.length) { openRandom(null); return; }

        // 数据尚未就绪：先在用户手势中开一个占位标签，避免后续被浏览器拦截
        var pending = window.open('', '_blank');
        if (pending) {
            try {
                pending.document.title = '正在前往…';
                pending.document.write(
                    '<meta charset="utf-8"><p style="font:14px/1.7 sans-serif;padding:28px;color:#3b4252">' +
                    '正在随机挑选一个网址…</p>'
                );
                pending.document.close();
            } catch (_) { /* 跨域占位页不可写时忽略 */ }
        }
        loadLinks(function () { openRandom(pending); });
    });
})();
