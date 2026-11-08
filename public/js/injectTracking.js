// 将后台「网站设置 → 统计代码」中粘贴的第三方统计/追踪代码注入到 <head>
// 典型用法：百度统计、Google Analytics(GA4)、51.la、CNZZ、Microsoft Clarity 等整段代码
// 通过 DOM 解析后移动节点到 <head>，保证 <script src> 与内联 <script> 都能正常执行。
window.injectTrackingCode = function (code) {
    if (!code || !String(code).trim()) return;
    try {
        const tmp = document.createElement('div');
        tmp.innerHTML = code;
        let node;
        // 逐个移动子节点到 <head>，appendChild 会执行其中的脚本
        while ((node = tmp.firstChild)) {
            document.head.appendChild(node);
        }
    } catch (e) {
        console.error('注入网站统计代码失败:', e);
    }
};
