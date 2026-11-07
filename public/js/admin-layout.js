/* ============================================================
   admin-layout.js — 控制台布局联动（纯展示层）
   只负责：页面头标题/说明、顶部标签页高亮、滚动定位。
   面板显隐与功能初始化仍由 admin.js 的 bindNavigationEvents() 负责，
   它对同一个 #admin-tabs a 直接绑定了 click，本文件用事件委托随后执行。
   左侧菜单已移除，顶部标签页是唯一导航入口。
   ============================================================ */
(function ($) {
    'use strict';
    if (!$) return;

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

    function scrollToHead() {
        var head = document.querySelector('.admin-pagehead');
        if (head && head.scrollIntoView) {
            head.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    $(function () {
        if (!$('#admin-tabs').length) return;

        // admin.js 的直接绑定先执行（完成面板切换），这里再更新标题与高亮
        $('#admin-tabs').on('click', 'a', function (e) {
            e.preventDefault();
            var id = (this.getAttribute('href') || '').slice(1);
            if (!META[id]) return;
            activate(id);
            scrollToHead();
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
