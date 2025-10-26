// Background Script - 处理插件后台逻辑
console.log('Background script loaded');

// 插件安装事件
chrome.runtime.onInstalled.addListener((details) => {
    console.log('插件安装/更新:', details.reason);
    
    if (details.reason === 'install') {
        // 首次安装
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

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background收到消息:', request);

    switch (request.action) {
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
});

// 交易所页面加载处理
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isExchangeUrl(tab.url)) {
        console.log('交易所页面加载完成:', tab.url);
        
        // 发送消息给content script
        chrome.tabs.sendMessage(tabId, {
            action: 'pageLoaded',
            url: tab.url
        }).catch(() => {
            // content script可能还未加载完成，忽略错误
        });
    }
});

// 检查是否为Variational Omni交易所URL
function isExchangeUrl(url) {
    if (!url) return false;
    return url.includes('variational.io');
}
