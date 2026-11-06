// 监听来自管理后台的主题预览请求
window.addEventListener('message', function(event) {
    if (event.data.type === 'applyThemeSettings') {
        // 应用预览主题设置
        if (window.themeManager) {
            window.themeManager.saveAllSettings(event.data.settings);
        }
    }
});