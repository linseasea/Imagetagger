/**
 * AI标签管理模块
 * 负责处理AI自动打标相关的功能
 */
const AILabelManager = {
    /**
     * 初始化AI标签管理器
     */
    init() {
        this.bindEvents();
        this.resetProgress();
        LogManager.addLog('info', 'AI打标模块初始化完成');
    },

    /**
     * 绑定事件处理函数
     */
    bindEvents() {
        // 绑定AI打标按钮点击事件
        const aiLabelBtn = document.getElementById('aiLabelBtn');
        if (aiLabelBtn) {
            aiLabelBtn.addEventListener('click', () => this.handleAILabel());
        } else {
            LogManager.addLog('warning', '未找到AI打标按钮，无法绑定事件');
        }
    },

    /**
     * 重置进度条
     */
    resetProgress() {
        // 获取进度条元素
        const progressBar = document.getElementById('aiProgressBar');
        const progressStatus = document.getElementById('progressStatus');
        const progressCount = document.getElementById('progressCount');
        const currentProcessingFile = document.getElementById('currentProcessingFile');
        const robotIcon = document.querySelector('.robot-icon');
        
        // 重置进度条和状态
        if (progressBar) {
            // 移除任何可能的transition
            progressBar.style.transition = 'none';
            
            // 设置固定宽度而不是0%
            progressBar.style.width = '20px';
            
            // 强制重绘
            progressBar.offsetHeight;
            
            // 恢复transition
            progressBar.style.transition = 'width 0.6s ease';
            
            // 添加呼吸效果
            setTimeout(() => {
                progressBar.style.width = '25px';
                
                setTimeout(() => {
                    progressBar.style.width = '20px';
                }, 400);
            }, 800);
        }
        
        // 确保机器人图标可见
        if (robotIcon) {
            robotIcon.style.transition = 'none';
            robotIcon.style.left = '20px';
            
            // 添加动画
            setTimeout(() => {
                robotIcon.style.transition = 'left 0.6s ease';
            }, 50);
        }
        
        if (progressStatus) progressStatus.textContent = '等待开始...';
        if (progressCount) progressCount.textContent = '0/0';
        if (currentProcessingFile) currentProcessingFile.textContent = '-';
        
        // 确保扫描线可见
        const scanLine = document.querySelector('.scan-line');
        if (scanLine) {
            scanLine.style.display = 'block';
        }
    },
    
    /**
     * 更新进度
     * @param {number} current 当前进度
     * @param {number} total 总任务数
     * @param {string} status 当前状态
     * @param {string} currentFile 当前处理的文件
     */
    updateProgress(current, total, status, currentFile) {
        // 获取进度条元素
        const progressBar = document.getElementById('aiProgressBar');
        const progressStatus = document.getElementById('progressStatus');
        const progressCount = document.getElementById('progressCount');
        const currentProcessingFile = document.getElementById('currentProcessingFile');
        const robotIcon = document.querySelector('.robot-icon');
        const container = document.querySelector('.progress-bar-container');
        
        // 计算进度百分比
        const percent = Math.round((current / total) * 100);
        
        // 获取容器宽度，确保机器人图标位置正确
        const containerWidth = container ? container.offsetWidth : 300;
        
        // 更新进度条宽度 - 使用像素而非百分比
        if (progressBar) {
            if (percent <= 5) {
                // 小于5%时确保至少20px
                progressBar.style.width = `${Math.max(20, 20 + percent * 2)}px`;
            } else {
                // 大于5%时使用容器宽度百分比的计算像素值
                const pixelWidth = Math.max(20, containerWidth * percent / 100);
                progressBar.style.width = `${pixelWidth}px`;
            }
            
            // 打印调试信息
            console.log(`Progress updated: ${percent}%, width: ${progressBar.style.width}`);
        }
        
        // 更新机器人图标位置
        if (robotIcon) {
            if (percent <= 5) {
                robotIcon.style.left = `${Math.max(20, 20 + percent * 2)}px`;
            } else {
                // 计算像素位置
                const pixelPos = Math.max(20, containerWidth * percent / 100);
                robotIcon.style.left = `${pixelPos}px`;
            }
        }
        
        if (progressStatus) progressStatus.textContent = status || '处理中...';
        if (progressCount) progressCount.textContent = `${current}/${total}`;
        if (currentProcessingFile && currentFile) {
            const fileName = typeof currentFile === 'string' 
                ? currentFile.split('/').pop() 
                : (currentFile.name || '未知文件');
            currentProcessingFile.textContent = fileName;
        }
    },

    /**
     * 处理AI打标操作
     */
    async handleAILabel() {
        try {
            LogManager.addLog('info', '开始处理AI打标操作...');
            
            // 检查是否有已选择的图片
            const selectedImages = this.getSelectedImagePaths();
            if (!selectedImages || selectedImages.length === 0) {
                LogManager.addLog('warning', '未选择任何图片，无法进行AI打标');
                alert('请先选择需要打标的图片');
                return;
            }
            
            // 重置并显示进度条
            this.resetProgress();
            this.updateProgress(0, selectedImages.length, '准备中...', null);
            
            // 显示加载指示器
            this.showLoading(true);
            LogManager.addLog('info', `已选择 ${selectedImages.length} 张图片，开始进行AI打标`);
            
            // 获取当前配置的文本保存路径
            const config = await this.getConfig();
            if (!config) {
                this.showLoading(false);
                this.updateProgress(0, selectedImages.length, '已取消', null);
                return;
            }
            
            // 开始模拟进度更新
            this.startProgressSimulation(selectedImages);
            
            // 更新进度状态
            this.updateProgress(1, selectedImages.length, '发送请求...', selectedImages[0]);
            
            // 调用后端API
            const response = await fetch('/ai-analyze-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_paths: selectedImages,
                    cn_dir_path: config.cnFilePath,
                    en_dir_path: config.enFilePath,
                    thread_count: config.threadCount || 4 // 传递线程数设置，默认为4
                })
            });
            
            // 停止模拟进度
            this.stopProgressSimulation();
            
            const result = await response.json();
            
            // 处理响应结果
            if (result.success) {
                // 更新进度为完成
                this.updateProgress(selectedImages.length, selectedImages.length, '处理完成', null);
                
                LogManager.addLog('success', `AI打标完成，成功处理 ${result.success_count}/${result.total} 张图片`);
                this.displayResults(result.results);
                
                // 刷新UI，更新文本区域内容
                this.refreshTextContent();
            } else {
                // 更新进度为失败
                this.updateProgress(0, selectedImages.length, '处理失败', null);
                
                LogManager.addLog('error', `AI打标失败: ${result.message}`);
                alert(`打标失败: ${result.message}`);
            }
        } catch (error) {
            // 停止模拟进度
            this.stopProgressSimulation();
            
            // 更新进度为错误
            this.updateProgress(0, selectedImages.length, '处理出错', null);
            
            LogManager.addLog('error', `AI打标过程中出错: ${error.message}`);
            alert(`处理过程中出错: ${error.message}`);
        } finally {
            // 隐藏加载指示器
            this.showLoading(false);
        }
    },
    
    /**
     * 开始模拟进度更新
     * @param {Array} selectedImages 选中的图片数组
     */
    startProgressSimulation(selectedImages) {
        // 清除可能存在的旧定时器
        this.stopProgressSimulation();
        
        const total = selectedImages.length;
        let current = 0;
        const maxProgress = total * 0.8; // 最多模拟到80%
        
        // 保存引用以便于清除
        this.progressTimer = setInterval(() => {
            // 逐渐增加进度
            current += 0.5;
            
            if (current >= maxProgress) {
                // 达到最大模拟进度，停止模拟
                this.stopProgressSimulation();
                return;
            }
            
            // 计算当前应该显示哪个文件
            const fileIndex = Math.min(Math.floor(current), total - 1);
            const currentFile = selectedImages[fileIndex];
            
            // 更新进度
            this.updateProgress(
                Math.floor(current),
                total,
                '处理中...',
                currentFile
            );
        }, 300); // 每300毫秒更新一次
    },
    
    /**
     * 停止进度模拟
     */
    stopProgressSimulation() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
    },
    
    /**
     * 获取已选择的图片路径
     * @returns {Array} 已选择的图片路径数组
     */
    getSelectedImagePaths() {
        // 从AppState中获取已选择的图片索引
        if (window.AppState && window.AppState.selectedImages && window.AppState.imageFiles) {
            const selectedIndices = Array.from(window.AppState.selectedImages);
            const paths = [];
            
            // 将索引转换为路径
            selectedIndices.forEach(index => {
                if (index >= 0 && index < window.AppState.imageFiles.length) {
                    // 确保我们获取的是字符串路径，而不是对象
                    const imageFile = window.AppState.imageFiles[index];
                    const imagePath = typeof imageFile === 'string' ? imageFile : (imageFile.path || '');
                    if (imagePath) {
                        paths.push(imagePath);
                    }
                }
            });
            
            LogManager.addLog('info', `从AppState获取到${paths.length}张已选择图片的路径`);
            return paths;
        }
        
        // 如果AppState不可用，从DOM中获取
        const selectedCheckboxes = document.querySelectorAll('.image-checkbox:checked');
        const paths = [];
        
        selectedCheckboxes.forEach(checkbox => {
            const container = checkbox.closest('.image-item');
            if (container && container.dataset.path) {
                paths.push(container.dataset.path);
            }
        });
        
        return paths;
    },
    
    /**
     * 显示或隐藏加载指示器
     * @param {boolean} show 是否显示
     */
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        } else if (show) {
            // 如果指示器不存在且需要显示，创建一个新的
            const indicator = document.createElement('div');
            indicator.id = 'loadingIndicator';
            indicator.className = 'loading-indicator';
            indicator.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-text">正在进行AI打标，请稍候...</div>
            `;
            document.body.appendChild(indicator);
        }
    },
    
    /**
     * 获取当前配置
     * @returns {Promise<Object>} 配置对象
     */
    async getConfig() {
        try {
            const response = await fetch('/get-directories');
            const data = await response.json();
            
            if (!data.cn_file_path || !data.en_file_path) {
                LogManager.addLog('warning', '未设置中文或英文文本保存路径');
                alert('请先在设置中配置中文和英文文本保存路径');
                return null;
            }
            
            return {
                cnFilePath: data.cn_file_path,
                enFilePath: data.en_file_path,
                threadCount: data.thread_count || 4 // 获取线程数，默认为4
            };
        } catch (error) {
            LogManager.addLog('error', `获取配置失败: ${error.message}`);
            alert(`获取配置失败: ${error.message}`);
            return null;
        }
    },
    
    /**
     * 在日志区域显示处理结果
     * @param {Array} results 处理结果数组
     */
    displayResults(results) {
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        
        let logMessage = `AI打标完成，成功: ${successCount}，失败: ${failCount}\n`;
        
        if (failCount > 0) {
            const failedItems = results.filter(r => !r.success);
            logMessage += '失败的图片：\n';
            
            failedItems.forEach(item => {
                // 安全地获取文件名
                let fileName = '未知文件';
                try {
                    if (typeof item.image_path === 'string') {
                        fileName = item.image_path.split('/').pop();
                    } else if (item.image_path && typeof item.image_path === 'object') {
                        // 如果是对象，尝试获取name属性
                        fileName = item.image_path.name || '未知文件';
                    }
                } catch (e) {
                    console.error('获取文件名出错:', e);
                }
                
                logMessage += `- ${fileName}: ${item.message || '未知错误'}\n`;
            });
        }
        
        LogManager.addLog('info', logMessage);
    },
    
    /**
     * 刷新文本内容
     * 通知其他模块更新文本区域内容
     */
    refreshTextContent() {
        // 触发一个自定义事件，通知其他模块刷新文本内容
        const event = new CustomEvent('textFilesUpdated');
        document.dispatchEvent(event);
        
        // 如果TextLoader模块可用，调用其重新加载方法
        if (window.TextLoader) {
            window.TextLoader.loadChineseTexts();
            window.TextLoader.loadEnglishTexts();
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AILabelManager;
} else {
    window.AILabelManager = AILabelManager;
} 