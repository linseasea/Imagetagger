// 滚动管理模块
const ScrollManager = {
    imagesContent: null,
    textContent: null,
    textScrollbar: null,
    textScrollbarThumb: null,
    scrollHeight: 0,
    viewportHeight: 0,
    thumbHeight: 0,
    maxThumbTop: 0,
    isDragging: false,
    startY: 0,
    startThumbTop: 0,
    
    init: function() {
        console.log('ScrollManager.init: 开始初始化滚动条');
        
        // 先清空所有已存在的滚动条，避免重复
        const existingScrollbars = document.querySelectorAll('.section-scrollbar');
        existingScrollbars.forEach(scrollbar => {
            console.log('ScrollManager.init: 移除已存在的滚动条');
            scrollbar.remove();
        });
        
        // 获取图片和文本内容区域，以便同步滚动
        this.imagesContainer = document.querySelector('.loading-area .scroll-container');
        this.imagesContent = document.querySelector('.loading-area .scrollable-content');
        this.textContainer = document.querySelector('.text-display .scroll-container');
        this.textContent = document.querySelector('.text-display .scrollable-content');
        
        // 记录存在同步滚动的容器
        this.syncContainers = [];
        
        // 查找所有需要滚动条的容器
        const scrollContainers = document.querySelectorAll('.scroll-container');
        console.log(`ScrollManager.init: 找到 ${scrollContainers.length} 个滚动容器`);
        
        scrollContainers.forEach((container, index) => {
            console.log(`ScrollManager.init: 为容器 ${index + 1} 初始化滚动条`);
            const content = container.querySelector('.scrollable-content');
            if (!content) {
                console.warn(`ScrollManager.init: 容器 ${index + 1} 没有找到 .scrollable-content 元素`);
                return;
            }
            
            // 判断是否为图片区域，只为文本区域创建滚动条
            const isImageContainer = container.closest('.loading-area') !== null;
            
            // 创建滚动条元素（仅为文本区域）
            if (!isImageContainer) {
                const scrollbar = document.createElement('div');
                scrollbar.className = 'section-scrollbar';
                
                // 创建滚动条滑块
                const thumb = document.createElement('div');
                thumb.className = 'scrollbar-thumb';
                scrollbar.appendChild(thumb);
                
                // 将滚动条添加到容器
                container.appendChild(scrollbar);
                console.log(`ScrollManager.init: 为容器 ${index + 1} 创建了滚动条`);
            }
            
            // 获取或设置滚动条元素
            const scrollbar = container.querySelector('.section-scrollbar');
            const thumb = scrollbar ? scrollbar.querySelector('.scrollbar-thumb') : null;
            
            // 记录容器信息以便同步滚动
            this.syncContainers.push({
                container: container,
                content: content,
                scrollbar: scrollbar,
                thumb: thumb,
                isImageContainer: isImageContainer
            });
            
            // 刷新滚动条状态
            if (!isImageContainer && scrollbar) {
                this.refreshScrollbar(container);
            }
            
            // 绑定鼠标滚轮事件
            container.addEventListener('wheel', (event) => {
                this.handleMouseWheel(event, container, content);
            });
            
            // 绑定滚动条拖动事件（仅文本区域）
            if (!isImageContainer && thumb) {
                const drag = { active: false, initialY: 0, initialScroll: 0 };
                
                thumb.addEventListener('mousedown', (event) => {
                    drag.active = true;
                    drag.initialY = event.clientY;
                    drag.initialScroll = content.offsetTop;
                    
                    thumb.style.cursor = 'grabbing';
                    
                    // 阻止事件冒泡和默认行为
                    event.preventDefault();
                    event.stopPropagation();
                });
                
                // 添加鼠标移动事件到文档级别
                document.addEventListener('mousemove', (event) => {
                    if (!drag.active) return;
                    
                    // 计算鼠标移动的距离
                    const delta = event.clientY - drag.initialY;
                    
                    // 获取容器高度和内容高度
                    const containerHeight = container.clientHeight;
                    const contentHeight = this.getContentScrollHeight(content);
                    
                    // 计算可滚动的最大距离
                    const maxScroll = contentHeight - containerHeight;
                    
                    // 计算滚动条的可移动距离与内容可滚动距离的比例
                    const scrollbarHeight = scrollbar.clientHeight;
                    const thumbHeight = thumb.offsetHeight;
                    const scrollRatio = (scrollbarHeight - thumbHeight) / maxScroll;
                    
                    // 计算内容应该滚动的距离
                    const scrollDistance = delta / scrollRatio;
                    const newPosition = Math.max(Math.min(drag.initialScroll - scrollDistance, 0), -maxScroll);
                    
                    // 更新内容位置
                    content.style.transform = `translateY(${newPosition}px)`;
                    
                    // 同步其他区域的滚动位置
                    this.syncScroll(container, maxScroll, newPosition / -maxScroll);
                    
                    // 更新滚动条位置
                    this.updateScrollbarPosition(container);
                });
                
                // 添加鼠标释放事件到文档级别
                document.addEventListener('mouseup', () => {
                    if (drag.active) {
                        drag.active = false;
                        thumb.style.cursor = 'grab';
                    }
                });
                
                // 绑定点击滚动条滚动事件
                scrollbar.addEventListener('click', (event) => {
                    // 确保点击是在滚动条上，而不是在滑块上
                    if (event.target === scrollbar) {
                        this.handleScrollbarClick(event, container, content, scrollbar, thumb);
                    }
                });
            }
        });
    },
    
    // 刷新滚动条
    refreshScrollbar: function(container) {
        console.log('ScrollManager.refreshScrollbar: 开始刷新滚动条');
        const content = container.querySelector('.scrollable-content');
        const scrollbar = container.querySelector('.section-scrollbar');
        
        if (!content || !scrollbar) {
            console.warn('ScrollManager.refreshScrollbar: 未找到内容元素或滚动条元素');
            return;
        }
        
        // 获取容器和内容的高度
        const containerHeight = container.clientHeight;
        const contentHeight = this.getContentScrollHeight(content);
        
        console.log(`ScrollManager.refreshScrollbar: 容器高度=${containerHeight}, 内容高度=${contentHeight}`);
        
        // 检查内容是否需要滚动
        const needsScrollbar = contentHeight > containerHeight;
        console.log(`ScrollManager.refreshScrollbar: 需要滚动条? ${needsScrollbar}`);
        
        // 根据是否需要滚动条来显示或隐藏滚动条
        if (needsScrollbar) {
            scrollbar.style.display = 'block';
            
            // 计算滑块高度
            const scrollbarHeight = scrollbar.clientHeight;
            const thumbHeight = Math.max(30, scrollbarHeight * (containerHeight / contentHeight));
        
        // 设置滑块高度
            const thumb = scrollbar.querySelector('.scrollbar-thumb');
            if (thumb) {
                thumb.style.height = `${thumbHeight}px`;
                console.log(`ScrollManager.refreshScrollbar: 设置滑块高度=${thumbHeight}px`);
            }
            
            // 更新滚动条位置
            this.updateScrollbarPosition(container);
        } else {
            // 不需要滚动条时隐藏
            scrollbar.style.display = 'none';
            
            // 重置内容位置
            content.style.transform = 'translateY(0)';
            console.log('ScrollManager.refreshScrollbar: 不需要滚动条，已隐藏并重置内容位置');
        }
    },
    
    // 更新滚动条位置
    updateScrollbarPosition: function(container) {
        const content = container.querySelector('.scrollable-content');
        const scrollbar = container.querySelector('.section-scrollbar');
        if (!content || !scrollbar) {
            console.warn('ScrollManager.updateScrollbarPosition: 未找到必要的元素');
            return;
        }
        
        const thumb = scrollbar ? scrollbar.querySelector('.scrollbar-thumb') : null;
        if (!thumb) {
            console.warn('ScrollManager.updateScrollbarPosition: 未找到滚动条滑块');
            return;
        }
        
        // 获取当前内容位置
        const contentY = content.style.transform ? 
            parseInt(content.style.transform.replace('translateY(', '').replace('px)', '')) : 0;
        
        // 获取容器和内容的高度
        const containerHeight = container.clientHeight;
        const contentHeight = this.getContentScrollHeight(content);
        
        // 如果内容不需要滚动，不更新滚动条
        if (contentHeight <= containerHeight) {
            thumb.style.top = '0px';
            return;
        }
        
        // 计算滚动比例 (0-1之间的值)
        const scrollRatio = -contentY / (contentHeight - containerHeight);
        
        // 计算滑块位置
        const scrollbarHeight = scrollbar.clientHeight;
        const thumbHeight = thumb.offsetHeight;
        const thumbY = scrollRatio * (scrollbarHeight - thumbHeight);
        
        // 设置滑块位置
        thumb.style.top = `${thumbY}px`;
        console.log(`ScrollManager.updateScrollbarPosition: 更新滑块位置 Y=${thumbY}px, 滚动比例=${scrollRatio}`);
    },
    
    // 获取内容实际滚动高度
    getContentScrollHeight: function(content) {
        console.log('ScrollManager.getContentScrollHeight: 计算内容滚动高度');
        // 检查容器中是否有图片项
        const imageItems = content.querySelectorAll('.image-item');
        if (imageItems.length > 0) {
            // 如果是图片列表，统计所有图片项的高度总和
            // 获取第一个图片项的高度(包括margin)
            if (imageItems.length > 0) {
                const firstItem = imageItems[0];
                const itemHeight = firstItem.offsetHeight;
                const style = window.getComputedStyle(firstItem);
                const marginBottom = parseInt(style.marginBottom || 0);
                const itemTotalHeight = itemHeight + marginBottom;
                
                // 计算所有项目的总高度
                const totalHeight = imageItems.length * itemTotalHeight;
                
                console.log(`ScrollManager.getContentScrollHeight: 图片项数量=${imageItems.length}, 单项高度=${itemTotalHeight}, 总高度=${totalHeight}`);
                return totalHeight;
            }
        }
        
        // 检查是否有文本项
        const textItems = content.querySelectorAll('.text-item');
        if (textItems.length > 0) {
            // 如果是文本列表，统计所有文本项的高度总和
            // 获取第一个文本项的高度(包括margin)
            if (textItems.length > 0) {
                const firstItem = textItems[0];
                const itemHeight = firstItem.offsetHeight;
                const style = window.getComputedStyle(firstItem);
                const marginBottom = parseInt(style.marginBottom || 0);
                const itemTotalHeight = itemHeight + marginBottom;
                
                // 计算所有项目的总高度
                const totalHeight = textItems.length * itemTotalHeight;
                
                console.log(`ScrollManager.getContentScrollHeight: 文本项数量=${textItems.length}, 单项高度=${itemTotalHeight}, 总高度=${totalHeight}`);
                return totalHeight;
            }
        }
        
        // 默认返回内容的滚动高度
        const height = content.scrollHeight;
        console.log(`ScrollManager.getContentScrollHeight: 使用默认scrollHeight=${height}`);
        return height;
    },
    
    // 鼠标滚轮事件处理
    handleMouseWheel: function(e, container, content) {
            e.preventDefault();
        
        // 获取容器高度和内容高度
        const containerHeight = container.clientHeight;
        const contentHeight = this.getContentScrollHeight(content);
        
        // 如果内容不需要滚动，直接返回
        if (contentHeight <= containerHeight) return;
        
        // 获取当前内容位置
        const currentY = content.style.transform ? 
            parseInt(content.style.transform.replace('translateY(', '').replace('px)', '')) : 0;
        
        // 计算新的滚动位置，增加滚动速度
        const wheelDelta = Math.abs(e.deltaY) > 50 ? Math.sign(e.deltaY) * 5 : e.deltaY / 10; // 增加速度
        const scrollDistance = wheelDelta * 10; // 增加步长到10，提高滚动速度
        
        // 计算最大可滚动距离
        const maxScroll = contentHeight - containerHeight;
        
        // 计算新位置，并确保在有效范围内
        const newY = Math.max(Math.min(currentY - scrollDistance, 0), -maxScroll);
        
        // 使用更平滑的过渡效果
        content.style.transition = 'transform 0.05s ease-out';
        content.style.transform = `translateY(${newY}px)`;
        
        // 计算滚动比例
        const scrollPercentage = Math.abs(newY) / maxScroll;
        
        // 同步其他区域的滚动位置
        this.syncScroll(container, maxScroll, scrollPercentage);
        
        // 更新滚动条位置
        this.updateScrollbarPosition(container);
        
        console.log(`ScrollManager.handleMouseWheel: 滚动距离=${scrollDistance}, 新位置=${newY}, 百分比=${scrollPercentage}`);
    },
    
    // 同步滚动其他区域
    syncScroll: function(sourceContainer, maxScroll, scrollPercentage) {
        // 遍历所有容器，同步滚动位置
        this.syncContainers.forEach(item => {
            // 跳过源容器
            if (item.container === sourceContainer) return;
            
            const targetContent = item.content;
            const targetContainer = item.container;
            
            // 获取目标容器的内容高度
            const targetContentHeight = this.getContentScrollHeight(targetContent);
            const targetContainerHeight = targetContainer.clientHeight;
            
            // 如果内容不需要滚动，直接返回
            if (targetContentHeight <= targetContainerHeight) return;
            
            // 计算目标容器最大可滚动距离
            const targetMaxScroll = targetContentHeight - targetContainerHeight;
            
            // 计算目标位置
            const targetY = -targetMaxScroll * scrollPercentage;
            
            // 设置目标容器的位置
            targetContent.style.transition = 'transform 0.05s ease-out';
            targetContent.style.transform = `translateY(${targetY}px)`;
            
            // 更新目标容器的滚动条位置
            this.updateScrollbarPosition(targetContainer);
            
            console.log(`同步滚动容器 到位置=${targetY}px (${scrollPercentage * 100}%)`);
        });
    },
    
    // 更新滚动内容位置
    updateScrollPosition: function(scrollPercentage) {
        if (this.scrollHeight <= this.viewportHeight) return; // 内容不需要滚动
        
        const maxScrollTop = this.scrollHeight - this.viewportHeight;
        const scrollTop = maxScrollTop * scrollPercentage;
        
        // 设置内容偏移
        if (this.imagesContent) this.imagesContent.style.transform = `translateY(-${scrollTop}px)`;
        if (this.textContent) this.textContent.style.transform = `translateY(-${scrollTop}px)`;
    },
    
    // 更新滚动条位置
    updateThumbPosition: function(scrollPercentage) {
        if (!this.textScrollbarThumb) return;
        const thumbTop = this.maxThumbTop * scrollPercentage;
        this.textScrollbarThumb.style.top = thumbTop + 'px';
    },
    
    // 鼠标滚轮事件处理
    handleWheelScroll: function(e) {
        if (!this.textScrollbarThumb) return;
        e.preventDefault();
        
        // 获取当前滑块位置
        const currentThumbTop = parseInt(getComputedStyle(this.textScrollbarThumb).top) || 0;
        
        // 计算新的滑块位置，极大降低滚动速度
        let newThumbTop = currentThumbTop + (e.deltaY > 0 ? 1 : -1); // 将滚动距离从5px减少到1px
        
        // 限制在有效范围内
        newThumbTop = Math.max(0, Math.min(this.maxThumbTop, newThumbTop));
        
        // 更新滚动条位置
        this.textScrollbarThumb.style.top = newThumbTop + 'px';
        
        // 更新内容滚动位置
        const scrollPercentage = newThumbTop / this.maxThumbTop;
        this.updateScrollPosition(scrollPercentage);
    },
    
    // 点击滚动条背景
    handleScrollbarClick: function(e, container, content, scrollbar, thumb) {
        // 确保不是点击滑块
        if (e.target === thumb) return;
        
        const clickPosition = e.clientY - scrollbar.getBoundingClientRect().top;
        const centerThumb = thumb.offsetHeight / 2;
        let newThumbTop = clickPosition - centerThumb;
        
        // 限制在有效范围内
        newThumbTop = Math.max(0, Math.min(this.maxThumbTop, newThumbTop));
        
        // 更新滚动条位置
        thumb.style.top = newThumbTop + 'px';
        
        // 更新内容滚动位置
        const scrollPercentage = newThumbTop / this.maxThumbTop;
        this.updateScrollPosition(scrollPercentage);
    }
}; 