#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SimpleExtensionPacker {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.extensionName = 'web3-trading-assistant';
  }

  // 检查必需文件
  checkRequiredFiles() {
    const requiredFiles = [
      'manifest.json',
      'popup.html',
      'popup.css',
      'popup.js',
      'content.js',
      'background.js'
    ];

    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(this.rootDir, file))
    );

    if (missingFiles.length > 0) {
      throw new Error(`缺少必需文件: ${missingFiles.join(', ')}`);
    }

    console.log('✅ 所有必需文件都存在');
  }

  // 使用系统zip命令打包
  createZipPackage() {
    const zipPath = path.join(this.rootDir, `${this.extensionName}.zip`);
    
    // 排除的文件模式
    const excludePatterns = [
      '*.git*',
      'node_modules/*',
      '*.DS_Store',
      'scripts/*',
      '*.log'
    ];

    const excludeArgs = excludePatterns.map(pattern => `-x "${pattern}"`).join(' ');
    
    try {
      const command = `cd "${this.rootDir}" && zip -r "${zipPath}" . ${excludeArgs}`;
      console.log('📦 创建ZIP包...');
      execSync(command, { stdio: 'inherit' });
      
      const stats = fs.statSync(zipPath);
      console.log(`✅ ZIP包创建成功: ${zipPath}`);
      console.log(`📏 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return zipPath;
    } catch (error) {
      throw new Error('ZIP包创建失败，请确保系统已安装zip命令');
    }
  }

  // 使用Chrome打包（如果可用）
  createCrxPackage() {
    try {
      // 检查Chrome是否安装
      execSync('which google-chrome || which chrome || which chromium-browser', { stdio: 'ignore' });
      
      console.log('🚀 使用Chrome命令行打包...');
      
      const keyPath = path.join(this.rootDir, 'key.pem');
      const crxPath = path.join(this.rootDir, `${this.extensionName}.crx`);

      // 如果私钥文件不存在，创建新的
      if (!fs.existsSync(keyPath)) {
        console.log('🔑 创建新的私钥文件...');
        fs.writeFileSync(keyPath, '');
      }

      const command = `chrome --pack-extension="${this.rootDir}" --pack-extension-key="${keyPath}"`;
      
      console.log(`执行命令: ${command}`);
      execSync(command, { stdio: 'inherit' });

      // 重命名生成的.crx文件
      const generatedCrx = path.join(this.rootDir, `${path.basename(this.rootDir)}.crx`);
      if (fs.existsSync(generatedCrx)) {
        fs.renameSync(generatedCrx, crxPath);
        const stats = fs.statSync(crxPath);
        console.log(`✅ CRX文件创建成功: ${crxPath}`);
        console.log(`📏 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        return crxPath;
      }

    } catch (error) {
      console.log('⚠️ Chrome命令行打包失败');
      console.log('提示: 确保Chrome已安装且在PATH中，或使用ZIP包');
      return null;
    }
  }

  // 显示打包结果
  showResults(zipPath, crxPath) {
    console.log('\n🎉 打包完成！');
    console.log('='.repeat(50));
    
    if (crxPath) {
      console.log(`📦 CRX文件: ${path.basename(crxPath)}`);
    }
    
    if (zipPath) {
      console.log(`📦 ZIP文件: ${path.basename(zipPath)}`);
    }
    
    console.log('\n📋 安装说明:');
    console.log('1. 开发者模式安装:');
    console.log('   - 打开 chrome://extensions/');
    console.log('   - 开启"开发者模式"');
    console.log('   - 点击"加载已解压的扩展程序"');
    console.log('   - 选择项目文件夹');
    
    if (crxPath) {
      console.log('2. CRX安装:');
      console.log('   - 将.crx文件拖拽到扩展程序页面');
    }
    
    console.log('3. 详细说明请查看 DEVELOPMENT.md');
    console.log('='.repeat(50));
  }

  // 主打包流程
  async pack() {
    try {
      console.log('🚀 开始打包Web3交易助手扩展程序...\n');

      // 步骤1: 检查文件
      this.checkRequiredFiles();

      // 步骤2: 创建ZIP包
      const zipPath = this.createZipPackage();

      // 步骤3: 尝试创建CRX包
      const crxPath = this.createCrxPackage();

      // 步骤4: 显示结果
      this.showResults(zipPath, crxPath);

    } catch (error) {
      console.error('❌ 打包失败:', error.message);
      console.log('\n💡 解决方案:');
      console.log('1. 确保所有必需文件都存在');
      console.log('2. 确保系统已安装zip命令');
      console.log('3. 或者手动在Chrome扩展页面打包');
      process.exit(1);
    }
  }
}

// 执行打包
const packer = new SimpleExtensionPacker();
packer.pack();
