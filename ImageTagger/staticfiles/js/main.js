// 主JavaScript文件
document.addEventListener('DOMContentLoaded', function() { 
    // 确保LogManager先初始化，以便其他模块可以使用日志功能
    LogManager.init();
    console.log('日志管理模块已初始化');
    
    // 初始化其他模块
    try {
        ImageManager.init();
        console.log('图片管理模块已初始化');
    } catch (error) {
        console.error('图片管理模块初始化失败:', error);
        LogManager.addLog('error', '图片管理模块初始化失败');
    }
    
    try {
        ScrollManager.init();
        console.log('滚动管理模块已初始化');
    } catch (error) {
        console.error('滚动管理模块初始化失败:', error);
        LogManager.addLog('error', '滚动管理模块初始化失败');
    }
    
    try {
        PaginationManager.init();
        console.log('分页管理模块已初始化');
        
        // 不需要在这里重复绑定翻页按钮事件，PaginationManager已经处理了
        // 只需保留页码按钮的事件委托，因为这是在PaginationManager之外的
        const pageNumbers = document.querySelector('.page-numbers');
        if (pageNumbers) {
            pageNumbers.addEventListener('click', function(event) {
                const target = event.target;
                if (target.classList.contains('page-number')) {
                    const pageNum = parseInt(target.dataset.page);
                    if (!isNaN(pageNum) && window.AppState) {
                        console.log(`点击页码按钮: ${pageNum}`);
                        window.AppState.goToPage(pageNum);
                    }
                }
            });
        }
    } catch (error) {
        console.error('分页管理模块初始化失败:', error);
        LogManager.addLog('error', '分页管理模块初始化失败');
    }
    
    // 初始化设置模块
    try {
        SettingsManager.init();
        console.log('设置管理模块已初始化');
    } catch (error) {
        console.error('设置管理模块初始化失败:', error);
        LogManager.addLog('error', '设置管理模块初始化失败');
    }
    
    // 初始化新增的模块
    try {
        ImageLoader.init();
        console.log('图片加载器模块已初始化');
    } catch (error) {
        console.error('图片加载器模块初始化失败:', error);
        LogManager.addLog('error', '图片加载器模块初始化失败');
    }
    
    try {
        TextLoader.init();
        console.log('文本加载器模块已初始化');
    } catch (error) {
        console.error('文本加载器模块初始化失败:', error);
        LogManager.addLog('error', '文本加载器模块初始化失败');
    }
    
    try {
        UIHighlighter.init();
        console.log('UI高亮器模块已初始化');
    } catch (error) {
        console.error('UI高亮器模块初始化失败:', error);
        LogManager.addLog('error', 'UI高亮器模块初始化失败');
    }
    
    // 初始化AI打标模块
    try {
        AILabelManager.init();
        console.log('AI打标模块已初始化');
    } catch (error) {
        console.error('AI打标模块初始化失败:', error);
        LogManager.addLog('error', 'AI打标模块初始化失败');
    }
    
    // 监听目录更新事件
    document.addEventListener('directoriesUpdated', function(event) {
        console.log('接收到directoriesUpdated事件:', event.detail);
        
        // 确认更新UI
        if (window.AppState) {
            console.log('调用AppState.refreshUI()更新UI');
            window.AppState.refreshUI();
            
            // 更新分页控件
            if (PaginationManager && typeof PaginationManager.updatePagination === 'function') {
                PaginationManager.updatePagination(
                    window.AppState.currentPage,
                    window.AppState.totalPages,
                    window.AppState.imageCount
                );
            }
        } else {
            console.error('window.AppState未定义，无法更新UI');
        }
    });
    
    // 窗口大小变化时重新初始化滚动条
    window.addEventListener('resize', function() {
        // 使用延迟确保DOM已经完成布局调整
        setTimeout(() => {
            ScrollManager.init();
        }, 200);
    });
    
    // 页面加载完成后，主动加载目录信息
    setTimeout(() => {
        console.log('页面加载完成，主动加载目录信息');
        // 调用设置管理器加载配置和目录信息
        if (SettingsManager && typeof SettingsManager.loadSettingsFromServer === 'function') {
            SettingsManager.loadSettingsFromServer();
        }
    }, 500);
    
    // 记录初始化完成日志
    LogManager.addLog('success', '应用程序初始化完成');
}); 

// 全局应用程序状态
window.AppState = {
    // 文件和计数信息
    imageFiles: [],
    imageCount: 0,
    cnFiles: [],
    cnCount: 0,
    enFiles: [],
    enCount: 0,
    
    // 选中和勾选状态跟踪
    selectedImages: new Set(), // 存储选中图片的索引
    checkedImages: new Set(),  // 存储勾选图片的索引
    
    // 当前选择的文件
    currentImageIndex: -1,
    currentCnFileIndex: -1,
    currentEnFileIndex: -1,
    
    // 分页相关
    imagesPerPage: 20,  // 每页显示20张图片
    currentPage: 1,    // 当前页码
    totalPages: 1,     // 总页数
    
    // 保存最近创建的文件信息
    lastCreatedFiles: null,
    
    // 初始化分页参数
    initPagination: function() {
        if (!this.imageFiles || this.imageFiles.length === 0) {
            this.totalPages = 1;
            this.currentPage = 1;
        } else {
            this.totalPages = Math.ceil(this.imageFiles.length / this.imagesPerPage);
            // 确保当前页有效
            if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages;
            }
        }
        console.log(`分页初始化: 总页数=${this.totalPages}, 当前页=${this.currentPage}, 每页图片数=${this.imagesPerPage}, 总图片数=${this.imageCount}`);
    },
    
    // 显示指定页面
    goToPage: function(pageNum) {
        if (!pageNum || pageNum < 1 || pageNum > this.totalPages) {
            console.warn(`请求的页码无效: ${pageNum}, 有效范围: 1-${this.totalPages}`);
            return;
        }
        
        this.currentPage = pageNum;
        console.log(`切换到第${pageNum}页`);
        
        // 更新UI显示
        this.refreshUI();
        
        // 如果有最近创建的文件，确保其显示在对应的文本框中
        if (this.lastCreatedFiles && this.lastCreatedFiles.length > 0) {
            setTimeout(() => {
                console.log('页面切换后加载最近创建的文本文件');
                if (TextLoader) {
                    TextLoader.loadNewlyCreatedTextFiles(this.lastCreatedFiles);
                } else {
                    this.loadNewlyCreatedTextFiles(this.lastCreatedFiles);
                }
            }, 100);
        }
        
        // 更新分页控件
        if (PaginationManager && typeof PaginationManager.updatePagination === 'function') {
            PaginationManager.updatePagination(this.currentPage, this.totalPages, this.imageCount);
        }
        
        LogManager.addLog('info', `切换到第${pageNum}页`);
    },
    
    // 下一页
    nextPage: function() {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    },
    
    // 上一页
    prevPage: function() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    },
    
    // 刷新UI，更新文件显示
    refreshUI: function() {
        console.log('刷新UI，当前文件计数：', {
            '图片': this.imageCount,
            '中文文件': this.cnCount,
            '英文文件': this.enCount
        });
        
        // 更新图片数量显示
        const imageCountElem = document.getElementById('imageCount');
        if (imageCountElem) {
            imageCountElem.textContent = this.imageCount;
            console.log('更新了图片计数元素：', this.imageCount);
        } else {
            console.warn('未找到图片计数元素(#imageCount)');
        }
        
        // 更新中文文件数量显示
        const cnCountElem = document.getElementById('cnCount');
        if (cnCountElem) {
            cnCountElem.textContent = this.cnCount;
            console.log('更新了中文文件计数元素：', this.cnCount);
        } else {
            console.warn('未找到中文文件计数元素(#cnCount)');
        }
        
        // 更新英文文件数量显示
        const enCountElem = document.getElementById('enCount');
        if (enCountElem) {
            enCountElem.textContent = this.enCount;
            console.log('更新了英文文件计数元素：', this.enCount);
        } else {
            console.warn('未找到英文文件计数元素(#enCount)');
        }
        
        // 初始化分页
        this.initPagination();
        
        // 更新分页控件中的统计信息
        const imageStatsElem = document.getElementById('imageStats');
        if (imageStatsElem) {
            imageStatsElem.innerHTML = `共 <strong>${this.imageCount}</strong> 张图片，<strong>${this.currentPage}</strong>/${this.totalPages} 页`;
        }
        
        // 加载图片和文本内容
        this.loadContents();
    },
    
    // 更新文件选择器
    updateFileSelectors: function() {
        // 如果存在文件选择器，则更新
        // 这里只是一个示例，具体实现取决于您的HTML结构
        console.log('更新文件选择器');
    },
    
    // 加载图片和文本内容到UI
    loadContents: function() {
        console.log('正在加载图片和文本内容到UI...');
        
        // 使用新的模块加载图片和文本
        if (ImageLoader && typeof ImageLoader.loadImages === 'function') {
            ImageLoader.loadImages();
        } else {
            console.warn('ImageLoader未定义或loadImages方法不存在');
        }
        
        // 创建文本容器
        if (TextLoader && typeof TextLoader.createTextContainers === 'function') {
            // 计算当前页要显示的图片索引范围
            const startIndex = (this.currentPage - 1) * this.imagesPerPage;
            const endIndex = Math.min(startIndex + this.imagesPerPage, this.imageFiles.length);
            const currentPageImagesCount = endIndex - startIndex;
            
            TextLoader.createTextContainers(currentPageImagesCount);
        } else {
            console.warn('TextLoader未定义或createTextContainers方法不存在');
        }
        
        // 加载文本内容
        if (TextLoader && typeof TextLoader.loadTextContent === 'function') {
            const startIndex = (this.currentPage - 1) * this.imagesPerPage;
            TextLoader.loadTextContent(startIndex);
        } else {
            console.warn('TextLoader未定义或loadTextContent方法不存在');
        }
    },
    
    // 创建文本文件（向后兼容，调用TextLoader）
    createTextFiles: function() {
        if (TextLoader && typeof TextLoader.createTextFiles === 'function') {
            TextLoader.createTextFiles();
        } else {
            console.warn('TextLoader未定义或createTextFiles方法不存在');
        }
    },
    
    // 切换图片选中状态（向后兼容，调用ImageLoader）
    toggleSelectImage: function(index) {
        if (ImageLoader && typeof ImageLoader.toggleSelectImage === 'function') {
            ImageLoader.toggleSelectImage(index);
        }
    },
    
    // 加载新创建的文本文件（向后兼容，调用TextLoader）
    loadNewlyCreatedTextFiles: function(createdFiles) {
        if (TextLoader && typeof TextLoader.loadNewlyCreatedTextFiles === 'function') {
            TextLoader.loadNewlyCreatedTextFiles(createdFiles);
        }
    },
    
    // 临时高亮文本项（向后兼容，调用UIHighlighter）
    highlightTextItem: function(imageIndex, isHighlight) {
        if (UIHighlighter && typeof UIHighlighter.highlightTextItem === 'function') {
            UIHighlighter.highlightTextItem(imageIndex, isHighlight);
        }
    },
    
    // 勾选所有图片（向后兼容，调用ImageLoader）
    checkAllImages: function() {
        if (ImageLoader && typeof ImageLoader.checkAllImages === 'function') {
            ImageLoader.checkAllImages();
        }
    },
    
    // 选择所有图片（向后兼容，调用ImageLoader）
    selectAllImages: function() {
        if (ImageLoader && typeof ImageLoader.selectAllImages === 'function') {
            ImageLoader.selectAllImages();
        }
    },
    
    // 选择选中的图片（向后兼容，调用ImageLoader）
    selectCheckedImages: function() {
        if (ImageLoader && typeof ImageLoader.selectCheckedImages === 'function') {
            ImageLoader.selectCheckedImages();
        }
    }
};