/* ============================================================
   admin-layout.js — 控制台布局联动
   1) 顶部吸附：按顶栏实际高度写入 --admin-top-h
   2) 页面头标题/说明、顶部标签页高亮、横向滚动定位
   3) 面板显隐兜底：即使浏览器缓存了旧版 admin.js（只给已删除的
      左侧菜单绑定切换），点击标签也能正常切换内容
   面板切换与功能初始化优先由 admin.js 的 bindNavigationEvents() 完成，
   本文件用事件委托在其之后执行，只在发现没切换成功时才接管。
   ============================================================ */
(function ($) {
    'use strict';
    if (!$) return;

    var PANELS = [
        'dashboard', 'category-management', 'link-management',
        'pending-bookmarks', 'theme-settings', 'image-sources',
        'announcement-management', 'search-engine-management', 'website-settings'
    ];

    var META = {
        'dashboard': ['数据仪表盘', '查看站点分类、书签与访问数据概览。'],
        'category-management': ['分类管理', '增删分类、调整排序与图标，组织站点内容结构。'],
        'link-management': ['书签管理', '维护导航链接、描述、图标与所属分类。'],
        'pending-bookmarks': ['待审核书签', '审核访客提交的网址，决定收录或忽略。'],
        'theme-settings': ['主题设置', '配置明暗主题、背景图与首页视觉风格。'],
        'image-sources': ['图片源管理', '维护随机背景图 API 与自定义图片来源。'],
        'announcement-management': ['公告管理', '编辑首页公告标题、内容与启用状态。'],
        'search-engine-management': ['搜索引擎管理', '配置首页搜索框可切换的搜索引擎。'],
        'website-settings': ['网站设置', '调整站点资料、SEO 信息与页脚内容。']
    };

    function measureTopbar() {
        var header = document.querySelector('body.page-admin > header');
        var h = header ? header.getBoundingClientRect().height : 54;
        document.documentElement.style.setProperty('--admin-top-h', Math.ceil(h) + 'px');
    }

    function activate(id) {
        var meta = META[id];
        if (!meta) return;

        $('#admin-tabs a').removeClass('is-active')
            .filter('[href="#' + id + '"]').addClass('is-active');
        $('#admin-page-title').text(meta[0]);
        $('#admin-crumb-current').text(meta[0]);
        $('#admin-page-desc').text(meta[1]);

        // 窄屏标签条横滑时，把当前项滚到可见区域中间
        var bar = document.getElementById('admin-tabs');
        var tab = bar && bar.querySelector('a.is-active');
        if (bar && tab && bar.scrollWidth > bar.clientWidth) {
            var left = tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2;
            if (typeof bar.scrollTo === 'function') {
                bar.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
            } else {
                bar.scrollLeft = Math.max(0, left);
            }
        }

        // 兼容仍旧带左侧菜单的旧版页面（若存在则同步高亮）
        var link = $('#admin-sidebar a[href="#' + id + '"]');
        if (link.length && !link.hasClass('bg-primary')) {
            $('#admin-sidebar a').removeClass('bg-primary text-white');
            link.addClass('bg-primary text-white');
        }
    }

    // 仅当 admin.js 没有完成切换时才接管，避免重复初始化
    function ensurePanel(id) {
        var target = document.getElementById(id);
        if (!target || !target.classList.contains('hidden')) return;

        PANELS.forEach(function (pid) {
            if (pid === id) return;
            var el = document.getElementById(pid);
            if (el) el.classList.add('hidden');
        });
        target.classList.remove('hidden');

        if (id === 'pending-bookmarks' && typeof window.loadPendingBookmarks === 'function') {
            window.loadPendingBookmarks();
        }
        if (id === 'search-engine-management' && typeof window.initSearchEngineManagement === 'function') {
            window.initSearchEngineManagement();
        }
    }

    function scrollToTop() {
        if (window.scrollY > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    $(function () {
        if (!$('#admin-tabs').length) return;

        measureTopbar();
        window.addEventListener('resize', measureTopbar);
        window.addEventListener('load', measureTopbar);
        if (window.ResizeObserver) {
            var header = document.querySelector('body.page-admin > header');
            if (header) new ResizeObserver(measureTopbar).observe(header);
        }

        // admin.js 的直接绑定先执行（完成面板切换），这里随后更新展示层
        $('#admin-tabs').on('click', 'a', function (e) {
            e.preventDefault();
            var id = (this.getAttribute('href') || '').slice(1);
            if (!META[id]) return;
            ensurePanel(id);
            activate(id);
            scrollToTop();
        });

        // 支持直接用 #link-management 之类的锚点进入对应模块
        var initial = (window.location.hash || '').slice(1);
        if (META[initial]) {
            $('#admin-tabs a[href="#' + initial + '"]').trigger('click');
        } else {
            activate('dashboard');
        }
    });
})(window.jQuery);
