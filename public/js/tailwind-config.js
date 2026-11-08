// Tailwind 自定义配置
tailwind.config = {
    darkMode: 'class', // 启用dark mode，使用class策略
    theme: {
        extend: {
            colors: {
                primary: '#0e9b74', // 主色调（默认翠绿，实际跟随网站色系动态覆盖）
                secondary: '#F3F4F6', // 辅助色调（浅灰）
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        }
    }
};