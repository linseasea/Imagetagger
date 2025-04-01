// TextEditor.js - 负责文本编辑和保存功能

const TextEditor = {
    // 文本编辑区域元素
    editArea: null,
    saveButton: null,
    clearButton: null,
    
    // 当前编辑的文本框和文件路径
    currentTextarea: null,
    currentFilePath: null,
    currentTextType: null, // 'cn' 或 'en'
    
    // 初始化方法
    init: function() {
        console.log('初始化文本编辑器...');
        
        // 获取文本编辑区域元素
        this.editArea = document.querySelector('.edit-area');
        this.saveButton = document.querySelector('.save-button');
        this.clearButton = document.querySelector('.clear-button');
        
        // 检查元素是否获取成功
        if (!this.editArea) {
            console.error('未找到编辑区域(.edit-area)元素');
            return;
        }
        
        if (!this.saveButton) {
            console.error('未找到保存按钮(.save-button)元素');
            return;
        }
        
        if (!this.clearButton) {
            console.error('未找到清空按钮(.clear-button)元素');
            return;
        }
        
        // 绑定事件
        this.bindEvents();
        console.log('文本编辑器初始化完成');
    },
    
    // 绑定事件
    bindEvents: function() {
        const self = this;
        
        // 绑定文本框点击事件
        document.addEventListener('click', function(event) {
            const textareaElement = event.target.closest('.text-box textarea');
            if (textareaElement) {
                const textBox = textareaElement.parentNode;
                const textItem = textBox.closest('.text-item');
                
                if (textBox && textItem) {
                    // 确定文本类型（中文或英文）
                    const isChinese = textBox.classList.contains('chinese');
                    const isEnglish = textBox.classList.contains('english');
                    const textType = isChinese ? 'cn' : (isEnglish ? 'en' : null);
                    
                    if (textType) {
                        console.log(`点击了${textType === 'cn' ? '中文' : '英文'}文本框`);
                        self.loadTextToEditor(textareaElement, textItem, textType);
                    }
                }
            }
        });
        
        // 绑定保存按钮点击事件
        this.saveButton.addEventListener('click', function() {
            self.saveEditedText();
        });
        
        // 绑定清空按钮点击事件
        this.clearButton.addEventListener('click', function() {
            self.clearEditArea();
        });
    },
    
    // 加载文本到编辑区域
    loadTextToEditor: function(textareaElement, textItem, textType) {
        // 如果存在之前的活动文本框，移除高亮样式
        if (this.currentTextarea) {
            this.currentTextarea.classList.remove('editing');
            this.currentTextarea.closest('.text-box').classList.remove('editing');
        }
        
        // 保存当前编辑的文本框引用
        this.currentTextarea = textareaElement;
        this.currentTextType = textType;
        
        // 获取文件路径
        const imageIndex = textItem.dataset.index;
        const imageName = textItem.querySelector('.item-title').textContent;
        
        if (!imageIndex || !imageName) {
            console.error('无法获取图片索引或名称');
            return;
        }
        
        console.log(`准备编辑图片[${imageIndex}] ${imageName} 的${textType === 'cn' ? '中文' : '英文'}文本`);
        
        // 获取文件路径
        this.getFilePath(imageName, textType).then(filePath => {
            if (filePath) {
                this.currentFilePath = filePath;
                
                // 加载文件内容到编辑区域
                this.loadFileContent(filePath);
                
                // 添加高亮样式到当前编辑的文本框
                textareaElement.classList.add('editing');
                textareaElement.closest('.text-box').classList.add('editing');
                
                // 滚动编辑区域到视图
                this.editArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // 聚焦编辑区域
                this.editArea.focus();
            } else {
                console.error(`未找到 ${imageName} 的 ${textType === 'cn' ? '中文' : '英文'} 文本文件`);
                this.setEditAreaPlaceholder(`未找到对应的${textType === 'cn' ? '中文' : '英文'}文本文件`);
                this.currentTextarea = null;
                this.currentFilePath = null;
            }
        });
    },
    
    // 获取文件路径
    getFilePath: function(imageName, textType) {
        return new Promise((resolve, reject) => {
            const appState = window.AppState;
            if (!appState) {
                console.error('未找到AppState');
                resolve(null);
                return;
            }
            
            // 移除扩展名，获取文件基本名
            const baseName = imageName.split('.').slice(0, -1).join('.');
            
            // 根据类型选择对应的文件列表
            const filesList = textType === 'cn' ? appState.cnFiles : appState.enFiles;
            
            // 查找匹配的文件
            const matchingFile = filesList.find(file => {
                const fileBaseName = file.name.split('.').slice(0, -1).join('.');
                return fileBaseName === baseName;
            });
            
            if (matchingFile) {
                console.log(`找到匹配的文件: ${matchingFile.path}`);
                resolve(matchingFile.path);
            } else {
                console.log(`未找到匹配的文件，将尝试创建`);
                this.createTextFile(imageName, textType).then(filePath => {
                    resolve(filePath);
                }).catch(() => {
                    resolve(null);
                });
            }
        });
    },
    
    // 创建文本文件
    createTextFile: function(imageName, textType) {
        return new Promise((resolve, reject) => {
            const appState = window.AppState;
            if (!appState) {
                reject(new Error('未找到AppState'));
                return;
            }
            
            // 获取配置中的路径
            let filePath = '';
            
            // 从SettingsManager获取路径
            if (window.SettingsManager && window.SettingsManager.cnFilePathInput && window.SettingsManager.enFilePathInput) {
                if (textType === 'cn') {
                    filePath = window.SettingsManager.cnFilePathInput.value.trim();
                } else if (textType === 'en') {
                    filePath = window.SettingsManager.enFilePathInput.value.trim();
                }
            }
            
            if (!filePath) {
                reject(new Error(`未设置${textType === 'cn' ? '中文' : '英文'}文件路径`));
                return;
            }
            
            // 构建请求数据
            const data = {
                image_name: imageName,
                cn_path: textType === 'cn' ? filePath : '',
                en_path: textType === 'en' ? filePath : ''
            };
            
            // 发送创建文件请求
            fetch('/create-text-file', {
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
                if (result.success) {
                    // 查找创建的文件路径
                    const createdFile = result.created_files.find(file => file.type === textType);
                    if (createdFile) {
                        console.log(`成功创建文件: ${createdFile.path}`);
                        
                        // 添加文件到appState的文件列表
                        const fileInfo = {
                            name: createdFile.name || imageName.replace(/\.[^.]+$/, '') + (textType === 'cn' ? '.txt' : '.txt'),
                            path: createdFile.path,
                            is_file: true
                        };
                        
                        if (textType === 'cn') {
                            appState.cnFiles.push(fileInfo);
                        } else {
                            appState.enFiles.push(fileInfo);
                        }
                        
                        // 刷新目录信息
                        if (window.SettingsManager && typeof window.SettingsManager.loadSettingsFromServer === 'function') {
                            window.SettingsManager.loadSettingsFromServer();
                        }
                        
                        resolve(createdFile.path);
                    } else {
                        reject(new Error('未找到创建的文件信息'));
                    }
                } else {
                    reject(new Error(result.message || '创建文件失败'));
                }
            })
            .catch(error => {
                console.error('创建文件出错:', error);
                reject(error);
            });
        });
    },
    
    // 加载文件内容
    loadFileContent: function(filePath) {
        fetch(`/read-text-file?path=${encodeURIComponent(filePath)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('加载文本文件失败: ' + response.status);
                }
                return response.text();
            })
            .then(text => {
                // 设置编辑区域内容
                this.editArea.value = text;
                
                // 标记编辑区域已有内容
                this.editArea.classList.remove('empty');
                
                console.log('已加载文件内容到编辑区域');
            })
            .catch(error => {
                console.error('加载文本内容出错:', error);
                this.setEditAreaPlaceholder('加载文件内容失败');
                // 标记编辑区域为空
                this.editArea.classList.add('empty');
            });
    },
    
    // 保存编辑后的文本
    saveEditedText: function() {
        // 检查是否有当前编辑的文本框和文件路径
        if (!this.currentTextarea || !this.currentFilePath) {
            console.warn('没有选择要编辑的文本');
            LogManager.addLog('warning', '请先点击要编辑的文本');
            return;
        }
        
        // 获取编辑区域的内容
        const content = this.editArea.value;
        
        // 发送保存请求
        fetch('/save-text-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file_path: this.currentFilePath,
                content: content
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('保存文件失败: ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                console.log('文件保存成功');
                LogManager.addLog('success', '文本保存成功');
                
                // 更新文本框内容
                if (this.currentTextarea) {
                    this.currentTextarea.value = content;
                    // 更新文本颜色（确保不是灰色）
                    this.currentTextarea.style.color = '#fff';
                }
            } else {
                throw new Error(result.message || '保存失败');
            }
        })
        .catch(error => {
            console.error('保存文件出错:', error);
            LogManager.addLog('error', '保存文件出错: ' + error.message);
        });
    },
    
    // 清空编辑区域
    clearEditArea: function() {
        this.editArea.value = '';
        this.editArea.focus();
    },
    
    // 设置编辑区域占位符
    setEditAreaPlaceholder: function(message) {
        this.editArea.value = '';
        this.editArea.placeholder = message;
    }
};

// 导出模块
window.TextEditor = TextEditor;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    TextEditor.init();
}); 