// 网站色系预设
// 每个色系定义「浅色 / 暗色」两套强调色变量，供首页、登录页在运行时动态套用。
// 只覆盖 nav-theme.css 使用的 --nv-* 变量，不改变任何布局与业务逻辑。
// 默认色系为 green，与 nav-theme.css 内置默认值一致，未加载本脚本或不配置时不会变色。
(function () {
    'use strict';

    var SCHEMES = {
        green: {
            name: '翠绿', swatch: '#0e9b74',
            primary: '#0e9b74', primaryRgb: '14, 155, 116', primarySoft: '#e8f7f0',
            gradientFrom: '#0e9b74', gradientTo: '#3ec79c', grad2Rgb: '62, 199, 156',
            darkPrimary: '#4ade9f', darkPrimaryRgb: '74, 222, 159', darkPrimarySoft: 'rgba(74, 222, 159, .12)',
            darkGradientFrom: '#4ade9f', darkGradientTo: '#34d399', darkGrad2Rgb: '52, 211, 153'
        },
        blue: {
            name: '湖蓝', swatch: '#2563eb',
            primary: '#2563eb', primaryRgb: '37, 99, 235', primarySoft: '#e9f1ff',
            gradientFrom: '#2563eb', gradientTo: '#38bdf8', grad2Rgb: '56, 189, 248',
            darkPrimary: '#60a5fa', darkPrimaryRgb: '96, 165, 250', darkPrimarySoft: 'rgba(96, 165, 250, .12)',
            darkGradientFrom: '#60a5fa', darkGradientTo: '#22d3ee', darkGrad2Rgb: '34, 211, 238'
        },
        indigo: {
            name: '靛青', swatch: '#4f46e5',
            primary: '#4f46e5', primaryRgb: '79, 70, 229', primarySoft: '#eef0ff',
            gradientFrom: '#4f46e5', gradientTo: '#6366f1', grad2Rgb: '99, 102, 241',
            darkPrimary: '#818cf8', darkPrimaryRgb: '129, 140, 248', darkPrimarySoft: 'rgba(129, 140, 248, .12)',
            darkGradientFrom: '#818cf8', darkGradientTo: '#a78bfa', darkGrad2Rgb: '167, 139, 250'
        },
        purple: {
            name: '紫罗兰', swatch: '#7c3aed',
            primary: '#7c3aed', primaryRgb: '124, 58, 237', primarySoft: '#f3ebfe',
            gradientFrom: '#7c3aed', gradientTo: '#a855f7', grad2Rgb: '168, 85, 247',
            darkPrimary: '#a78bfa', darkPrimaryRgb: '167, 139, 250', darkPrimarySoft: 'rgba(167, 139, 250, .12)',
            darkGradientFrom: '#a78bfa', darkGradientTo: '#c084fc', darkGrad2Rgb: '192, 132, 252'
        },
        rose: {
            name: '玫红', swatch: '#e11d48',
            primary: '#e11d48', primaryRgb: '225, 29, 72', primarySoft: '#fff0f3',
            gradientFrom: '#e11d48', gradientTo: '#fb7185', grad2Rgb: '251, 113, 133',
            darkPrimary: '#fb7185', darkPrimaryRgb: '251, 113, 133', darkPrimarySoft: 'rgba(251, 113, 133, .14)',
            darkGradientFrom: '#fb7185', darkGradientTo: '#f43f5e', darkGrad2Rgb: '244, 63, 94'
        },
        amber: {
            name: '琥珀', swatch: '#d97706',
            primary: '#d97706', primaryRgb: '217, 119, 6', primarySoft: '#fef3e2',
            gradientFrom: '#d97706', gradientTo: '#f59e0b', grad2Rgb: '245, 158, 11',
            darkPrimary: '#fbbf24', darkPrimaryRgb: '251, 191, 36', darkPrimarySoft: 'rgba(251, 191, 36, .14)',
            darkGradientFrom: '#fbbf24', darkGradientTo: '#f59e0b', darkGrad2Rgb: '245, 158, 11'
        },
        teal: {
            name: '青碧', swatch: '#0d9488',
            primary: '#0d9488', primaryRgb: '13, 148, 136', primarySoft: '#e6f7f4',
            gradientFrom: '#0d9488', gradientTo: '#2dd4bf', grad2Rgb: '45, 212, 191',
            darkPrimary: '#2dd4bf', darkPrimaryRgb: '45, 212, 191', darkPrimarySoft: 'rgba(45, 212, 191, .14)',
            darkGradientFrom: '#2dd4bf', darkGradientTo: '#14b8a6', darkGrad2Rgb: '20, 184, 166'
        },
        cyan: {
            name: '天青', swatch: '#0891b2',
            primary: '#0891b2', primaryRgb: '8, 145, 178', primarySoft: '#e6f8fb',
            gradientFrom: '#0891b2', gradientTo: '#22d3ee', grad2Rgb: '34, 211, 238',
            darkPrimary: '#22d3ee', darkPrimaryRgb: '34, 211, 238', darkPrimarySoft: 'rgba(34, 211, 238, .14)',
            darkGradientFrom: '#22d3ee', darkGradientTo: '#06b6d4', darkGrad2Rgb: '6, 182, 212'
        }
    };

    var DEFAULT_KEY = 'green';

    function getScheme(key) {
        return SCHEMES[key] || SCHEMES[DEFAULT_KEY];
    }

    // 生成覆盖 :root / body.dark 变量的一组 CSS 文本
    function buildCss(key) {
        var s = getScheme(key);
        return ':root{' +
            '--nv-primary:' + s.primary + ';' +
            '--nv-primary-rgb:' + s.primaryRgb + ';' +
            '--nv-primary-soft:' + s.primarySoft + ';' +
            '--nv-gradient-from:' + s.gradientFrom + ';' +
            '--nv-gradient-to:' + s.gradientTo + ';' +
            '--nv-grad-2-rgb:' + s.grad2Rgb + ';' +
            '--nv-gradient:linear-gradient(135deg,' + s.gradientFrom + ' 0%,' + s.gradientTo + ' 100%);' +
            '--nv-shadow-hover:0 18px 38px -16px rgba(' + s.primaryRgb + ', .42);' +
            '}' +
            'body.dark{' +
            '--nv-primary:' + s.darkPrimary + ';' +
            '--nv-primary-rgb:' + s.darkPrimaryRgb + ';' +
            '--nv-primary-soft:' + s.darkPrimarySoft + ';' +
            '--nv-gradient-from:' + s.darkGradientFrom + ';' +
            '--nv-gradient-to:' + s.darkGradientTo + ';' +
            '--nv-grad-2-rgb:' + s.darkGrad2Rgb + ';' +
            '--nv-gradient:linear-gradient(135deg,' + s.darkGradientFrom + ' 0%,' + s.darkGradientTo + ' 100%);' +
            '--nv-shadow-hover:0 18px 40px -16px rgba(' + s.darkPrimaryRgb + ', .55);' +
            '}' +
            // 让后台（管理面板）的 Tailwind primary 也跟随所选色系，保持整体一致
            '.bg-primary{background-color:var(--nv-primary)!important}' +
            '.text-primary{color:var(--nv-primary)!important}' +
            '.border-primary{border-color:var(--nv-primary)!important}';
    }

    // 注入/更新色系样式（幂等）。elementId 固定，重复调用只更新内容。
    function applyColorScheme(key) {
        if (typeof document === 'undefined') return;
        var el = document.getElementById('site-color-scheme');
        if (!el) {
            el = document.createElement('style');
            el.id = 'site-color-scheme';
            (document.head || document.getElementsByTagName('head')[0]).appendChild(el);
        }
        el.textContent = buildCss(key);
    }

    window.COLOR_SCHEMES = SCHEMES;
    window.COLOR_SCHEME_DEFAULT = DEFAULT_KEY;
    window.applyColorScheme = applyColorScheme;
    window.getColorScheme = getScheme;
})();
