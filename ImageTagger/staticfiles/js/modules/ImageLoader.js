// ImageLoader.js - 负责图片加载和图片操作相关功能

const ImageLoader = {
    // 初始化方法
    init: function() {
        console.log('初始化图片加载器');
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 初始化按钮文本
        this.updateCheckAllButtonText();
    },
    
    // 绑定事件监听器
    bindEventListeners: function() {
        // 绑定选择选中、选择单页和勾选所有按钮事件
        const selectCheckedBtn = document.getElementById('selectCheckedBtn');
        const selectPageBtn = document.getElementById('selectPageBtn');
        const checkAllBtn = document.getElementById('checkAllBtn');
        
        if (selectCheckedBtn) {
            selectCheckedBtn.addEventListener('click', () => {
                console.log('点击选择选中按钮');
                this.selectCheckedImages();
            });
        } else {
            console.warn('未找到选择选中按钮(#selectCheckedBtn)');
        }
        
        if (selectPageBtn) {
            selectPageBtn.addEventListener('click', () => {
                console.log('点击选择单页按钮');
                this.selectAllImages();
            });
        } else {
            console.warn('未找到选择单页按钮(#selectPageBtn)');
        }
        
        if (checkAllBtn) {
            checkAllBtn.addEventListener('click', () => {
                console.log('点击勾选/取消所有按钮');
                this.toggleCheckAllImages();
            });
        } else {
            console.warn('未找到勾选所有按钮(#checkAllBtn)');
        }
    },
    
    // 加载图片到UI界面
    loadImages: function() {
        if (!window.AppState || !window.AppState.imageFiles || window.AppState.imageFiles.length === 0) {
            console.log('没有图片文件可加载');
            
            // 清空或显示"无图片"提示
            const noImagesMessage = document.getElementById('noImagesMessage');
            if (noImagesMessage) {
                noImagesMessage.style.display = 'flex';
            }
            
            return;
        }
        
        // 隐藏"无图片"提示
        const noImagesMessage = document.getElementById('noImagesMessage');
        if (noImagesMessage) {
            noImagesMessage.style.display = 'none';
        }
        
        const appState = window.AppState;
        
        // 计算当前页要显示的图片索引范围
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        const endIndex = Math.min(startIndex + appState.imagesPerPage, appState.imageFiles.length);
        
        console.log(`准备加载第${appState.currentPage}页图片, 索引范围: ${startIndex}-${endIndex-1}, 总数: ${appState.imageFiles.length}, 本页: ${endIndex - startIndex}张`);
        
        // 获取当前页的图片
        const currentPageImages = appState.imageFiles.slice(startIndex, endIndex);
        
        // 获取图片容器的父元素
        const imagesContainer = document.getElementById('imagesContainer');
        if (!imagesContainer) {
            console.warn('未找到图片容器父元素(#imagesContainer)');
            return;
        }
        
        // 清空现有容器内容，避免重复
        imagesContainer.innerHTML = '';
        
        // 创建所需的图片容器
        for (let i = 0; i < currentPageImages.length; i++) {
            const file = currentPageImages[i];
            const globalIndex = startIndex + i; // 全局索引，用于显示编号
            
            // 创建图片容器
            const newContainer = document.createElement('div');
            newContainer.className = 'image-item';
            newContainer.dataset.id = `img${i + 1}`;
            newContainer.dataset.index = globalIndex;
            
            // 创建图片编号元素
            const numberElem = document.createElement('div');
            numberElem.className = 'image-number';
            numberElem.textContent = globalIndex + 1; // 从1开始编号
            newContainer.appendChild(numberElem);
            
            // 创建图片元素
            const img = document.createElement('img');
            const imageSrc = `/serve-image?path=${encodeURIComponent(file.path)}`;
            img.src = imageSrc;
            img.alt = file.name;
            img.title = file.name;
            img.classList.add('tagger-image');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            newContainer.appendChild(img);
            
            // 创建复选框
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'image-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `img${globalIndex + 1}-check`;
            checkbox.checked = appState.checkedImages.has(globalIndex);
            
            const label = document.createElement('label');
            label.setAttribute('for', checkbox.id);
            
            checkboxDiv.appendChild(checkbox);
            checkboxDiv.appendChild(label);
            newContainer.appendChild(checkboxDiv);
            
            // 添加到容器
            imagesContainer.appendChild(newContainer);
            
            // 添加图片点击事件，只处理选择功能，不处理高亮
            newContainer.addEventListener('click', (event) => {
                // 如果点击的是复选框或标签，不触发图片选择（让复选框自己处理）
                if (event.target.closest('.image-checkbox')) {
                    return;
                }
                
                const index = parseInt(newContainer.dataset.index);
                if (!isNaN(index)) {
                    this.toggleSelectImage(index);
                }
            });
            
            // 如果图片已经被选中，立即添加选中样式
            if (appState.selectedImages.has(globalIndex)) {
                newContainer.classList.add('selected');
            }
            
            // 添加鼠标悬停事件，临时高亮对应文本
            newContainer.addEventListener('mouseenter', (event) => {
                const index = parseInt(newContainer.dataset.index);
                if (!isNaN(index)) {
                    newContainer.classList.add('hover');
                    if (window.UIHighlighter) {
                        window.UIHighlighter.highlightTextItem(index, true);
                    } else if (window.AppState) {
                        window.AppState.highlightTextItem(index, true);
                    }
                }
            });
            
            // 鼠标离开时，取消临时高亮
            newContainer.addEventListener('mouseleave', (event) => {
                const index = parseInt(newContainer.dataset.index);
                if (!isNaN(index)) {
                    newContainer.classList.remove('hover');
                    if (window.UIHighlighter) {
                        window.UIHighlighter.highlightTextItem(index, false);
                    } else if (window.AppState) {
                        window.AppState.highlightTextItem(index, false);
                    }
                }
            });
            
            // 添加复选框变更事件
            checkbox.addEventListener('change', (event) => {
                const index = parseInt(newContainer.dataset.index);
                if (!isNaN(index)) {
                    if (checkbox.checked) {
                        appState.checkedImages.add(index);
                    } else {
                        appState.checkedImages.delete(index);
                    }
                    console.log(`图片 ${index + 1} 勾选状态: ${checkbox.checked ? '已勾选' : '未勾选'}`);
                }
            });
            
            console.log(`已加载图片 ${globalIndex + 1}/${appState.imageFiles.length}: ${file.name}，使用URL: ${imageSrc}`);
        }
        
        // 图片加载完成后，刷新滚动条
        console.log('图片加载完成，初始化滚动条');
        setTimeout(() => {
            if (ScrollManager && typeof ScrollManager.init === 'function') {
                ScrollManager.init();
                console.log('滚动条已初始化');
            } else {
                console.warn('无法初始化滚动条，ScrollManager未找到或init方法不存在');
            }
        }, 100); // 延迟一段时间确保DOM更新
        
        // 更新勾选所有按钮文本
        this.updateCheckAllButtonText();
    },
    
    // 切换图片选中状态
    toggleSelectImage: function(index) {
        const appState = window.AppState;
        if (!appState) return;
        
        const isSelected = appState.selectedImages.has(index);
        
        // 切换图片选中状态
        if (isSelected) {
            // 如果图片已经被选中，则取消选中
            appState.selectedImages.delete(index);
            // 找到对应的DOM元素并移除选中样式
            const imageContainers = document.querySelectorAll('.image-item');
            imageContainers.forEach(container => {
                const containerIndex = parseInt(container.dataset.index);
                if (containerIndex === index) {
                    container.classList.remove('selected');
                }
            });
            console.log(`取消选中图片 ${index + 1}`);
        } else {
            // 先清除之前选中的所有图片（单选模式）
            appState.selectedImages.clear();
            
            // 清除所有图片的选中样式
            const imageContainers = document.querySelectorAll('.image-item');
            imageContainers.forEach(container => {
                container.classList.remove('selected');
            });
            
            // 选中当前图片
            appState.selectedImages.add(index);
            
            // 为当前图片添加选中样式
            imageContainers.forEach(container => {
                const containerIndex = parseInt(container.dataset.index);
                if (containerIndex === index) {
                    container.classList.add('selected');
                }
            });
            console.log(`选中图片 ${index + 1}`);
        }
        
        // 更新文本项的高亮状态
        if (window.UIHighlighter) {
            window.UIHighlighter.syncAllTextItemsHighlight();
        }
        
        console.log(`图片 ${index + 1} 选中状态: ${appState.selectedImages.has(index) ? '已选中' : '未选中'}`);
    },
    
    // 清除所有图片的选中状态
    clearAllImageSelections: function() {
        const imageContainers = document.querySelectorAll('.image-item');
        imageContainers.forEach(container => {
            container.classList.remove('selected');
        });
        console.log('清除所有图片选中状态');
    },
    
    // 选择所有图片（当前页）
    selectAllImages: function() {
        console.log('选择当前页所有图片');
        
        const appState = window.AppState;
        if (!appState) return;
        
        // 根据当前页面范围选择图片
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        const endIndex = Math.min(startIndex + appState.imagesPerPage, appState.imageFiles.length);
        
        // 添加当前页面所有图片到选中集合
        for (let i = startIndex; i < endIndex; i++) {
            appState.selectedImages.add(i);
        }
        
        // 更新UI中所有图片容器的选中状态
        const imageContainers = document.querySelectorAll('.image-item');
        imageContainers.forEach(container => {
            const index = parseInt(container.dataset.index);
            if (!isNaN(index) && appState.selectedImages.has(index)) {
                container.classList.add('selected');
            }
        });
        
        // 更新所有文本项的高亮状态
        if (window.UIHighlighter) {
            window.UIHighlighter.syncAllTextItemsHighlight();
        } else if (appState.syncAllTextItemsHighlight) {
            appState.syncAllTextItemsHighlight();
        }
        
        LogManager.addLog('info', `已选择当前页面的所有图片（${endIndex - startIndex}张）`);
    },
    
    // 勾选所有图片（所有页码）
    checkAllImages: function() {
        console.log('勾选所有图片（所有页码）');
        
        const appState = window.AppState;
        if (!appState) return;
        
        // 勾选所有图片，而不仅仅是当前页面的
        if (appState.imageFiles && appState.imageFiles.length > 0) {
            // 添加所有图片到勾选集合
            for (let i = 0; i < appState.imageFiles.length; i++) {
                appState.checkedImages.add(i);
            }
            
            // 更新当前页面UI中所有复选框的勾选状态
            const checkboxes = document.querySelectorAll('.image-item input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const container = checkbox.closest('.image-item');
                if (container) {
                    const index = parseInt(container.dataset.index);
                    if (!isNaN(index)) {
                        checkbox.checked = true;
                    }
                }
            });
            
            // 更新按钮文本
            this.updateCheckAllButtonText();
            
            LogManager.addLog('success', `已勾选所有图片（${appState.imageFiles.length}张）`);
        } else {
            LogManager.addLog('warning', '没有图片可勾选');
        }
    },
    
    // 选择选中图片
    selectCheckedImages: function() {
        console.log('将勾选的图片添加到选择集合');
        
        const appState = window.AppState;
        if (!appState) return;
        
        if (appState.checkedImages.size === 0) {
            LogManager.addLog('warning', '没有勾选的图片，请先勾选需要选择的图片');
            return;
        }
        
        // 清空之前的选择
        appState.selectedImages.clear();
        
        // 添加所有勾选的图片到选择集合
        appState.checkedImages.forEach(index => {
            appState.selectedImages.add(index);
        });
        
        // 更新UI中所有图片容器的选中状态
        const imageContainers = document.querySelectorAll('.image-item');
        imageContainers.forEach(container => {
            const index = parseInt(container.dataset.index);
            if (!isNaN(index)) {
                // 先移除所有选中状态
                container.classList.remove('selected');
                
                // 如果该图片在选中集合中，添加选中状态
                if (appState.selectedImages.has(index)) {
                    container.classList.add('selected');
                }
            }
        });
        
        // 更新当前页面文本项的高亮状态
        if (window.UIHighlighter) {
            window.UIHighlighter.syncAllTextItemsHighlight();
        } else if (appState.syncAllTextItemsHighlight) {
            appState.syncAllTextItemsHighlight();
        }
        
        LogManager.addLog('success', `已将${appState.checkedImages.size}张勾选的图片添加到选择集合`);
    },
    
    // 切换勾选所有图片状态
    toggleCheckAllImages: function() {
        console.log('切换勾选所有图片状态');
        
        const appState = window.AppState;
        if (!appState) return;
        
        if (appState.checkedImages.size === appState.imageFiles.length) {
            // 如果已全部勾选，则取消所有勾选
            appState.checkedImages.clear();
            
            // 更新当前页面UI中所有复选框的勾选状态
            const checkboxes = document.querySelectorAll('.image-item input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const container = checkbox.closest('.image-item');
                if (container) {
                    const index = parseInt(container.dataset.index);
                    if (!isNaN(index)) {
                        checkbox.checked = false;
                    }
                }
            });
            
            // 更新按钮文本
            this.updateCheckAllButtonText();
            
            LogManager.addLog('success', '已取消所有图片的勾选');
        } else {
            // 勾选所有图片
            this.checkAllImages();
            
            LogManager.addLog('success', '已勾选所有图片');
        }
    },
    
    // 更新勾选所有按钮的文本
    updateCheckAllButtonText: function() {
        const appState = window.AppState;
        if (!appState || !appState.imageFiles) return;
        
        const checkAllBtn = document.getElementById('checkAllBtn');
        if (!checkAllBtn) return;
        
        if (appState.checkedImages.size === appState.imageFiles.length && appState.imageFiles.length > 0) {
            checkAllBtn.innerHTML = '<i class="fas fa-minus-square"></i> 取消所有';
        } else {
            checkAllBtn.innerHTML = '<i class="fas fa-check-square"></i> 勾选所有';
        }
    }
};

// 导出模块
window.ImageLoader = ImageLoader; 