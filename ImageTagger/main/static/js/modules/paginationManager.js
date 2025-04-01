// 分页管理模块
const PaginationManager = {
    imageStats: null,
    paginationBar: null,
    pageNumbersContainer: null,
    prevBtn: null,
    nextBtn: null,
    ITEMS_PER_PAGE: 20, // 每页显示20张图片
    totalImages: 0,
    totalPages: 0,
    currentPage: 1,
    
    init: function() {
        // 获取DOM元素
        this.imageStats = document.getElementById('imageStats');
        this.paginationBar = document.querySelector('.pagination-bar');
        this.pageNumbersContainer = document.querySelector('.page-numbers');
        this.prevBtn = document.getElementById('prevPageBtn');
        this.nextBtn = document.getElementById('nextPageBtn');
        
        console.log('分页DOM元素获取状态:', {
            'imageStats': !!this.imageStats,
            'paginationBar': !!this.paginationBar,
            'pageNumbersContainer': !!this.pageNumbersContainer,
            'prevBtn': !!this.prevBtn,
            'nextBtn': !!this.nextBtn
        });
        
        // 初始化总页数（将在AppState更新后重新计算）
        this.totalImages = 0;
        this.totalPages = 1;
        this.currentPage = 1;
        
        // 更新统计信息
        this.updateStats();
        
        // 生成页码
        this.generatePageNumbers();
        
        // 添加翻页按钮事件
        this.addPaginationEvents();
        
        // 设置上一页/下一页按钮状态
        this.updatePrevNextButtons();
        
        console.log('分页管理模块初始化完成');
    },
    
    // 更新分页信息（由AppState调用）
    updatePagination: function(currentPage, totalPages, totalImages) {
        console.log(`更新分页信息: 当前页=${currentPage}, 总页数=${totalPages}, 总图片数=${totalImages}`);
        
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalImages = totalImages;
        
        // 更新统计信息
        this.updateStats();
        
        // 重新生成页码
        this.generatePageNumbers();
        
        // 更新按钮状态
        this.updatePrevNextButtons();
    },
    
    // 更新统计信息并控制分页显示
    updateStats: function() {
        if (!this.imageStats) return;
        
        // 更新统计信息
        this.imageStats.innerHTML = `共 <strong>${this.totalImages}</strong> 张图片，<strong>${this.currentPage}</strong>/${this.totalPages} 页`;
        
        // 更新上一页/下一页按钮状态
        this.updatePrevNextButtons();
    },
    
    // 设置上一页/下一页按钮状态
    updatePrevNextButtons: function() {
        if (this.prevBtn && this.nextBtn) {
            // 如果在第一页，禁用上一页按钮
            if (this.currentPage <= 1) {
                this.prevBtn.classList.add('disabled');
                this.prevBtn.disabled = true;
            } else {
                this.prevBtn.classList.remove('disabled');
                this.prevBtn.disabled = false;
            }
            
            // 如果在最后一页，禁用下一页按钮
            if (this.currentPage >= this.totalPages) {
                this.nextBtn.classList.add('disabled');
                this.nextBtn.disabled = true;
            } else {
                this.nextBtn.classList.remove('disabled');
                this.nextBtn.disabled = false;
            }
        }
    },
    
    // 生成页码按钮
    generatePageNumbers: function() {
        if (!this.pageNumbersContainer) return;
        
        // 清空现有页码
        this.pageNumbersContainer.innerHTML = '';
        
        // 对于只有一页的情况，只显示"1"
        if (this.totalPages <= 1) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-number active';
            pageBtn.textContent = 1;
            pageBtn.dataset.page = 1;
            this.pageNumbersContainer.appendChild(pageBtn);
            return;
        }
        
        // 生成页码按钮
        const maxPages = Math.min(5, this.totalPages); // 最多显示5个页码
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
        const endPage = Math.min(startPage + maxPages - 1, this.totalPages);
        
        // 调整起始页，确保显示足够的页码
        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-number' + (i === this.currentPage ? ' active' : '');
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;
            
            pageBtn.addEventListener('click', () => {
                this.goToPage(i);
            });
            
            this.pageNumbersContainer.appendChild(pageBtn);
        }
        
        // 如果总页数大于显示的页码，添加省略号和最后一页
        if (this.totalPages > maxPages && endPage < this.totalPages) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            this.pageNumbersContainer.appendChild(ellipsis);
            
            // 添加最后一页
            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'page-number';
            lastPageBtn.textContent = this.totalPages;
            lastPageBtn.dataset.page = this.totalPages;
            
            lastPageBtn.addEventListener('click', () => {
                this.goToPage(this.totalPages);
            });
            
            this.pageNumbersContainer.appendChild(lastPageBtn);
        }
    },
    
    // 添加翻页按钮事件
    addPaginationEvents: function() {
        // 确保按钮存在且尚未绑定事件
        if (this.prevBtn && !this.prevBtn._hasClickListener) {
            console.log('为上一页按钮添加事件监听器');
            this.prevBtn._hasClickListener = true; // 标记已绑定
            this.prevBtn.addEventListener('click', () => {
                console.log('PaginationManager: 点击上一页按钮');
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            });
        } else if (!this.prevBtn) {
            console.warn('上一页按钮不存在，无法添加事件监听器');
        }
        
        // 下一页按钮
        if (this.nextBtn && !this.nextBtn._hasClickListener) {
            console.log('为下一页按钮添加事件监听器');
            this.nextBtn._hasClickListener = true; // 标记已绑定
            this.nextBtn.addEventListener('click', () => {
                console.log('PaginationManager: 点击下一页按钮');
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            });
        } else if (!this.nextBtn) {
            console.warn('下一页按钮不存在，无法添加事件监听器');
        }
        
        // 设置初始按钮状态
        this.updatePrevNextButtons();
    },
    
    // 翻页功能
    goToPage: function(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) {
            console.warn(`无效的页码: ${pageNum}, 有效范围: 1-${this.totalPages}`);
            return;
        }
        
        console.log(`用户点击切换到第${pageNum}页`);
        
        // 如果AppState可用，通过AppState切换页面
        if (window.AppState && typeof window.AppState.goToPage === 'function') {
            window.AppState.goToPage(pageNum);
        } else {
            // 否则，只更新本地分页状态
            this.currentPage = pageNum;
            
            // 更新统计信息
            this.updateStats();
            
            // 重新生成页码
            this.generatePageNumbers();
            
            LogManager.addLog('info', `切换到第${pageNum}页`);
        }
    }
}; 