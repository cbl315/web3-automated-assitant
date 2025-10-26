# 开发与调试指南

## 本地调试扩展程序

### 方法一：开发者模式加载（推荐用于开发）

1. **打开Chrome扩展程序页面**
   - 在Chrome浏览器地址栏输入：`chrome://extensions/`
   - 或者点击菜单 → 更多工具 → 扩展程序

2. **开启开发者模式**
   - 在页面右上角找到"开发者模式"开关
   - 点击开启开发者模式

3. **加载扩展程序**
   - 点击"加载已解压的扩展程序"按钮
   - 选择本项目文件夹
   - 扩展程序将立即加载并显示在列表中

4. **调试扩展程序**
   - **Popup调试**: 点击扩展图标打开popup，右键点击popup窗口 → 检查
   - **Content Script调试**: 在交易所页面按F12打开开发者工具，在Console中查看日志
   - **Background Script调试**: 在扩展程序页面点击"service worker"链接

### 方法二：使用开发者工具

1. **实时重载**
   - 在扩展程序页面找到已加载的扩展
   - 点击"刷新"图标可以重新加载扩展
   - 修改代码后需要刷新扩展才能生效

2. **查看日志**
   - Popup和Content Script的日志在各自页面的Console中
   - Background Script的日志在Service Worker控制台中

3. **断点调试**
   - 在Sources面板中找到扩展文件
   - 设置断点进行调试

## 打包.crx文件

### 方法一：使用Chrome开发者模式打包

1. **准备扩展程序**
   - 确保所有文件都在项目文件夹中
   - 确保manifest.json配置正确

2. **打包扩展程序**
   - 打开 `chrome://extensions/`
   - 找到您的扩展程序
   - 点击"打包扩展程序"按钮
   - 选择扩展程序根目录
   - 选择私钥文件（如无则留空创建新私钥）
   - 点击"打包扩展程序"

3. **获取.crx文件**
   - 打包成功后会在项目目录生成.crx文件
   - 同时会生成.pem私钥文件（重要！请妥善保管）

### 方法二：使用命令行打包

1. **安装Chrome浏览器**
   - 确保已安装Google Chrome浏览器

2. **使用Chrome命令行工具**
   ```bash
   # 在项目根目录执行
   chrome --pack-extension=./ --pack-extension-key=./key.pem
   ```

3. **或者使用npm脚本**
   ```bash
   npm run pack
   ```

### 方法三：使用第三方工具

1. **使用crx工具**
   ```bash
   # 安装crx工具
   npm install -g crx
   
   # 打包扩展
   crx pack . -o web3-trading-assistant.crx
   ```

2. **使用web-ext工具**
   ```bash
   # 安装web-ext
   npm install -g web-ext
   
   # 打包扩展
   web-ext build
   ```

## 安装.crx文件

### 方法一：拖拽安装
1. 打开 `chrome://extensions/`
2. 将.crx文件拖拽到扩展程序页面
3. 确认安装

### 方法二：开发者模式安装
1. 开启开发者模式
2. 点击"加载已解压的扩展程序"
3. 选择解压后的扩展文件夹

## 开发工作流程

### 1. 开发阶段
```bash
# 1. 在Chrome中加载未打包的扩展
# 2. 修改代码
# 3. 在扩展程序页面点击刷新
# 4. 测试功能
# 5. 重复2-4步
```

### 2. 测试阶段
```bash
# 1. 打包扩展程序
npm run pack

# 2. 在新Chrome实例中测试安装
# 3. 验证所有功能正常工作
```

### 3. 发布阶段
```bash
# 1. 更新版本号
# 2. 打包最终版本
# 3. 提交到Chrome Web Store
```

## 常见问题解决

### Service Worker注册失败 (Status code: 15)
- 完全移除扩展后重新加载
- 检查background.js是否有语法错误
- 确保没有在Service Worker中使用DOM API (window, document等)
- 运行测试脚本: `node test-service-worker.js`

### 扩展无法加载
- 检查manifest.json语法是否正确
- 检查文件路径是否正确
- 检查权限配置是否完整
- 运行测试脚本: `node test-extension.js`

### 功能不工作
- 检查Console中的错误信息
- 确认Content Script是否在目标页面加载
- 检查popup与content script的通信

### 打包失败
- 确保所有必需文件都存在
- 检查manifest.json的完整性
- 确认没有使用禁止的API

## 调试技巧

### 1. 使用console.log
```javascript
// 在popup.js中
console.log('Popup loaded');

// 在content.js中  
console.log('Content script injected');

// 在background.js中
console.log('Background service started');
```

### 2. 使用Chrome DevTools
- 使用Network面板检查API调用
- 使用Application面板检查存储
- 使用Performance面板分析性能

### 3. 错误处理
```javascript
try {
  // 你的代码
} catch (error) {
  console.error('Error:', error);
  // 发送错误报告
}
```

## 最佳实践

1. **版本控制**
   - 每次发布前更新版本号
   - 使用语义化版本号

2. **代码质量**
   - 使用ESLint检查代码
   - 编写清晰的注释
   - 模块化代码结构

3. **安全性**
   - 最小化权限请求
   - 验证用户输入
   - 使用HTTPS连接

4. **用户体验**
   - 提供清晰的错误提示
   - 优化加载性能
   - 支持响应式设计
