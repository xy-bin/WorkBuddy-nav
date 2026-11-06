// 初始化仪表盘
function initDashboard() {
    // 加载仪表盘数据
    loadDashboardData();
}

// 加载仪表盘数据
function loadDashboardData() {
    // 加载分类和书签数量
    loadCategoriesAndBookmarkCounts();
    
    // 加载访问量数据
    loadVisitData();
    
    // 渲染图表
    renderCharts();
}

// 加载分类和书签数量
function loadCategoriesAndBookmarkCounts() {
    // 从API获取真实数据
    $.ajax({
        url: "/api/dashboard",
        method: "GET",
        success: function(response) {
            if (response.success) {
                // 更新统计卡片
                $('#category-count').text(response.data.total_categories);
                $('#bookmark-count').text(response.data.total_bookmarks);
            }
        }
    });
}

// 加载访问量数据
function loadVisitData() {
    // 从API获取真实数据
    $.ajax({
        url: "/api/dashboard",
        method: "GET",
        success: function(response) {
            if (response.success) {
                // 更新统计卡片
                // 注意：目前API没有提供访问量数据，这里暂时使用模拟数据
                const mockTodayVisits = 125;
                const mockTotalVisits = 15230;
                
                $('#today-visits').text(mockTodayVisits);
                $('#total-visits').text(mockTotalVisits);
            }
        }
    });
}

// 渲染图表
function renderCharts() {
    // 渲染分类书签数量柱状图
    renderCategoryBookmarkChart();
    
    // 渲染访问量趋势图
    renderVisitTrendChart();
}

// 渲染分类书签数量柱状图
function renderCategoryBookmarkChart() {
    // 从API获取真实数据
    $.ajax({
        url: "/api/categories",
        method: "GET",
        success: function(response) {
            if (response.success) {
                // 从响应中提取分类名称和书签数量
                const categories = response.data.map(category => category.category_name);
                const bookmarkCounts = response.data.map(category => category.link_count || 0);
                
                // 获取canvas元素
                const ctx = document.getElementById('category-bookmark-chart').getContext('2d');
                
                // 创建图表
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: categories,
                        datasets: [{
                            label: '书签数量',
                            data: bookmarkCounts,
                            backgroundColor: [
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(255, 206, 86, 0.6)',
                                'rgba(153, 102, 255, 0.6)',
                                'rgba(255, 159, 64, 0.6)',
                                'rgba(255, 99, 132, 0.6)'
                            ],
                            borderColor: [
                                'rgba(75, 192, 192, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)',
                                'rgba(255, 99, 132, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: '书签数量'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: '分类名称'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        },
        error: function(xhr) {
            console.error('获取分类数据失败:', xhr);
        }
    });
}

// 渲染访问量趋势图
function renderVisitTrendChart() {
    // 从API获取真实数据
    $.ajax({
        url: "/api/dashboard",
        method: "GET",
        success: function(response) {
            if (response.success) {
                // 从响应中提取日期和访问量
                const days = response.data.visit_trend.map(item => item.date);
                const visits = response.data.visit_trend.map(item => item.visits);
                
                // 获取canvas元素
                const ctx = document.getElementById('visit-trend-chart').getContext('2d');
                
                // 创建图表
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: days,
                        datasets: [{
                            label: '访问量',
                            data: visits,
                            fill: true,
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            tension: 0.3,
                            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: '访问量'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: '日期'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        },
        error: function(xhr) {
            console.error('获取访问量趋势数据失败:', xhr);
        }
    });
}