// 主题管理器 - 负责主题切换和背景图管理
class ThemeManager {
    constructor() {
        this.themeToggleBtn = $('#theme-toggle-btn');
        this.body = $('body');
        this.bgImageContainer = $('#bg-image-container');
        this.init();
    }

    init() {
        // 创建背景图容器（必须先执行）
        this.createBgImageContainer();
        // 初始化主题设置
        this.loadThemeSettings();
        // 绑定主题切换事件
        this.bindEvents();
    }

    // 创建背景图容器（样式在此统一设置，兼容页面里已存在的静态容器）
    createBgImageContainer() {
        if (!this.bgImageContainer.length) {
            this.bgImageContainer = $('<div id="bg-image-container" aria-hidden="true"></div>');
            this.body.prepend(this.bgImageContainer);
        }
        this.bgImageContainer.css({
            'position': 'fixed',
            'top': 0,
            'left': 0,
            'width': '100%',
            'height': '100%',
            'z-index': -1,
            'pointer-events': 'none',
            'background-repeat': 'no-repeat',
            'background-position': 'center',
            'background-attachment': 'fixed',
            'background-size': 'cover',
            'opacity': 1,
            'transition': 'opacity .45s ease'
        });
    }

    // 加载主题设置
    loadThemeSettings() {
        const themeSettings = this.getThemeSettings();
        
        // 应用主题
        if (themeSettings.theme === 'dark' || (!themeSettings.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.enableDarkMode();
        } else {
            this.enableLightMode();
        }

        // 应用背景图
        this.applyBackgroundImage(themeSettings);
    }

    // 绑定事件
    bindEvents() {
        // 主题切换按钮点击事件
        this.themeToggleBtn.on('click', () => {
            if (this.body.hasClass('dark')) {
                this.enableLightMode();
            } else {
                this.enableDarkMode();
            }
        });
    }

    // 启用夜间模式
    enableDarkMode() {
        this.body.addClass('dark');
        this.themeToggleBtn.find('i').removeClass('fa-moon-o').addClass('fa-sun-o');
        
        // 保存主题设置
        this.saveThemeSetting('theme', 'dark');
        console.log('切换到夜间模式');
    }

    // 启用白天模式
    enableLightMode() {
        this.body.removeClass('dark');
        this.themeToggleBtn.find('i').removeClass('fa-sun-o').addClass('fa-moon-o');
        
        // 保存主题设置
        this.saveThemeSetting('theme', 'light');
        console.log('切换到白天模式');
    }

    // 安全地把 URL 写进 CSS background-image，阻止引号/换行注入
    setBackgroundUrl(raw) {
        const url = String(raw || '').trim().replace(/[\r\n\t]/g, '');
        if (!/^(https?:\/\/|data:image\/)/i.test(url)) return false;
        const safe = url.replace(/["\\]/g, '\\$&');
        this.bgImageContainer.css('background-image', 'url("' + safe + '")');
        return true;
    }

    // 应用背景图：开启时给 body 打标记，样式层据此把内容区切成半透明玻璃
    applyBackgroundImage(settings) {
        const enabled = !!settings.bgImageEnabled &&
            (settings.bgImageType !== 'custom' || !!settings.bgImageUrl);
        this.body.toggleClass('has-bg-image', enabled);
        if (!enabled) {
            this.bgImageContainer.hide();
            return;
        }

        const opacity = Math.min(1, Math.max(0.3, Number(settings.bgImageOpacity) || 1));
        const size = settings.bgImageSize === 'contain' ? 'contain' : 'cover';
        this.bgImageContainer.css({
            'background-size': size,
            'background-attachment': 'fixed',
            'background-color': size === 'contain' ? 'var(--nv-bg)' : 'transparent',
            'opacity': opacity
        }).show();

        if (settings.bgImageType === 'custom' && settings.bgImageUrl) {
            if (!this.setBackgroundUrl(settings.bgImageUrl)) {
                this.body.removeClass('has-bg-image');
                this.bgImageContainer.hide();
            }
        } else {
            this.loadRandomBackgroundImage(settings.bgImageApi);
        }
    }

    // 加载随机背景图
    loadRandomBackgroundImage(apiUrl) {
        // 备用背景图API列表 - 尽量使用简单的URL格式避免被ORB阻止
        const backupApis = [
            'https://picsum.photos/1920/1080', // 简化的Picsum API
            'https://picsum.photos/1920/1080?random', // 带random参数的Picsum API
            'https://fastly.picsum.photos/id/1015/1920/1080.jpg' // 具体ID的图片，更稳定
        ];

        // 默认背景颜色（作为最后备选，跟随明暗主题变量）
        const defaultBgColor = 'var(--nv-bg)';

        // 如果没有指定API，直接使用备用API列表
        const apiList = apiUrl ? [apiUrl, ...backupApis] : backupApis;

        console.log(`准备加载背景图，API列表: ${JSON.stringify(apiList)}`);

        // 尝试加载背景图的函数
        const tryLoadImage = (list, index = 0) => {
            if (index >= list.length) {
                console.error('所有背景图API都加载失败，使用默认背景色');
                // 使用默认背景色，不隐藏容器
                this.bgImageContainer.css({
                    'background-image': 'none',
                    'background-color': defaultBgColor
                });
                this.bgImageContainer.show();
                return;
            }

            const currentApi = list[index];
            console.log(`尝试加载背景图 (${index + 1}/${list.length}): ${currentApi}`);

            // 创建图片对象预加载
            const img = new Image();
            
            // 设置超时时间（5秒）
            const timeout = setTimeout(() => {
                console.error(`背景图加载超时: ${currentApi}`);
                img.src = ''; // 取消加载
                tryLoadImage(list, index + 1);
            }, 5000);

            img.onload = () => {
                clearTimeout(timeout);
                console.log('背景图加载成功');
                this.setBackgroundUrl(img.src);
                this.bgImageContainer.css('background-color', 'transparent').show();
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                console.error(`背景图加载失败: ${currentApi}`);
                // 尝试下一个备用API
                tryLoadImage(list, index + 1);
            };
            
            // 尝试添加随机参数避免缓存
            const randomApi = currentApi + (currentApi.includes('?') ? '&' : '?') + 't=' + Date.now();
            img.src = randomApi;
        };

        // 开始尝试加载背景图
        tryLoadImage(apiList);
    }

    // 获取主题设置
    getThemeSettings() {
        const defaultSettings = {
            theme: 'light',
            bgImageEnabled: false, // 渐变首屏：默认不再叠加全屏随机照片
            bgImageType: 'random',
            bgImageUrl: '',
            bgImageOpacity: 1,      // 1 = 原图清晰可见（旧版固定 0.3 会把图压得很淡）
            bgImageSize: 'cover',   // cover = 铺满；contain = 完整显示不裁切
            bgImageApi: 'https://picsum.photos/1920/1080' // 使用更可靠的Picsum Photos作为默认API
        };
        const MIGRATION_KEY = 'nav-hero-gradient-v2';

        try {
            const savedSettings = JSON.parse(localStorage.getItem('themeSettings'));

            // 如果保存的设置中使用了可能被阻止的Unsplash API，自动替换为Picsum API
            if (savedSettings && savedSettings.bgImageApi && savedSettings.bgImageApi.includes('unsplash.com')) {
                savedSettings.bgImageApi = defaultSettings.bgImageApi;
                console.log('自动替换Unsplash API为Picsum API');
            }

            // 一次性迁移：旧版默认会加载 picsum 随机照片，容易随机到带大字的图片，
            // 与渐变首屏冲突。仅当用户从未自定义过背景配置时关闭；
            // 之后在后台「主题设置」里的显式开启不受影响。
            if (savedSettings && !localStorage.getItem(MIGRATION_KEY)) {
                const isLegacyDefault = savedSettings.bgImageEnabled === true &&
                    savedSettings.bgImageType === 'random' && !savedSettings.bgImageUrl &&
                    (!savedSettings.bgImageApi || savedSettings.bgImageApi === defaultSettings.bgImageApi);
                if (isLegacyDefault) {
                    savedSettings.bgImageEnabled = false;
                    localStorage.setItem('themeSettings', JSON.stringify(savedSettings));
                }
                localStorage.setItem(MIGRATION_KEY, '1');
            }

            return { ...defaultSettings, ...savedSettings };
        } catch (error) {
            console.error('主题设置读取失败:', error);
            return defaultSettings;
        }
    }

    // 保存主题设置
    saveThemeSetting(key, value) {
        const settings = this.getThemeSettings();
        settings[key] = value;
        localStorage.setItem('themeSettings', JSON.stringify(settings));
    }

    // 保存所有主题设置
    saveAllSettings(settings) {
        localStorage.setItem('themeSettings', JSON.stringify(settings));
        // 重新应用设置
        this.loadThemeSettings();
    }

    // 更新背景图
    updateBackgroundImage() {
        const settings = this.getThemeSettings();
        this.applyBackgroundImage(settings);
    }
}

// 导出主题管理器
window.ThemeManager = ThemeManager;