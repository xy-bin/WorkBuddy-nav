/* ============================================================
   admin-layout.js — 控制台布局联动（纯展示层）
   只负责：页面头标题/说明、横向标签页高亮、与左侧菜单同步。
   面板显隐仍由 admin.js 的 bindNavigationEvents() 负责，
   本文件通过触发对应菜单链接的 click 复用原逻辑，不重复实现。
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

        // 从标签条切换时，左侧菜单也要同步高亮
        var link = $('#admin-sidebar a[href="#' + id + '"]');
        if (link.length && !link.hasClass('bg-primary')) {
            $('#admin-sidebar a').removeClass('bg-primary text-white');
            link.addClass('bg-primary text-white');
        }
    }

    $(function () {
        if (!$('#admin-tabs').length) return;

        $('#admin-tabs').on('click', 'a', function (e) {
            e.preventDefault();
            var id = (this.getAttribute('href') || '').slice(1);
            if (!META[id]) return;

            // 复用 admin.js 里已有的面板切换与初始化逻辑
            $('#admin-sidebar a[href="#' + id + '"]').trigger('click');
            activate(id);

            var head = document.querySelector('.admin-pagehead');
            if (head && head.scrollIntoView) {
                head.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        // 事件委托：admin.js 的直接绑定先执行，这里读取切换后的状态
        $(document).on('click', '#admin-sidebar a', function () {
            activate((this.getAttribute('href') || '').slice(1));
        });

        activate('dashboard');
    });
})(window.jQuery);
