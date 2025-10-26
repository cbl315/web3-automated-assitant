# 调试指南 - 如何获取错误信息

当自动交易出现"自动交易出错"时，可以通过以下方法获取详细的错误信息：

## 方法一：查看Chrome开发者工具Console

### 步骤：
1. 在Variational Omni页面按 `F12` 打开开发者工具
2. 切换到 **Console** 标签页
3. 重新启动自动交易
4. 查看Console中输出的详细错误信息

### 可能看到的错误信息：
- `未找到买入BTC按钮。请确保在Variational Omni交易页面，并且页面已完全加载。`
- `按钮文本不匹配。期望包含"买 BTC"或"买入"，实际文本: "..."`
- `未找到"关闭"按钮。请确保有持仓可以平仓。`
- `未找到确认平仓按钮。请确保弹出窗口已正确显示。`

## 方法二：检查页面元素

### 检查开仓按钮：
1. 在开发者工具中按 `Ctrl+F` (Windows) 或 `Cmd+F` (Mac)
2. 搜索以下内容：
   - `data-testid="submit-button"`
   - `买 BTC`
   - `买入`

### 检查平仓按钮：
1. 搜索以下内容：
   - `class*="border-azure"`
   - `class*="text-azure"`
   - `关闭`
   - `平仓`

### 检查确认平仓按钮：
1. 搜索以下内容：
   - `data-testid="close-position-button"`
   - `卖出平仓`
   - `确认平仓`

## 方法三：手动测试按钮

### 测试开仓：
1. 在Console中执行：
```javascript
// 查找买入按钮
const buyButton = document.querySelector('button[data-testid="submit-button"]');
console.log('买入按钮:', buyButton);
if (buyButton) {
    console.log('按钮文本:', buyButton.textContent.trim());
    console.log('是否禁用:', buyButton.disabled);
}
```

### 测试平仓：
1. 在Console中执行：
```javascript
// 查找关闭按钮
const closeButton = document.querySelector('button[class*="border-azure"][class*="text-azure"]');
console.log('关闭按钮:', closeButton);
if (closeButton) {
    console.log('按钮文本:', closeButton.textContent.trim());
    console.log('是否禁用:', closeButton.disabled);
}
```

## 常见问题及解决方案

### 问题1：未找到按钮
**原因**：页面结构可能已更新
**解决方案**：
- 检查是否在正确的交易页面
- 检查页面是否完全加载
- 更新content.js中的选择器

### 问题2：按钮文本不匹配
**原因**：按钮文本可能已更改
**解决方案**：
- 检查实际按钮文本
- 更新content.js中的文本匹配逻辑

### 问题3：按钮被禁用
**原因**：交易条件不满足
**解决方案**：
- 确保有足够的资金
- 确保交易对设置正确
- 等待页面状态更新

## 调试技巧

### 1. 启用详细日志
在Console中执行：
```javascript
localStorage.setItem('debug', 'true');
```

### 2. 检查页面URL
确保在正确的页面：
```
https://omni.variational.io
```

### 3. 检查网络连接
确保网络连接正常，页面可以正常加载

### 4. 重新加载扩展
1. 访问 `chrome://extensions/`
2. 找到Web3自动交易助手
3. 点击刷新按钮

## 报告错误

如果问题持续存在，请提供以下信息：
1. 完整的错误信息（从Console复制）
2. 页面URL
3. 浏览器版本
4. 扩展版本
5. 具体的操作步骤

这样可以帮助快速定位和解决问题。
