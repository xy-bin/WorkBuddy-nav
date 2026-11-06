/* ============================================================
   首页 Hero 交互：背景配色切换 + 公告铃铛
   - 配色为纯 CSS 渐变，零外部图片依赖，避免随机图 API 失效或跨域问题
   - 选择写入 localStorage，刷新页面后保持
   - 依赖 jQuery（head 中已引入）与首页 DOM，非首页会自动跳过
   ============================================================ */
(function () {
    'use strict';

    var STORAGE_KEY = 'nav-hero-theme';
    var THEME_COUNT = 5;
    var $hero = $('#hero');
    if (!$hero.length) return;

    function readTheme() {
        try {
            var n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
            if (isNaN(n)) return 0;
            return ((n % THEME_COUNT) + THEME_COUNT) % THEME_COUNT;
        } catch (_) { return 0; }
    }

    function saveTheme(n) {
        try { localStorage.setItem(STORAGE_KEY, String(n)); } catch (_) { /* 隐私模式下忽略 */ }
    }

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

    function apply(theme, animate) {
        document.body.setAttribute('data-hero', String(theme));
        shuffleSpots();
        if (animate) {
            $hero.removeClass('hero-flash');
            // 强制重排，保证连续点击时动画能重新播放
            void $hero[0].offsetWidth;
            $hero.addClass('hero-flash');
            window.setTimeout(function () { $hero.removeClass('hero-flash'); }, 450);
        }
    }

    apply(readTheme(), false);

    // 刷新：保持当前配色，重新生成光斑位置
    $('#hero-refresh-btn').on('click', function () {
        apply(readTheme(), true);
    });

    // 随机：换一套与当前不同的配色
    $('#hero-random-btn').on('click', function () {
        var current = readTheme();
        var next = current;
        while (next === current) next = Math.floor(Math.random() * THEME_COUNT);
        saveTheme(next);
        apply(next, true);
    });

    // 公告铃铛：重新弹出公告浮层（与 main.js 的显隐 class 保持一致）
    $('#hero-notice-btn').on('click', function () {
        var $toast = $('#announcement-toast');
        $toast.css('top', (Math.ceil($hero[0].getBoundingClientRect().height) + 14) + 'px');
        $toast
            .removeClass('-translate-y-full opacity-0')
            .addClass('translate-y-0 opacity-100');
    });
})();
