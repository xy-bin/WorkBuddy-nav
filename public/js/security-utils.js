/* 前端共用安全工具：所有进入 HTML 的动态数据必须经过这里 */
(function (global) {
    'use strict';

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // URL 属性专用：只放行安全协议，同时做 HTML 属性转义（不改变原始 URL 形式）
    function safeHref(value) {
        const raw = String(value === null || value === undefined ? '' : value).trim();
        if (!raw) return '#';
        const lower = raw.toLowerCase();
        if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
            if (!/^(https?:|mailto:|tel:)/i.test(raw)) return '#';
        }
        if (lower.startsWith('//')) return '#';
        return esc(raw);
    }

    // 富文本白名单净化：用于公告正文 / 自定义 footer
    function sanitizeRichHtml(input) {
        const doc = new DOMParser().parseFromString(String(input || ''), 'text/html');
        const blocked = new Set([
            'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'STYLE', 'LINK', 'META',
            'BASE', 'FORM', 'INPUT', 'SVG', 'MATH', 'TEMPLATE', 'BUTTON', 'TEXTAREA'
        ]);
        function walk(node) {
            Array.from(node.children).forEach(function (el) {
                if (blocked.has(el.tagName)) { el.remove(); return; }
                Array.from(el.attributes).forEach(function (attr) {
                    const name = attr.name.toLowerCase();
                    const value = String(attr.value).trim();
                    if (name.indexOf('on') === 0) {
                        el.removeAttribute(attr.name);
                    } else if (name === 'href' || name === 'src' || name === 'action' || name === 'formaction') {
                        if (safeHref(value) === '#') el.removeAttribute(attr.name);
                        else el.setAttribute(attr.name, safeHref(value));
                    }
                });
                walk(el);
            });
        }
        walk(doc.body);
        return doc.body.innerHTML;
    }

    global.NavSecurity = { esc: esc, safeHref: safeHref, sanitizeRichHtml: sanitizeRichHtml };
})(window);
