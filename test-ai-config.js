const { app, BrowserWindow } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// 简单的测试函数，模拟AI调用流程
async function testAIService() {
  console.log('开始测试AI服务配置...');

  // 1. 检查API密钥文件是否存在
  const assetsPath = path.join(__dirname, 'private', 'assets.bin');
  try {
    await fs.access(assetsPath);
    console.log('✓ assets.bin 文件存在');
    const apiKey = await fs.readFile(assetsPath, 'utf8');
    console.log('✓ API密钥已读取:', apiKey.substring(0, 10) + '...');
  } catch (error) {
    console.log('✗ 无法访问assets.bin文件:', error.message);
  }

  // 2. 检查aiModels.json配置
  try {
    const aiModels = require('./src/utils/aiModels.json');
    console.log('✓ AI模型配置已加载:', aiModels.length, '个模型');
    const freemiumModel = aiModels.find(m => m.type === 'freemium');
    console.log('✓ 免费模型:', freemiumModel ? freemiumModel.id : '未找到');
  } catch (error) {
    console.log('✗ 无法加载AI模型配置:', error.message);
  }

  // 3. 检查aiService.js语法
  try {
    const aiService = require('./src/utils/aiService.js');
    console.log('✓ AI服务模块语法正确');
    console.log('✓ getAIRetakePlan函数已导出:', typeof aiService.getAIRetakePlan);
  } catch (error) {
    console.log('✗ AI服务模块语法错误:', error.message);
    return;
  }

  console.log('\n测试完成! 请确保:');
  console.log('1. assets.bin 文件中包含有效的API密钥');
  console.log('2. 网络连接正常');
  console.log('3. API密钥有效且未过期');
  console.log('4. 智谱AI服务目前运行正常');
}

// 运行测试
testAIService().then(() => {
  console.log('\n测试结束');
  process.exit(0);
}).catch(error => {
  console.error('测试过程中出现错误:', error);
  process.exit(1);
});