// Background Script - 处理插件后台逻辑和交易状态管理
class TradingStateManager {
    constructor() {
        this.tradingState = {
            isAutoTrading: false,
            isBatchOpening: false,
            tradeCount: 0,
            batchCompleted: 0,
            batchTotal: 0,
            batchDirection: 'BUY',
            batchAmount: 20,
            autoTradeAmount: 20,
            lastActiveTabId: null
        };
        this.timers = {
            autoTrade: null,
            batchOpen: null
        };
        this.init();
    }

    init() {
        this.loadState();
        this.setupMessageListener();
        this.setupTabListener();
        console.log('交易状态管理器已启动');
    }

    // 加载保存的状态
    async loadState() {
        try {
            const result = await chrome.storage.local.get(['tradingState']);
            if (result.tradingState) {
                this.tradingState = { ...this.tradingState, ...result.tradingState };
                console.log('已加载保存的交易状态:', this.tradingState);
                
                // 如果之前有活跃交易，尝试恢复
                if (this.tradingState.isAutoTrading || this.tradingState.isBatchOpening) {
                    this.tryResumeTrading();
                }
            }
        } catch (error) {
            console.error('加载状态失败:', error);
        }
    }

    // 保存状态
    async saveState() {
        try {
            await chrome.storage.local.set({ tradingState: this.tradingState });
        } catch (error) {
            console.error('保存状态失败:', error);
        }
    }

    // 设置消息监听器
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Background收到消息:', request);

            switch (request.action) {
                case 'getTradingState':
                    sendResponse({ success: true, state: this.tradingState });
                    break;
                    
                case 'updateTradingState':
                    this.tradingState = { ...this.tradingState, ...request.state };
                    this.saveState();
                    sendResponse({ success: true });
                    break;
                    
                case 'startAutoTrade':
                    this.startAutoTrade(request.amount);
                    sendResponse({ success: true });
                    break;
                    
                case 'stopAutoTrade':
                    this.stopAutoTrade();
                    sendResponse({ success: true });
                    break;
                    
                case 'startBatchOpen':
                    this.startBatchOpen(request.direction, request.amount, request.count);
                    sendResponse({ success: true });
                    break;
                    
                case 'stopBatchOpen':
                    this.stopBatchOpen();
                    sendResponse({ success: true });
                    break;
                    
                case 'stopAllTrading':
                    this.stopAllTrading();
                    sendResponse({ success: true });
                    break;

                case 'getTradeHistory':
                    chrome.storage.local.get(['tradeHistory'], (result) => {
                        const history = result.tradeHistory || [];
                        sendResponse({ success: true, history: history.slice(0, request.limit || 50) });
                    });
                    return true;

                case 'clearTradeHistory':
                    chrome.storage.local.set({ tradeHistory: [] });
                    sendResponse({ success: true });
                    break;

                case 'logTrade':
                    const historyEntry = {
                        ...request.tradeData,
                        timestamp: new Date().toISOString(),
                        id: `TRADE_${Date.now()}`
                    };

                    chrome.storage.local.get(['tradeHistory'], (result) => {
                        const history = result.tradeHistory || [];
                        history.unshift(historyEntry);
                        
                        // 只保留最近100条记录
                        if (history.length > 100) {
                            history.splice(100);
                        }

                        chrome.storage.local.set({ tradeHistory: history });
                        sendResponse({ success: true });
                    });
                    return true;

                case 'sendNotification':
                    const notificationOptions = {
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: request.title,
                        message: request.message
                    };

                    chrome.notifications.create(`notification_${Date.now()}`, notificationOptions);
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: '未知操作' });
            }
            
            return true; // 保持消息通道开放
        });
    }

    // 设置标签页监听器
    setupTabListener() {
        // 监听标签页激活
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.tradingState.lastActiveTabId = activeInfo.tabId;
            this.saveState();
        });

        // 监听标签页更新
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.isExchangeUrl(tab.url)) {
                console.log('交易所页面加载完成:', tab.url);
                this.tradingState.lastActiveTabId = tabId;
                this.saveState();
                
                // 发送消息给content script
                chrome.tabs.sendMessage(tabId, {
                    action: 'pageLoaded',
                    url: tab.url
                }).catch(() => {
                    // content script可能还未加载完成，忽略错误
                });
            }
        });

        // 监听标签页关闭
        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            if (tabId === this.tradingState.lastActiveTabId) {
                this.tradingState.lastActiveTabId = null;
                this.saveState();
            }
        });
    }

    // 开始自动交易
    async startAutoTrade(amount) {
        this.tradingState.isAutoTrading = true;
        this.tradingState.autoTradeAmount = amount;
        this.saveState();
        
        console.log('开始自动交易，金额:', amount);
        await this.executeAutoTradeCycle();
    }

    // 停止自动交易
    stopAutoTrade() {
        this.tradingState.isAutoTrading = false;
        if (this.timers.autoTrade) {
            clearTimeout(this.timers.autoTrade);
            this.timers.autoTrade = null;
        }
        this.saveState();
        console.log('自动交易已停止');
    }

    // 执行自动交易循环
    async executeAutoTradeCycle() {
        if (!this.tradingState.isAutoTrading) return;

        try {
            // 执行开仓
            await this.executeTradeOrder('open', 'BUY', this.tradingState.autoTradeAmount);
            
            // 等待2秒后执行平仓
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 执行平仓
            await this.executeTradeOrder('close', 'SELL', this.tradingState.autoTradeAmount);
            
            // 增加交易计数
            this.tradingState.tradeCount++;
            this.saveState();
            
            console.log(`自动交易完成第${this.tradingState.tradeCount}次`);
            
            // 等待10秒后开始下一轮
            this.timers.autoTrade = setTimeout(() => {
                this.executeAutoTradeCycle();
            }, 10000);
            
        } catch (error) {
            console.error('自动交易循环错误:', error);
            
            // 出错后等待10秒重试
            this.timers.autoTrade = setTimeout(() => {
                this.executeAutoTradeCycle();
            }, 10000);
        }
    }

    // 开始批量开单
    async startBatchOpen(direction, amount, count) {
        this.tradingState.isBatchOpening = true;
        this.tradingState.batchDirection = direction;
        this.tradingState.batchAmount = amount;
        this.tradingState.batchTotal = count;
        this.tradingState.batchCompleted = 0;
        this.saveState();
        
        console.log(`开始批量开单，方向:${direction}, 金额:${amount}, 数量:${count}`);
        await this.executeBatchOpenCycle();
    }

    // 停止批量开单
    stopBatchOpen() {
        this.tradingState.isBatchOpening = false;
        if (this.timers.batchOpen) {
            clearTimeout(this.timers.batchOpen);
            this.timers.batchOpen = null;
        }
        this.saveState();
        console.log('批量开单已停止');
    }

    // 执行批量开单循环
    async executeBatchOpenCycle() {
        if (!this.tradingState.isBatchOpening) return;

        try {
            // 执行开仓
            await this.executeTradeOrder('open', this.tradingState.batchDirection, this.tradingState.batchAmount);
            
            // 增加完成计数
            this.tradingState.batchCompleted++;
            this.saveState();
            
            console.log(`批量开单进度: ${this.tradingState.batchCompleted}/${this.tradingState.batchTotal}`);
            
            // 检查是否完成所有开单
            if (this.tradingState.batchCompleted >= this.tradingState.batchTotal) {
                console.log('批量开单已完成');
                this.stopBatchOpen();
                return;
            }
            
            // 等待2秒后开始下一单
            this.timers.batchOpen = setTimeout(() => {
                this.executeBatchOpenCycle();
            }, 2000);
            
        } catch (error) {
            console.error('批量开单循环错误:', error);
            
            // 出错后等待2秒重试
            this.timers.batchOpen = setTimeout(() => {
                this.executeBatchOpenCycle();
            }, 2000);
        }
    }

    // 执行交易订单
    async executeTradeOrder(type, side, amount) {
        const activeTab = await this.getActiveExchangeTab();
        if (!activeTab) {
            throw new Error('未找到活跃的交易所标签页');
        }

        try {
            const response = await chrome.tabs.sendMessage(activeTab.id, {
                action: 'executeMarketOrder',
                exchange: 'variational',
                symbol: 'BTC',
                type: type,
                side: side,
                amount: amount,
                direction: side
            });

            if (!response.success) {
                throw new Error(response.error || `${type === 'open' ? '开仓' : '平仓'}失败`);
            }

            return response;
        } catch (error) {
            if (error.message.includes('Could not establish connection') || 
                error.message.includes('Receiving end does not exist')) {
                throw new Error('无法连接到交易页面，请确保页面已加载完成');
            }
            throw error;
        }
    }

    // 获取活跃的交易所标签页
    async getActiveExchangeTab() {
        // 首先尝试上次活跃的标签页
        if (this.tradingState.lastActiveTabId) {
            try {
                const tab = await chrome.tabs.get(this.tradingState.lastActiveTabId);
                if (tab && this.isExchangeUrl(tab.url)) {
                    return tab;
                }
            } catch (error) {
                // 标签页可能已关闭
                this.tradingState.lastActiveTabId = null;
            }
        }

        // 如果没有找到，搜索所有标签页
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (this.isExchangeUrl(tab.url)) {
                this.tradingState.lastActiveTabId = tab.id;
                this.saveState();
                return tab;
            }
        }

        return null;
    }

    // 尝试恢复交易
    async tryResumeTrading() {
        console.log('尝试恢复之前的交易状态...');
        
        const activeTab = await this.getActiveExchangeTab();
        if (!activeTab) {
            console.log('未找到交易所页面，无法恢复交易');
            return;
        }

        if (this.tradingState.isAutoTrading) {
            console.log('恢复自动交易');
            await this.startAutoTrade(this.tradingState.autoTradeAmount);
        }

        if (this.tradingState.isBatchOpening) {
            console.log('恢复批量开单');
            await this.startBatchOpen(
                this.tradingState.batchDirection,
                this.tradingState.batchAmount,
                this.tradingState.batchTotal - this.tradingState.batchCompleted
            );
        }
    }

    // 停止所有交易
    stopAllTrading() {
        this.stopAutoTrade();
        this.stopBatchOpen();
        console.log('已停止所有交易活动');
    }

    // 检查是否为Variational Omni交易所URL
    isExchangeUrl(url) {
        if (!url) return false;
        return url.includes('variational.io');
    }
}

// 初始化交易状态管理器
const stateManager = new TradingStateManager();

// 插件安装事件
chrome.runtime.onInstalled.addListener((details) => {
    console.log('插件安装/更新:', details.reason);
    
    if (details.reason === 'install') {
        console.log('欢迎使用Web3自动交易助手！');
        
        // 初始化默认设置
        const defaultSettings = {
            symbol: 'BTCUSDT',
            autoConfirm: false,
            soundAlert: true
        };
        
        chrome.storage.local.set(defaultSettings);
    }
});

// 监听扩展关闭
chrome.runtime.onSuspend.addListener(() => {
    console.log('扩展即将挂起，保存状态');
    stateManager.saveState();
});
