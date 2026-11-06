$(document).ready(function() {
    // 提交书签按钮点击事件
    $('#submit-bookmark-btn').on('click', function() {
        loadCategories();
        $('#submit-bookmark-modal').removeClass('hidden');
    });
    
    // 关闭模态框按钮点击事件
    $('#close-submit-modal-btn, #cancel-submit-btn').on('click', function() {
        $('#submit-bookmark-modal').addClass('hidden');
        $('#submit-bookmark-form')[0].reset();
    });
    
    // 点击模态框外部关闭
    $('#submit-bookmark-modal').on('click', function(e) {
        if (e.target === this) {
            $('#submit-bookmark-modal').addClass('hidden');
            $('#submit-bookmark-form')[0].reset();
        }
    });
    
    // 加载分类列表
    function loadCategories() {
        $.ajax({
            url: '/api/categories',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    const categories = response.data;
                    $('#submit-bookmark-category').empty();
                    $('#submit-bookmark-category').append('<option value="">请选择分类</option>');
                    categories.forEach(category => {
                        const option = '<option value="' + category.category_id + '">' + category.category_name + '</option>';
                        $('#submit-bookmark-category').append(option);
                    });
                }
            },
            error: function(xhr) {
                console.error('加载分类失败:', xhr);
            }
        });
    }
    
    // 提交书签表单提交事件
    $('#submit-bookmark-form').on('submit', function(e) {
        e.preventDefault();
        
        const data = {
            link_name: $('#submit-bookmark-name').val(),
            link_url: $('#submit-bookmark-url').val(),
            link_desc: $('#submit-bookmark-desc').val(),
            category_id: $('#submit-bookmark-category').val(),
            submitter_name: $('#submit-bookmark-submitter').val() || '匿名',
            submitter_contact: $('#submit-bookmark-contact').val()
        };
        
        $.ajax({
            url: '/api/pending-bookmarks',
            method: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    alert('书签提交成功，等待管理员审核');
                    $('#submit-bookmark-modal').addClass('hidden');
                    $('#submit-bookmark-form')[0].reset();
                } else {
                    alert(response.message || '提交失败');
                }
            },
            error: function(xhr) {
                let errorMsg = '提交失败';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMsg = response.message || errorMsg;
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });
});