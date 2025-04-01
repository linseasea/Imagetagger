// 日志管理模块
const LogManager = {
    logContainer: null,
    maxLogs: 50, // 最大日志数量
    
    init: function() {
        // 获取DOM元素
        this.logContainer = document.querySelector('.log-container');
        
        // 添加日志按钮事件
        this.addLogButtonEvents();
        
        // 为现有日志添加显示类
        this.showExistingLogs();
        
        // 在初始化完成后添加一条日志
        this.addLog('info', '日志系统初始化完成');
    },
    
    // 显示现有日志
    showExistingLogs: function() {
        if (!this.logContainer) return;
        
        // 确保所有现有日志都是可见的
        const existingLogs = this.logContainer.querySelectorAll('.log-entry');
        existingLogs.forEach(log => {
            // 移除可能导致隐藏的类，确保日志可见
            log.classList.remove('animate');
            log.classList.add('show');
        });
        
        // 记录找到的日志数量
        console.log(`找到 ${existingLogs.length} 条已有日志`);
    },
    
    // 添加日志按钮事件
    addLogButtonEvents: function() {
        // 清空日志按钮
        const clearBtn = document.querySelector('.log-button:nth-child(3)');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearLogs();
            });
        }
        
        // 刷新日志按钮
        const refreshBtn = document.querySelector('.log-button:nth-child(1)');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.addLog('info', '刷新日志');
            });
        }
        
        // 导出日志按钮
        const exportBtn = document.querySelector('.log-button:nth-child(2)');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportLogs();
            });
        }
    },
    
    // 添加日志
    addLog: function(level, message) {
        if (!this.logContainer) {
            this.logContainer = document.querySelector('.log-container');
            if (!this.logContainer) return;
        }
        
        // 创建日志元素
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry animate'; // 添加动画类
        
        // 获取当前时间
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        
        // 添加日志内容
        logEntry.innerHTML = `
            <span class="log-time">[${timeStr}]</span>
            <span class="log-level ${level}">${this.getLevelText(level)}</span>
            <span class="log-message">${message}</span>
        `;
        
        // 添加到日志容器的底部（最新的日志在下方）
        this.logContainer.appendChild(logEntry);
        
        // 限制日志数量
        this.limitLogs();
        
        // 添加显示动画
        setTimeout(() => {
            logEntry.classList.add('show');
            // 自动滚动到最新的日志
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }, 10);
        
        return logEntry; // 返回创建的日志元素，方便进一步操作
    },
    
    // 清空日志
    clearLogs: function() {
        if (!this.logContainer) return;
        
        // 清空日志
        this.logContainer.innerHTML = '';
        
        // 添加清空日志的记录
        this.addLog('info', '日志已清空');
    },
    
    // 导出日志
    exportLogs: function() {
        if (!this.logContainer) return;
        
        // 获取所有日志
        const logEntries = document.querySelectorAll('.log-entry');
        if (logEntries.length === 0) {
            this.addLog('warning', '没有可导出的日志');
            return;
        }
        
        // 格式化日志文本
        let logText = '=== ImageTagger 日志 ===\n';
        logText += `导出时间: ${new Date().toLocaleString()}\n\n`;
        
        logEntries.forEach(entry => {
            const time = entry.querySelector('.log-time').textContent;
            const level = entry.querySelector('.log-level').textContent;
            const message = entry.querySelector('.log-message').textContent;
            
            logText += `${time} [${level}] ${message}\n`;
        });
        
        // 创建下载链接
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imagetagger_log_${new Date().toISOString().replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        // 记录日志
        this.addLog('success', '日志导出成功');
    },
    
    // 限制日志数量
    limitLogs: function() {
        if (!this.logContainer) return;
        
        const logEntries = this.logContainer.querySelectorAll('.log-entry');
        if (logEntries.length > this.maxLogs) {
            // 移除最旧的日志
            for (let i = 0; i < logEntries.length - this.maxLogs; i++) {
                this.logContainer.removeChild(logEntries[i]);
            }
        }
    },
    
    // 获取日志级别文本
    getLevelText: function(level) {
        switch (level) {
            case 'info': return '信息';
            case 'success': return '成功';
            case 'warning': return '警告';
            case 'error': return '错误';
            default: return '信息';
        }
    }
}; 

// 导出模块
window.LogManager = LogManager; 