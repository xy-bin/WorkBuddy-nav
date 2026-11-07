// 安全工具别名（js/security-utils.js 由页面先行引入）
const esc = NavSecurity.esc;
const safeHref = NavSecurity.safeHref;
const sanitizeRichHtml = NavSecurity.sanitizeRichHtml;

// 管理后台核心功能


// 根据URL或网站名称自动匹配图标
function autoMatchIcon(url, name) {
    // 常见网站图标映射
    const iconMap = {
        // 搜索引擎
        'google.com': 'fa fa-google',
        'baidu.com': 'fa fa-paw',
        'bing.com': 'fa fa-windows',
        'sogou.com': 'fa fa-search',
        'so.com': 'fa fa-search',
        'yandex.ru': 'fa fa-search',
        'duckduckgo.com': 'fa fa-search',
        
        // 社交媒体
        'facebook.com': 'fa fa-facebook',
        'twitter.com': 'fa fa-twitter',
        'instagram.com': 'fa fa-instagram',
        'linkedin.com': 'fa fa-linkedin',
        'pinterest.com': 'fa fa-pinterest',
        'reddit.com': 'fa fa-reddit',
        'youtube.com': 'fa fa-youtube',
        'vimeo.com': 'fa fa-vimeo',
        'tiktok.com': 'fa fa-music',
        'snapchat.com': 'fa fa-camera',
        'weibo.com': 'fa fa-weibo',
        'wechat.com': 'fa fa-wechat',
        'qq.com': 'fa fa-qq',
        
        // 新闻资讯
        'news.google.com': 'fa fa-newspaper-o',
        'cnn.com': 'fa fa-newspaper-o',
        'bbc.com': 'fa fa-newspaper-o',
        'reuters.com': 'fa fa-newspaper-o',
        'nytimes.com': 'fa fa-newspaper-o',
        'chinadaily.com.cn': 'fa fa-newspaper-o',
        
        // 视频网站
        'bilibili.com': 'fa fa-play',
        'iqiyi.com': 'fa fa-play',
        'youku.com': 'fa fa-play',
        'tudou.com': 'fa fa-play',
        'douyu.com': 'fa fa-twitch',
        'huya.com': 'fa fa-twitch',
        
        // 购物网站
        'amazon.com': 'fa fa-shopping-cart',
        'taobao.com': 'fa fa-shopping-cart',
        'tmall.com': 'fa fa-shopping-cart',
        'jd.com': 'fa fa-shopping-cart',
        'pinduoduo.com': 'fa fa-shopping-cart',
        'suning.com': 'fa fa-shopping-cart',
        'gome.com.cn': 'fa fa-shopping-cart',
        
        // 工具网站
        'github.com': 'fa fa-github',
        'gitlab.com': 'fa fa-gitlab',
        'bitbucket.org': 'fa fa-bitbucket',
        'stackoverflow.com': 'fa fa-stack-overflow',
        'w3schools.com': 'fa fa-book',
        'mdn.io': 'fa fa-book',
        'jsfiddle.net': 'fa fa-code',
        'codepen.io': 'fa fa-code',
        
        // 邮箱
        'gmail.com': 'fa fa-envelope',
        'yahoo.com': 'fa fa-envelope',
        'outlook.com': 'fa fa-envelope',
        'qq.com': 'fa fa-envelope',
        '163.com': 'fa fa-envelope',
        
        // 云存储
        'dropbox.com': 'fa fa-dropbox',
        'drive.google.com': 'fa fa-cloud',
        'onedrive.live.com': 'fa fa-cloud',
        
        // 音乐
        'spotify.com': 'fa fa-music',
        'music.163.com': 'fa fa-music',
        'qqmusic.qq.com': 'fa fa-music',
        'kugou.com': 'fa fa-music',
        'kuwo.cn': 'fa fa-music',
        
        // 工具
        'baidu.com': 'fa fa-paw',
        'weather.com': 'fa fa-cloud',
        'maps.google.com': 'fa fa-map-marker',
        'translate.google.com': 'fa fa-language',
        
        // 游戏
        'steamcommunity.com': 'fa fa-gamepad',
        'playstation.com': 'fa fa-gamepad',
        'xbox.com': 'fa fa-gamepad',
        'nintendo.com': 'fa fa-gamepad'
    };
    
    // 尝试从URL中提取域名
    let domain = '';
    try {
        const urlObj = new URL(url);
        domain = urlObj.hostname;
    } catch (e) {
        // 如果URL解析失败，尝试从名称中提取关键词
        domain = name.toLowerCase();
    }
    
    // 检查完整域名
    if (iconMap[domain]) {
        return iconMap[domain];
    }
    
    // 检查子域名（如www.google.com -> google.com）
    const parts = domain.split('.');
    if (parts.length >= 2) {
        const mainDomain = parts.slice(-2).join('.');
        if (iconMap[mainDomain]) {
            return iconMap[mainDomain];
        }
    }
    
    // 根据网站名称匹配
    const lowerName = name.toLowerCase();
    for (const key in iconMap) {
        if (lowerName.includes(key.replace('.com', '').replace('.cn', '').replace('.org', '').replace('.net', ''))) {
            return iconMap[key];
        }
    }
    
    // 通用图标
    if (lowerName.includes('搜索') || lowerName.includes('search')) {
        return 'fa fa-search';
    } else if (lowerName.includes('邮件') || lowerName.includes('email')) {
        return 'fa fa-envelope';
    } else if (lowerName.includes('视频') || lowerName.includes('video')) {
        return 'fa fa-play';
    } else if (lowerName.includes('音乐') || lowerName.includes('music')) {
        return 'fa fa-music';
    } else if (lowerName.includes('购物') || lowerName.includes('shop') || lowerName.includes('buy')) {
        return 'fa fa-shopping-cart';
    } else if (lowerName.includes('新闻') || lowerName.includes('news')) {
        return 'fa fa-newspaper-o';
    } else if (lowerName.includes('地图') || lowerName.includes('map')) {
        return 'fa fa-map-marker';
    } else if (lowerName.includes('游戏') || lowerName.includes('game')) {
        return 'fa fa-gamepad';
    } else if (lowerName.includes('工具') || lowerName.includes('tool')) {
        return 'fa fa-wrench';
    } else if (lowerName.includes('学习') || lowerName.includes('study') || lowerName.includes('learn')) {
        return 'fa fa-book';
    } else if (lowerName.includes('博客') || lowerName.includes('blog')) {
        return 'fa fa-rss';
    } else if (lowerName.includes('图片') || lowerName.includes('image') || lowerName.includes('photo')) {
        return 'fa fa-picture-o';
    }
    
    // 默认图标
    return 'fa fa-link';
}

// 截断URL函数，限制显示长度并添加省略号
function truncateUrl(url, maxLength = 30) {
    if (!url || url.length <= maxLength) {
        return url;
    }
    
    // 保留协议部分
    const protocolMatch = url.match(/^https?:\/\//);
    const protocol = protocolMatch ? protocolMatch[0] : '';
    const rest = url.slice(protocol.length);
    
    if (rest.length <= maxLength - protocol.length) {
        return url;
    }
    
    // 截断剩余部分，确保总长度不超过maxLength
    const truncatedRest = rest.slice(0, maxLength - protocol.length - 3) + '...';
    
    return protocol + truncatedRest;
}


// 初始化管理页面
function initAdminPage() {
    // 初始化仪表盘
    initDashboard();
    
    // 加载分类列表
    loadCategories();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 初始化移动端菜单
    initAdminMobileMenu();
    
    // 绑定导航菜单事件
    bindNavigationEvents();
    
    // 初始化主题设置
    initThemeSettings();
    
    // 初始化图片源管理
    initImageSourceManagement();
    
    // 初始化公告管理
    initAnnouncementManagement();
    
    // 初始化网站设置管理
    initWebsiteSettings();
    
    // 初始化待审核书签管理
    initPendingBookmarks();
}


// 页面加载完成后初始化
$(document).ready(function() {
    initAdminPage();
    
    // 初始化一键添加书签功能
    generateBookmarklet();
    
    // 为复制按钮添加点击事件
    $('#copy-bookmarklet').on('click', copyBookmarklet);
});


// 初始化仪表盘
function initDashboard() {
    // 仪表盘数据加载逻辑
    $.ajax({
        url: "/api/dashboard",
        method: "GET",
        success: function(response) {
            if (response.success) {
                // 更新仪表盘统计数据
                $("#category-count").text(response.data.total_categories);
                $("#bookmark-count").text(response.data.total_bookmarks);
                // 注意：目前HTML中没有活跃用户的显示位置
                // $("#active-users").text(response.data.active_users);
            } else if (response.message && response.message.includes("请先登录")) {
                // 如果API返回未登录错误，重定向到登录页面
                window.location.href = "/login.html";
            }
        },
        error: function(xhr) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.message && response.message.includes("请先登录")) {
                    // 如果API返回未登录错误，重定向到登录页面
                    window.location.href = "/login.html";
                    return;
                }
            } catch (e) {}
            // 仪表盘数据加载失败时使用默认值
            $("#category-count").text("0");
            $("#bookmark-count").text("0");
        }
    });
    
    // 从API获取真实访问量数据
    $.ajax({
        url: "/api/dashboard",
        method: "GET",
        success: function(response) {
            if (response.success) {
                // 更新访问量统计卡片
                $("#today-visits").text(response.data.today_visits);
                $("#total-visits").text(response.data.total_visits);
            }
        },
        error: function(xhr) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.message && response.message.includes("请先登录")) {
                    // 如果API返回未登录错误，重定向到登录页面
                    window.location.href = "/login.html";
                    return;
                }
            } catch (e) {}
            // 访问量数据加载失败时使用默认值
            $("#today-visits").text("0");
            $("#total-visits").text("0");
        }
    });
    
    // 渲染图表
    renderCharts();
}


// 加载分类列表
function loadCategories() {
    $.ajax({
        url: "/api/categories",
        method: "GET",
        success: function(response) {
            if (response.success) {
                // 直接使用服务器返回的link_count字段
                const categoriesWithCount = response.data;
                
                // 填充分类列表表格
                $("#category-list").empty();
                categoriesWithCount.forEach(category => {
                    const row = "<tr data-id=\"" + esc(category.category_id) + "\"><td class=\"py-3 px-4 text-center\"><i class=\"drag-handle fa fa-bars cursor-move text-gray-500\"></i></td><td class=\"py-3 px-4 text-center\">" + esc(category.category_id) + "</td><td class=\"py-3 px-4\"><i class=\"" + esc(category.category_icon) + " text-xl mr-2\"></i>" + esc(category.category_name) + "</td><td class=\"py-3 px-4 font-mono text-sm\">" + esc(category.category_icon) + "</td><td class=\"py-3 px-4 text-center font-medium text-blue-600\">" + (category.link_count || 0) + "</td><td class=\"py-3 px-4 text-right\"><button type=\"button\" class=\"edit-category-btn bg-primary text-white px-3 py-1 rounded-lg mr-2\" data-id=\"" + esc(category.category_id) + "\">编辑</button><button type=\"button\" class=\"delete-category-btn bg-red-500 text-white px-3 py-1 rounded-lg\" data-id=\"" + esc(category.category_id) + "\">删除</button></td></tr>";
                    $("#category-list").append(row);
                });
                    
                    // 填充分类选择下拉框
                    $("#select-category").empty();
                    // 添加"全部分类"选项
                    $("#select-category").append("<option value=\"\">全部分类</option>");
                    response.data.forEach(category => {
                        const option = "<option value=\"" + esc(category.category_id) + "\">" + esc(category.category_name) + "</option>";
                        $("#select-category").append(option);
                        $("#link-category").append(option);
                    });
                    
                    bindCategoryActions();
                    bindCategoryFilter();
                    
                    // 分类加载完成后，默认加载所有书签
                    loadBookmarks();
            } else if (response.message && response.message.includes("请先登录")) {
                // 如果API返回未登录错误，重定向到登录页面
                window.location.href = "/login.html";
            }
        },
        error: function(xhr) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.message && response.message.includes("请先登录")) {
                    // 如果API返回未登录错误，重定向到登录页面
                    window.location.href = "/login.html";
                    return;
                }
            } catch (e) {}
            
            let errorMsg = "加载分类失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
            
            // 分类加载失败时，仍然尝试加载书签
            loadBookmarks();
        }
    });
}


// 绑定分类操作事件
function bindCategoryActions() {
    // 移除事件委托绑定，移到initEventListeners()中
}


// 加载书签列表
function loadBookmarks(categoryId = null) {
    let url = "/api/bookmarks";
    if (categoryId) {
        url = "/api/categories/" + categoryId + "/links";
    }
    
    $.ajax({
        url: url,
        method: "GET",
        success: function(response) {
            let bookmarks = [];
            if (response.success) {
                bookmarks = response.data || [];
            } else if (response.length > 0) {
                // 处理旧格式的响应
                bookmarks = response.map(link => ({
                    bookmark_id: link.link_id,
                    bookmark_name: link.link_name,
                    bookmark_url: link.link_url,
                    bookmark_icon: link.link_icon,
                    bookmark_description: link.link_desc,
                    category_id: link.category_id,
                    sort: link.sort
                }));
            }

            // 统一字段别名：管理端表格读 bookmark_*，部分接口/备份数据返回 link_*。
            // 不做这层归一化时，字段缺失会让 ID、名称、URL 三列静默显示为空。
            bookmarks = (Array.isArray(bookmarks) ? bookmarks : []).map(b => ({
                bookmark_id: b.bookmark_id != null ? b.bookmark_id : (b.link_id != null ? b.link_id : ''),
                bookmark_name: b.bookmark_name != null ? b.bookmark_name : (b.link_name || ''),
                bookmark_url: b.bookmark_url != null ? b.bookmark_url : (b.link_url || ''),
                bookmark_icon: b.bookmark_icon != null ? b.bookmark_icon : (b.link_icon || 'fa fa-link'),
                bookmark_description: b.bookmark_description != null ? b.bookmark_description : (b.link_desc || ''),
                category_id: b.category_id != null ? b.category_id : 0,
                category_name: b.category_name || '',
                sort: b.sort != null ? b.sort : 0
            }));

            $("#link-list").empty();
            bookmarks.forEach(bookmark => {
                const row = "<tr data-id=\"" + esc(bookmark.bookmark_id) + "\" class=\"hover:bg-gray-50 transition-colors duration-150\"><td class=\"py-3 px-4 text-center bg-gray-50 hover:bg-gray-100\"><i class=\"drag-handle fa fa-bars cursor-move text-gray-400 hover:text-gray-600 transition-colors duration-150\"></i></td><td class=\"py-3 px-4 text-gray-500 font-mono text-sm\" width=\"80\">" + esc(bookmark.bookmark_id) + "</td><td class=\"py-3 px-4 font-medium\" width=\"200\"><i class=\"" + esc(bookmark.bookmark_icon) + " text-xl text-gray-700 mr-2\"></i>" + esc(bookmark.bookmark_name) + "</td><td class=\"py-3 px-4 truncate flex-1\"><a href=\"" + safeHref(bookmark.bookmark_url) + "\" target=\"_blank\" title=\"" + safeHref(bookmark.bookmark_url) + "\" class=\"text-blue-600 hover:text-blue-800 transition-colors duration-150\">" + esc(truncateUrl(bookmark.bookmark_url, 30)) + "</a></td><td class=\"py-3 px-4 text-right\"><button type=\"button\" class=\"edit-link-btn bg-primary text-white px-3 py-1 rounded-lg mr-2 hover:bg-primary/90 transition-colors duration-150\" data-id=\"" + esc(bookmark.bookmark_id) + "\">编辑</button><button type=\"button\" class=\"delete-link-btn bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-150\" data-id=\"" + esc(bookmark.bookmark_id) + "\">删除</button></td></tr>";
                $("#link-list").append(row);
            });
            bindBookmarkActions();
        },
        error: function(xhr) {
            let errorMsg = "加载书签失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
        }
    });
}

// 绑定分类选择事件
function bindCategoryFilter() {
    $("#select-category").on("change", function() {
        const categoryId = $(this).val();
        loadBookmarks(categoryId || null);
    });
}


// 绑定书签操作事件
function bindBookmarkActions() {
    // 移除事件委托绑定，移到initEventListeners()中
}


// 初始化拖拽排序功能
function initSortable() {
    // 初始化分类拖拽排序
    $("#category-list").sortable({
        handle: ".drag-handle",
        axis: "y",
        update: function(event, ui) {
            // 获取排序后的分类ID数组
            const categoryIds = $("#category-list").sortable("toArray", { attribute: "data-id" });
            
            // 更新每个分类的排序值
            categoryIds.forEach((id, index) => {
                $.ajax({
                    url: "/api/categories/" + id + "/sort",
                    method: "PUT",
                    data: JSON.stringify({ sort: index + 1 }),
                    contentType: "application/json",
                    success: function(response) {
                        // 排序已保存，无需更新页面显示
                    },
                    error: function(xhr) {
                        let errorMsg = "更新分类排序失败";
                        try {
                            const response = JSON.parse(xhr.responseText);
                            errorMsg = response.message || errorMsg;
                        } catch (e) {}
                        alert(errorMsg);
                        // 恢复原始排序
                        $("#category-list").sortable("cancel");
                    }
                });
            });
        }
    });
    
    // 初始化书签拖拽排序
    $("#link-list").sortable({
        handle: ".drag-handle",
        axis: "y",
        update: function(event, ui) {
            // 获取排序后的书签ID数组
            const bookmarkIds = $("#link-list").sortable("toArray", { attribute: "data-id" });
            
            // 更新每个书签的排序值
            bookmarkIds.forEach((id, index) => {
                $.ajax({
                    url: "/api/links/" + id + "/sort",
                    method: "PUT",
                    data: JSON.stringify({ sort: index + 1 }),
                    contentType: "application/json",
                    success: function(response) {
                        // 排序已保存，无需更新页面显示
                    },
                    error: function(xhr) {
                        let errorMsg = "更新书签排序失败";
                        try {
                            const response = JSON.parse(xhr.responseText);
                            errorMsg = response.message || errorMsg;
                        } catch (e) {}
                        alert(errorMsg);
                        // 恢复原始排序
                        $("#link-list").sortable("cancel");
                    }
                });
            });
        }
    });
}

// 初始化事件监听器
function initEventListeners() {
    // 初始化拖拽排序
    initSortable();
    
    // 一键添加书签功能
    generateBookmarklet();
    $('#copy-bookmarklet').on('click', copyBookmarklet);
    
    // 分类表单保存按钮点击
    $("#save-category-btn").on("click", function(e) {
        const id = $("#category-id").val();
        const data = {
            category_name: $("#category-name").val(),
            category_icon: $("#category-icon").val(),
            sort: $("#category-sort").val()
        };
        
        const url = id ? "/api/categories/" + id : "/api/categories";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    loadCategories();
                    alert(id ? "分类更新成功" : "分类创建成功");
                    $("#category-form").addClass("hidden");
                    $("#category-form input").val("");
                    $("#category-id").val("");
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新分类失败" : "创建分类失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 监听URL输入，自动匹配图标
    $("#link-url").on("blur", function(e) {
        const url = $("#link-url").val();
        const name = $("#link-name").val();
        
        // 只有当图标输入框为空时才自动匹配
        if (url && !$("#link-icon").val()) {
            const icon = autoMatchIcon(url, name || url);
            $("#link-icon").val(icon);
        }
    });
    
    // 监听名称输入，自动匹配图标
    $("#link-name").on("blur", function(e) {
        const name = $("#link-name").val();
        const url = $("#link-url").val();
        
        // 只有当图标输入框为空且URL已填写时才自动匹配
        if (name && url && !$("#link-icon").val()) {
            const icon = autoMatchIcon(url, name);
            $("#link-icon").val(icon);
        }
    });
    
    // 书签表单保存按钮点击
    $("#save-link-btn").on("click", function(e) {
        const id = $("#link-id").val();
        const bookmarkUrl = $("#link-url").val();
        const name = $("#link-name").val();
        
        // 在保存之前检查是否需要自动匹配图标
        if (bookmarkUrl && !$("#link-icon").val()) {
            const icon = autoMatchIcon(bookmarkUrl, name || bookmarkUrl);
            $("#link-icon").val(icon);
        }
        
        const data = {
            bookmark_name: $("#link-name").val(),
            bookmark_url: $("#link-url").val(),
            bookmark_icon: $("#link-icon").val(),
            category_id: $("#link-category").val(),
            bookmark_description: $("#link-desc").val(),
            sort: $("#link-sort").val()
        };
        
        const url = id ? "/api/bookmarks/" + id : "/api/bookmarks";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    loadBookmarks();
                    alert(id ? "书签更新成功" : "书签创建成功");
                    $("#link-form").addClass("hidden");
                    $("#link-form input").val("");
                    $("#link-id").val("");
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新书签失败" : "创建书签失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 关闭分类表单
    $("#cancel-category-btn").on("click", function() {
        $("#category-form").addClass("hidden");
        $("#category-form input").val("");
        $("#category-id").val("");
    });
    
    // 关闭书签表单
    $("#cancel-link-btn").on("click", function() {
        $("#link-form").addClass("hidden");
        $("#link-form input").val("");
        $("#link-id").val("");
    });
    
    // 添加新分类按钮
    $("#add-category-btn").on("click", function() {
        $("#category-form").removeClass("hidden");
        $("#category-form input").val("");
        $("#category-id").val("");
    });
    
    // 添加新书签按钮
    $("#add-link-btn").on("click", function() {
        $("#link-form").removeClass("hidden");
        $("#link-form input").val("");
        $("#link-id").val("");
    });
    
    // 退出登录按钮
    $("#logout-btn").on("click", function() {
        $.ajax({
            url: "/api/logout",
            method: "POST",
            success: function(response) {
                if (response.success) {
                    window.location.href = "/login.html";
                }
            },
            error: function(xhr) {
                let errorMsg = "退出登录失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
    
    // 分类表单保存按钮点击
    $("#save-category-btn").on("click", function(e) {
        const id = $("#category-id").val();
        const data = {
            category_name: $("#category-name").val(),
            category_icon: $("#category-icon").val(),
            sort: $("#category-sort").val()
        };
        
        const url = id ? "/api/categories/" + id : "/api/categories";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    loadCategories();
                    alert(id ? "分类更新成功" : "分类创建成功");
                    $("#category-form").addClass("hidden");
                    $("#category-form input").val("");
                    $("#category-id").val("");
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新分类失败" : "创建分类失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 书签表单保存按钮点击
    $("#save-link-btn").on("click", function(e) {
        const id = $("#link-id").val();
        const bookmarkUrl = $("#link-url").val();
        const name = $("#link-name").val();
        
        // 在保存之前检查是否需要自动匹配图标
        if (bookmarkUrl && !$("#link-icon").val()) {
            const icon = autoMatchIcon(bookmarkUrl, name || bookmarkUrl);
            $("#link-icon").val(icon);
        }
        
        const data = {
            bookmark_name: $("#link-name").val(),
            bookmark_url: $("#link-url").val(),
            bookmark_icon: $("#link-icon").val(),
            category_id: $("#link-category").val(),
            bookmark_description: $("#link-desc").val(),
            sort: $("#link-sort").val()
        };
        
        const url = id ? "/api/bookmarks/" + id : "/api/bookmarks";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    loadBookmarks();
                    alert(id ? "书签更新成功" : "书签创建成功");
                    $("#link-form").addClass("hidden");
                    $("#link-form input, #link-form textarea").val("");
                    $("#link-id").val("");
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新书签失败" : "创建书签失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 图片源表单保存按钮点击
    $("#save-image-source-btn").on("click", function(e) {
        const id = $("#image-source-id").val();
        const data = {
            name: $("#image-source-name").val(),
            url: $("#image-source-url").val(),
            desc: $("#image-source-desc").val()
        };
        
        const url = id ? "/api/image-sources/" + id : "/api/image-sources";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    loadImageSources();
                    alert(id ? "图片源更新成功" : "图片源创建成功");
                    $("#image-source-form").addClass("hidden");
                    $("#image-source-form input, #image-source-form textarea").val("");
                    $("#image-source-id").val("");
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新图片源失败" : "创建图片源失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 公告表单保存按钮点击
    $("#save-announcement-btn").on("click", function(e) {
        const id = $("#announcement-id").val();
        const data = {
            title: $("#announcement-title").val(),
            content: $("#announcement-content").val(),
            is_active: $("#announcement-is-active").is(":checked") ? 1 : 0
        };
        
        const url = id ? "/api/announcements/" + id : "/api/announcements";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    loadAnnouncements();
                    alert(id ? "公告更新成功" : "公告添加成功");
                    $("#announcement-form").addClass("hidden");
                    $("#announcement-form input, #announcement-form textarea").val("");
                    $("#announcement-is-active").prop("checked", false);
                    $("#announcement-id").val("");
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新公告失败" : "创建公告失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 退出登录按钮
    $("#logout-btn").on("click", function() {
        $.ajax({
            url: "/api/logout",
            method: "POST",
            success: function(response) {
                if (response.success) {
                    window.location.href = "/login.html";
                }
            },
            error: function(xhr) {
                let errorMsg = "退出登录失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 编辑分类按钮
    $(document).on("click", ".edit-category-btn", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        // 根据id获取分类详情并填充表单
        $.ajax({
            url: "/api/categories/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const category = response.data;
                    $("#category-id").val(category.category_id);
                    $("#category-name").val(category.category_name);
                    $("#category-icon").val(category.category_icon);
                    $("#category-sort").val(category.sort);
                    $("#category-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取分类详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 编辑书签按钮
    $(document).on("click", ".edit-link-btn", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        // 根据id获取书签详情并填充表单
        $.ajax({
            url: "/api/bookmarks/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const bookmark = response.data;
                    $("#link-id").val(bookmark.bookmark_id);
                    $("#link-name").val(bookmark.bookmark_name);
                    $("#link-url").val(bookmark.bookmark_url);
                    $("#link-icon").val(bookmark.bookmark_icon);
                    $("#link-desc").val(bookmark.bookmark_description);
                    $("#link-category").val(bookmark.category_id);
                    $("#link-sort").val(bookmark.sort);
                    $("#link-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取书签详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 编辑图片源按钮
    $(document).on("click", ".edit-image-source-btn", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        // 根据id获取图片源详情并填充表单
        $.ajax({
            url: "/api/image-sources/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const source = response.data;
                    $("#image-source-id").val(source.id);
                    $("#image-source-name").val(source.name);
                    $("#image-source-url").val(source.url);
                    $("#image-source-desc").val(source.desc);
                    $("#image-source-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取图片源详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 编辑公告按钮
    $(document).on("click", ".edit-announcement-btn", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        // 根据id获取公告详情并填充表单
        $.ajax({
            url: "/api/announcements/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const announcement = response.data;
                    $("#announcement-id").val(announcement.id);
                    $("#announcement-title").val(announcement.title);
                    $("#announcement-content").html(sanitizeRichHtml(announcement.content));
                    $("#announcement-is-active").prop("checked", announcement.is_active);
                    $("#announcement-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取公告详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // 只保留这一个统一的删除事件监听器
    $(document).on("click", ".delete-category-btn, .delete-link-btn, .delete-image-source-btn, .delete-announcement-btn, .delete-search-engine-btn", function(e) {
        console.log("删除按钮被点击！");
        // 必须先阻止所有默认行为和事件冒泡
        e.preventDefault();
        e.stopPropagation();
        
        // 获取按钮信息
        const $this = $(this);
        const id = $this.data('id');
        console.log("删除按钮ID:", id);
        console.log("删除按钮类名:", $this.attr('class'));
        
        // 确定删除类型和确认消息
        let confirmMessage = "确定要删除此项目吗？此操作不可恢复！";
        let apiUrl = "";
        let reloadFunction = function() {};
        
        if ($this.hasClass('delete-category-btn')) {
            confirmMessage = "确定要删除此分类吗？此操作将同时删除该分类下的所有书签，不可恢复！";
            apiUrl = `/api/categories/${id}`;
            reloadFunction = loadCategories;
        } else if ($this.hasClass('delete-link-btn')) {
            confirmMessage = "确定要删除此书签吗？此操作不可恢复！";
            apiUrl = `/api/bookmarks/${id}`;
            reloadFunction = loadBookmarks;
        } else if ($this.hasClass('delete-image-source-btn')) {
            confirmMessage = "确定要删除此图片源吗？此操作不可恢复！";
            apiUrl = `/api/image-sources/${id}`;
            reloadFunction = loadImageSources;
        } else if ($this.hasClass('delete-announcement-btn')) {
            confirmMessage = "确定要删除此公告吗？此操作不可恢复！";
            apiUrl = `/api/announcements/${id}`;
            reloadFunction = loadAnnouncements;
        } else if ($this.hasClass('delete-search-engine-btn')) {
            confirmMessage = "确定要删除此搜索引擎吗？此操作不可恢复！";
            apiUrl = `/api/search-engines/${id}`;
            reloadFunction = loadSearchEngines;
        }
        
        // 使用setTimeout确保确认框在事件循环的下一个周期执行
        setTimeout(function() {
            console.log("setTimeout回调被执行，准备显示确认框");
            console.log("确认消息:", confirmMessage);
            // 显示确认对话框
            if (confirm(confirmMessage)) {
                console.log("用户确认删除，准备执行AJAX请求");
                // 用户确认后才执行AJAX请求
                $.ajax({
                    url: apiUrl,
                    method: 'DELETE',
                    success: function(response) {
                        if (response.success) {
                            reloadFunction();
                            alert('删除成功！');
                        }
                    },
                    error: function(xhr) {
                        let errorMsg = '删除失败！';
                        try {
                            const resp = JSON.parse(xhr.responseText);
                            errorMsg = resp.message || errorMsg;
                        } catch (e) {}
                        alert(errorMsg);
                    }
                });
            }
        }, 0);
    });
    
    // 搜索引擎管理事件监听器
    
    // 添加搜索引擎按钮点击
    $("#add-search-engine-btn").on("click", function() {
        openAddSearchEngineForm();
    });
    
    // 编辑搜索引擎按钮点击
    $(document).on("click", ".edit-search-engine-btn", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        openEditSearchEngineForm(id);
    });
    
    // 保存搜索引擎按钮点击
    $("#save-search-engine-btn").on("click", function() {
        saveSearchEngine();
    });
    
    // 取消按钮点击
    $("#cancel-search-engine-btn").on("click", function() {
        // 隐藏表单
        $("#search-engine-form").addClass("hidden");
        
        // 重置表单内容（可选）
        $("#search-engine-name").val("");
        $("#search-engine-key").val("");
        $("#search-engine-url").val("");
        $("#search-engine-sort").val(0);
        $("#search-engine-id").val("");
        editingSearchEngineId = null;
    });
    
    // 搜索搜索引擎按钮点击
    $("#search-engine-search").on("input", function() {
        const searchTerm = $(this).val().toLowerCase();
        $("#search-engine-list tr").each(function() {
            const engineName = $(this).find("td:nth-child(2)").text().toLowerCase();
            const engineKey = $(this).find("td:nth-child(3)").text().toLowerCase();
            if (engineName.includes(searchTerm) || engineKey.includes(searchTerm)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
    
    // 清空所有数据按钮 - 重新实现，确保先确认后执行
    $("#clear-all-data-btn").off("click").on("click", function(e) {
        // 防止任何默认行为
        e.preventDefault();
        
        console.log("清空数据按钮被点击，准备弹出确认框...");
        
        // 使用setTimeout确保确认框在事件循环的下一个周期执行，避免任何可能的同步执行问题
        setTimeout(function() {
            // 先弹出确认框
            const userConfirmed = confirm("警告：此操作将删除所有分类和书签数据，且无法恢复！\n\n确定要继续吗？");
            console.log("用户确认结果:", userConfirmed);
            
            if (userConfirmed) {
                // 用户确认后才执行删除操作
                console.log("用户已确认，开始执行删除操作...");
                $.ajax({
                    url: "/api/clear-all-data",
                    method: "DELETE",
                    success: function(response) {
                        if (response.success) {
                            alert("所有数据已成功清空！");
                            // 重新加载分类和书签列表
                            loadCategories();
                            loadBookmarks();
                        }
                    },
                    error: function(xhr) {
                        let errorMsg = "清空数据失败";
                        try {
                            const response = JSON.parse(xhr.responseText);
                            errorMsg = response.message || errorMsg;
                        } catch (e) {}
                        alert(errorMsg);
                    }
                });
            } else {
                console.log("用户取消了删除操作");
            }
        }, 0);
    });
    
    // 图标选择器按钮
    $("#icon-selector-btn").on("click", function() {
        $("#icon-selector-modal").removeClass("hidden").addClass("flex");
    });
    
    // 关闭图标选择器
    $("#icon-selector-close, #icon-selector-cancel").on("click", function() {
        $("#icon-selector-modal").addClass("hidden").removeClass("flex");
    });
    
    // 导出书签按钮
    $("#export-bookmarks-btn").on("click", function() {
        // 获取所有书签数据
        $.ajax({
            url: "/api/bookmarks",
            method: "GET",
            success: function(response) {
                if (response.success) {
                    // 将书签数据转换为JSON格式
                    const bookmarks = response.data;
                    const jsonData = JSON.stringify(bookmarks, null, 2);
                    
                    // 创建下载链接
                    const blob = new Blob([jsonData], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `bookmarks_${new Date().toISOString().slice(0, 10)}.json`;
                    
                    // 触发下载
                    document.body.appendChild(a);
                    a.click();
                    
                    // 清理
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            },
            error: function(xhr) {
                let errorMsg = "导出书签失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
    
    // 解析HTML书签文件，包含分类结构
    function parseHtmlBookmarks(htmlContent) {
        const result = {
            categories: [], // 提取的分类列表
            bookmarks: [] // 提取的书签列表
        };
        
        console.log('=== 开始解析HTML书签文件 ===');
        console.log('文件内容长度:', htmlContent.length);
        console.log('文件内容开头:', htmlContent.substring(0, 200));
        
        // 创建一个临时DOM元素来解析HTML内容
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // 查找所有包含H3的DT元素（分类）
        const allCategoryDts = tempDiv.querySelectorAll('dt, DT');
        
        console.log('\n=== 遍历所有DT元素 ===');
        console.log('找到DT元素数量:', allCategoryDts.length);
        
        allCategoryDts.forEach(categoryDt => {
            const categoryH3 = categoryDt.querySelector('h3, H3');
            
            if (categoryH3) {
                // 这是一个分类DT
                console.log('\n找到分类DT:', categoryH3.textContent.trim());
                
                // 忽略浏览器书签栏，但仍然处理其下的内容
                if (categoryH3.getAttribute('PERSONAL_TOOLBAR_FOLDER') === 'true') {
                    console.log('忽略浏览器书签栏作为分类，但处理其下的内容');
                    
                    // 处理书签栏下的DL内容，这里不指定分类，让processDlContent函数自行处理其中的文件夹
                    const bookmarkBarDl = categoryDt.nextElementSibling;
                    if (bookmarkBarDl && (bookmarkBarDl.tagName === 'DL' || bookmarkBarDl.tagName === 'dl')) {
                        console.log('处理书签栏下的DL内容，包含其中的文件夹和书签');
                        processDlContent(bookmarkBarDl);
                    }
                    return;
                }
                
                // 获取分类名称
                const categoryName = categoryH3.textContent.trim();
                console.log('分类名称:', categoryName);
                
                // 添加到分类列表
                if (categoryName && !result.categories.includes(categoryName)) {
                    result.categories.push(categoryName);
                    console.log('添加分类到列表:', categoryName);
                }
                
                // 查找该分类下的DL元素，其中包含该分类的书签
                const categoryDl = categoryDt.nextElementSibling;
                if (categoryDl && (categoryDl.tagName === 'DL' || categoryDl.tagName === 'dl')) {
                    console.log('处理分类下的DL内容');
                    // 处理该DL元素中的所有书签
                    processDlContent(categoryDl, categoryName);
                }
            }
        });
        
        // 处理顶级DL中的书签（不在任何分类中）
        const topLevelDls = tempDiv.querySelectorAll('dl, DL');
        topLevelDls.forEach(dl => {
            // 检查是否已经处理过（即是否是某个分类DT的下一个兄弟元素）
            const prevSibling = dl.previousElementSibling;
            if (prevSibling && (prevSibling.tagName === 'DT' || prevSibling.tagName === 'dt') && prevSibling.querySelector('h3, H3')) {
                console.log('跳过已处理的DL:', dl);
                return;
            }
            
            console.log('处理顶级DL:', dl);
            processDlContent(dl, '未分类');
        });
        
        // 5. 清理分类列表，移除重复项
        result.categories = [...new Set(result.categories)];
        
        console.log('\n=== 解析完成 ===');
        console.log('最终分类列表:', result.categories);
        console.log('最终书签数量:', result.bookmarks.length);
        
        return result;
        
        // 处理DL元素中的内容，包括书签和子分类
        function processDlContent(dlElement, currentCategory = '未分类') {
            console.log(`处理DL内容，当前分类:${currentCategory}`);
            
            // 查找DL元素中的所有子DT
            const dlChildren = dlElement.children;
            for (let i = 0; i < dlChildren.length; i++) {
                const child = dlChildren[i];
                console.log('处理DL子元素:', child.tagName);
                
                if (child.tagName === 'DT' || child.tagName === 'dt') {
                    // 检查是否是子分类
                    const childH3 = child.querySelector('h3, H3');
                    if (childH3) {
                        // 这是一个子分类
                        const subCategoryName = childH3.textContent.trim();
                        console.log('找到子分类:', subCategoryName);
                        
                        // 添加到分类列表
                        if (subCategoryName && !result.categories.includes(subCategoryName)) {
                            result.categories.push(subCategoryName);
                            console.log('添加子分类到列表:', subCategoryName);
                        }
                        
                        // 查找子分类下的DL
                        const subCategoryDl = child.nextElementSibling;
                        if (subCategoryDl && (subCategoryDl.tagName === 'DL' || subCategoryDl.tagName === 'dl')) {
                            console.log('处理子分类下的DL，使用分类:', subCategoryName);
                            // 递归处理子分类，使用子分类名称作为分类
                            processDlContent(subCategoryDl, subCategoryName);
                        }
                    } else {
                        // 这是一个书签
                        const bookmarkA = child.querySelector('a, A');
                        if (bookmarkA) {
                            const url = bookmarkA.getAttribute('href');
                            console.log('处理书签A标签:', bookmarkA.textContent.trim(), 'URL:', url);
                            
                            // 跳过无效URL
                            if (!url) {
                                console.log('跳过无效URL');
                                continue;
                            }
                            
                            // 跳过非HTTP/HTTPS URL
                            if (!(url.startsWith('http://') || url.startsWith('https://'))) {
                                console.log('跳过非HTTP/HTTPS URL');
                                continue;
                            }
                            
                            // 排除特定书签
                            if (url === 'http://znl.tupojingyang.top/Web/mine.html') {
                                console.log('排除特定书签');
                                continue;
                            }
                            
                            // 创建书签对象
                            const bookmark = {
                                bookmark_name: bookmarkA.textContent.trim() || `未命名书签${result.bookmarks.length + 1}`,
                                bookmark_url: url,
                                bookmark_icon: 'fa fa-link',
                                category_name: currentCategory,
                                bookmark_description: bookmarkA.getAttribute('title') || '',
                                sort: result.bookmarks.length
                            };
                            
                            result.bookmarks.push(bookmark);
                            console.log('添加书签:', bookmark.bookmark_name, '分类:', currentCategory);
                        }
                    }
                }
            }
        }
    }
    
    // 导入书签文件选择
    $("#import-bookmarks-file").on("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let parsedData = { categories: [], bookmarks: [] };
                const fileContent = e.target.result;
                
                console.log('文件内容开头:', fileContent.substring(0, 100));
                
                // 检测文件类型并解析
                if (fileContent.trim().startsWith('<!DOCTYPE NETSCAPE-Bookmark-file-1>') || 
                    fileContent.includes('<DT><A HREF=')) {
                    // HTML书签格式
                    console.log('检测到HTML书签格式');
                    parsedData = parseHtmlBookmarks(fileContent);
                    console.log('解析到的分类数量:', parsedData.categories.length);
                    console.log('解析到的书签数量:', parsedData.bookmarks.length);
                    if (parsedData.bookmarks.length === 0) {
                        alert('未从HTML文件中解析到有效的书签');
                        $("#import-bookmarks-file").val(""); // 重置文件选择
                        return;
                    }
                } else {
                    // JSON书签格式
                    console.log('检测到JSON书签格式');
                    const jsonBookmarks = JSON.parse(fileContent);
                    
                    // 验证JSON数据格式
                    if (!Array.isArray(jsonBookmarks)) {
                        throw new Error('无效的书签数据格式');
                    }
                    parsedData.bookmarks = jsonBookmarks;
                }
                
                // 获取现有分类和书签，用于去重
                let existingCategories = {};
                let existingBookmarks = new Set();
                
                // 先获取所有分类
                $.ajax({
                    url: '/api/categories',
                    method: 'GET',
                    async: false, // 同步获取分类列表
                    success: function(response) {
                        if (response.success && response.data.length > 0) {
                            response.data.forEach(category => {
                                existingCategories[category.category_name] = category.category_id;
                            });
                        }
                    },
                    error: function(xhr) {
                        console.error('获取分类列表失败:', xhr);
                    }
                });
                
                // 获取所有书签URL，用于去重
                $.ajax({
                    url: '/api/bookmarks',
                    method: 'GET',
                    async: false, // 同步获取书签列表
                    success: function(response) {
                        if (response.success && response.data.length > 0) {
                            response.data.forEach(bookmark => {
                                existingBookmarks.add(bookmark.bookmark_url);
                            });
                        }
                    },
                    error: function(xhr) {
                        console.error('获取书签列表失败:', xhr);
                    }
                });
                
                // 创建新分类
                let categoryIdMap = { ...existingCategories };
                let createdCategories = 0;
                
                // 先处理分类创建，确保所有解析到的分类都被创建
                parsedData.categories.forEach((categoryName, index) => {
                    if (!categoryIdMap[categoryName]) {
                        // 创建新分类
                        $.ajax({
                            url: '/api/categories',
                            method: 'POST',
                            data: JSON.stringify({
                                category_name: categoryName,
                                category_icon: 'fa fa-folder',
                                sort: Object.keys(categoryIdMap).length + index + 1
                            }),
                            contentType: 'application/json',
                            async: false, // 同步创建分类
                            success: function(response) {
                                if (response.success) {
                                    categoryIdMap[categoryName] = response.data.category_id;
                                    createdCategories++;
                                    console.log('创建分类成功:', categoryName, response.data.category_id);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('创建分类失败:', categoryName, xhr.responseText || error);
                            }
                        });
                    }
                });
                
                // 确保所有分类都被添加到 categoryIdMap 中
                console.log('现有分类映射:', categoryIdMap);
                console.log('解析到的分类:', parsedData.categories);
                
                // 遍历所有书签，确保它们的分类都在 categoryIdMap 中
                console.log('\n=== 检查书签分类 ===');
                parsedData.bookmarks.forEach((bookmark, index) => {
                    console.log(`书签 ${index + 1} 分类:`, bookmark.category_name);
                    if (bookmark.category_name && !categoryIdMap[bookmark.category_name]) {
                        console.log(`书签 ${index + 1} 的分类 ${esc(bookmark.category_name)} 不在 categoryIdMap 中`);
                        // 如果分类不在 map 中，创建它
                        $.ajax({
                            url: '/api/categories',
                            method: 'POST',
                            data: JSON.stringify({
                                category_name: bookmark.category_name,
                                category_icon: 'fa fa-folder',
                                sort: Object.keys(categoryIdMap).length + 1
                            }),
                            contentType: 'application/json',
                            async: false, // 同步创建分类
                            success: function(response) {
                                if (response.success) {
                                    categoryIdMap[bookmark.category_name] = response.data.category_id;
                                    createdCategories++;
                                    console.log('创建分类成功:', bookmark.category_name, response.data.category_id);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('创建分类失败:', bookmark.category_name, xhr.responseText || error);
                            }
                        });
                    }
                });
                
                // 如果没有未分类，创建一个
                if (!categoryIdMap['未分类']) {
                    $.ajax({
                        url: '/api/categories',
                        method: 'POST',
                        data: JSON.stringify({
                            category_name: '未分类',
                            category_icon: 'fa fa-folder',
                            sort: Object.keys(categoryIdMap).length + 1
                        }),
                        contentType: 'application/json',
                        async: false, // 同步创建分类
                        success: function(response) {
                            if (response.success) {
                                categoryIdMap['未分类'] = response.data.category_id;
                                createdCategories++;
                                console.log('创建默认分类成功:', response.data.category_id);
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('创建默认分类失败:', xhr.responseText || error);
                        }
                    });
                }
                
                // 调试：输出最终的分类映射
                console.log('最终分类映射:', categoryIdMap);
                
                // 批量导入书签，跳过重复项
                let importedCount = 0;
                let failedCount = 0;
                let skippedCount = 0;
                
                // 过滤掉重复的书签
                const uniqueBookmarks = parsedData.bookmarks.filter(bookmark => {
                    if (existingBookmarks.has(bookmark.bookmark_url)) {
                        skippedCount++;
                        return false;
                    }
                    existingBookmarks.add(bookmark.bookmark_url);
                    return true;
                });
                
                console.log('去重后书签数量:', uniqueBookmarks.length);
                
                // 遍历书签数据，逐个导入
                uniqueBookmarks.forEach((bookmark, index) => {
                    // 调试：输出书签信息
                    console.log('\n=== 处理书签 ===');
                    console.log('书签名称:', bookmark.bookmark_name);
                    console.log('书签URL:', bookmark.bookmark_url);
                    console.log('预期分类:', bookmark.category_name);
                    console.log('分类映射:', categoryIdMap);
                    
                    // 获取分类ID
                    let categoryId = categoryIdMap['未分类']; // 默认使用未分类
                    
                    // 检查书签是否有category_name
                    if (bookmark.category_name) {
                        // 直接查找分类映射
                        if (categoryIdMap[bookmark.category_name]) {
                            categoryId = categoryIdMap[bookmark.category_name];
                            console.log('通过category_name找到分类ID:', bookmark.category_name, '->', categoryId);
                        } else {
                            // 尝试去除首尾空格后查找
                            const trimmedCategoryName = bookmark.category_name.trim();
                            if (categoryIdMap[trimmedCategoryName]) {
                                categoryId = categoryIdMap[trimmedCategoryName];
                                console.log('通过去除空格后的category_name找到分类ID:', trimmedCategoryName, '->', categoryId);
                            } else {
                                // 尝试创建分类
                                console.log('分类不存在，创建:', bookmark.category_name);
                                $.ajax({
                                    url: '/api/categories',
                                    method: 'POST',
                                    data: JSON.stringify({
                                        category_name: bookmark.category_name,
                                        category_icon: 'fa fa-folder',
                                        sort: Object.keys(categoryIdMap).length + 1
                                    }),
                                    contentType: 'application/json',
                                    async: false, // 同步创建分类
                                    success: function(response) {
                                        if (response.success) {
                                            categoryIdMap[bookmark.category_name] = response.data.category_id;
                                            categoryId = response.data.category_id;
                                            createdCategories++;
                                            console.log('创建分类成功:', bookmark.category_name, response.data.category_id);
                                        }
                                    },
                                    error: function(xhr, status, error) {
                                        console.error('创建分类失败:', bookmark.category_name, xhr.responseText || error);
                                    }
                                });
                            }
                        }
                    } else {
                        console.log('书签没有category_name，使用默认分类');
                    }
                    
                    console.log('最终分类ID:', categoryId);
                    
                    // 为书签添加默认分类（如果没有指定）
                    const bookmarkName = bookmark.bookmark_name || `未命名书签${index + 1}`;
                    const bookmarkUrl = bookmark.bookmark_url;
                    
                    // 自动匹配图标
                    let bookmarkIcon = bookmark.bookmark_icon;
                    if (!bookmarkIcon) {
                        bookmarkIcon = autoMatchIcon(bookmarkUrl, bookmarkName);
                    }
                    
                    const bookmarkData = {
                        bookmark_name: bookmarkName,
                        bookmark_url: bookmarkUrl,
                        bookmark_icon: bookmarkIcon,
                        category_id: categoryId,
                        bookmark_description: bookmark.bookmark_description || '',
                        sort: bookmark.sort || index
                    };
                    
                    console.log('最终导入书签数据:', bookmarkData);
                    
                    $.ajax({
                        url: '/api/bookmarks',
                        method: 'POST',
                        data: JSON.stringify(bookmarkData),
                        contentType: 'application/json',
                        success: function(response) {
                            console.log('书签导入成功:', response);
                            importedCount++;
                            // 所有书签导入完成后显示结果
                            if (importedCount + failedCount === uniqueBookmarks.length) {
                                let resultMsg = `书签导入完成：\n`;
                                resultMsg += `成功导入书签：${importedCount} 个\n`;
                                resultMsg += `创建分类：${createdCategories} 个\n`;
                                resultMsg += `跳过重复书签：${skippedCount} 个\n`;
                                resultMsg += `导入失败：${failedCount} 个`;
                                
                                alert(resultMsg);
                                loadCategories(); // 重新加载分类列表
                                loadBookmarks(); // 重新加载书签列表
                                $("#import-bookmarks-file").val(""); // 重置文件选择
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('书签导入失败:', bookmarkData.bookmark_name, xhr.responseText || error);
                            failedCount++;
                            // 所有书签导入完成后显示结果
                            if (importedCount + failedCount === uniqueBookmarks.length) {
                                let resultMsg = `书签导入完成：\n`;
                                resultMsg += `成功导入书签：${importedCount} 个\n`;
                                resultMsg += `创建分类：${createdCategories} 个\n`;
                                resultMsg += `跳过重复书签：${skippedCount} 个\n`;
                                resultMsg += `导入失败：${failedCount} 个`;
                                
                                alert(resultMsg);
                                loadCategories(); // 重新加载分类列表
                                loadBookmarks(); // 重新加载书签列表
                                $("#import-bookmarks-file").val(""); // 重置文件选择
                            }
                        }
                    });
                });
                
                // 如果所有书签都被跳过
                if (uniqueBookmarks.length === 0 && skippedCount > 0) {
                    alert(`书签导入完成：所有 ${skippedCount} 个书签都是重复的，已跳过`);
                    $("#import-bookmarks-file").val(""); // 重置文件选择
                }
            } catch (error) {
                console.error('导入过程发生错误:', error);
                alert(`导入书签失败：${esc(error.message)}\n\n详细错误信息请查看浏览器控制台`);
                $("#import-bookmarks-file").val(""); // 重置文件选择
            }
        };
        
        reader.onerror = function() {
            console.error('文件读取失败');
            alert('读取文件失败，请检查文件是否损坏');
            $("#import-bookmarks-file").val(""); // 重置文件选择
        };
        
        // 开始读取文件
        reader.readAsText(file);
    });
    
    // ------------------------
    // 主题设置功能
    // ------------------------
    
    // 主题选择
    $("input[name='theme']").on("change", function() {
        const theme = $(this).val();
        localStorage.setItem("theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
    });
    
    // 背景图启用/禁用
    $("#bg-image-enabled").on("change", function() {
        const enabled = $(this).prop("checked");
        if (enabled) {
            $("#bg-image-api-container, #bg-image-url-container").removeClass("hidden");
        } else {
            $("#bg-image-api-container, #bg-image-url-container").addClass("hidden");
        }
    });
    
    // 背景图类型切换
    $("input[name='bg-image-type']").on("change", function() {
        const type = $(this).val();
        if (type === "random") {
            $("#bg-image-api-container").removeClass("hidden");
            $("#bg-image-url-container").addClass("hidden");
        } else {
            $("#bg-image-api-container").addClass("hidden");
            $("#bg-image-url-container").removeClass("hidden");
        }
    });
    
    // 保存主题设置
    $("#save-theme-settings").on("click", function() {
        const settings = {
            theme: $("input[name='theme']:checked").val(),
            bgImageEnabled: $("#bg-image-enabled").prop("checked"),
            bgImageType: $("input[name='bg-image-type']:checked").val(),
            bgImageApi: $("#bg-image-api").val(),
            bgImageUrl: $("#bg-image-url").val()
        };
        localStorage.setItem("themeSettings", JSON.stringify(settings));
        alert("主题设置已保存");
    });
    
    // 预览主题效果
    $("#preview-theme").on("click", function() {
        alert("预览功能即将实现");
    });
    
    // 添加图片源按钮
    $("#add-image-source-btn").on("click", function() {
        $("#image-source-form-title").text("添加图片源");
        $("#image-source-name").val("");
        $("#image-source-url").val("");
        $("#image-source-desc").val("");
        $("#image-source-id").val("");
        $("#image-source-form").removeClass("hidden");
    });
    
    // 保存图片源
    $("#save-image-source-btn").on("click", function() {
        const id = $("#image-source-id").val();
        const data = {
            name: $("#image-source-name").val(),
            url: $("#image-source-url").val(),
            desc: $("#image-source-desc").val()
        };
        
        const url = id ? "/api/image-sources/" + id : "/api/image-sources";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    alert(id ? "图片源更新成功" : "图片源添加成功");
                    $("#image-source-form").addClass("hidden");
                    loadImageSources();
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新图片源失败" : "添加图片源失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
    
    // 取消图片源操作
    $("#cancel-image-source-btn").on("click", function() {
        $("#image-source-form").addClass("hidden");
    });
    
    // 预览图片源
    $("#preview-image-source-btn").on("click", function() {
        const url = $("#image-source-url").val();
        if (url) {
            $("#image-preview").html(`<img src="${safeHref(url)}" alt="预览" class="w-full h-full object-cover">`);
            $("#image-preview-container").removeClass("hidden");
        }
    });
    
    // 添加公告按钮
    $("#add-announcement-btn").off("click").on("click", function() {
        $("#announcement-form-title").text("添加公告");
        $("#announcement-title").val("");
        $("#announcement-content").html("");
        $("#announcement-is-active").prop("checked", false);
        $("#announcement-id").val("");
        $("#announcement-form").removeClass("hidden");
    });
    
    // 保存公告
    $("#save-announcement-btn").off("click").on("click", function() {
        const id = $("#announcement-id").val();
        const data = {
            title: $("#announcement-title").val(),
            content: sanitizeRichHtml($("#announcement-content").html()),
            is_active: $("#announcement-is-active").prop("checked")
        };
        const url = id ? "/api/announcements/" + id : "/api/announcements";
        const method = id ? "PUT" : "POST";
        
        $.ajax({
            url: url,
            method: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(response) {
                if (response.success) {
                    loadAnnouncements();
                    alert(id ? "公告更新成功" : "公告添加成功");
                    $("#announcement-form").addClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = id ? "更新公告失败" : "创建公告失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
    
    // 取消公告操作
    $("#cancel-announcement-btn").off("click").on("click", function() {
        $("#announcement-form").addClass("hidden");
    });
    
    // 批准待审核书签按钮
    $(document).on("click", ".approve-pending-btn", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        approvePendingBookmark(id);
    });
    
    // 拒绝待审核书签按钮
    $(document).on("click", ".reject-pending-btn", function(e) {
        e.stopPropagation();
        const id = $(this).data("id");
        rejectPendingBookmark(id);
    });
    
    // ------------------------
    // 事件委托绑定 - 编辑按钮
    // ------------------------
    
    // 编辑分类
    $(document).on("click", ".edit-category-btn", function() {
        const id = $(this).data("id");
        // 根据id获取分类详情并填充表单
        $.ajax({
            url: "/api/categories/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const category = response.data;
                    $("#category-id").val(category.category_id);
                    $("#category-name").val(category.category_name);
                    $("#category-icon").val(category.category_icon);
                    $("#category-sort").val(category.sort);
                    $("#category-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取分类详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
    
    // 编辑书签
    $(document).on("click", ".edit-link-btn", function() {
        const id = $(this).data("id");
        // 根据id获取书签详情并填充表单
        $.ajax({
            url: "/api/bookmarks/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const bookmark = response.data;
                    $("#link-id").val(bookmark.bookmark_id);
                    $("#link-name").val(bookmark.bookmark_name);
                    $("#link-url").val(bookmark.bookmark_url);
                    $("#link-icon").val(bookmark.bookmark_icon);
                    $("#link-desc").val(bookmark.bookmark_description);
                    $("#select-category").val(bookmark.category_id);
                    $("#link-sort").val(bookmark.sort);
                    $("#link-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取书签详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
    
    // 编辑图片源
    $(document).on("click", ".edit-image-source-btn", function() {
        const id = $(this).data("id");
        // 根据id获取图片源详情并填充表单
        $.ajax({
            url: "/api/image-sources/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const source = response.data;
                    $("#image-source-id").val(source.id);
                    $("#image-source-name").val(source.name);
                    $("#image-source-url").val(source.url);
                    $("#image-source-desc").val(source.desc);
                    $("#image-source-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取图片源详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
    
    // 编辑公告
    $(document).on("click", ".edit-announcement-btn", function() {
        const id = $(this).data("id");
        // 根据id获取公告详情并填充表单
        $.ajax({
            url: "/api/announcements/" + id,
            method: "GET",
            success: function(response) {
                if (response.success) {
                    const announcement = response.data;
                    $("#announcement-id").val(announcement.id);
                    $("#announcement-title").val(announcement.title);
                    $("#announcement-content").html(sanitizeRichHtml(announcement.content));
                    $("#announcement-is-active").prop("checked", announcement.is_active);
                    $("#announcement-form").removeClass("hidden");
                }
            },
            error: function(xhr) {
                let errorMsg = "获取公告详情失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
}


// 初始化移动端菜单（新版控制台已移除左侧菜单，仅在旧版 DOM 存在时启用）
function initAdminMobileMenu() {
    if (!$("#admin-mobile-menu-btn").length) return;
    $("#admin-mobile-menu-btn").on("click", function() {
        $("#admin-sidebar").toggleClass("hidden");
    });
}


// 绑定导航菜单事件
// 新版控制台用顶部标签页（#admin-tabs），旧版 Node/Workers 仍用左侧菜单（#admin-sidebar），
// 两者共用同一套面板显隐与初始化逻辑，避免重复实现。
function bindNavigationEvents() {
    $("#admin-tabs a, #admin-sidebar a").on("click", function(e) {
        e.preventDefault();

        $("#admin-tabs a").removeClass("is-active");
        $("#admin-sidebar a").removeClass("bg-primary text-white");
        if ($(this).closest("#admin-tabs").length) {
            $(this).addClass("is-active");
        } else {
            $(this).addClass("bg-primary text-white");
        }
        
        // 隐藏所有内容区域
        $("#dashboard, #category-management, #link-management, #pending-bookmarks, #theme-settings, #image-sources, #announcement-management, #search-engine-management, #website-settings").addClass("hidden");
        
        // 显示对应的内容区域
        const target = $(this).attr("href").substring(1);
        if (target) {
            $("#" + target).removeClass("hidden");
            
            // 根据目标区域初始化对应的功能
            if (target === "search-engine-management") {
                initSearchEngineManagement();
            } else if (target === "pending-bookmarks") {
                loadPendingBookmarks();
            }
        }
    });
}


// ------------------------
// 主题设置功能
// ------------------------

// 初始化主题设置
function initThemeSettings() {
    const savedSettings = JSON.parse(localStorage.getItem("themeSettings"));
    if (savedSettings) {
        // 恢复主题
        $(`input[name='theme'][value='${savedSettings.theme}']`).prop("checked", true);
        document.documentElement.classList.toggle("dark", savedSettings.theme === "dark");
        
        // 恢复背景图设置
        $("#bg-image-enabled").prop("checked", savedSettings.bgImageEnabled);
        if (savedSettings.bgImageEnabled) {
            $("#bg-image-api-container, #bg-image-url-container").removeClass("hidden");
        }
        
        // 恢复背景图类型
        $(`input[name='bg-image-type'][value='${savedSettings.bgImageType}']`).prop("checked", true);
        if (savedSettings.bgImageType === "random") {
            $("#bg-image-api-container").removeClass("hidden");
            $("#bg-image-url-container").addClass("hidden");
        } else {
            $("#bg-image-api-container").addClass("hidden");
            $("#bg-image-url-container").removeClass("hidden");
        }
        
        // 恢复其他设置
        $("#bg-image-api").val(savedSettings.bgImageApi);
        $("#bg-image-url").val(savedSettings.bgImageUrl);
    } else {
        // 默认设置
        $("#theme-light").prop("checked", true);
        $("#bg-image-random").prop("checked", true);
    }
    
    // 填充分图源选项
    const imageSources = [
        { id: 1, name: "Unsplash随机图", url: "https://source.unsplash.com/random/1920x1080" },
        { id: 2, name: "Pexels随机图", url: "https://images.pexels.com/photos/random" },
        { id: 3, name: "Pixabay随机图", url: "https://pixabay.com/zh/photos/random" }
    ];
    $("#bg-image-api").empty();
    imageSources.forEach(source => {
        $("#bg-image-api").append(`<option value="${safeHref(source.url)}">${esc(source.name)}</option>`);
    });
}


// ------------------------
// 图片源管理功能
// ------------------------

// 初始化图片源管理
function initImageSourceManagement() {
    loadImageSources();
}

// 加载图片源列表
function loadImageSources() {
    $.ajax({
        url: "/api/image-sources",
        method: "GET",
        success: function(response) {
            $("#image-source-list").empty();
            if (response.success && response.data) {
                response.data.forEach(source => {
                    const row = `<tr><td class="py-3 px-4">${esc(source.id)}</td><td class="py-3 px-4">${esc(source.name)}</td><td class="py-3 px-4 truncate"><a href="${safeHref(source.url)}" target="_blank" title="${safeHref(source.url)}">${esc(truncateUrl(source.url, 50))}</a></td><td class="py-3 px-4">${esc(source.desc)}</td><td class="py-3 px-4 text-right"><button type="button" class="edit-image-source-btn bg-primary text-white px-3 py-1 rounded-lg mr-2" data-id="${esc(source.id)}">编辑</button><button type="button" class="delete-image-source-btn bg-red-500 text-white px-3 py-1 rounded-lg" data-id="${esc(source.id)}">删除</button></td></tr>`;
                    $("#image-source-list").append(row);
                });
            } else {
                // 如果没有数据，显示空状态
                const emptyRow = `<tr><td colspan="5" class="py-4 text-center text-gray-500">暂无图片源数据</td></tr>`;
                $("#image-source-list").append(emptyRow);
            }
            bindImageSourceActions();
        },
        error: function(xhr) {
            let errorMsg = "加载图片源失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
            
            // 显示错误状态
            const errorRow = `<tr><td colspan="5" class="py-4 text-center text-red-500">加载图片源失败：${esc(errorMsg)}</td></tr>`;
            $("#image-source-list").empty().append(errorRow);
        }
    });
}

// 绑定图片源操作事件
function bindImageSourceActions() {
    // 移除事件委托绑定，移到initEventListeners()中
}


// ------------------------
// 公告管理功能
// ------------------------

// 初始化公告管理
function initAnnouncementManagement() {
    loadAnnouncements();
}

// 加载公告列表
function loadAnnouncements() {
    $.ajax({
        url: "/api/announcements",
        method: "GET",
        success: function(response) {
            $("#announcement-list").empty();
            response.forEach(announcement => {
                const status = announcement.is_active ? "启用" : "禁用";
                const statusClass = announcement.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                const row = `<tr><td class="py-3 px-4">${esc(announcement.id)}</td><td class="py-3 px-4">${esc(announcement.title)}</td><td class="py-3 px-4"><span class="px-2 py-1 text-xs rounded-full ${esc(statusClass)}">${esc(status)}</span></td><td class="py-3 px-4">${esc(announcement.created_at)}</td><td class="py-3 px-4">${esc(announcement.updated_at)}</td><td class="py-3 px-4 text-right"><button type="button" class="edit-announcement-btn bg-primary text-white px-3 py-1 rounded-lg mr-2" data-id="${esc(announcement.id)}">编辑</button><button type="button" class="delete-announcement-btn bg-red-500 text-white px-3 py-1 rounded-lg" data-id="${esc(announcement.id)}">删除</button></td></tr>`;
                $("#announcement-list").append(row);
            });
            bindAnnouncementActions();
        },
        error: function(xhr) {
            let errorMsg = "加载公告失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
        }
    });
}

// 绑定公告操作事件
function bindAnnouncementActions() {
    // 移除事件委托绑定，移到initEventListeners()中
}


// ------------------------
// 搜索引擎管理功能
// ------------------------

// 初始化搜索引擎管理
function initSearchEngineManagement() {
    loadSearchEngines();
}

// 加载搜索引擎列表
function loadSearchEngines() {
    $.ajax({
        url: "/api/search-engines",
        method: "GET",
        success: function(response) {
            $("#search-engine-list").empty();
            if (response.success && response.data && response.data.search_engines) {
                response.data.search_engines.forEach(engine => {
                    const row = `<tr><td class="py-3 px-4">${esc(engine.search_engine_id)}</td><td class="py-3 px-4">${esc(engine.engine_name)}</td><td class="py-3 px-4">${esc(engine.engine_key)}</td><td class="py-3 px-4 truncate"><a href="${safeHref(engine.engine_url)}" target="_blank" title="${safeHref(engine.engine_url)}">${esc(truncateUrl(engine.engine_url, 50))}</a></td><td class="py-3 px-4">${esc(engine.sort)}</td><td class="py-3 px-4 text-right"><button type="button" class="edit-search-engine-btn bg-primary text-white px-3 py-1 rounded-lg mr-2" data-id="${esc(engine.search_engine_id)}">编辑</button><button type="button" class="delete-search-engine-btn bg-red-500 text-white px-3 py-1 rounded-lg" data-id="${esc(engine.search_engine_id)}">删除</button></td></tr>`;
                    $("#search-engine-list").append(row);
                });
            } else {
                // 如果没有数据，显示空状态
                const emptyRow = `<tr><td colspan="6" class="py-4 text-center text-gray-500">暂无搜索引擎数据</td></tr>`;
                $("#search-engine-list").append(emptyRow);
            }
        },
        error: function(xhr) {
            let errorMsg = "加载搜索引擎失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
            
            // 显示错误状态
            const errorRow = `<tr><td colspan="6" class="py-4 text-center text-red-500">加载搜索引擎失败：${esc(errorMsg)}</td></tr>`;
            $("#search-engine-list").empty().append(errorRow);
        }
    });
}

// 添加/编辑搜索引擎表单
let editingSearchEngineId = null;

// 打开添加搜索引擎表单
function openAddSearchEngineForm() {
    editingSearchEngineId = null;
    $("#search-engine-form-title").text("添加搜索引擎");
    $("#search-engine-name").val("");
    $("#search-engine-key").val("");
    $("#search-engine-url").val("");
    $("#search-engine-sort").val(0);
    $("#search-engine-form").removeClass("hidden");
}

// 打开编辑搜索引擎表单
function openEditSearchEngineForm(id) {
    $.ajax({
        url: "/api/search-engines/" + id,
        method: "GET",
        success: function(response) {
            if (response.success) {
                const engine = response.data;
                editingSearchEngineId = id;
                $("#search-engine-form-title").text("编辑搜索引擎");
                $("#search-engine-name").val(engine.engine_name);
                $("#search-engine-key").val(engine.engine_key);
                $("#search-engine-url").val(engine.engine_url);
                $("#search-engine-sort").val(engine.sort);
                $("#search-engine-form").removeClass("hidden");
            }
        },
        error: function(xhr) {
            let errorMsg = "获取搜索引擎详情失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
        }
    });
}

// 保存搜索引擎
function saveSearchEngine() {
    const engineName = $("#search-engine-name").val().trim();
    const engineKey = $("#search-engine-key").val().trim();
    const engineUrl = $("#search-engine-url").val().trim();
    const sort = parseInt($("#search-engine-sort").val()) || 0;
    
    // 验证表单
    if (!engineName || !engineKey || !engineUrl) {
        alert("请填写完整的搜索引擎信息");
        return;
    }
    
    const engineData = {
        engine_name: engineName,
        engine_key: engineKey,
        engine_url: engineUrl,
        sort: sort
    };
    
    const url = editingSearchEngineId ? "/api/search-engines/" + editingSearchEngineId : "/api/search-engines";
    const method = editingSearchEngineId ? "PUT" : "POST";
    
    $.ajax({
        url: url,
        method: method,
        contentType: "application/json",
        data: JSON.stringify(engineData),
        success: function(response) {
            if (response.success) {
                alert(editingSearchEngineId ? "搜索引擎更新成功" : "搜索引擎添加成功");
                $("#search-engine-form").addClass("hidden");
                loadSearchEngines();
            } else {
                alert(response.message || "操作失败");
            }
        },
        error: function(xhr) {
            let errorMsg = editingSearchEngineId ? "更新搜索引擎失败" : "添加搜索引擎失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
        }
    });
}

// 删除搜索引擎
function deleteSearchEngine(id) {
    if (confirm("确定要删除这个搜索引擎吗？")) {
        $.ajax({
            url: "/api/search-engines/" + id,
            method: "DELETE",
            success: function(response) {
                if (response.success) {
                    alert("搜索引擎删除成功");
                    loadSearchEngines();
                } else {
                    alert(response.message || "删除失败");
                }
            },
            error: function(xhr) {
                let errorMsg = "删除搜索引擎失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    }
}

// ------------------------------
// 一键添加书签功能
// ------------------------------

function generateBookmarklet() {
    // 获取当前网站URL（使用window.location.origin）
    const baseUrl = window.location.origin;
    // token 由 Worker 在管理页响应中动态注入（仅登录后可见），源码与静态产物不保存任何凭据
    const token = window.__JSADD_TOKEN__ || '';
    if (!token) {
        $('#bookmarklet-link').val('未配置 JSADD_TOKEN：请在 Cloudflare Pages 环境变量中设置后重新部署');
        return;
    }
    
    // 生成简洁可靠的bookmarklet代码（使用iframe模态框）
    const bookmarklet = `javascript:(function(){var overlay=document.createElement("div");overlay.style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;";var modal=document.createElement("div");modal.style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:550px;height:450px;background:white;border-radius:12px;box-shadow:0 15px 50px rgba(0,0,0,0.3);z-index:10000;overflow:hidden;";var closeBtn=document.createElement("button");closeBtn.style="position:absolute;top:10px;right:10px;width:35px;height:35px;background:#ff4444;color:white;border:none;border-radius:50%;cursor:pointer;font-size:20px;z-index:10002;";closeBtn.innerHTML="×";closeBtn.onclick=function(){document.body.removeChild(modal);document.body.removeChild(overlay);window.removeEventListener('message',handleCloseMessage);};var iframe=document.createElement("iframe");iframe.style="width:100%;height:100%;border:none;overflow:hidden;";iframe.src="${baseUrl}/api/v1/jsadd?token=${token}&name="+encodeURIComponent(document.title)+"&url="+encodeURIComponent(location.href);iframe.scrolling="no";modal.appendChild(closeBtn);modal.appendChild(iframe);document.body.appendChild(overlay);document.body.appendChild(modal);overlay.onclick=function(){document.body.removeChild(modal);document.body.removeChild(overlay);window.removeEventListener('message',handleCloseMessage);};function handleCloseMessage(event){if(event.data==='close-modal'){document.body.removeChild(modal);document.body.removeChild(overlay);window.removeEventListener('message',handleCloseMessage);}}window.addEventListener('message',handleCloseMessage);setTimeout(function(){if(document.body.contains(modal)){document.body.removeChild(modal);document.body.removeChild(overlay);window.removeEventListener('message',handleCloseMessage);}},5000);})();void(0)`;
    
    // 填充到输入框
    $('#bookmarklet-link').val(bookmarklet);
}

// 复制bookmarklet到剪贴板
function copyBookmarklet() {
    const bookmarkletInput = document.getElementById('bookmarklet-link');
    
    // 选择文本
    bookmarkletInput.select();
    bookmarkletInput.setSelectionRange(0, 99999); // 移动到文本末尾
    
    try {
        // 复制到剪贴板
        document.execCommand('copy');
        
        // 显示复制成功提示
        const copyButton = document.getElementById('copy-bookmarklet');
        const originalText = copyButton.textContent;
        copyButton.textContent = '已复制!';
        copyButton.classList.add('bg-green-600');
        copyButton.classList.remove('bg-blue-600');
        
        // 2秒后恢复原状
        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove('bg-green-600');
            copyButton.classList.add('bg-blue-600');
        }, 2000);
        
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    }
}

// ------------------------------
// 网站设置管理
// ------------------------------

// 加载网站设置
function loadWebsiteSettings() {
    $.ajax({
        url: "/api/website-settings",
        method: "GET",
        success: function(response) {
            if (response.success) {
                const settings = response.data;
                
                // 设置表单字段值
                $("#website-title").val(settings.site_title || "");
                $("#website-logo").val(settings.site_logo || "");
                $("#website-keywords").val(settings.site_keywords || "");
                $("#website-description").val(settings.site_description || "");
                $("#website-copyright").val(settings.site_copyright || "");
                $("#website-icp").val(settings.site_icp || "");
                $("#website-footer").val(settings.site_footer || "");
                $("#website-footer-custom").val(settings.site_footer_custom || "");
            } else {
                console.error("加载网站设置失败:", response.message);
            }
        },
        error: function(xhr) {
            console.error("加载网站设置失败:", xhr.statusText);
        }
    });
}

// 保存网站设置
function saveWebsiteSettings() {
    const settings = {
        site_title: $("#website-title").val(),
        site_logo: $("#website-logo").val(),
        site_keywords: $("#website-keywords").val(),
        site_description: $("#website-description").val(),
        site_copyright: $("#website-copyright").val(),
        site_icp: $("#website-icp").val(),
        site_footer: $("#website-footer").val(),
        site_footer_custom: $("#website-footer-custom").val()
    };
    
    $.ajax({
        url: "/api/website-settings",
        method: "POST",
        data: JSON.stringify(settings),
        contentType: "application/json",
        xhrFields: {
            withCredentials: true // 确保发送Cookie和认证信息
        },
        success: function(response) {
            if (response.success) {
                alert("网站设置保存成功");
                // 保存成功后重新加载设置，确保UI显示最新值
                loadWebsiteSettings();
            } else {
                alert(response.message || "保存失败");
            }
        },
        error: function(xhr) {
            console.error("保存网站设置失败:", xhr.statusText, xhr.responseText);
            try {
                const errorData = JSON.parse(xhr.responseText);
                alert("保存网站设置失败: " + (errorData.message || xhr.statusText));
            } catch (e) {
                alert("保存网站设置失败: " + xhr.statusText);
            }
        }
    });
}

// 初始化网站设置管理
function initWebsiteSettings() {
    // 加载网站设置
    loadWebsiteSettings();
    
    // 添加保存按钮点击事件
    $("#save-website-settings-btn").on("click", function(e) {
        e.preventDefault();
        saveWebsiteSettings();
    });
}

// ------------------------------
// 待审核书签管理
// ------------------------------

// 初始化待审核书签管理
function initPendingBookmarks() {
    loadPendingBookmarks();
    
    // 刷新按钮点击事件
    $("#refresh-pending-btn").on("click", function() {
        loadPendingBookmarks();
    });
}

// 加载待审核书签列表
function loadPendingBookmarks() {
    $.ajax({
        url: "/api/pending-bookmarks",
        method: "GET",
        success: function(response) {
            $("#pending-bookmark-list").empty();
            
            if (response.success && response.data && response.data.length > 0) {
                // 显示列表，隐藏空状态
                $("#pending-empty-state").addClass("hidden");
                
                response.data.forEach(bookmark => {
                    const row = `<tr data-id="${esc(bookmark.id)}">
                        <td class="py-3 px-4 text-gray-500 font-mono text-sm">${esc(bookmark.id)}</td>
                        <td class="py-3 px-4 font-medium">
                            <i class="${esc(bookmark.link_icon || 'fa fa-link')} text-xl text-gray-700 mr-2"></i>
                            ${esc(bookmark.link_name)}
                        </td>
                        <td class="py-3 px-4">
                            <a href="${safeHref(bookmark.link_url)}" target="_blank" title="${safeHref(bookmark.link_url)}" class="text-blue-600 hover:text-blue-800 transition-colors duration-150">
                                ${esc(truncateUrl(bookmark.link_url, 30))}
                            </a>
                        </td>
                        <td class="py-3 px-4">${esc(bookmark.category_name || '未分类')}</td>
                        <td class="py-3 px-4">${esc(bookmark.submitter_name || '匿名')}</td>
                        <td class="py-3 px-4">${esc(bookmark.submitter_contact || '-')}</td>
                        <td class="py-3 px-4 truncate max-w-xs" title="${esc(bookmark.link_desc || '')}">${esc(bookmark.link_desc || '-')}</td>
                        <td class="py-3 px-4 text-sm text-gray-500">${esc(bookmark.created_at || '-')}</td>
                        <td class="py-3 px-4 text-right">
                            <button type="button" class="approve-pending-btn bg-green-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-600 transition-colors duration-150" data-id="${esc(bookmark.id)}">
                                <i class="fa fa-check mr-1"></i>批准
                            </button>
                            <button type="button" class="reject-pending-btn bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-150" data-id="${esc(bookmark.id)}">
                                <i class="fa fa-times mr-1"></i>拒绝
                            </button>
                        </td>
                    </tr>`;
                    $("#pending-bookmark-list").append(row);
                });
            } else {
                // 显示空状态，隐藏列表
                $("#pending-empty-state").removeClass("hidden");
            }
        },
        error: function(xhr) {
            let errorMsg = "加载待审核书签失败";
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.message || errorMsg;
            } catch (e) {}
            alert(errorMsg);
            
            // 显示错误状态
            $("#pending-bookmark-list").empty();
            $("#pending-empty-state").removeClass("hidden");
        }
    });
}

// 批准待审核书签
function approvePendingBookmark(id) {
    if (confirm("确定要批准这个书签吗？批准后书签将显示在网站上。")) {
        $.ajax({
            url: `/api/pending-bookmarks/${id}/approve`,
            method: "PUT",
            success: function(response) {
                if (response.success) {
                    alert("书签已批准！");
                    loadPendingBookmarks();
                    // 重新加载书签列表以显示新添加的书签
                    loadBookmarks();
                } else {
                    alert(response.message || "批准失败");
                }
            },
            error: function(xhr) {
                let errorMsg = "批准书签失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    }
}

// 拒绝待审核书签
function rejectPendingBookmark(id) {
    if (confirm("确定要拒绝这个书签吗？此操作不可恢复！")) {
        $.ajax({
            url: `/api/pending-bookmarks/${id}/reject`,
            method: "PUT",
            success: function(response) {
                if (response.success) {
                    alert("书签已拒绝！");
                    loadPendingBookmarks();
                } else {
                    alert(response.message || "拒绝失败");
                }
            },
            error: function(xhr) {
                let errorMsg = "拒绝书签失败";
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    }
}