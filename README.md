# Variational Omni 自动交易助手

一个专门针对Variational Omni交易所的浏览器插件，支持自动市价开单和市价平仓功能。

## 功能特性

### 🚀 核心功能
- **市价开单**: 快速执行市价买入BTC订单
- **市价平仓**: 一键平仓现有持仓
- **Variational Omni专用**: 专门针对omni.variational.io交易所优化
- **实时价格**: 显示当前交易对的最新价格
- **快速操作**: 预设快速开仓/平仓按钮

### ⚙️ 设置选项
- 自动确认交易
- 声音提醒
- 交易历史记录
- 个性化交易参数

## 安装说明

### 方法一：开发者模式加载（推荐用于开发和测试）
1. 下载或克隆本项目
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目文件夹
6. 扩展将立即加载并显示蓝色"T"图标

### 方法二：打包安装
1. 在项目根目录执行打包命令：`npm run pack`
2. 将生成的 `.crx` 文件拖拽到扩展程序页面安装

### 验证安装
运行测试脚本确保扩展配置正确：
```bash
node test-extension.js
```

## 使用指南

### 自动交易流程
1. **访问Variational Omni**: 打开 https://omni.variational.io
2. **设置交易对**: 输入要交易的币对，如 `BTCUSDT`
3. **设置开仓金额**: 输入每次开仓的金额
4. **开始自动交易**: 点击"开始自动交易"按钮
5. **自动循环执行**:
   - 执行市价开仓（自动点击"买 BTC"按钮）
   - 等待2秒
   - 执行市价平仓（自动点击"关闭"→"卖出平仓"）
   - 等待10秒
   - 重复上述流程
6. **停止交易**: 点击"停止自动交易"按钮结束循环

### Variational Omni专用功能
- **开仓操作**: 自动识别并点击"买 BTC"按钮 (data-testid="submit-button")
- **平仓操作**: 两步流程：
  1. 点击"关闭"按钮 (class包含border-azure和text-azure)
  2. 点击确认平仓按钮 (data-testid="close-position-button"包含"卖出平仓"文本)
- **自动交易**: 循环执行开仓→平仓→等待→重复
- **智能等待**: 自动处理弹出窗口和确认流程
- **专门针对omni.variational.io页面结构优化**

## 文件结构

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
└── README.md             # 说明文档
```

## 技术架构

### 插件组件
- **Popup**: 用户交互界面
- **Content Script**: 在Variational Omni页面中执行DOM操作
- **Background Script**: 处理插件后台逻辑和消息传递

### 支持的交易所
- ✅ Variational Omni (omni.variational.io)

## 安全说明

⚠️ **重要安全提示**

1. **模拟交易**: 当前版本为演示版本，使用模拟交易逻辑
2. **实际使用**: 在生产环境使用前，请充分测试并了解风险
3. **资金安全**: 请勿在真实账户中使用未经充分测试的版本
4. **API密钥**: 如需直接API交易，请妥善保管API密钥

## 开发说明

### 环境要求
- Chrome 浏览器 88+
- 支持 Manifest V3

### 本地开发
1. 克隆项目
2. 在 Chrome 扩展程序页面加载项目文件夹
3. 打开开发者工具调试

### 添加新交易所支持
1. 在 `content.js` 中添加新的交易所检测逻辑
2. 实现对应的交易执行函数
3. 更新 `manifest.json` 中的权限配置

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 免责声明

本工具仅供学习和研究使用，作者不对使用本工具造成的任何资金损失负责。请在充分了解风险的情况下谨慎使用。
