// 交易助手主逻辑
class TradingAssistant {
    constructor() {
        this.currentExchange = 'variational';
        this.isProcessing = false;
        this.isAutoTrading = false;
        this.isBatchOpening = false;
        this.tradeInterval = null;
        this.batchInterval = null;
        this.tradeCount = 0;
        this.batchCompleted = 0;
        this.batchTotal = 0;
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.updateTradeInfo();
    }

    // 加载设置
    loadSettings() {
        chrome.storage.local.get([
            'tradeCount'
        ], (result) => {
            if (result.tradeCount !== undefined) {
                this.tradeCount = result.tradeCount;
                this.updateTradeInfo();
            }
        });
    }

    // 保存设置
    saveSettings() {
        const settings = {
            tradeCount: this.tradeCount
        };
        chrome.storage.local.set(settings);
    }

    // 绑定事件
    bindEvents() {
        // 自动交易切换
        document.getElementById('autoTradeToggle').addEventListener('click', () => {
            this.toggleAutoTrade();
        });

        // 批量开单切换
        document.getElementById('batchOpenToggle').addEventListener('click', () => {
            this.toggleBatchOpen();
        });
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 在实际实现中，这里可以添加toast通知
        console.log(`${type}: ${message}`);
    }

    // 播放声音
    playSound(type) {
        const audio = new Audio();
        audio.volume = 0.3;
        
        if (type === 'success') {
            // 成功声音
            audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        } else {
            // 错误声音
            audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        }
        
        audio.play().catch(() => {
            // 忽略音频播放错误
        });
    }

    // 切换自动交易
    toggleAutoTrade() {
        if (this.isAutoTrading) {
            this.stopAutoTrade();
        } else {
            this.startAutoTrade();
        }
    }

    // 开始自动交易
    async startAutoTrade() {
        const amount = document.getElementById('autoTradeAmount').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            this.showMessage('请输入有效的开仓金额', 'error');
            return;
        }

        // 检查content script是否加载
        try {
            await this.checkContentScript();
        } catch (error) {
            this.showMessage(`无法启动自动交易: ${error.message}`, 'error');
            return;
        }

        this.isAutoTrading = true;
        this.updateAutoTradeButton();
        this.updateTradeStatus('自动交易运行中...');
        
        // 开始交易循环
        this.executeAutoTradeCycle();
        
        this.showMessage('自动交易已开始', 'success');
    }

    // 检查content script状态
    async checkContentScript() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('未找到活动标签页');
        }

        if (!tab.url.includes('variational.io')) {
            throw new Error('请确保在Variational Omni交易页面 (omni.variational.io)');
        }

        try {
            // 发送ping消息检查content script是否响应
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'ping'
            });
            
            if (!response || !response.success) {
                throw new Error('交易助手未正确加载，请刷新页面');
            }
            
            return true;
        } catch (error) {
            if (error.message.includes('Could not establish connection') || 
                error.message.includes('Receiving end does not exist')) {
                throw new Error('交易助手未加载。请刷新Variational Omni页面后重试。');
            }
            throw error;
        }
    }

    // 停止自动交易
    stopAutoTrade() {
        this.isAutoTrading = false;
        if (this.tradeInterval) {
            clearTimeout(this.tradeInterval);
            this.tradeInterval = null;
        }
        this.updateAutoTradeButton();
        this.updateTradeStatus('自动交易已停止');
        this.showMessage('自动交易已停止', 'info');
    }

    // 执行自动交易循环
    async executeAutoTradeCycle() {
        if (!this.isAutoTrading) return;

        try {
            // 执行开仓
            await this.executeAutoTradeOrder('open');
            
            // 等待2秒后执行平仓
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 执行平仓
            await this.executeAutoTradeOrder('close');
            
            // 增加交易计数
            this.tradeCount++;
            this.updateTradeInfo();
            this.saveSettings();
            
            // 等待10秒后开始下一轮
            this.updateTradeStatus(`等待下一轮交易... (${this.tradeCount}次)`);
            this.tradeInterval = setTimeout(() => {
                this.executeAutoTradeCycle();
            }, 10000); // 10秒等待
            
        } catch (error) {
            console.error('自动交易循环错误:', error);
            this.updateTradeStatus('自动交易出错');
            this.showMessage(`自动交易出错: ${error.message}`, 'error');
            
            // 出错后等待10秒重试
            this.tradeInterval = setTimeout(() => {
                this.executeAutoTradeCycle();
            }, 10000);
        }
    }

    // 执行自动交易订单
    async executeAutoTradeOrder(type) {
        const amount = document.getElementById('autoTradeAmount').value;
        const side = type === 'open' ? 'BUY' : 'SELL';

        this.updateTradeStatus(`${type === 'open' ? '开仓' : '平仓'}中...`);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('未找到活动标签页。请确保在Variational Omni页面。');
        }

        // 检查是否在正确的页面
        if (!tab.url.includes('variational.io')) {
            throw new Error('请确保在Variational Omni交易页面 (omni.variational.io)');
        }

        try {
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'executeMarketOrder',
                exchange: this.currentExchange,
                symbol: 'BTC',
                type: type,
                side: side,
                amount: amount
            });

            if (!response.success) {
                throw new Error(response.error || `${type === 'open' ? '开仓' : '平仓'}失败`);
            }

            return response;
        } catch (error) {
            // 处理连接错误
            if (error.message.includes('Could not establish connection') || 
                error.message.includes('Receiving end does not exist')) {
                
                console.error('Content script连接失败:', error);
                throw new Error(`无法连接到交易页面。请确保：
1. 在Variational Omni页面 (omni.variational.io)
2. 页面已完全加载
3. 刷新页面后重试`);
            }
            
            // 重新抛出其他错误
            throw error;
        }
    }

    // 更新自动交易按钮
    updateAutoTradeButton() {
        const button = document.getElementById('autoTradeToggle');
        if (this.isAutoTrading) {
            button.textContent = '停止自动交易';
            button.className = 'btn btn-stop';
        } else {
            button.textContent = '开始自动交易';
            button.className = 'btn btn-success';
        }
    }

    // 更新交易状态
    updateTradeStatus(message) {
        document.getElementById('tradeStatus').textContent = `状态: ${message}`;
    }

    // 切换批量开单
    toggleBatchOpen() {
        if (this.isBatchOpening) {
            this.stopBatchOpen();
        } else {
            this.startBatchOpen();
        }
    }

    // 开始批量开单
    async startBatchOpen() {
        const direction = document.getElementById('batchDirection').value;
        const amount = document.getElementById('batchAmount').value;
        const count = document.getElementById('batchCount').value;
        
        if (!direction) {
            this.showMessage('请选择开仓方向', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            this.showMessage('请输入有效的开仓金额', 'error');
            return;
        }

        if (!count || parseInt(count) <= 0) {
            this.showMessage('请输入有效的开仓数量', 'error');
            return;
        }

        // 检查content script是否加载
        try {
            await this.checkContentScript();
        } catch (error) {
            this.showMessage(`无法启动批量开单: ${error.message}`, 'error');
            return;
        }

        this.isBatchOpening = true;
        this.batchCompleted = 0;
        this.batchTotal = parseInt(count);
        this.updateBatchOpenButton();
        this.updateBatchStatus('批量开单运行中...');
        this.updateBatchProgress();
        
        // 开始批量开单循环
        this.executeBatchOpenCycle(direction);
        
        this.showMessage('批量开单已开始', 'success');
    }

    // 停止批量开单
    stopBatchOpen() {
        this.isBatchOpening = false;
        if (this.batchInterval) {
            clearTimeout(this.batchInterval);
            this.batchInterval = null;
        }
        this.updateBatchOpenButton();
        this.updateBatchStatus('批量开单已停止');
        this.showMessage('批量开单已停止', 'info');
    }

    // 执行批量开单循环
    async executeBatchOpenCycle(direction) {
        if (!this.isBatchOpening) return;

        try {
            // 执行开仓
            await this.executeBatchOpenOrder(direction);
            
            // 增加完成计数
            this.batchCompleted++;
            this.updateBatchProgress();
            
            // 检查是否完成所有开单
            if (this.batchCompleted >= this.batchTotal) {
                this.updateBatchStatus('批量开单已完成');
                this.showMessage(`批量开单完成: ${this.batchCompleted}/${this.batchTotal}`, 'success');
                this.stopBatchOpen();
                return;
            }
            
            // 等待2秒后开始下一单
            this.updateBatchStatus(`等待下一单... (${this.batchCompleted}/${this.batchTotal})`);
            this.batchInterval = setTimeout(() => {
                this.executeBatchOpenCycle(direction);
            }, 2000); // 2秒等待
            
        } catch (error) {
            console.error('批量开单循环错误:', error);
            this.updateBatchStatus('批量开单出错');
            this.showMessage(`批量开单出错: ${error.message}`, 'error');
            
            // 出错后等待2秒重试
            this.batchInterval = setTimeout(() => {
                this.executeBatchOpenCycle(direction);
            }, 2000);
        }
    }

    // 执行批量开单订单
    async executeBatchOpenOrder(direction) {
        const amount = document.getElementById('batchAmount').value;

        this.updateBatchStatus(`开仓中... (${this.batchCompleted + 1}/${this.batchTotal})`);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('未找到活动标签页。请确保在Variational Omni页面。');
        }

        // 检查是否在正确的页面
        if (!tab.url.includes('variational.io')) {
            throw new Error('请确保在Variational Omni交易页面 (omni.variational.io)');
        }

        try {
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'executeMarketOrder',
                exchange: this.currentExchange,
                symbol: 'BTC',
                type: 'open',
                side: direction,
                amount: amount,
                direction: direction
            });

            if (!response.success) {
                throw new Error(response.error || '开仓失败');
            }

            return response;
        } catch (error) {
            // 处理连接错误
            if (error.message.includes('Could not establish connection') || 
                error.message.includes('Receiving end does not exist')) {
                
                console.error('Content script连接失败:', error);
                throw new Error(`无法连接到交易页面。请确保：
1. 在Variational Omni页面 (omni.variational.io)
2. 页面已完全加载
3. 刷新页面后重试`);
            }
            
            // 重新抛出其他错误
            throw error;
        }
    }

    // 更新批量开单按钮
    updateBatchOpenButton() {
        const button = document.getElementById('batchOpenToggle');
        if (this.isBatchOpening) {
            button.textContent = '停止批量开单';
            button.className = 'btn btn-stop';
        } else {
            button.textContent = '开始批量开单';
            button.className = 'btn btn-primary';
        }
    }

    // 更新批量开单状态
    updateBatchStatus(message) {
        document.getElementById('batchStatus').textContent = `状态: ${message}`;
    }

    // 更新批量开单进度
    updateBatchProgress() {
        document.getElementById('batchProgress').textContent = `进度: ${this.batchCompleted}/${this.batchTotal}`;
    }

    // 更新交易信息
    updateTradeInfo() {
        document.getElementById('tradeCount').textContent = `交易次数: ${this.tradeCount}`;
    }

}

// 初始化交易助手
document.addEventListener('DOMContentLoaded', () => {
    new TradingAssistant();
});
