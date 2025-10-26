// 扩展测试脚本
// 这个脚本可以帮助验证扩展的基本功能

console.log('🔧 Web3交易助手扩展测试脚本');
console.log('============================');

// 检查必需文件
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'content.js',
  'background.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

console.log('\n📁 文件检查:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ 错误: 缺少必需文件，扩展无法加载');
  process.exit(1);
}

// 验证manifest.json
console.log('\n📋 Manifest验证:');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  
  // 检查必需字段
  const requiredFields = ['manifest_version', 'name', 'version', 'description'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`✅ ${field}: ${manifest[field]}`);
    } else {
      console.log(`❌ 缺少必需字段: ${field}`);
      allFilesExist = false;
    }
  });

  // 检查权限
  if (manifest.permissions && manifest.permissions.length > 0) {
    console.log(`✅ 权限配置: ${manifest.permissions.join(', ')}`);
  }

  // 检查host_permissions
  if (manifest.host_permissions && manifest.host_permissions.length > 0) {
    console.log(`✅ 主机权限: ${manifest.host_permissions.join(', ')}`);
  }

} catch (error) {
  console.log(`❌ Manifest解析错误: ${error.message}`);
  allFilesExist = false;
}

// 检查图标
console.log('\n🖼️ 图标检查:');
const iconSizes = ['16', '48', '128'];
iconSizes.forEach(size => {
  const iconPath = path.join(__dirname, 'icons', `icon${size}.png`);
  const stats = fs.statSync(iconPath);
  console.log(`✅ icon${size}.png: ${stats.size} bytes`);
});

if (allFilesExist) {
  console.log('\n🎉 所有检查通过！扩展应该可以正常加载。');
  console.log('\n📋 下一步:');
  console.log('1. 打开 Chrome 浏览器');
  console.log('2. 访问 chrome://extensions/');
  console.log('3. 开启"开发者模式"');
  console.log('4. 点击"加载已解压的扩展程序"');
  console.log('5. 选择项目文件夹');
  console.log('6. 扩展应该成功加载并显示图标');
} else {
  console.log('\n❌ 扩展配置有问题，请检查上述错误');
  process.exit(1);
}
