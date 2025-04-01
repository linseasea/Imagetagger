const SettingsManager = {
    // 设置管理器对象，负责处理应用程序设置相关的功能

    // 配置文件路径 - 使用相对路径
    configFilePath: 'ImageTagger/main/config/filepath.conf',
    
    // 元素引用
    modal: null,
    closeBtn: null,
    settingsBtn: null,
    loadBtn: null,
    saveBtn: null,
    imagePathInput: null,
    cnFilePathInput: null,
    enFilePathInput: null,
    baseUrlInput: null,
    modelNameInput: null,
    systemPromptInput: null,
    apiKeyInput: null,
    threadCountInput: null,
    loadingIndicator: null,

    init: function() {
        // 初始化方法，在应用程序启动时调用，设置所有必要的DOM引用和事件监听器
        
        // 获取DOM元素，存储为对象属性以便后续使用
        this.modal = document.getElementById('settingsModal');
        this.closeBtn = document.getElementById('closeBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.imagePathInput = document.getElementById('imagePath');
        this.cnFilePathInput = document.getElementById('cnFilePath');
        this.enFilePathInput = document.getElementById('enFilePath');
        this.baseUrlInput = document.getElementById('baseUrl');
        this.modelNameInput = document.getElementById('modelName');
        this.systemPromptInput = document.getElementById('systemPrompt');
        this.apiKeyInput = document.getElementById('apiKey');
        this.threadCountInput = document.getElementById('threadCount');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        
        // 绑定事件
        this.bindEvents();
        
        console.log('设置管理器初始化完成');
    },
    
    // 绑定事件
    bindEvents: function() {
        // 设置按钮点击事件
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.openModal());
        }
        
        // 关闭按钮点击事件
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // 点击模态窗口外部关闭
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
        
        // 加载按钮点击事件
        if (this.loadBtn) {
            this.loadBtn.addEventListener('click', () => this.loadSettingsFromServer());
        }
        
        // 保存按钮点击事件
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveSettingsToServer());
        }
    },
    
    // 打开设置模态窗口
    openModal: function() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            
            // 重置加载指示器文本
            if (this.loadingIndicator) {
                const loadingText = this.loadingIndicator.querySelector('.loading-text');
                if (loadingText) {
                    loadingText.textContent = '正在加载配置...';
                }
            }
            
            // 每次打开模态窗口时，自动加载当前设置
            this.loadSettingsFromServer();
        }
    },
    
    // 关闭设置模态窗口
    closeModal: function() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    },
    
    // 从服务器加载设置
    loadSettingsFromServer: function() {
        // 显示加载中信息
        LogManager.addLog('info', '正在加载配置和目录信息...');
        console.log('开始从服务器加载配置信息...');
        
        // 确保模态窗口是可见的
        if (this.modal && this.modal.style.display !== 'flex') {
            this.modal.style.display = 'flex';
        }
        
        // 显示加载指示器
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
        }
        
        // 创建并返回Promise以支持链式调用
        return new Promise((resolve, reject) => {
            fetch('/get-directories')
                .then(response => {
                    console.log('响应状态:', response.status);
                    if (!response.ok) {
                        console.error('请求失败:', response.statusText);
                        throw new Error('服务器响应错误: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('获取到的数据:', data);
                    
                    // 更新输入字段值 - 保持原有字段名称
                    if (this.imagePathInput) {
                        this.imagePathInput.value = data.image_path || '';
                        console.log('更新图片路径输入框:', data.image_path);
                    }
                    if (this.cnFilePathInput) {
                        this.cnFilePathInput.value = data.cn_file_path || '';
                        console.log('更新中文文件路径输入框:', data.cn_file_path);
                    }
                    if (this.enFilePathInput) {
                        this.enFilePathInput.value = data.en_file_path || '';
                        console.log('更新英文文件路径输入框:', data.en_file_path);
                    }
                    if (this.baseUrlInput) {
                        this.baseUrlInput.value = data.base_url || '';
                        console.log('更新API基础URL输入框:', data.base_url);
                    }
                    if (this.modelNameInput) {
                        this.modelNameInput.value = data.model_name || '';
                        console.log('更新模型名称输入框:', data.model_name);
                    }
                    if (this.systemPromptInput) {
                        this.systemPromptInput.value = data.system_prompt || '';
                        console.log('更新系统提示词输入框:', data.system_prompt);
                    }
                    if (this.apiKeyInput) {
                        this.apiKeyInput.value = data.api_key || '';
                        console.log('更新API密钥输入框');
                    }
                    if (this.threadCountInput) {
                        // 设置默认线程数为4
                        const threadCount = data.thread_count !== undefined ? data.thread_count : 4;
                        this.threadCountInput.value = threadCount;
                        console.log('更新线程数输入框:', threadCount);
                    }
                    
                    // 更新文件列表和计数
                    this.handleDirectoriesInfo(data);
                    
                    // 隐藏加载指示器
                    if (this.loadingIndicator) {
                        this.loadingIndicator.style.display = 'none';
                    }
                    
                    // 通知用户配置加载成功
                    LogManager.addLog('success', '配置加载成功');
                    this.showSuccessMessage('配置已加载成功');
                    resolve(data);
                })
                .catch(error => {
                    console.error('错误详情:', error);
                    LogManager.addLog('error', '加载配置失败: ' + error.message);
                    
                    // 隐藏加载指示器
                    if (this.loadingIndicator) {
                        this.loadingIndicator.style.display = 'none';
                    }
                    
                    reject(error);
                });
        });
    },
    
    // 处理目录信息
    handleDirectoriesInfo: function(data) {
        // 更新全局应用状态
        if (window.AppState) {
            window.AppState.imageFiles = data.image_files || [];
            window.AppState.imageCount = window.AppState.imageFiles.length;
            
            window.AppState.cnFiles = data.cn_files || [];
            window.AppState.cnCount = window.AppState.cnFiles.length;
            
            window.AppState.enFiles = data.en_files || [];
            window.AppState.enCount = window.AppState.enFiles.length;
            
            // 更新导航栏中的文件计数显示
            const imageCountElem = document.getElementById('imageCount');
            if (imageCountElem) {
                imageCountElem.textContent = window.AppState.imageCount;
                console.log('更新了图片计数元素：', window.AppState.imageCount);
            }
            
            const cnCountElem = document.getElementById('cnCount');
            if (cnCountElem) {
                cnCountElem.textContent = window.AppState.cnCount;
                console.log('更新了中文文件计数元素：', window.AppState.cnCount);
            }
            
            const enCountElem = document.getElementById('enCount');
            if (enCountElem) {
                enCountElem.textContent = window.AppState.enCount;
                console.log('更新了英文文件计数元素：', window.AppState.enCount);
            }
            
            // 如果AppState有refreshUI方法，调用它来更新UI
            if (typeof window.AppState.refreshUI === 'function') {
                window.AppState.refreshUI();
            }
        }
        
        // 触发自定义事件，通知目录信息已更新
        const event = new CustomEvent('directoriesUpdated', { detail: data });
        document.dispatchEvent(event);
        console.log('已触发directoriesUpdated事件');
    },
    
    // 保存设置到服务器
    saveSettingsToServer: function() {
        // 获取表单数据
        const imagePathVal = this.imagePathInput ? this.imagePathInput.value.trim() : '';
        const cnFilePathVal = this.cnFilePathInput ? this.cnFilePathInput.value.trim() : '';
        const enFilePathVal = this.enFilePathInput ? this.enFilePathInput.value.trim() : '';
        const baseUrlVal = this.baseUrlInput ? this.baseUrlInput.value.trim() : '';
        const modelNameVal = this.modelNameInput ? this.modelNameInput.value.trim() : '';
        const systemPromptVal = this.systemPromptInput ? this.systemPromptInput.value.trim() : '';
        const apiKeyVal = this.apiKeyInput ? this.apiKeyInput.value.trim() : '';
        
        // 获取线程数并验证范围
        let threadCountVal = 4; // 默认值
        if (this.threadCountInput) {
            let value = parseInt(this.threadCountInput.value);
            // 确保值在1-20范围内
            if (isNaN(value) || value < 1) {
                value = 1;
                this.threadCountInput.value = 1;
            } else if (value > 20) {
                value = 20;
                this.threadCountInput.value = 20;
            }
            threadCountVal = value;
        }
        
        // 显示保存中信息
        LogManager.addLog('info', '正在保存配置...');
        console.log('正在保存配置到服务器...');
        
        // 显示加载指示器
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
            this.loadingIndicator.querySelector('.loading-text').textContent = '正在保存配置...';
        }
        
        // 准备请求数据 - 保持原有字段名称
        const data = {
            image_path: imagePathVal,
            cn_file_path: cnFilePathVal,
            en_file_path: enFilePathVal,
            base_url: baseUrlVal,
            model_name: modelNameVal,
            system_prompt: systemPromptVal,
            api_key: apiKeyVal,
            thread_count: threadCountVal
        };
        
        // 发送数据到服务器
        fetch('/save-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('服务器响应错误: ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            console.log('设置保存成功:', result);
            
            // 隐藏加载指示器
            if (this.loadingIndicator) {
                this.loadingIndicator.style.display = 'none';
            }
            
            // 显示成功消息
            this.showSuccessMessage('配置已保存成功');
            
            // 添加成功日志
            LogManager.addLog('success', '配置保存成功');
            
            // 直接关闭模态窗口 (修改：将关闭窗口移到这里，确保执行)
            console.log('尝试关闭模态窗口...');
            try {
                if (this.modal) {
                    this.modal.style.display = 'none';
                    console.log('模态窗口已关闭');
                } else {
                    console.warn('模态窗口元素不存在');
                }
            } catch (e) {
                console.error('关闭模态窗口时出错:', e);
            }
            
            // 重新加载目录信息以更新UI (修改：从返回中删除，避免可能的问题)
            this.loadSettingsFromServer().catch(err => {
                console.error('重新加载设置时出错:', err);
            });
        })
        .catch(error => {
            console.error('保存设置失败:', error);
            
            // 隐藏加载指示器
            if (this.loadingIndicator) {
                this.loadingIndicator.style.display = 'none';
            }
            
            LogManager.addLog('error', '保存配置失败: ' + error.message);
        });
    },
    
    // 显示成功消息
    showSuccessMessage: function(message) {
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            const msgText = successMsg.querySelector('span');
            if (msgText) {
                msgText.textContent = message;
            }
            
            // 显示消息
            successMsg.classList.add('show');
            
            // 3秒后隐藏
            setTimeout(() => {
                successMsg.classList.remove('show');
            }, 3000);
        }
    }
};

// 导出模块
window.SettingsManager = SettingsManager;