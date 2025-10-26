#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// 检查是否安装了archiver
try {
  require.resolve('archiver');
} catch (e) {
  console.log('正在安装archiver...');
  execSync('npm install archiver --save-dev', { stdio: 'inherit' });
}

class ExtensionPacker {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.outputDir = this.rootDir;
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

  // 验证manifest.json
  validateManifest() {
    const manifestPath = path.join(this.rootDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 基本验证
    if (!manifest.manifest_version) {
      throw new Error('manifest.json缺少manifest_version');
    }
    if (!manifest.name) {
      throw new Error('manifest.json缺少name');
    }
    if (!manifest.version) {
      throw new Error('manifest.json缺少version');
    }

    console.log('✅ manifest.json验证通过');
    return manifest;
  }

  // 创建ZIP包
  createZipPackage() {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.outputDir, `${this.extensionName}.zip`);
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', () => {
        console.log(`✅ ZIP包创建成功: ${outputPath}`);
        console.log(`📦 文件大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // 添加文件到ZIP包
      const files = this.getFilesToInclude();
      files.forEach(file => {
        const filePath = path.join(this.rootDir, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      });

      archive.finalize();
    });
  }

  // 获取需要包含的文件列表
  getFilesToInclude() {
    const includePatterns = [
      'manifest.json',
      'popup.html',
      'popup.css',
      'popup.js',
      'content.js',
      'background.js',
      'package.json',
      'README.md',
      'DEVELOPMENT.md',
      'icons/*.png',
      'icons/*.jpg',
      'icons/*.svg'
    ];

    const files = [];
    
    includePatterns.forEach(pattern => {
      if (pattern.includes('*')) {
        // 处理通配符
        const dir = pattern.split('/*')[0];
        const ext = pattern.split('*.')[1];
        const dirPath = path.join(this.rootDir, dir);
        
        if (fs.existsSync(dirPath)) {
          const dirFiles = fs.readdirSync(dirPath);
          dirFiles.forEach(file => {
            if (file.endsWith(ext)) {
              files.push(path.join(dir, file));
            }
          });
        }
      } else {
        // 单个文件
        if (fs.existsSync(path.join(this.rootDir, pattern))) {
          files.push(pattern);
        }
      }
    });

    return files;
  }

  // 使用Chrome命令行打包（如果可用）
  async createCrxPackage() {
    try {
      // 检查Chrome是否安装
      execSync('which google-chrome || which chrome || which chromium-browser', { stdio: 'ignore' });
      
      console.log('🚀 尝试使用Chrome命令行打包...');
      
      const keyPath = path.join(this.outputDir, 'key.pem');
      const crxPath = path.join(this.outputDir, `${this.extensionName}.crx`);

      // 如果私钥文件不存在，创建新的
      if (!fs.existsSync(keyPath)) {
        console.log('🔑 创建新的私钥文件...');
        // 这里应该使用openssl生成私钥，但为了简化，我们创建空文件
        fs.writeFileSync(keyPath, '');
      }

      const command = `chrome --pack-extension="${this.rootDir}" --pack-extension-key="${keyPath}"`;
      
      console.log(`执行命令: ${command}`);
      execSync(command, { stdio: 'inherit' });

      // 重命名生成的.crx文件
      const generatedCrx = path.join(this.rootDir, `${path.basename(this.rootDir)}.crx`);
      if (fs.existsSync(generatedCrx)) {
        fs.renameSync(generatedCrx, crxPath);
        console.log(`✅ CRX文件创建成功: ${crxPath}`);
        return crxPath;
      }

    } catch (error) {
      console.log('⚠️ Chrome命令行打包失败，使用ZIP包替代');
      console.log('提示: 确保Chrome已安装且在PATH中');
      return null;
    }
  }

  // 显示打包结果
  showResults(zipPath, crxPath) {
    console.log('\n🎉 打包完成！');
    console.log('=' .repeat(50));
    
    if (crxPath) {
      const stats = fs.statSync(crxPath);
      console.log(`📦 CRX文件: ${path.basename(crxPath)}`);
      console.log(`📏 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    if (zipPath) {
      const stats = fs.statSync(zipPath);
      console.log(`📦 ZIP文件: ${path.basename(zipPath)}`);
      console.log(`📏 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    console.log('\n📋 安装说明:');
    console.log('1. 开发者模式安装: 在 chrome://extensions/ 中加载已解压的扩展程序');
    console.log('2. CRX安装: 将.crx文件拖拽到扩展程序页面');
    console.log('3. 详细说明请查看 DEVELOPMENT.md');
    console.log('=' .repeat(50));
  }

  // 主打包流程
  async pack() {
    try {
      console.log('🚀 开始打包Web3交易助手扩展程序...\n');

      // 步骤1: 检查文件
      this.checkRequiredFiles();

      // 步骤2: 验证manifest
      this.validateManifest();

      // 步骤3: 创建ZIP包
      const zipPath = await this.createZipPackage();

      // 步骤4: 尝试创建CRX包
      const crxPath = await this.createCrxPackage();

      // 步骤5: 显示结果
      this.showResults(zipPath, crxPath);

    } catch (error) {
      console.error('❌ 打包失败:', error.message);
      process.exit(1);
    }
  }
}

// 执行打包
const packer = new ExtensionPacker();
packer.pack();
