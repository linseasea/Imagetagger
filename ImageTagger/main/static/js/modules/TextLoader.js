// TextLoader.js - 负责文本加载和文本操作相关功能

const TextLoader = {
    // 初始化方法
    init: function() {
        console.log('初始化文本加载器');
        
        // 绑定事件监听器
        this.bindEventListeners();
    },
    
    // 绑定事件监听器
    bindEventListeners: function() {
        // 绑定创建文本按钮事件
        const createTextBtn = document.getElementById('createTextBtn');
        if (createTextBtn) {
            createTextBtn.addEventListener('click', () => {
                console.log('点击创建文本按钮');
                this.createTextFiles();
            });
        } else {
            console.warn('未找到创建文本按钮(#createTextBtn)');
        }
        
        // 绑定一键添加咒语按钮事件
        const addPrefixBtn = document.getElementById('addPrefixBtn');
        if (addPrefixBtn) {
            addPrefixBtn.addEventListener('click', () => {
                console.log('点击一键添加咒语按钮');
                this.addPrefixToAllEnglishTexts();
            });
        } else {
            console.warn('未找到一键添加咒语按钮(#addPrefixBtn)');
        }
    },
    
    // 创建文本容器
    createTextContainers: function(count) {
        // 获取文本容器的父元素
        const textContainer = document.getElementById('textContainer');
        if (!textContainer) {
            console.warn('未找到文本容器父元素(#textContainer)');
            return;
        }
        
        const appState = window.AppState;
        if (!appState) return;
        
        // 清空现有容器内容，避免重复
        textContainer.innerHTML = '';
        
        // 计算当前页面的起始索引
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        
        console.log(`创建${count}个文本项，起始索引: ${startIndex}`);
        
        // 创建需要的文本项
        for (let i = 0; i < count; i++) {
            const globalIndex = startIndex + i;
            const newTextItem = document.createElement('div');
            newTextItem.className = 'text-item';
            newTextItem.dataset.id = `img${i + 1}`;
            newTextItem.dataset.index = globalIndex;
            
            // 创建标题行
            const header = document.createElement('div');
            header.className = 'item-header';
            
            const itemNumber = document.createElement('span');
            itemNumber.className = 'item-number';
            itemNumber.textContent = globalIndex + 1; // 从1开始编号
            
            const itemTitle = document.createElement('span');
            itemTitle.className = 'item-title';
            
            // 设置标题文本
            if (appState.imageFiles && appState.imageFiles[globalIndex]) {
                itemTitle.textContent = appState.imageFiles[globalIndex].name;
            } else {
                itemTitle.textContent = `图片${globalIndex + 1}`;
            }
            
            header.appendChild(itemNumber);
            header.appendChild(itemTitle);
            newTextItem.appendChild(header);
            
            // 创建文本内容区域
            const textContent = document.createElement('div');
            textContent.className = 'text-content';
            
            // 中文文本框
            const cnTextBox = document.createElement('div');
            cnTextBox.className = 'text-box chinese';
            
            const cnTitle = document.createElement('h3');
            cnTitle.textContent = '中文';
            
            const cnTextarea = document.createElement('textarea');
            cnTextarea.setAttribute('readonly', 'readonly');
            
            cnTextBox.appendChild(cnTitle);
            cnTextBox.appendChild(cnTextarea);
            
            // 英文文本框
            const enTextBox = document.createElement('div');
            enTextBox.className = 'text-box english';
            
            const enTitle = document.createElement('h3');
            enTitle.textContent = '英文';
            
            const enTextarea = document.createElement('textarea');
            enTextarea.setAttribute('readonly', 'readonly');
            
            enTextBox.appendChild(enTitle);
            enTextBox.appendChild(enTextarea);
            
            // 添加文本框到内容区域
            textContent.appendChild(cnTextBox);
            textContent.appendChild(enTextBox);
            
            // 添加内容区域到文本项
            newTextItem.appendChild(textContent);
            
            // 设置选中状态
            if (appState.selectedImages.has(globalIndex)) {
                newTextItem.classList.add('selected');
            }
            
            // 添加文本项到容器
            textContainer.appendChild(newTextItem);
        }
        
        console.log(`已创建${count}个文本项`);
    },
    
    // 加载对应当前图片的文本内容
    loadTextContent: function(startIndex) {
        console.log(`加载从索引${startIndex}开始的文本内容`);
        
        // 加载中文文本
        this.loadChineseTexts();
        
        // 加载英文文本
        this.loadEnglishTexts();
    },
    
    // 加载中文文本到对应文本框
    loadChineseTexts: function() {
        const appState = window.AppState;
        if (!appState) return;
        
        // 计算当前页要显示的文件索引范围
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        const endIndex = Math.min(startIndex + appState.imagesPerPage, appState.imageFiles.length);
        
        // 获取当前页的图片文件
        const currentPageImages = appState.imageFiles.slice(startIndex, endIndex);
        
        // 查找所有中文文本区域
        const textItems = document.querySelectorAll('.text-item');
        if (!textItems || textItems.length === 0) {
            console.warn('未找到文本项元素');
            return;
        }
        
        console.log(`开始加载第${appState.currentPage}页中文文本`);
        
        // 遍历当前页的图片，并设置对应的中文文本
        for (let i = 0; i < currentPageImages.length; i++) {
            if (i >= textItems.length) break;
            
            const textItem = textItems[i];
            const cnTextarea = textItem.querySelector('.chinese textarea');
            if (!cnTextarea) continue;
            
            // 设置默认提示文本
            cnTextarea.removeAttribute('readonly');
            cnTextarea.value = "文本文件暂未创建";
            cnTextarea.setAttribute('readonly', 'readonly');
            cnTextarea.style.color = '#888';
            
            // 检查是否有对应的中文文件
            const globalIndex = startIndex + i;
            const imageFileName = appState.imageFiles[globalIndex].name;
            console.log(`查找图片 [${globalIndex + 1}] ${imageFileName} 对应的中文文件...`);
            
            const matchingCnFiles = appState.cnFiles.filter(file => {
                // 提取文件名（不含扩展名）用于匹配
                const cnBaseName = file.name.split('.').slice(0, -1).join('.');
                const imgBaseName = imageFileName.split('.').slice(0, -1).join('.');
                const isMatch = cnBaseName === imgBaseName;
                if (isMatch) {
                    console.log(`找到匹配的中文文件: ${file.name}`);
                }
                return isMatch;
            });
            
            if (matchingCnFiles.length > 0) {
                // 加载文件内容并设置到文本区域
                this.loadTextFile(matchingCnFiles[0].path, (text) => {
                    cnTextarea.removeAttribute('readonly');
                    cnTextarea.value = text || "文件内容为空";
                    cnTextarea.setAttribute('readonly', 'readonly');
                    cnTextarea.style.color = '#fff'; // 恢复正常文本颜色
                    console.log(`已加载中文文本: ${matchingCnFiles[0].name}`);
                });
            } else {
                console.log(`图片 ${appState.imageFiles[globalIndex].name} 没有对应的中文文件`);
            }
        }
    },
    
    // 加载英文文本到对应文本框
    loadEnglishTexts: function() {
        const appState = window.AppState;
        if (!appState) return;
        
        // 计算当前页要显示的文件索引范围
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        const endIndex = Math.min(startIndex + appState.imagesPerPage, appState.imageFiles.length);
        
        // 获取当前页的图片文件
        const currentPageImages = appState.imageFiles.slice(startIndex, endIndex);
        
        // 查找所有文本项
        const textItems = document.querySelectorAll('.text-item');
        if (!textItems || textItems.length === 0) {
            console.warn('未找到文本项元素');
            return;
        }
        
        console.log(`开始加载第${appState.currentPage}页英文文本`);
        
        // 遍历当前页的图片，并设置对应的英文文本
        for (let i = 0; i < currentPageImages.length; i++) {
            if (i >= textItems.length) break;
            
            const textItem = textItems[i];
            const enTextarea = textItem.querySelector('.english textarea');
            if (!enTextarea) continue;
            
            // 设置默认提示文本
            enTextarea.removeAttribute('readonly');
            enTextarea.value = "文本文件暂未创建";
            enTextarea.setAttribute('readonly', 'readonly');
            enTextarea.style.color = '#888';
            
            // 检查是否有对应的英文文件
            const globalIndex = startIndex + i;
            const imageFileName = appState.imageFiles[globalIndex].name;
            console.log(`查找图片 [${globalIndex + 1}] ${imageFileName} 对应的英文文件...`);
            
            const matchingEnFiles = appState.enFiles.filter(file => {
                // 提取文件名（不含扩展名）用于匹配
                const enBaseName = file.name.split('.').slice(0, -1).join('.');
                const imgBaseName = imageFileName.split('.').slice(0, -1).join('.');
                const isMatch = enBaseName === imgBaseName;
                if (isMatch) {
                    console.log(`找到匹配的英文文件: ${file.name}`);
                }
                return isMatch;
            });
            
            if (matchingEnFiles.length > 0) {
                // 加载文件内容并设置到文本区域
                this.loadTextFile(matchingEnFiles[0].path, (text) => {
                    enTextarea.removeAttribute('readonly');
                    enTextarea.value = text || "文件内容为空";
                    enTextarea.setAttribute('readonly', 'readonly');
                    enTextarea.style.color = '#fff'; // 恢复正常文本颜色
                    console.log(`已加载英文文本: ${matchingEnFiles[0].name}`);
                });
            } else {
                console.log(`图片 ${appState.imageFiles[globalIndex].name} 没有对应的英文文件`);
            }
        }
    },
    
    // 通用方法：加载文本文件内容
    loadTextFile: function(filePath, callback) {
        fetch(`/read-text-file?path=${encodeURIComponent(filePath)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('加载文本文件失败: ' + response.status);
                }
                return response.text();
            })
            .then(text => {
                if (callback && typeof callback === 'function') {
                    callback(text);
                }
            })
            .catch(error => {
                console.error('加载文本文件出错:', error);
                LogManager.addLog('error', '加载文本文件出错: ' + error.message);
            });
    },
    
    // 创建文本文件
    createTextFiles: function() {
        console.log('执行创建文本文件功能');
        
        const appState = window.AppState;
        if (!appState) return;
        
        // 检查是否有当前显示的图片
        if (!appState.imageFiles || appState.imageFiles.length === 0) {
            LogManager.addLog('warning', '没有图片可用，无法创建对应的文本文件');
            return;
        }
        
        // 获取选中或勾选的图片
        let targetImageIndexes = new Set();
        
        // 优先使用勾选的图片
        if (appState.checkedImages.size > 0) {
            targetImageIndexes = new Set(appState.checkedImages);
            console.log(`使用勾选的图片：共${appState.checkedImages.size}张`);
        } 
        // 如果没有勾选的，使用选中的图片
        else if (appState.selectedImages.size > 0) {
            targetImageIndexes = new Set(appState.selectedImages);
            console.log(`使用选中的图片：共${appState.selectedImages.size}张`);
        } 
        // 如果都没有，提示用户先选择或勾选图片
        else {
            LogManager.addLog('warning', '未选择或勾选任何图片，请先选择或勾选需要创建文本的图片');
            return;
        }
        
        console.log(`将为${targetImageIndexes.size}张选中/勾选的图片创建文本文件`);
        
        // 获取配置中的路径
        let cnPath = '';
        let enPath = '';
        
        // 从SettingsManager获取路径
        if (SettingsManager && SettingsManager.cnFilePathInput && SettingsManager.enFilePathInput) {
            cnPath = SettingsManager.cnFilePathInput.value.trim();
            enPath = SettingsManager.enFilePathInput.value.trim();
        }
        
        if (!cnPath && !enPath) {
            LogManager.addLog('error', '未设置中文或英文文件路径，请先在设置中配置路径');
            return;
        }
        
        // 创建选中/勾选图片对应的文本文件
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let createdFiles = []; // 存储新创建的文件信息，用于后续加载
        
        // 将Set转为数组，方便遍历
        const targetIndices = Array.from(targetImageIndexes);
        
        // 显示进度信息
        LogManager.addLog('info', `开始创建${targetIndices.length}个文本文件...`);
        
        const createPromises = targetIndices.map(index => {
            if (index < 0 || index >= appState.imageFiles.length) {
                return Promise.resolve(); // 跳过无效索引
            }
            
            const imageFile = appState.imageFiles[index];
            console.log(`准备为图片 [${index + 1}] ${imageFile.name} 创建文本文件`);
            
            return new Promise((resolve) => {
                fetch('/create-text-file', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image_name: imageFile.name,
                        cn_path: cnPath,
                        en_path: enPath
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('服务器响应错误: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`图片 [${index + 1}] ${imageFile.name} 创建文本文件结果:`, data);
                    
                    if (data.success) {
                        // 统计创建结果
                        data.created_files.forEach(file => {
                            if (file.note === '文件已存在') {
                                skippedCount++;
                                // 已存在的文件也添加到创建列表，以便更新显示
                                createdFiles.push({
                                    type: file.type,
                                    path: file.path,
                                    imageIndex: index,
                                    name: file.name || imageFile.name.replace(/\.[^.]+$/, '') + (file.type === 'cn' ? '.cn.txt' : '.en.txt'),
                                    exists: true
                                });
                            } else {
                                successCount++;
                                // 保存创建的文件信息，用于后续加载
                                createdFiles.push({
                                    type: file.type,
                                    path: file.path,
                                    imageIndex: index,
                                    name: file.name || imageFile.name.replace(/\.[^.]+$/, '') + (file.type === 'cn' ? '.cn.txt' : '.en.txt')
                                });
                            }
                        });
                    } else {
                        errorCount++;
                        LogManager.addLog('error', `创建文本文件失败: ${data.message || '未知错误'}`);
                    }
                    
                    resolve();
                })
                .catch(error => {
                    console.error(`图片 ${index + 1} 创建文本文件出错:`, error);
                    errorCount++;
                    LogManager.addLog('error', `创建文本文件出错: ${error.message}`);
                    resolve(); // 即使出错也要继续处理其他文件
                });
            });
        });
        
        // 等待所有文件处理完成
        Promise.all(createPromises).then(() => {
            // 显示处理结果
            if (successCount > 0) {
                LogManager.addLog('success', `成功创建了 ${successCount} 个文本文件`);
            }
            
            if (skippedCount > 0) {
                LogManager.addLog('info', `跳过了 ${skippedCount} 个已存在的文本文件`);
            }
            
            if (errorCount > 0) {
                LogManager.addLog('warning', `有 ${errorCount} 个文本文件创建失败`);
            }
            
            // 如果创建了文件或跳过了文件，重新加载目录信息
            if (successCount > 0 || skippedCount > 0) {
                // 直接先更新应用状态中的文件列表，然后再发起服务器请求
                this.updateFilesWithCreated(createdFiles, appState);
                
                // 缓存创建的文件信息，便于页面切换时使用
                appState.lastCreatedFiles = createdFiles;
                
                // 重新加载目录信息
                if (SettingsManager && typeof SettingsManager.loadSettingsFromServer === 'function') {
                    LogManager.addLog('info', '重新加载目录信息...');
                    
                    // 创建一个不会触发打开模态窗口的函数
                    const loadDirectoriesOnly = function() {
                        // 复制SettingsManager.loadSettingsFromServer的功能，但不打开模态窗口
                        return fetch('/get-directories')
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('服务器响应错误: ' + response.status);
                                }
                                return response.json();
                            })
                            .then(data => {
                                // 更新文件列表和计数
                                if (SettingsManager.handleDirectoriesInfo) {
                                    SettingsManager.handleDirectoriesInfo(data);
                                }
                                return data;
                            });
                    };
                    
                    // 使用这个函数代替SettingsManager.loadSettingsFromServer
                    let loadPromise = loadDirectoriesOnly();
                    
                    // 如果loadPromise不是Promise，创建一个已解决的Promise
                    if (!(loadPromise instanceof Promise)) {
                        loadPromise = Promise.resolve();
                        console.warn('loadDirectoriesOnly没有返回Promise，使用默认Promise');
                    }
                    
                    loadPromise.then(() => {
                        console.log('目录信息已重新加载，准备刷新UI...');
                        
                        // 延迟执行以确保DOM和状态已更新
                        setTimeout(() => {
                            // 强制刷新UI
                            if (appState.refreshUI) {
                                appState.refreshUI();
                            }
                            
                            // 再次强制刷新文本内容
                            setTimeout(() => {
                                console.log('强制重新加载文本内容...');
                                // 先尝试直接加载新创建的文件，以确保即使SettingsManager没有正确更新文件列表，也能显示内容
                                this.loadNewlyCreatedTextFiles(createdFiles);
                                
                                // 然后再尝试通过正常渠道加载所有文本
                                this.loadChineseTexts();
                                this.loadEnglishTexts();
                            }, 300);
                        }, 200);
                    });
                } else {
                    // 如果无法重新加载目录信息，至少尝试直接加载新创建的文件
                    console.log('无法通过SettingsManager重新加载目录信息，直接加载新创建的文件');
                    this.updateFilesWithCreated(createdFiles, appState);
                    this.loadNewlyCreatedTextFiles(createdFiles);
                    
                    // 强制刷新UI
                    setTimeout(() => {
                        if (appState.refreshUI) {
                            appState.refreshUI();
                        }
                    }, 100);
                }
            }
        });
    },
    
    // 使用新创建的文件更新文件列表
    updateFilesWithCreated: function(createdFiles, appState) {
        if (!createdFiles || createdFiles.length === 0 || !appState) {
            return;
        }
        
        console.log('使用新创建的文件更新内部文件列表:', createdFiles);
        
        // 按类型分组并添加到对应的文件列表中
        createdFiles.forEach(file => {
            if (file.type === 'cn') {
                // 检查文件是否已存在于cnFiles列表中
                const exists = appState.cnFiles.some(existing => existing.path === file.path);
                if (!exists) {
                    appState.cnFiles.push({
                        name: file.name,
                        path: file.path,
                        is_file: true
                    });
                    appState.cnCount = appState.cnFiles.length;
                    console.log(`添加中文文件到列表: ${file.name}, 当前中文文件总数: ${appState.cnCount}`);
                }
            } else if (file.type === 'en') {
                // 检查文件是否已存在于enFiles列表中
                const exists = appState.enFiles.some(existing => existing.path === file.path);
                if (!exists) {
                    appState.enFiles.push({
                        name: file.name,
                        path: file.path,
                        is_file: true
                    });
                    appState.enCount = appState.enFiles.length;
                    console.log(`添加英文文件到列表: ${file.name}, 当前英文文件总数: ${appState.enCount}`);
                }
            }
        });
    },
    
    // 加载新创建的文本文件
    loadNewlyCreatedTextFiles: function(createdFiles) {
        const appState = window.AppState;
        if (!appState || !createdFiles || createdFiles.length === 0) {
            return;
        }
        
        console.log('加载新创建的文本文件:', createdFiles);
        
        // 当前页面范围
        const startIndex = (appState.currentPage - 1) * appState.imagesPerPage;
        const endIndex = Math.min(startIndex + appState.imagesPerPage, appState.imageFiles.length);
        
        console.log(`当前页面索引范围: ${startIndex} - ${endIndex-1}`);
        
        // 查找文本区域
        const textItems = document.querySelectorAll('.text-item');
        if (!textItems || textItems.length === 0) {
            console.warn('未找到文本项元素，无法加载文本文件');
            return;
        }
        
        // 按类型分组
        const cnFiles = createdFiles.filter(file => file.type === 'cn');
        const enFiles = createdFiles.filter(file => file.type === 'en');
        
        console.log(`需要加载的中文文件: ${cnFiles.length}个，英文文件: ${enFiles.length}个`);
        
        // 加载中文文件
        cnFiles.forEach(file => {
            const imageIndex = file.imageIndex;
            // 只处理当前页面范围内的图片
            if (imageIndex >= startIndex && imageIndex < endIndex) {
                const itemIndex = imageIndex - startIndex;
                console.log(`加载中文文件: 图片索引=${imageIndex}, 文本项索引=${itemIndex}`);
                
                if (itemIndex >= 0 && itemIndex < textItems.length) {
                    const textItem = textItems[itemIndex];
                    const cnTextarea = textItem.querySelector('.chinese textarea');
                    if (cnTextarea) {
                        this.loadTextFile(file.path, text => {
                            cnTextarea.removeAttribute('readonly');
                            cnTextarea.value = text || "文件内容为空";
                            cnTextarea.setAttribute('readonly', 'readonly');
                            cnTextarea.style.color = '#fff'; // 恢复正常文本颜色
                            console.log(`为图片 [${imageIndex + 1}] 加载了中文文本: ${file.name}`);
                        });
                    } else {
                        console.warn(`未找到图片 ${imageIndex + 1} 对应的中文文本区域`);
                    }
                }
            }
        });
        
        // 加载英文文件
        enFiles.forEach(file => {
            const imageIndex = file.imageIndex;
            // 只处理当前页面范围内的图片
            if (imageIndex >= startIndex && imageIndex < endIndex) {
                const itemIndex = imageIndex - startIndex;
                console.log(`加载英文文件: 图片索引=${imageIndex}, 文本项索引=${itemIndex}`);
                
                if (itemIndex >= 0 && itemIndex < textItems.length) {
                    const textItem = textItems[itemIndex];
                    const enTextarea = textItem.querySelector('.english textarea');
                    if (enTextarea) {
                        this.loadTextFile(file.path, text => {
                            enTextarea.removeAttribute('readonly');
                            enTextarea.value = text || "文件内容为空";
                            enTextarea.setAttribute('readonly', 'readonly');
                            enTextarea.style.color = '#fff'; // 恢复正常文本颜色
                            console.log(`为图片 [${imageIndex + 1}] 加载了英文文本: ${file.name}`);
                        });
                    } else {
                        console.warn(`未找到图片 ${imageIndex + 1} 对应的英文文本区域`);
                    }
                }
            }
        });
    },
    
    // 添加前缀到所有英文文本
    addPrefixToAllEnglishTexts: function() {
        // 弹出输入框，让用户输入咒语文本
        const prefix = prompt('请输入要添加的咒语文本:');
        
        // 检查用户是否输入了内容并确认
        if (prefix === null || prefix.trim() === '') {
            console.log('用户取消了操作或未输入咒语');
            return;
        }
        
        const trimmedPrefix = prefix.trim();
        console.log(`用户输入的咒语: "${trimmedPrefix}"`);
        
        const appState = window.AppState;
        if (!appState) return;
        
        // 对当前页面的所有英文文本框应用修改
        this.updateEnglishTextAreasWithPrefix(trimmedPrefix);
        
        // 对所有英文文本文件应用修改
        this.updateAllEnglishFilesWithPrefix(trimmedPrefix);
    },
    
    // 更新当前页面的所有英文文本框
    updateEnglishTextAreasWithPrefix: function(prefix) {
        // 查找所有英文文本区域
        const enTextareas = document.querySelectorAll('.english textarea');
        if (!enTextareas || enTextareas.length === 0) {
            console.warn('未找到英文文本区域');
            return;
        }
        
        let updatedCount = 0;
        
        // 遍历每个文本框并修改内容
        enTextareas.forEach(textarea => {
            // 跳过空文本或未创建的文件
            if (!textarea.value || textarea.value === "文本文件暂未创建" || textarea.value === "文件内容为空") {
                return;
            }
            
            // 修改文本内容：添加咒语前缀
            textarea.removeAttribute('readonly');
            // 如果文本已经以prefix开头，不重复添加
            if (!textarea.value.startsWith(prefix)) {
                textarea.value = `${prefix}, ${textarea.value}`;
                updatedCount++;
            }
            textarea.setAttribute('readonly', 'readonly');
        });
        
        console.log(`已更新${updatedCount}个英文文本框，添加了咒语: "${prefix}"`);
        LogManager.addLog('success', `已更新${updatedCount}个英文文本框，添加了咒语`);
    },
    
    // 更新所有英文文本文件
    updateAllEnglishFilesWithPrefix: function(prefix) {
        const appState = window.AppState;
        if (!appState || !appState.enFiles || appState.enFiles.length === 0) {
            console.warn('没有英文文件可更新');
            return;
        }
        
        console.log(`准备更新${appState.enFiles.length}个英文文件，添加咒语: "${prefix}"`);
        LogManager.addLog('info', `正在更新${appState.enFiles.length}个英文文件...`);
        
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        // 处理每个英文文件
        const updatePromises = appState.enFiles.map(file => {
            return new Promise((resolve) => {
                // 先读取文件内容
                this.loadTextFile(file.path, (currentText) => {
                    // 跳过空文件
                    if (!currentText || currentText.trim() === '') {
                        skippedCount++;
                        resolve();
                        return;
                    }
                    
                    // 如果文本已经以prefix开头，不重复添加
                    if (currentText.startsWith(prefix)) {
                        skippedCount++;
                        resolve();
                        return;
                    }
                    
                    // 添加咒语前缀
                    const newText = `${prefix}, ${currentText}`;
                    
                    // 保存更新后的文件
                    fetch('/save-text-file', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            file_path: file.path,
                            content: newText
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('服务器响应错误: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            successCount++;
                            console.log(`成功更新文件: ${file.name}`);
                        } else {
                            errorCount++;
                            console.error(`更新文件失败: ${file.name}, 错误: ${data.message}`);
                        }
                        resolve();
                    })
                    .catch(error => {
                        errorCount++;
                        console.error(`更新文件出错: ${file.name}, 错误: ${error.message}`);
                        resolve();
                    });
                });
            });
        });
        
        // 等待所有文件更新完成
        Promise.all(updatePromises).then(() => {
            // 显示处理结果
            if (successCount > 0) {
                LogManager.addLog('success', `成功更新了 ${successCount} 个英文文件，添加了咒语`);
            }
            
            if (skippedCount > 0) {
                LogManager.addLog('info', `跳过了 ${skippedCount} 个已包含咒语或空的文件`);
            }
            
            if (errorCount > 0) {
                LogManager.addLog('warning', `有 ${errorCount} 个文件更新失败`);
            }
            
            // 重新加载当前页面的文本内容
            setTimeout(() => {
                this.loadEnglishTexts();
            }, 500);
        });
    }
};

// 导出模块
window.TextLoader = TextLoader; 