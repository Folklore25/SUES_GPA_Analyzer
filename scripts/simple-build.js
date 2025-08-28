const fs = require('fs-extra');
const path = require('path');

async function build() {
  try {
    // 创建dist-webpack目录
    await fs.ensureDir('dist-webpack');
    
    // 复制主进程文件
    await fs.copy('main.js', 'dist-webpack/main.js');
    
    // 复制src目录
    await fs.copy('src', 'dist-webpack/src');
    
    // 复制frontend目录
    await fs.copy('frontend', 'dist-webpack/frontend');
    
    // 复制package.json并修改main字段
    const packageJson = await fs.readJson('package.json');
    packageJson.main = 'main.js';
    // 移除devDependencies以减小打包体积
    delete packageJson.devDependencies;
    // 保留build字段用于electron-packager
    await fs.writeJson('dist-webpack/package.json', packageJson, { spaces: 2 });
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();