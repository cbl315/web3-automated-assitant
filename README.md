# Variational Omni 自动交易助手

一个专门针对Variational Omni交易所的浏览器插件，支持自动市价开单和市价平仓功能。

## 🚀 核心功能

- **市价开单**: 快速执行市价买入BTC订单
- **市价平仓**: 一键平仓现有持仓
- **自动循环**: 开仓→平仓→等待→重复
- **智能重试**: 自动处理按钮禁用状态
- **Variational Omni专用**: 专门针对omni.variational.io交易所优化

## 📦 安装使用

### 快速安装（推荐）

1. **下载ZIP包**: 使用项目中的 `web3-trading-assistant.zip`
2. **解压文件**: 右键点击ZIP文件 → "全部解压缩"
3. **安装扩展**:
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的项目文件夹
4. **验证安装**: 扩展将显示在工具栏中

### 系统要求

- **操作系统**: Windows 10/11, macOS 10.14+, Linux
- **浏览器**: Chrome 88+ (支持Manifest V3), Edge 88+
- **网络**: 能够访问 `https://omni.variational.io`

## 🎯 使用指南

### 自动交易流程

1. **访问交易所**: 打开 https://omni.variational.io
2. **设置开仓金额**: 在扩展中设置每次开仓的金额
3. **开始自动交易**: 点击"开始自动交易"按钮
4. **自动执行**:
   - 检查货币单位是否为美元($)，如果不是则自动切换
   - 设置开仓金额
   - 点击"买 BTC"按钮开仓
   - 等待2秒
   - 点击"关闭"按钮平仓
   - 点击"卖出平仓"确认平仓
   - 等待10秒后重复
5. **停止交易**: 点击"停止自动交易"按钮

### 技术特点

- **稳定选择器**: 使用data-testid定位关键元素
  - 开仓金额输入框: `[data-testid="quantity-input"]`
  - 货币单位切换: `[data-testid="input-mode-toggle"]`
  - 买入按钮: `[data-testid="submit-button"]`
  - 仓位表格行: `[data-testid="positions-table-row"]`
  - 确认平仓按钮: `[data-testid="close-position-button"]`
- **智能重试**: 最大重试10次，间隔500ms
- **详细日志**: 完整的操作日志输出

## 🔧 故障排除

### 常见问题

**扩展未加载**
- 重新加载扩展，检查控制台错误

**按钮无法点击**
- 确保在正确的交易页面
- 检查页面是否完全加载
- 查看Console日志获取详细错误信息

**自动交易出错**
- 按F12打开开发者工具
- 切换到Console标签页查看错误详情
- 检查是否有持仓可以平仓

### 调试方法

在Console中手动测试按钮：
```javascript
// 测试买入按钮
const buyButton = document.querySelector('[data-testid="submit-button"]');
console.log('买入按钮:', buyButton);

// 测试关闭按钮
const closeButton = document.querySelector('button[class*="border-azure"]');
console.log('关闭按钮:', closeButton);
```

## 📁 项目结构

```
web3-automated-assistant/
├── manifest.json          # 插件配置文件
├── popup.html            # 弹出窗口界面
├── popup.css             # 弹出窗口样式
├── popup.js              # 弹出窗口逻辑
├── content.js            # 内容脚本（交易所页面操作）
├── background.js         # 后台脚本
├── icons/                # 插件图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/              # 打包脚本
│   ├── pack.js
│   └── simple-pack.js
└── README.md             # 说明文档
```

## ⚠️ 安全提示

**重要**: 本工具仅供学习和研究使用：
- 当前版本为演示版本，使用模拟交易逻辑
- 在生产环境使用前，请充分测试并了解风险
- 请勿在真实账户中使用未经充分测试的版本
- 作者不对使用本工具造成的任何资金损失负责

## 🛠️ 开发说明

### 本地开发
1. 在Chrome扩展程序页面加载项目文件夹
2. 开启开发者模式
3. 修改代码后点击刷新按钮重新加载

### 打包扩展
```bash
node scripts/simple-pack.js
```

### 环境要求
- Chrome 浏览器 88+
- 支持 Manifest V3

## 📄 许可证

MIT License

---

**注意**: 请在充分了解风险的情况下谨慎使用本工具。
