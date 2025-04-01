// UIHighlighter.js - 负责UI高亮和选择状态相关功能

const UIHighlighter = {
    // 初始化方法
    init: function() {
        console.log('初始化UI高亮器');
    },
    
    // 同步所有文本项的高亮状态
    syncAllTextItemsHighlight: function() {
        const appState = window.AppState;
        if (!appState) return;
        
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        const textItems = document.querySelectorAll('.text-item');
        
        textItems.forEach((textItem, index) => {
            const globalIndex = startIndex + index;
            
            // 设置高亮状态与图片选中状态一致
            if (appState.selectedImages.has(globalIndex)) {
                textItem.classList.add('selected');
            } else {
                textItem.classList.remove('selected');
            }
        });
        
        console.log('所有文本项高亮状态已同步');
    },
    
    // 同步文本项高亮状态
    syncTextItemHighlight: function(imageIndex, isSelected) {
        const appState = window.AppState;
        if (!appState) return;
        
        // 计算当前页面的起始索引
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        
        // 如果图片索引在当前页面范围内
        if (imageIndex >= startIndex && imageIndex < startIndex + appState.imagesPerPage) {
            // 计算在当前页面内的索引位置
            const pageItemIndex = imageIndex - startIndex;
            
            // 查找对应的文本项
            const textItems = document.querySelectorAll('.text-item');
            if (textItems && textItems.length > pageItemIndex) {
                const textItem = textItems[pageItemIndex];
                
                // 先清除所有文本项的选中状态
                this.clearAllTextSelections();
                
                // 设置高亮状态
                if (isSelected) {
                    textItem.classList.add('selected');
                }
                
                console.log(`文本项 ${imageIndex + 1} 高亮状态已${isSelected ? '添加' : '移除'}`);
            }
        }
    },
    
    // 清除所有文本项的选中状态
    clearAllTextSelections: function() {
        const textItems = document.querySelectorAll('.text-item');
        textItems.forEach(textItem => {
            textItem.classList.remove('selected');
        });
        console.log('清除所有文本项选中状态');
    },
    
    // 临时高亮文本项(鼠标悬停时)
    highlightTextItem: function(imageIndex, isHighlight) {
        const appState = window.AppState;
        if (!appState) return;
        
        // 计算当前页面的起始索引
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        
        // 如果图片索引在当前页面范围内
        if (imageIndex >= startIndex && imageIndex < startIndex + appState.imagesPerPage) {
            // 计算在当前页面内的索引位置
            const pageItemIndex = imageIndex - startIndex;
            
            // 查找对应的文本项
            const textItems = document.querySelectorAll('.text-item');
            if (textItems && textItems.length > pageItemIndex) {
                const textItem = textItems[pageItemIndex];
                
                // 设置高亮状态
                if (isHighlight) {
                    textItem.classList.add('hover');
                } else {
                    textItem.classList.remove('hover');
                }
                
                console.log(`文本项 ${imageIndex + 1} 悬停高亮状态已${isHighlight ? '添加' : '移除'}`);
            }
        }
    }
};

// 导出模块
window.UIHighlighter = UIHighlighter; 