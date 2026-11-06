// Tailwind 自定义配置
tailwind.config = {
    darkMode: 'class', // 启用dark mode，使用class策略
    theme: {
        extend: {
            colors: {
                primary: '#4F46E5', // 主色调（紫色，可修改）
                secondary: '#F3F4F6', // 辅助色调（浅灰）
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        }
    }
};