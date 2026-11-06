// 等待DOM加载完成后执行（确保所有容器已存在）
$(document).ready(function() {
    // ************ 功能-1：应用网站设置 ************
    function applyWebsiteSettings() {
        $.ajax({
            url: '/api/website-settings',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    const settings = response.data;
                    
                    // 更新网站标题
                    if (settings.site_title) {
                        $('#site-title').text(settings.site_title);
                        $('#brand-name').text(settings.site_title);
                    }
                    
                    // 更新网站关键词
                    if (settings.site_keywords) {
                        $('#site-keywords').attr('content', settings.site_keywords);
                    }
                    
                    // 更新网站描述（同步到首屏 Hero 标语）
                    if (settings.site_description) {
                        $('#site-description').attr('content', settings.site_description);
                        $('#brand-slogan').text(settings.site_description);
                    }
                    
                    // 更新网站图标
                    if (settings.site_logo) {
                        $('#site-favicon').attr('href', settings.site_logo);
                    }
                    
                    // 更新网站版权信息
                    if (settings.site_copyright) {
                        $('#site-footer').text(settings.site_copyright);
                    } else {
                        // 如果没有设置版权信息，使用默认内容
                        $('#site-footer').text('Copyright © 2024 我的聚合导航站 | Theme By Tailwind CSS');
                    }
                    
                    // 更新备案信息（添加可点击链接）
                    if (settings.site_icp) {
                        $('#site-icp').html('<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">' + escapeHtml(settings.site_icp) + '</a>');
                        $('#site-icp').show();
                    } else {
                        $('#site-icp').hide();
                    }
                    
                    // 更新网站底部自定义内容
                    if (settings.site_footer_custom) {
                        $('#site-footer-custom').html(sanitizeRichHtml(settings.site_footer_custom));
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('加载网站设置失败:', error);
            }
        });
    }
    
    // ************ 功能0：加载并显示公告悬浮框 ************
    function loadAnnouncement() {
        // 去掉每天只显示一次的限制，每次页面加载都显示公告
        $.ajax({
            url: '/api/announcements/active',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.length > 0) {
                    // 显示第一个活跃的公告
                    const announcement = data[0];
                    $('#toast-title').text(announcement.title);
                    $('#toast-content').html(sanitizeRichHtml(announcement.content));
                    showAnnouncementToast();
                } else {
                    // 如果没有活跃公告，使用默认公告
                    showDefaultAnnouncement();
                }
            },
            error: function(xhr, status, error) {
                console.error('加载公告失败:', error);
                // 如果加载失败，使用默认公告
                showDefaultAnnouncement();
            }
        });
    }
    
    // 显示默认公告
    function showDefaultAnnouncement() {
        $('#toast-title').text('公告');
        $('#toast-content').text('本站为静态聚合导航，仅供个人使用');
        showAnnouncementToast();
    }
    
    // 显示公告悬浮框
    function showAnnouncementToast() {
        const toast = $('#announcement-toast');
        // 渐变首屏：浮层下移到 Hero 之下，避免盖住右上角铃铛与背景控制按钮
        const hero = document.getElementById('hero');
        if (hero) {
            toast.css('top', (Math.ceil(hero.getBoundingClientRect().height) + 14) + 'px');
        }
        toast.removeClass('-translate-y-full opacity-0').addClass('translate-y-0 opacity-100');
        // 渐变首屏下浮层会压住第一行书签卡片，展示数秒后自动收起；铃铛可随时再次打开
        window.clearTimeout(window.__navToastTimer);
        window.__navToastTimer = window.setTimeout(function () {
            hideAnnouncementToast();
        }, 5000);
        // 不再记录显示次数，每次页面加载都显示
    }
    
    // 关闭公告悬浮框
    function hideAnnouncementToast() {
        const toast = $('#announcement-toast');
        toast.removeClass('translate-y-0 opacity-100').addClass('-translate-y-full opacity-0');
    }
    
    // 初始化公告悬浮框功能
    function initAnnouncementToast() {
        // 绑定关闭按钮事件
        $('#close-toast').on('click', function() {
            hideAnnouncementToast();
        });
        
        // 页面加载完成后显示公告
        loadAnnouncement();
    }

    // ************ 功能1：渲染左侧分类导航栏 ************
    function renderSidebarNav(data) {
        // 1. 清空侧边栏容器
        $("#sidebar-nav").empty();
        // 2. 添加标题
        let sidebarTitle = `
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <i class="fa fa-folder-open text-primary mr-2"></i>
                分类导航
            </h3>
        `;
        $("#sidebar-nav").append(sidebarTitle);
        // 3. 排序分类（按sort字段升序）
        data.sort(function(a, b) {
            return a.sort - b.sort;
        });
        // 4. 遍历分类数据，生成侧边栏导航项
        let sidebarItems = `<ul class="space-y-3">`;
        $.each(data, function(categoryIndex, category) {
            // 确保分类数据的所有字段都有有效值
            const safeCategory = {
                category_id: category.category_id || '',
                category_name: category.category_name || '未命名分类',
                category_icon: category.category_icon || 'fa-folder',
                links: category.links || [],
                sort: category.sort || 0
            };
            
            sidebarItems += `
                <li>
                    <a href="#category-${escapeHtml(safeCategory.category_id)}" class="flex items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_1px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_3px_6px_rgba(0,0,0,0.2)] dark:hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.5)] transition-all duration-300 text-gray-700 dark:text-gray-200 hover:text-primary group">
                        <i class="${escapeHtml(safeCategory.category_icon)} text-primary mr-3"></i>
                        <span class="group-hover:text-primary">${escapeHtml(safeCategory.category_name)}</span>
                        <span class="ml-auto bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">${safeCategory.links.length}</span>
                    </a>
                </li>
            `;
        });
        sidebarItems += `</ul>`;
        // 5. 将导航项添加到侧边栏
        $("#sidebar-nav").append(sidebarItems);
    }

    // ************ 功能2：核心 - 渲染分类和链接数据 ************
    function renderNavData() {
        // 1. 从API获取数据
        $.getJSON("/api/data", function(data) {
            // 2. 清空分类容器
            $("#category-container").empty();
            // 3. 先渲染左侧侧边栏
            renderSidebarNav(data);
            // 4. 排序分类（按sort字段升序）
            data.sort(function(a, b) {
                return a.sort - b.sort;
            });
            // 4. 遍历分类数据，生成分类卡片
            $.each(data, function(categoryIndex, category) {
                // 确保分类数据的所有字段都有有效值
                const safeCategory = {
                    category_id: category.category_id || '',
                    category_name: category.category_name || '未命名分类',
                    category_icon: category.category_icon || 'fa-folder',
                    links: category.links || [],
                    sort: category.sort || 0
                };
                
                // 4.1 构建分类卡片外层结构（添加ID用于锚点跳转）
                let categoryCard = `
                    <div id="category-${escapeHtml(safeCategory.category_id)}" class="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_5px_10px_rgba(0,0,0,0.1),0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_5px_10px_rgba(0,0,0,0.3),0_1px_3px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.2),0_2px_4px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_8px_16px_rgba(0,0,0,0.4),0_2px_4px_rgba(255,255,255,0.15)] transition-all duration-300 overflow-hidden mb-6 scroll-mt-20">
                        <div class="bg-primary/10 dark:bg-primary/20 px-4 py-3 flex items-center">
                            <i class="${escapeHtml(safeCategory.category_icon)} text-primary mr-3 text-xl"></i>
                            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">${escapeHtml(safeCategory.category_name)}</h2>
                        </div>
                        <div class="p-4">
                            <ul class="space-y-3" id="link-list-${escapeHtml(safeCategory.category_id)}"></ul>
                        </div>
                    </div>
                `;
                // 4.2 将分类卡片添加到容器中
                $("#category-container").append(categoryCard);
                // 5. 排序链接（按sort字段升序）
                safeCategory.links.sort(function(a, b) {
                    return (a.sort || 0) - (b.sort || 0);
                });
                
                // 设置书签列表布局：一行显示5个书签（响应式设计）
                let linkListClass = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";
                
                // 更新分类卡片中的链接列表类
                $(`#link-list-${category.category_id}`).removeClass("space-y-3").addClass(linkListClass);
                
                // 7. 辅助函数：截断字符串到指定长度
                function truncateString(str, maxLength) {
                    if (!str) return "无描述";
                    let length = 0;
                    let result = "";
                    for (let i = 0; i < str.length; i++) {
                        // 判断字符是否为汉字
                        if (str.charCodeAt(i) > 255) {
                            length += 2;
                        } else {
                            length += 1;
                        }
                        if (length > maxLength) {
                            return result + "...";
                        }
                        result += str.charAt(i);
                    }
                    return result;
                }
                
                // 8. 遍历链接数据，生成链接列表
                $.each(safeCategory.links, function(linkIndex, link) {
                    // 确保链接数据的所有字段都有有效值
                    const safeLink = {
                        link_id: link.link_id || '',
                        link_name: link.link_name || '未命名书签',
                        link_url: link.link_url || '#',
                        link_icon: link.link_icon || 'fa-link',
                        link_desc: link.link_desc || '',
                        sort: link.sort || 0
                    };
                    
                    // 8.1 截断书签描述到最多10个汉字
                    let truncatedDesc = truncateString(safeLink.link_desc, 20); // 10个汉字 = 20个字符
                    
                    // 8.2 获取完整描述用于悬浮显示
                    let fullDesc = safeLink.link_desc || "无描述";
                    
                    // 8.3 构建链接列表项结构
                    let iconElement = '';
                    if (safeLink.link_icon && safeLink.link_icon.startsWith('http')) {
                        // 如果是URL，使用图片标签
                        iconElement = `<img src="${safeUrlAttr(safeLink.link_icon)}" alt="${escapeHtml(safeLink.link_name)}" class="w-8 h-8 rounded-md object-cover mr-3">`;
                    } else {
                        // 否则使用Font Awesome图标
                        iconElement = `<i class="${escapeHtml(safeLink.link_icon)} text-primary text-xl mr-3"></i>`;
                    }
                    
                    let linkItem = `
                        <li class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_3px_6px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.2),0_2px_4px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_5px_10px_rgba(0,0,0,0.4),0_2px_4px_rgba(255,255,255,0.15)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.2),0_1px_3px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.4),0_1px_3px_rgba(255,255,255,0.1)] transition-all duration-300 max-w-full overflow-hidden">
                            <a href="${safeUrlAttr(safeLink.link_url)}" target="_blank" class="flex items-center text-left text-gray-700 dark:text-gray-200 hover:text-primary transition-colors duration-200 min-w-0 p-2" title="${escapeHtml(fullDesc)}">
                                ${iconElement}
                                <div class="flex flex-col flex-1">
                                    <div class="font-medium truncate">${escapeHtml(safeLink.link_name)}</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate min-h-[1.2rem]">${escapeHtml(truncatedDesc)}</div>
                                </div>
                            </a>
                        </li>
                    `;
                    // 8.4 将链接列表项添加到对应分类的列表中
                    $(`#link-list-${safeCategory.category_id}`).append(linkItem);
                });
            });
        }).fail(function(error) {
            // 数据读取失败处理
            console.error("JSON数据读取失败：", error);
            $("#category-container").html('<div class="text-red-500 text-center py-8">数据加载失败，请检查links.json文件路径或格式</div>');
        });
    }

    // ************ 功能2：实时显示当前时间（包含农历和节日倒计时） ************
    function updateCurrentTime() {
        let now = new Date();
        // 格式化公历时间
        let gregorianStr = now.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            weekday: "long"
        });
        
        // 获取农历日期
        let lunarDateInfo = getLunarDate(now);
        
        // 获取节日倒计时
        let holidayCountdown = getNextHolidayCountdown(now);
        
        // 更新各个显示容器
        $("#current-time").text(gregorianStr);
        $("#lunar-date").text(lunarDateInfo.fullLunarDate);
        $("#holiday-countdown").text(holidayCountdown);
    }
    
    // 农历日期转换函数（增强版）
    function getLunarDate(date) {
        // 阿拉伯数字转汉字年份
        function numberToChineseYear(year) {
            const chineseNums = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
            const yearStr = year.toString();
            let chineseYear = '';
            
            for (let i = 0; i < yearStr.length; i++) {
                chineseYear += chineseNums[parseInt(yearStr[i])];
            }
            
            return chineseYear + '年';
        }
        
        // 农历月份名称
        const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
        // 农历日期名称
        const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                          '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                          '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
        
        // 天干地支
        const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        
        // 2025年农历数据（详细版）
        const lunarMap2025 = {
            '2025-01-01': { lunarYear: 2024, lunarMonth: 11, lunarDay: 22, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丙', diZhiMonth: '子', tianGanDay: '庚', diZhiDay: '午' },
            '2025-01-02': { lunarYear: 2024, lunarMonth: 11, lunarDay: 23, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丙', diZhiMonth: '子', tianGanDay: '辛', diZhiDay: '未' },
            '2025-01-03': { lunarYear: 2024, lunarMonth: 11, lunarDay: 24, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丙', diZhiMonth: '子', tianGanDay: '壬', diZhiDay: '申' },
            '2025-01-04': { lunarYear: 2024, lunarMonth: 11, lunarDay: 25, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丙', diZhiMonth: '子', tianGanDay: '癸', diZhiDay: '酉' },
            '2025-01-05': { lunarYear: 2024, lunarMonth: 11, lunarDay: 26, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '甲', diZhiDay: '戌' },
            '2025-01-06': { lunarYear: 2024, lunarMonth: 11, lunarDay: 27, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '乙', diZhiDay: '亥' },
            '2025-01-07': { lunarYear: 2024, lunarMonth: 11, lunarDay: 28, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '丙', diZhiDay: '子' },
            '2025-01-08': { lunarYear: 2024, lunarMonth: 11, lunarDay: 29, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '丁', diZhiDay: '丑' },
            '2025-01-09': { lunarYear: 2024, lunarMonth: 12, lunarDay: 1, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '戊', diZhiDay: '寅' },
            '2025-01-10': { lunarYear: 2024, lunarMonth: 12, lunarDay: 2, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '己', diZhiDay: '卯' },
            '2025-01-11': { lunarYear: 2024, lunarMonth: 12, lunarDay: 3, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '庚', diZhiDay: '辰' },
            '2025-01-12': { lunarYear: 2024, lunarMonth: 12, lunarDay: 4, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '辛', diZhiDay: '巳' },
            '2025-01-13': { lunarYear: 2024, lunarMonth: 12, lunarDay: 5, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '壬', diZhiDay: '午' },
            '2025-01-14': { lunarYear: 2024, lunarMonth: 12, lunarDay: 6, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '癸', diZhiDay: '未' },
            '2025-01-15': { lunarYear: 2024, lunarMonth: 12, lunarDay: 7, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '甲', diZhiDay: '申' },
            '2025-01-16': { lunarYear: 2024, lunarMonth: 12, lunarDay: 8, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '乙', diZhiDay: '酉' },
            '2025-01-17': { lunarYear: 2024, lunarMonth: 12, lunarDay: 9, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '丙', diZhiDay: '戌' },
            '2025-01-18': { lunarYear: 2024, lunarMonth: 12, lunarDay: 10, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '丁', diZhiDay: '亥' },
            '2025-01-19': { lunarYear: 2024, lunarMonth: 12, lunarDay: 11, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '戊', diZhiDay: '子' },
            '2025-01-20': { lunarYear: 2024, lunarMonth: 12, lunarDay: 12, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '丁', diZhiMonth: '丑', tianGanDay: '己', diZhiDay: '丑' },
            '2025-01-21': { lunarYear: 2024, lunarMonth: 12, lunarDay: 13, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '庚', diZhiDay: '寅' },
            '2025-01-22': { lunarYear: 2024, lunarMonth: 12, lunarDay: 14, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '辛', diZhiDay: '卯' },
            '2025-01-23': { lunarYear: 2024, lunarMonth: 12, lunarDay: 15, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '壬', diZhiDay: '辰' },
            '2025-01-24': { lunarYear: 2024, lunarMonth: 12, lunarDay: 16, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '癸', diZhiDay: '巳' },
            '2025-01-25': { lunarYear: 2024, lunarMonth: 12, lunarDay: 17, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '甲', diZhiDay: '午' },
            '2025-01-26': { lunarYear: 2024, lunarMonth: 12, lunarDay: 18, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '乙', diZhiDay: '未' },
            '2025-01-27': { lunarYear: 2024, lunarMonth: 12, lunarDay: 19, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丙', diZhiDay: '申' },
            '2025-01-28': { lunarYear: 2024, lunarMonth: 12, lunarDay: 20, tianGanYear: '甲', diZhiYear: '辰', zodiac: '龙', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丁', diZhiDay: '酉' },
            '2025-01-29': { lunarYear: 2025, lunarMonth: 1, lunarDay: 1, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '戊', diZhiDay: '戌' },
            '2025-01-30': { lunarYear: 2025, lunarMonth: 1, lunarDay: 2, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '己', diZhiDay: '亥' },
            '2025-01-31': { lunarYear: 2025, lunarMonth: 1, lunarDay: 3, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '庚', diZhiDay: '子' },
            '2025-02-01': { lunarYear: 2025, lunarMonth: 1, lunarDay: 4, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '辛', diZhiDay: '丑' },
            '2025-02-02': { lunarYear: 2025, lunarMonth: 1, lunarDay: 5, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '壬', diZhiDay: '寅' },
            '2025-02-03': { lunarYear: 2025, lunarMonth: 1, lunarDay: 6, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '癸', diZhiDay: '卯' },
            '2025-02-04': { lunarYear: 2025, lunarMonth: 1, lunarDay: 7, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '甲', diZhiDay: '辰' },
            '2025-02-05': { lunarYear: 2025, lunarMonth: 1, lunarDay: 8, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '乙', diZhiDay: '巳' },
            '2025-02-06': { lunarYear: 2025, lunarMonth: 1, lunarDay: 9, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丙', diZhiDay: '午' },
            '2025-02-07': { lunarYear: 2025, lunarMonth: 1, lunarDay: 10, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丁', diZhiDay: '未' },
            '2025-02-08': { lunarYear: 2025, lunarMonth: 1, lunarDay: 11, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '戊', diZhiDay: '申' },
            '2025-02-09': { lunarYear: 2025, lunarMonth: 1, lunarDay: 12, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '己', diZhiDay: '酉' },
            '2025-02-10': { lunarYear: 2025, lunarMonth: 1, lunarDay: 13, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '庚', diZhiDay: '戌' },
            '2025-02-11': { lunarYear: 2025, lunarMonth: 1, lunarDay: 14, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '辛', diZhiDay: '亥' },
            '2025-02-12': { lunarYear: 2025, lunarMonth: 1, lunarDay: 15, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '壬', diZhiDay: '子' },
            '2025-02-13': { lunarYear: 2025, lunarMonth: 1, lunarDay: 16, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '癸', diZhiDay: '丑' },
            '2025-02-14': { lunarYear: 2025, lunarMonth: 1, lunarDay: 17, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '甲', diZhiDay: '寅' },
            '2025-02-15': { lunarYear: 2025, lunarMonth: 1, lunarDay: 18, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '乙', diZhiDay: '卯' },
            '2025-02-16': { lunarYear: 2025, lunarMonth: 1, lunarDay: 19, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丙', diZhiDay: '辰' },
            '2025-02-17': { lunarYear: 2025, lunarMonth: 1, lunarDay: 20, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丁', diZhiDay: '巳' },
            '2025-02-18': { lunarYear: 2025, lunarMonth: 1, lunarDay: 21, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '戊', diZhiDay: '午' },
            '2025-02-19': { lunarYear: 2025, lunarMonth: 1, lunarDay: 22, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '己', diZhiDay: '未' },
            '2025-02-20': { lunarYear: 2025, lunarMonth: 1, lunarDay: 23, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '庚', diZhiDay: '申' },
            '2025-02-21': { lunarYear: 2025, lunarMonth: 1, lunarDay: 24, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '辛', diZhiDay: '酉' },
            '2025-02-22': { lunarYear: 2025, lunarMonth: 1, lunarDay: 25, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '壬', diZhiDay: '戌' },
            '2025-02-23': { lunarYear: 2025, lunarMonth: 1, lunarDay: 26, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '癸', diZhiDay: '亥' },
            '2025-02-24': { lunarYear: 2025, lunarMonth: 1, lunarDay: 27, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '甲', diZhiDay: '子' },
            '2025-02-25': { lunarYear: 2025, lunarMonth: 1, lunarDay: 28, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '乙', diZhiDay: '丑' },
            '2025-02-26': { lunarYear: 2025, lunarMonth: 1, lunarDay: 29, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丙', diZhiDay: '寅' },
            '2025-02-27': { lunarYear: 2025, lunarMonth: 1, lunarDay: 30, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丁', diZhiDay: '卯' },
            '2025-02-28': { lunarYear: 2025, lunarMonth: 2, lunarDay: 1, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '戊', diZhiDay: '辰' },
            '2025-03-01': { lunarYear: 2025, lunarMonth: 2, lunarDay: 2, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '己', diZhiDay: '巳' },
            '2025-03-02': { lunarYear: 2025, lunarMonth: 2, lunarDay: 3, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '庚', diZhiDay: '午' },
            '2025-03-03': { lunarYear: 2025, lunarMonth: 2, lunarDay: 4, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '辛', diZhiDay: '未' },
            '2025-03-04': { lunarYear: 2025, lunarMonth: 2, lunarDay: 5, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '壬', diZhiDay: '申' },
            '2025-03-05': { lunarYear: 2025, lunarMonth: 2, lunarDay: 6, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '癸', diZhiDay: '酉' },
            '2025-03-06': { lunarYear: 2025, lunarMonth: 2, lunarDay: 7, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '甲', diZhiDay: '戌' },
            '2025-03-07': { lunarYear: 2025, lunarMonth: 2, lunarDay: 8, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '乙', diZhiDay: '亥' },
            '2025-03-08': { lunarYear: 2025, lunarMonth: 2, lunarDay: 9, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丙', diZhiDay: '子' },
            '2025-03-09': { lunarYear: 2025, lunarMonth: 2, lunarDay: 10, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丁', diZhiDay: '丑' },
            '2025-03-10': { lunarYear: 2025, lunarMonth: 2, lunarDay: 11, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '戊', diZhiDay: '寅' },
            '2025-03-11': { lunarYear: 2025, lunarMonth: 2, lunarDay: 12, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '己', diZhiDay: '卯' },
            '2025-03-12': { lunarYear: 2025, lunarMonth: 2, lunarDay: 13, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '庚', diZhiDay: '辰' },
            '2025-03-13': { lunarYear: 2025, lunarMonth: 2, lunarDay: 14, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '辛', diZhiDay: '巳' },
            '2025-03-14': { lunarYear: 2025, lunarMonth: 2, lunarDay: 15, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '壬', diZhiDay: '午' },
            '2025-03-15': { lunarYear: 2025, lunarMonth: 2, lunarDay: 16, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '癸', diZhiDay: '未' },
            '2025-03-16': { lunarYear: 2025, lunarMonth: 2, lunarDay: 17, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '甲', diZhiDay: '申' },
            '2025-03-17': { lunarYear: 2025, lunarMonth: 2, lunarDay: 18, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '乙', diZhiDay: '酉' },
            '2025-03-18': { lunarYear: 2025, lunarMonth: 2, lunarDay: 19, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丙', diZhiDay: '戌' },
            '2025-03-19': { lunarYear: 2025, lunarMonth: 2, lunarDay: 20, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丁', diZhiDay: '亥' },
            '2025-03-20': { lunarYear: 2025, lunarMonth: 2, lunarDay: 21, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '戊', diZhiDay: '子' },
            '2025-03-21': { lunarYear: 2025, lunarMonth: 2, lunarDay: 22, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '己', diZhiDay: '丑' },
            '2025-03-22': { lunarYear: 2025, lunarMonth: 2, lunarDay: 23, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '庚', diZhiDay: '寅' },
            '2025-03-23': { lunarYear: 2025, lunarMonth: 2, lunarDay: 24, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '辛', diZhiDay: '卯' },
            '2025-03-24': { lunarYear: 2025, lunarMonth: 2, lunarDay: 25, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '壬', diZhiDay: '辰' },
            '2025-03-25': { lunarYear: 2025, lunarMonth: 2, lunarDay: 26, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '癸', diZhiDay: '巳' },
            '2025-03-26': { lunarYear: 2025, lunarMonth: 2, lunarDay: 27, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '甲', diZhiDay: '午' },
            '2025-03-27': { lunarYear: 2025, lunarMonth: 2, lunarDay: 28, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '乙', diZhiDay: '未' },
            '2025-03-28': { lunarYear: 2025, lunarMonth: 2, lunarDay: 29, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丙', diZhiDay: '申' },
            '2025-03-29': { lunarYear: 2025, lunarMonth: 2, lunarDay: 30, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '丁', diZhiDay: '酉' },
            '2025-03-30': { lunarYear: 2025, lunarMonth: 3, lunarDay: 1, tianGanYear: '乙', diZhiYear: '巳', zodiac: '蛇', 
                             tianGanMonth: '戊', diZhiMonth: '寅', tianGanDay: '戊', diZhiDay: '戌' }
        };
        
        // 格式化日期为YYYY-MM-DD格式
        const dateStr = date.toISOString().split('T')[0];
        
        // 检查是否在映射表中
        if (lunarMap2025[dateStr]) {
            const lunarInfo = lunarMap2025[dateStr];
            const lunarYearStr = lunarInfo.lunarYear;
            const lunarMonthStr = lunarMonths[lunarInfo.lunarMonth - 1];
            const lunarDayStr = lunarDays[lunarInfo.lunarDay - 1];
            
            // 构建完整的农历日期字符串
            const chineseLunarYear = numberToChineseYear(lunarYearStr);
            const fullLunarDate = `${chineseLunarYear}${lunarMonthStr}${lunarDayStr} ${lunarInfo.tianGanYear}${lunarInfo.diZhiYear}年${lunarInfo.tianGanMonth}${lunarInfo.diZhiMonth}月${lunarInfo.tianGanDay}${lunarInfo.diZhiDay}日(${lunarInfo.zodiac}年)`;
            
            return { fullLunarDate: fullLunarDate };
        } else {
            // 如果不在映射表中，使用简化的计算方法
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            // 计算天干地支
            const tianGanIndex = (year - 4) % 10;
            const diZhiIndex = (year - 4) % 12;
            const zodiacIndex = (year - 4) % 12;
            
            // 这里只是一个占位符，实际应用中需要更复杂的算法
            const chineseLunarYear = numberToChineseYear(year);
            const fullLunarDate = `${chineseLunarYear}${lunarMonths[month - 1]}${lunarDays[day - 1]} ${tianGan[tianGanIndex]}${diZhi[diZhiIndex]}年${tianGan[(month + 7) % 10]}${diZhi[(month + 1) % 12]}月${tianGan[day % 10]}${diZhi[day % 12]}日(${zodiacs[zodiacIndex]}年)`;
            
            return { fullLunarDate: fullLunarDate };
        }
    }
    
    // 获取下一个节日的倒计时
    function getNextHolidayCountdown(now) {
        // 2025-2026年主要节日列表（公历）
        const holidays = [
            { date: '2025-01-01', name: '元旦' },
            { date: '2025-01-29', name: '春节' },
            { date: '2025-04-04', name: '清明节' },
            { date: '2025-05-01', name: '劳动节' },
            { date: '2025-06-25', name: '端午节' },
            { date: '2025-09-17', name: '中秋节' },
            { date: '2025-10-01', name: '国庆节' },
            { date: '2026-01-01', name: '元旦' },
            { date: '2026-02-16', name: '春节' },
            { date: '2026-04-04', name: '清明节' },
            { date: '2026-05-01', name: '劳动节' },
            { date: '2026-06-15', name: '端午节' },
            { date: '2026-09-25', name: '中秋节' },
            { date: '2026-10-01', name: '国庆节' }
        ];
        
        // 格式化当前日期
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // 查找下一个节日
        let nextHoliday = null;
        for (const holiday of holidays) {
            const holidayDate = new Date(holiday.date);
            if (holidayDate > currentDate) {
                nextHoliday = holiday;
                break;
            }
        }
        
        if (nextHoliday) {
            // 计算倒计时
            const holidayDate = new Date(nextHoliday.date);
            const timeDiff = holidayDate - currentDate;
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            return `距离${nextHoliday.name}还有${daysLeft}天`;
        } else {
            return '暂无即将到来的节日';
        }
    }

    // ************ 功能3：站内链接搜索（模糊匹配） + 网络搜索 ************
    function initSearchFunction() {
        // 搜索引擎映射（将从API动态加载）
        let searchEngines = {};
        
        // 从API加载搜索引擎数据
        function loadSearchEngines() {
            $.getJSON("/api/search-engines", function(data) {
                // 清空搜索引擎选择器
                $("#search-engine").empty();
                
                // 清空搜索引擎映射
                searchEngines = {};
                
                // 添加默认搜索引擎（如果API返回空数据）
                const defaultEngines = [
                    { engine_name: '百度搜索', engine_key: 'baidu', engine_url: 'https://www.baidu.com/s?wd=', sort: 1 },
                    { engine_name: '谷歌搜索', engine_key: 'google', engine_url: 'https://www.google.com/search?q=', sort: 2 },
                    { engine_name: '必应搜索', engine_key: 'bing', engine_url: 'https://www.bing.com/search?q=', sort: 3 },
                    { engine_name: '360搜索', engine_key: 'so', engine_url: 'https://www.so.com/s?q=', sort: 4 }
                ];
                
                const enginesToUse = data.success && data.data && data.data.search_engines && data.data.search_engines.length > 0 ? data.data.search_engines : defaultEngines;
                
                // 填充搜索引擎选择器并更新映射
                enginesToUse.forEach(engine => {
                    $("#search-engine").append(`<option value="${escapeHtml(engine.engine_key)}">${escapeHtml(engine.engine_name)}</option>`);
                    searchEngines[engine.engine_key] = engine.engine_url;
                });
            }).fail(function(error) {
                console.error("获取搜索引擎数据失败：", error);
                
                // 清空搜索引擎选择器
                $("#search-engine").empty();
                
                // 清空搜索引擎映射
                searchEngines = {};
                
                // 加载失败时使用默认搜索引擎
                const defaultEngines = [
                    { engine_name: '百度搜索', engine_key: 'baidu', engine_url: 'https://www.baidu.com/s?wd=' },
                    { engine_name: '谷歌搜索', engine_key: 'google', engine_url: 'https://www.google.com/search?q=' },
                    { engine_name: '必应搜索', engine_key: 'bing', engine_url: 'https://www.bing.com/search?q=' },
                    { engine_name: '360搜索', engine_key: 'so', engine_url: 'https://www.so.com/s?q=' }
                ];
                
                // 填充搜索引擎选择器并更新映射
                defaultEngines.forEach(engine => {
                    $("#search-engine").append(`<option value="${escapeHtml(engine.engine_key)}">${escapeHtml(engine.engine_name)}</option>`);
                    searchEngines[engine.engine_key] = engine.engine_url;
                });
            });
        }
        
        // 初始化加载搜索引擎数据
        loadSearchEngines();
        
        // 监听搜索框输入事件（站内搜索）
        let searchDebounceTimer = null;
        let searchXhr = null;
        $("#search-input").on("input", function() {
            let searchKey = $(this).val().trim().toLowerCase();
            
            // 控制清空按钮的显示/隐藏
            if (searchKey === "") {
                $("#clear-search-btn").addClass("hidden");
                renderNavData();
                return;
            } else {
                $("#clear-search-btn").removeClass("hidden");
            }
            
            // 防止XSS攻击，对搜索关键词进行过滤
            searchKey = escapeHtml(searchKey);
            
            // 若无搜索关键词，重新渲染全部数据
            if (searchKey === "") {
                renderNavData();
                return;
            }
            // 从API获取数据，进行模糊匹配
            // 防抖：连续输入 250ms 内只发一次请求，并取消上一次未完成请求
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            if (searchXhr && searchXhr.readyState !== 4) searchXhr.abort();
            searchDebounceTimer = setTimeout(function() {
            searchXhr = $.getJSON("/api/data", function(data) {
                // 清空分类容器
                $("#category-container").empty();
                // 遍历分类，筛选包含匹配链接的分类
                $.each(data, function(categoryIndex, category) {
                    let matchedLinks = [];
                    // 遍历链接，模糊匹配链接名称或描述
                    $.each(category.links, function(linkIndex, link) {
                        let linkName = link.link_name.toLowerCase();
                        let linkDesc = (link.link_desc || "").toLowerCase();
                        if (linkName.includes(searchKey) || linkDesc.includes(searchKey)) {
                            matchedLinks.push(link);
                        }
                    });
                    // 若该分类有匹配的链接，渲染该分类和匹配的链接
                    if (matchedLinks.length > 0) {
                            let categoryCard = `
                                <div id="category-${escapeHtml(category.category_id)}" class="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_5px_10px_rgba(0,0,0,0.1),0_1px_3px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_5px_10px_rgba(0,0,0,0.3),0_1px_3px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.2),0_2px_4px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_8px_16px_rgba(0,0,0,0.4),0_2px_4px_rgba(255,255,255,0.15)] transition-all duration-300 overflow-hidden mb-6">
                                    <div class="bg-primary/10 dark:bg-primary/20 px-4 py-3 flex items-center">
                                        <i class="${escapeHtml(category.category_icon)} text-primary mr-3 text-xl"></i>
                                        <h2 class="text-lg font-semibold text-gray-800 dark:text-white">${escapeHtml(category.category_name)}</h2>
                                    </div>
                                    <div class="p-4">
                                        <ul class="space-y-3" id="search-link-list-${escapeHtml(category.category_id)}"></ul>
                                    </div>
                                </div>
                            `;
                            $("#category-container").append(categoryCard);
                            // 辅助函数：截断字符串到指定长度
                            function truncateString(str, maxLength) {
                                if (!str) return "无描述";
                                let length = 0;
                                let result = "";
                                for (let i = 0; i < str.length; i++) {
                                    // 判断字符是否为汉字
                                    if (str.charCodeAt(i) > 255) {
                                        length += 2;
                                    } else {
                                        length += 1;
                                    }
                                    if (length > maxLength) {
                                        return result + "...";
                                    }
                                    result += str.charAt(i);
                                }
                                return result;
                            }
                            
                            // 设置搜索结果中的书签布局：一行显示5个书签（响应式设计）
                            let searchLinkListClass = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3";
                            
                            // 更新搜索结果中的链接列表类
                            $(`#search-link-list-${category.category_id}`).removeClass("space-y-3").addClass(searchLinkListClass);
                            
                            // 渲染匹配的链接
                            $.each(matchedLinks, function(linkIndex, link) {
                                // 截断书签描述到最多10个汉字
                                let truncatedDesc = truncateString(link.link_desc, 20); // 10个汉字 = 20个字符
                                
                                // 获取完整描述用于悬浮显示
                                let fullDesc = link.link_desc || "无描述";
                                
                                // 构建图标元素
                                let iconElement = '';
                                if (link.link_icon && link.link_icon.startsWith('http')) {
                                    // 如果是URL，使用图片标签
                                    iconElement = `<img src="${safeUrlAttr(link.link_icon)}" alt="${escapeHtml(link.link_name)}" class="w-8 h-8 rounded-md object-cover mr-3">`;
                                } else {
                                    // 否则使用Font Awesome图标
                                    iconElement = `<i class="${escapeHtml(link.link_icon || 'fa-link')} text-primary text-xl mr-3"></i>`;
                                }
                                
                                let linkItem = `
                                    <li class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_3px_6px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.1)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_5px_10px_rgba(0,0,0,0.2),0_2px_4px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_5px_10px_rgba(0,0,0,0.4),0_2px_4px_rgba(255,255,255,0.15)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.2),0_1px_3px_rgba(255,255,255,0.7)] dark:active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.4),0_1px_3px_rgba(255,255,255,0.1)] transition-all duration-300 max-w-full overflow-hidden">
                                        <a href="${safeUrlAttr(link.link_url)}" target="_blank" class="flex items-center text-left text-gray-700 dark:text-gray-200 hover:text-primary transition-colors duration-200 min-w-0 p-2" title="${escapeHtml(fullDesc)}">
                                            ${iconElement}
                                            <div class="flex flex-col flex-1">
                                                <div class="font-medium truncate">${escapeHtml(link.link_name)}</div>
                                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate min-h-[1.2rem]">${escapeHtml(truncatedDesc)}</div>
                                            </div>
                                        </a>
                                    </li>
                                `;
                                $(`#search-link-list-${category.category_id}`).append(linkItem);
                            });
                        }
                });
                // 若无任何匹配结果，显示提示信息
                if ($("#category-container").children().length === 0) {
                    $("#category-container").html('<div class="text-gray-500 text-center py-8">未找到匹配的链接，请更换搜索关键词</div>');
                }
            }).fail(function(xhr, status) {
                if (status === "abort") return;
                console.error("JSON数据读取失败：", error);
                $("#category-container").html('<div class="text-red-500 text-center py-8">数据加载失败，请检查links.json文件路径或格式</div>');
            });
            }, 250);
        });
        
        // 监听清空搜索按钮点击事件
        $("#clear-search-btn").on("click", function() {
            $("#search-input").val("");
            $("#clear-search-btn").addClass("hidden");
            renderNavData();
        });
        
        // 监听回车键（网络搜索）
        $("#search-input").on("keypress", function(e) {
            if (e.which === 13) { // Enter键
                $("#search-button").click();
            }
        });
        
        // 监听搜索按钮点击事件（网络搜索）
        $("#search-button").on("click", function() {
            let searchKey = $("#search-input").val().trim();
            if (searchKey === "") {
                return; // 空搜索不执行
            }
            
            // 防止XSS攻击，对搜索关键词进行过滤
            searchKey = escapeHtml(searchKey);
            
            // 获取选择的搜索引擎
            let selectedEngine = $("#search-engine").val();
            let searchUrl = searchEngines[selectedEngine] + encodeURIComponent(searchKey);
            
            // 打开新窗口进行网络搜索
            window.open(searchUrl, '_blank');
        });
    }
    
    // 防止XSS攻击的HTML转义函数（引号也必须转义，用于属性上下文）
    function escapeHtml(text) {
        return NavSecurity.esc(text);
    }
    function safeUrlAttr(value) {
        return NavSecurity.safeHref(value);
    }
    function sanitizeRichHtml(value) {
        return NavSecurity.sanitizeRichHtml(value);
    }

    // ************ 功能4：移动端菜单切换 ************
    function initMobileMenu() {
        // 根据屏幕尺寸决定是否显示侧边栏
        function checkScreenSize() {
            if ($(window).width() >= 1024) { // lg断点
                $('#sidebar-nav').show();
            } else {
                $('#sidebar-nav').hide();
            }
        }
        
        // 初始检查
        checkScreenSize();
        
        // 窗口大小改变时检查
        $(window).on('resize', checkScreenSize);
        
        // 移动端菜单按钮点击事件
        $('#mobile-menu-btn').on('click', function() {
            $('#sidebar-nav').slideToggle(300);
        });
    }

    // ************ 功能5：一键返回顶部 ************
    function initBackToTop() {
        const backToTopBtn = $('#back-to-top-btn');
        
        // 监听滚动事件，控制按钮显示/隐藏
        $(window).on('scroll', function() {
            if ($(window).scrollTop() > 300) {
                backToTopBtn.removeClass('opacity-0 invisible').addClass('opacity-100 visible');
            } else {
                backToTopBtn.removeClass('opacity-100 visible').addClass('opacity-0 invisible');
            }
        });
        
        // 点击返回顶部
        backToTopBtn.on('click', function() {
            $('html, body').animate({ scrollTop: 0 }, 500);
        });
    }

    // ************ 功能6：夜间/白天模式切换 ************
    function initThemeToggle() {
        // 使用新的ThemeManager
        window.themeManager = new ThemeManager();
    }

    // ************ 初始化所有功能 ************
    function initAllFunctions() {
        // 0. 应用网站设置
        applyWebsiteSettings();
        // 1. 渲染导航数据（核心功能，优先执行）
        renderNavData();
        // 2. 加载并显示公告悬浮框
        initAnnouncementToast();
        // 3. 初始化实时时间（立即执行一次，然后每秒更新）
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
        // 4. 初始化搜索功能
        initSearchFunction();
        // 5. 初始化移动端菜单
        initMobileMenu();
        // 6. 初始化一键返回顶部
        initBackToTop();
        // 7. 初始化主题切换
        initThemeToggle();
    }

    // 执行初始化
    initAllFunctions();
});