// 交易助手主逻辑
class TradingAssistant {
    constructor() {
        this.currentExchange = 'variational';
        this.currentSymbol = 'BTCUSDT';
        this.isProcessing = false;
        this.isAutoTrading = false;
        this.tradeInterval = null;
        this.tradeCount = 0;
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.updateStatus('ready', '就绪');
        this.updateTradeInfo();
    }

    // 加载设置
    loadSettings() {
        chrome.storage.local.get([
            'symbol', 
            'autoConfirm', 
            'soundAlert',
            'tradeCount'
        ], (result) => {
            if (result.symbol) {
                document.getElementById('symbol').value = result.symbol;
                this.currentSymbol = result.symbol;
            }
            if (result.autoConfirm !== undefined) {
                document.getElementById('autoConfirm').checked = result.autoConfirm;
            }
            if (result.soundAlert !== undefined) {
                document.getElementById('soundAlert').checked = result.soundAlert;
            }
            if (result.tradeCount !== undefined) {
                this.tradeCount = result.tradeCount;
                this.updateTradeInfo();
            }
        });
    }

    // 保存设置
    saveSettings() {
        const settings = {
            symbol: this.currentSymbol,
            autoConfirm: document.getElementById('autoConfirm').checked,
            soundAlert: document.getElementById('soundAlert').checked,
            tradeCount: this.tradeCount
        };
        chrome.storage.local.set(settings);
    }

    // 绑定事件
    bindEvents() {
        // 交易对输入
        document.getElementById('symbol').addEventListener('change', (e) => {
            this.currentSymbol = e.target.value.toUpperCase();
            this.saveSettings();
        });

        // 设置变更
        document.getElementById('autoConfirm').addEventListener('change', () => this.saveSettings());
        document.getElementById('soundAlert').addEventListener('change', () => this.saveSettings());

        // 自动交易切换
        document.getElementById('autoTradeToggle').addEventListener('click', () => {
            this.toggleAutoTrade();
        });
    }

    // 更新状态
    updateStatus(type, message) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
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

        if (!this.currentSymbol) {
            this.showMessage('请输入交易对', 'error');
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
                symbol: this.currentSymbol,
                type: type,
                side: side,
                amount: amount,
                autoConfirm: document.getElementById('autoConfirm').checked
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

    // 更新交易信息
    updateTradeInfo() {
        document.getElementById('tradeCount').textContent = `交易次数: ${this.tradeCount}`;
    }

    // 获取最新价格
    async updatePrice() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'getCurrentPrice',
                    symbol: this.currentSymbol
                });
                
                if (response && response.price) {
                    document.getElementById('lastPrice').textContent = 
                        `最新价格: ${response.price}`;
                }
            }
        } catch (error) {
            // 忽略价格获取错误
        }
    }
}

// 初始化交易助手
document.addEventListener('DOMContentLoaded', () => {
    new TradingAssistant();
});

// 定期更新价格
setInterval(() => {
    const assistant = window.tradingAssistant;
    if (assistant) {
        assistant.updatePrice();
    }
}, 5000);
