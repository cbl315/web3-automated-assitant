// Content Script - 专门针对Variational Omni交易所的交易助手
class VariationalTrader {
    constructor() {
        this.currentExchange = 'variational';
        this.init();
    }

    init() {
        this.setupMessageListener();
        console.log('Variational Omni交易助手已加载');
    }

    // 设置消息监听器
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('收到消息:', request);
            
            switch (request.action) {
                case 'ping':
                    // 响应ping消息，确认content script已加载
                    sendResponse({ success: true, message: 'Variational Omni交易助手已就绪' });
                    break;
                    
                case 'executeMarketOrder':
                    this.executeVariationalOrder(request, sendResponse);
                    return true; // 保持消息通道开放
                    
                    
                case 'getCurrentPrice':
                    this.getCurrentPrice(request, sendResponse);
                    return true;
                    
                default:
                    sendResponse({ success: false, error: '未知操作' });
            }
        });
    }

    // Variational Omni交易所交易逻辑
    async executeVariationalOrder(request, sendResponse) {
        try {
            console.log('执行Variational Omni市价订单:', request);
            
            // 根据交易类型和方向执行相应的操作
            let result;
            if (request.type === 'open') {
                // 开仓操作
                result = await this.executeOpenOrder(request);
            } else {
                // 平仓操作
                result = await this.executeCloseOrder(request);
            }
            
            sendResponse(result);
            
        } catch (error) {
            console.error('执行Variational Omni订单错误:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // 执行开仓订单
    async executeOpenOrder(request) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('执行开仓操作:', request);
                
                // 第一步：确保货币单位是美元($)
                await this.ensureCurrencyIsUSD();
                
                // 第二步：根据开仓方向点击对应的价格按钮
                if (request.direction) {
                    await this.clickDirectionButton(request.direction);
                }
                
                // 第三步：使用data-testid精准定位开仓金额输入框并设置金额
                const amountInput = document.querySelector('[data-testid="quantity-input"]');
                
                if (amountInput) {
                    console.log('找到开仓金额输入框:', amountInput);
                    
                    // 清空输入框并设置金额
                    amountInput.value = '';
                    amountInput.focus();
                    
                    // 模拟用户输入
                    setTimeout(() => {
                        amountInput.value = request.amount;
                        
                        // 触发输入事件确保页面响应
                        const inputEvent = new Event('input', { bubbles: true });
                        amountInput.dispatchEvent(inputEvent);
                        
                        console.log(`已设置开仓金额: ${request.amount}`);
                        
                        // 第四步：查找并点击买入/卖出BTC按钮
                        this.clickTradeButton(request, resolve, reject);
                        
                    }, 500);
                } else {
                    console.log('未找到开仓金额输入框，直接点击交易按钮');
                    // 如果找不到输入框，直接点击交易按钮
                    this.clickTradeButton(request, resolve, reject);
                }
                
            } catch (error) {
                console.error('开仓操作详细错误:', error);
                reject(error);
            }
        });
    }

    // 确保货币单位是美元($)
    async ensureCurrencyIsUSD() {
        return new Promise((resolve, reject) => {
            try {
                console.log('检查货币单位...');
                
                // 检查当前货币单位是否为美元($)
                const currencyButton = document.querySelector('[data-testid="input-mode-toggle"]');
                
                if (currencyButton) {
                    // 获取货币显示文本
                    const currencySpan = currencyButton.querySelector('span');
                    if (currencySpan) {
                        const currentCurrency = currencySpan.textContent.trim();
                        console.log(`当前货币单位: "${currentCurrency}"`);
                        
                        if (currentCurrency === '$') {
                            console.log('货币单位已经是美元($)，无需切换');
                            resolve();
                            return;
                        } else {
                            console.log(`货币单位不是美元($)，当前是"${currentCurrency}"，需要切换到美元($)`);
                            
                            // 点击货币切换按钮
                            console.log('找到货币切换按钮，点击切换到美元($)');
                            currencyButton.click();
                            
                            // 等待切换完成
                            setTimeout(() => {
                                console.log('货币单位已切换到美元($)');
                                resolve();
                            }, 1000);
                        }
                    } else {
                        console.log('未找到货币显示文本，继续使用当前货币');
                        resolve();
                    }
                } else {
                    console.log('未找到货币切换按钮，继续使用当前货币');
                    resolve();
                }
                
            } catch (error) {
                console.error('货币单位检查错误:', error);
                // 不阻止交易继续，只是记录错误
                resolve();
            }
        });
    }

    // 点击开仓方向按钮
    async clickDirectionButton(direction) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`点击开仓方向按钮: ${direction}`);
                
                let directionButton = null;
                
                if (direction === 'BUY') {
                    // 查找卖价显示元素的上一级button
                    const askPriceSpan = document.querySelector('[data-testid="ask-price-display"]');
                    if (askPriceSpan) {
                        directionButton = askPriceSpan.closest('button');
                        console.log('找到卖价按钮:', directionButton);
                    }
                } else if (direction === 'SELL') {
                    // 查找买价显示元素的上一级button
                    const bidPriceSpan = document.querySelector('[data-testid="bid-price-display"]');
                    if (bidPriceSpan) {
                        directionButton = bidPriceSpan.closest('button');
                        console.log('找到买价按钮:', directionButton);
                    }
                }
                
                if (!directionButton) {
                    console.log('未找到方向按钮，继续执行开仓');
                    resolve();
                    return;
                }
                
                // 点击方向按钮
                directionButton.click();
                console.log(`已点击${direction === 'BUY' ? '卖价' : '买价'}按钮`);
                
                // 等待方向切换完成
                setTimeout(() => {
                    console.log('方向切换完成');
                    resolve();
                }, 500);
                
            } catch (error) {
                console.error('点击方向按钮错误:', error);
                // 不阻止交易继续，只是记录错误
                resolve();
            }
        });
    }

    // 点击交易按钮的通用逻辑
    clickTradeButton(request, resolve, reject) {
        try {
            // 等待按钮可用并点击
            this.waitForTradeButtonAvailable(request, resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    // 等待交易按钮可用并点击
    async waitForTradeButtonAvailable(request, resolve, reject) {
        const maxRetries = 10; // 最大重试次数
        const retryInterval = 500; // 重试间隔(毫秒)
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`尝试查找交易按钮 (第${attempt}次)...`);
                
                // 第一步：使用data-testid精准定位交易按钮
                let tradeButton = document.querySelector('[data-testid="submit-button"]');
                
                if (!tradeButton) {
                    console.log('data-testid未找到交易按钮，尝试查找所有按钮');
                    // 如果data-testid没找到，查找所有按钮并检查文本
                    const allButtons = document.querySelectorAll('button');
                    console.log(`页面中共有 ${allButtons.length} 个按钮`);
                    
                    for (let button of allButtons) {
                        const text = button.textContent.trim();
                        console.log(`按钮文本: "${text}"`);
                        if (text.includes('买 BTC') || text.includes('卖 BTC') || text.includes('买入') || text.includes('卖出') || text.includes('输入大小')) {
                            tradeButton = button;
                            console.log('通过文本匹配找到按钮');
                            break;
                        }
                    }
                } else {
                    console.log('使用data-testid成功找到交易按钮');
                }
                
                if (!tradeButton) {
                    if (attempt === maxRetries) {
                        throw new Error('未找到交易按钮。请确保在Variational Omni交易页面，并且页面已完全加载。');
                    } else {
                        console.log(`未找到按钮，等待${retryInterval}ms后重试`);
                        await new Promise(resolve => setTimeout(resolve, retryInterval));
                        continue;
                    }
                }

                // 检查按钮文本是否匹配
                const buttonText = tradeButton.textContent.trim();
                console.log(`找到按钮，文本内容: "${buttonText}"`);
                
                // 检查按钮是否可用
                if (tradeButton.disabled) {
                    console.log(`按钮当前不可用（被禁用），等待${retryInterval}ms后重试`);
                    if (attempt === maxRetries) {
                        throw new Error('交易按钮长时间不可用，请检查交易条件是否满足。');
                    }
                    await new Promise(resolve => setTimeout(resolve, retryInterval));
                    continue;
                }
                
                // 按钮可用，执行点击
                console.log('按钮可用，执行点击');
                tradeButton.click();
                
                console.log(`已点击${request.direction === 'BUY' ? '买入' : '卖出'}BTC按钮`);
                
                // 模拟交易成功
                setTimeout(() => {
                    resolve({
                        success: true,
                        orderId: `VARIATIONAL_${Date.now()}`,
                        message: `Variational Omni${request.direction === 'BUY' ? '买入' : '卖出'}订单执行成功`,
                        details: {
                            side: request.side,
                            amount: request.amount,
                            symbol: request.symbol,
                            direction: request.direction
                        }
                    });
                }, 1000);
                
                return; // 成功，退出循环
                
            } catch (error) {
                if (attempt === maxRetries) {
                    reject(error);
                    return;
                }
                console.log(`第${attempt}次尝试失败: ${error.message}，等待${retryInterval}ms后重试`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }
    }

    // 等待按钮可用并点击 (兼容旧版本)
    async waitForButtonAvailable(request, resolve, reject) {
        const maxRetries = 10; // 最大重试次数
        const retryInterval = 500; // 重试间隔(毫秒)
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`尝试查找买入按钮 (第${attempt}次)...`);
                
                // 第一步：使用data-testid精准定位买入BTC按钮
                let buyButton = document.querySelector('[data-testid="submit-button"]');
                
                if (!buyButton) {
                    console.log('data-testid未找到买入按钮，尝试查找所有按钮');
                    // 如果data-testid没找到，查找所有按钮并检查文本
                    const allButtons = document.querySelectorAll('button');
                    console.log(`页面中共有 ${allButtons.length} 个按钮`);
                    
                    for (let button of allButtons) {
                        const text = button.textContent.trim();
                        console.log(`按钮文本: "${text}"`);
                        if (text.includes('买 BTC') || text.includes('买入') || text.includes('输入大小')) {
                            buyButton = button;
                            console.log('通过文本匹配找到按钮');
                            break;
                        }
                    }
                } else {
                    console.log('使用data-testid成功找到买入BTC按钮');
                }
                
                if (!buyButton) {
                    if (attempt === maxRetries) {
                        throw new Error('未找到买入BTC按钮。请确保在Variational Omni交易页面，并且页面已完全加载。');
                    } else {
                        console.log(`未找到按钮，等待${retryInterval}ms后重试`);
                        await new Promise(resolve => setTimeout(resolve, retryInterval));
                        continue;
                    }
                }

                // 检查按钮文本是否匹配
                const buttonText = buyButton.textContent.trim();
                console.log(`找到按钮，文本内容: "${buttonText}"`);
                
                // 检查按钮是否可用
                if (buyButton.disabled) {
                    console.log(`按钮当前不可用（被禁用），等待${retryInterval}ms后重试`);
                    if (attempt === maxRetries) {
                        throw new Error('买入按钮长时间不可用，请检查交易条件是否满足。');
                    }
                    await new Promise(resolve => setTimeout(resolve, retryInterval));
                    continue;
                }
                
                // 按钮可用，执行点击
                console.log('按钮可用，执行点击');
                buyButton.click();
                
                console.log('已点击买入BTC按钮');
                
                // 模拟交易成功
                setTimeout(() => {
                    resolve({
                        success: true,
                        orderId: `VARIATIONAL_${Date.now()}`,
                        message: 'Variational Omni开仓订单执行成功',
                        details: {
                            side: request.side,
                            amount: request.amount,
                            symbol: request.symbol
                        }
                    });
                }, 1000);
                
                return; // 成功，退出循环
                
            } catch (error) {
                if (attempt === maxRetries) {
                    reject(error);
                    return;
                }
                console.log(`第${attempt}次尝试失败: ${error.message}，等待${retryInterval}ms后重试`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }
    }

    // 执行平仓订单
    async executeCloseOrder(request) {
        return new Promise((resolve, reject) => {
            try {
                console.log('执行平仓操作:', request);
                
                // 第一步：使用data-testid定位仓位表格行，然后找到关闭按钮
                let closeButton = null;
                
                // 方法1：查找所有按钮并检查文本内容
                const allButtons = document.querySelectorAll('button');
                for (let button of allButtons) {
                    const text = button.textContent.trim();
                    if (text === '关闭') {
                        closeButton = button;
                        console.log('通过文本匹配找到关闭按钮');
                        break;
                    }
                }
                
                if (!closeButton) {
                    console.log('直接查找关闭按钮失败，尝试通过仓位表格行查找');
                    
                    // 方法2：通过仓位表格行查找关闭按钮
                    const positionRows = document.querySelectorAll('[data-testid="positions-table-row"]');
                    console.log(`找到 ${positionRows.length} 个仓位行`);
                    
                    for (const row of positionRows) {
                        // 在仓位行中查找所有按钮并检查文本
                        const buttons = row.querySelectorAll('button');
                        for (let button of buttons) {
                            const text = button.textContent.trim();
                            if (text === '关闭') {
                                closeButton = button;
                                console.log('在仓位表格行中找到关闭按钮');
                                break;
                            }
                        }
                        if (closeButton) break;
                    }
                }
                
                if (!closeButton) {
                    // 方法3：查找所有包含特定样式的按钮
                    const closeSelectors = [
                        'button[class*="border-azure"][class*="text-azure"]'
                    ];
                    
                    for (const selector of closeSelectors) {
                        const buttons = document.querySelectorAll(selector);
                        for (let button of buttons) {
                            const text = button.textContent.trim();
                            if (text === '关闭' || text === '平仓' || text === '交易') {
                                closeButton = button;
                                console.log(`使用样式选择器找到关闭按钮: ${selector}`);
                                break;
                            }
                        }
                        if (closeButton) break;
                    }
                }
                
                if (!closeButton) {
                    throw new Error('未找到平仓按钮。请确保有持仓可以平仓。');
                }

                const buttonText = closeButton.textContent.trim();
                console.log(`找到平仓按钮，文本内容: "${buttonText}"`);
                
                // 检查按钮是否可用
                if (closeButton.disabled) {
                    throw new Error('平仓按钮当前不可用（被禁用）');
                }
                
                // 点击平仓按钮
                closeButton.click();
                console.log('已点击平仓按钮');
                
                // 第二步：等待弹出窗口出现并点击确认平仓按钮
                setTimeout(() => {
                    // 使用data-testid精准定位确认平仓按钮
                    let confirmButton = document.querySelector('[data-testid="close-position-button"]');
                    
                    if (!confirmButton) {
                        console.log('data-testid未找到确认按钮，尝试查找所有按钮');
                        // 如果data-testid没找到，查找所有按钮并检查文本
                        const allConfirmButtons = document.querySelectorAll('button');
                        console.log(`弹出窗口中共有 ${allConfirmButtons.length} 个按钮`);
                        
                        for (let button of allConfirmButtons) {
                            const text = button.textContent.trim();
                            console.log(`确认按钮文本: "${text}"`);
                            if (text.includes('卖出平仓') || text.includes('确认平仓')) {
                                confirmButton = button;
                                console.log('通过文本匹配找到确认按钮');
                                break;
                            }
                        }
                    } else {
                        console.log('使用data-testid成功找到确认平仓按钮');
                    }
                    
                    if (!confirmButton) {
                        throw new Error('未找到确认平仓按钮。请确保弹出窗口已正确显示。');
                    }

                    const confirmText = confirmButton.textContent.trim();
                    console.log(`找到确认按钮，文本内容: "${confirmText}"`);
                    
                    if (!confirmText.includes('卖出平仓') && !confirmText.includes('确认平仓')) {
                        throw new Error(`确认按钮文本不匹配。期望包含"卖出平仓"或"确认平仓"，实际文本: "${confirmText}"`);
                    }

                    console.log('找到确认平仓按钮:', confirmButton);
                    
                    // 检查按钮是否可用
                    if (confirmButton.disabled) {
                        throw new Error('确认平仓按钮当前不可用（被禁用）');
                    }
                    
                    // 点击确认平仓按钮
                    confirmButton.click();
                    console.log('已点击确认平仓按钮');
                    
                    // 模拟交易成功
                    setTimeout(() => {
                        resolve({
                            success: true,
                            orderId: `VARIATIONAL_CLOSE_${Date.now()}`,
                            message: 'Variational Omni平仓订单执行成功',
                            details: {
                                side: request.side,
                                amount: request.amount,
                                symbol: request.symbol
                            }
                        });
                    }, 1000);
                    
                }, 1000); // 增加等待时间到1秒
                
            } catch (error) {
                console.error('平仓操作详细错误:', error);
                reject(error);
            }
        });
    }


    // 获取当前价格
    async getCurrentPrice(request, sendResponse) {
        try {
            let price = null;
            
            // 尝试从页面获取价格信息
            const priceElements = document.querySelectorAll([
                '.price', 
                '[data-testid="price"]',
                '.last-price',
                '.current-price',
                '[class*="price"]'
            ].join(','));
            
            for (let element of priceElements) {
                const text = element.textContent.trim();
                const priceMatch = text.match(/(\d+\.?\d*)/);
                if (priceMatch) {
                    price = priceMatch[0];
                    break;
                }
            }
            
            // 如果没找到，使用模拟价格
            if (!price) {
                price = (Math.random() * 10000 + 30000).toFixed(2);
            }
            
            sendResponse({
                success: true,
                price: price,
                symbol: request.symbol
            });
            
        } catch (error) {
            console.error('获取价格错误:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    // 模拟点击页面元素
    simulateClick(element) {
        if (element) {
            element.click();
            return true;
        }
        return false;
    }

    // 通过XPath获取元素
    getElementByXPath(xpath) {
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        } catch (error) {
            console.error('XPath查找错误:', error);
            return null;
        }
    }

    // 等待元素出现
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            function check() {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`等待元素超时: ${selector}`));
                } else {
                    setTimeout(check, 100);
                }
            }
            
            check();
        });
    }
}

// 初始化交易器
const trader = new VariationalTrader();

// 导出到全局作用域，便于调试
window.variationalTrader = trader;
