// Service Worker 测试脚本
// 这个脚本检查background.js是否有语法错误

const fs = require('fs');
const path = require('path');

console.log('🔧 Service Worker 语法检查');
console.log('==========================');

const backgroundPath = path.join(__dirname, 'background.js');
const backgroundCode = fs.readFileSync(backgroundPath, 'utf8');

console.log('\n📋 检查background.js语法...');

try {
    // 尝试解析代码来检查语法
    new Function(backgroundCode);
    console.log('✅ background.js语法正确');
    
    // 检查是否有常见的Service Worker问题
    const lines = backgroundCode.split('\n');
    let hasIssues = false;
    
    lines.forEach((line, index) => {
        // 检查是否有window对象的使用（Service Worker中不可用）
        if (line.includes('window.') && !line.includes('//')) {
            console.log(`⚠️ 第${index + 1}行: Service Worker中不应使用window对象`);
            hasIssues = true;
        }
        
        // 检查是否有document对象的使用（Service Worker中不可用）
        if (line.includes('document.') && !line.includes('//')) {
            console.log(`⚠️ 第${index + 1}行: Service Worker中不应使用document对象`);
            hasIssues = true;
        }
    });
    
    if (!hasIssues) {
        console.log('✅ 没有发现Service Worker兼容性问题');
    }
    
    console.log('\n🎉 Service Worker代码检查完成');
    console.log('\n💡 如果扩展仍然无法加载，请尝试:');
    console.log('1. 在Chrome扩展页面完全移除扩展');
    console.log('2. 重新加载扩展');
    console.log('3. 检查Chrome开发者工具Console中的错误信息');
    
} catch (error) {
    console.log(`❌ background.js语法错误: ${error.message}`);
    process.exit(1);
}
