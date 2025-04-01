// 图片管理模块
const ImageManager = {
    // 存储重要的元素
    imageItems: [],      // 存储所有图片元素
    textItems: [],       // 存储所有文本元素
    noImagesMessage: null, // 存储"无图片"提示消息的元素
    
    init: function() {
        // 获取页面上所有的图片和文本元素
        this.imageItems = document.querySelectorAll('.image-item');
        this.textItems = document.querySelectorAll('.text-item');
        this.noImagesMessage = document.getElementById('noImagesMessage');
        
        // 检查是否有图片
        this.checkImages();
        
        // 给图片添加点击事件
        this.addClickEvents();
        
        // 记录日志
        LogManager.addLog('success', `载入${this.imageItems.length}张图片`);
    },
    
    // 检查是否有图片
    checkImages: function() {
        // 检查是否有图片
        const hasImages = this.imageItems.length > 0;
        
        // 如果没有图片，显示提示消息；如果有图片，隐藏提示消息
        if (this.noImagesMessage) {
            this.noImagesMessage.style.display = hasImages ? 'none' : 'block';
        }
        
        // 更新分页信息
        PaginationManager.updateStats();
    },
    
    // 添加图片点击事件
    addClickEvents: function() {
        // 为每个图片添加点击事件
        this.imageItems.forEach(item => {
            item.addEventListener('click', () => {
                // 清除所有高亮
                this.imageItems.forEach(img => img.classList.remove('active'));
                this.textItems.forEach(txt => txt.classList.remove('active'));
                
                // 添加当前项高亮
                item.classList.add('active');
                
                // 高亮对应的文本项
                const imgId = item.getAttribute('data-id');
                const correspondingText = document.querySelector(`.text-item[data-id="${imgId}"]`);
                if (correspondingText) {
                    correspondingText.classList.add('active');
                }
                
                LogManager.addLog('info', `选中图片: ${imgId}`);
            });
        });
    },
    
    // 获取图片总数
    getTotalImages: function() {
        return this.imageItems.length;
    }
}; 