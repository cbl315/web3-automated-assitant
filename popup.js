// 交易助手主逻辑 - 与后台脚本通信
class TradingAssistant {
    constructor() {
        this.currentExchange = 'variational';
        this.isProcessing = false;
        this.tradingState = {
            isAutoTrading: false,
            isBatchOpening: false,
            tradeCount: 0,
            batchCompleted: 0,
            batchTotal: 0
        };
        this.init();
    }

    init() {
        this.loadTradingState();
        this.bindEvents();
    }

    // 加载交易状态
    async loadTradingState() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getTradingState'
            });
            
            if (response.success) {
                this.tradingState = response.state;
                this.updateUI();
            }
        } catch (error) {
            console.error('加载交易状态失败:', error);
        }
    }

    // 更新UI
    updateUI() {
        this.updateAutoTradeButton();
        this.updateBatchOpenButton();
        this.updateTradeStatus(this.tradingState.isAutoTrading ? '自动交易运行中...' : '自动交易已停止');
        this.updateBatchStatus(this.tradingState.isBatchOpening ? '批量开单运行中...' : '批量开单已停止');
        this.updateTradeInfo();
        this.updateBatchProgress();
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

    // 切换自动交易
    async toggleAutoTrade() {
        if (this.tradingState.isAutoTrading) {
            await this.stopAutoTrade();
        } else {
            await this.startAutoTrade();
        }
    }

    // 开始自动交易
    async startAutoTrade() {
        const amount = document.getElementById('autoTradeAmount').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            this.showMessage('请输入有效的开仓金额', 'error');
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'startAutoTrade',
                amount: amount
            });
            
            if (response.success) {
                this.tradingState.isAutoTrading = true;
                this.tradingState.autoTradeAmount = amount;
                this.updateUI();
                this.showMessage('自动交易已开始', 'success');
            } else {
                this.showMessage('启动自动交易失败', 'error');
            }
        } catch (error) {
            console.error('启动自动交易错误:', error);
            this.showMessage(`启动自动交易失败: ${error.message}`, 'error');
        }
    }

    // 停止自动交易
    async stopAutoTrade() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'stopAutoTrade'
            });
            
            if (response.success) {
                this.tradingState.isAutoTrading = false;
                this.updateUI();
                this.showMessage('自动交易已停止', 'info');
            } else {
                this.showMessage('停止自动交易失败', 'error');
            }
        } catch (error) {
            console.error('停止自动交易错误:', error);
            this.showMessage(`停止自动交易失败: ${error.message}`, 'error');
        }
    }

    // 切换批量开单
    async toggleBatchOpen() {
        if (this.tradingState.isBatchOpening) {
            await this.stopBatchOpen();
        } else {
            await this.startBatchOpen();
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

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'startBatchOpen',
                direction: direction,
                amount: amount,
                count: parseInt(count)
            });
            
            if (response.success) {
                this.tradingState.isBatchOpening = true;
                this.tradingState.batchDirection = direction;
                this.tradingState.batchAmount = amount;
                this.tradingState.batchTotal = parseInt(count);
                this.tradingState.batchCompleted = 0;
                this.updateUI();
                this.showMessage('批量开单已开始', 'success');
            } else {
                this.showMessage('启动批量开单失败', 'error');
            }
        } catch (error) {
            console.error('启动批量开单错误:', error);
            this.showMessage(`启动批量开单失败: ${error.message}`, 'error');
        }
    }

    // 停止批量开单
    async stopBatchOpen() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'stopBatchOpen'
            });
            
            if (response.success) {
                this.tradingState.isBatchOpening = false;
                this.updateUI();
                this.showMessage('批量开单已停止', 'info');
            } else {
                this.showMessage('停止批量开单失败', 'error');
            }
        } catch (error) {
            console.error('停止批量开单错误:', error);
            this.showMessage(`停止批量开单失败: ${error.message}`, 'error');
        }
    }

    // 更新自动交易按钮
    updateAutoTradeButton() {
        const button = document.getElementById('autoTradeToggle');
        if (this.tradingState.isAutoTrading) {
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

    // 更新批量开单按钮
    updateBatchOpenButton() {
        const button = document.getElementById('batchOpenToggle');
        if (this.tradingState.isBatchOpening) {
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
        document.getElementById('batchProgress').textContent = `进度: ${this.tradingState.batchCompleted}/${this.tradingState.batchTotal}`;
    }

    // 更新交易信息
    updateTradeInfo() {
        document.getElementById('tradeCount').textContent = `交易次数: ${this.tradingState.tradeCount}`;
    }

    // 定期更新状态
    startStatusPolling() {
        setInterval(() => {
            this.loadTradingState();
        }, 2000); // 每2秒更新一次状态
    }
}

// 初始化交易助手
document.addEventListener('DOMContentLoaded', () => {
    const assistant = new TradingAssistant();
    assistant.startStatusPolling(); // 开始定期更新状态
});
