const path = require('path');
const IniHelper = require('./src/utils/iniHelper');

// INI文件路径在程序运行目录
const iniPath = path.join(__dirname, 'user-info.ini');
console.log('INI文件路径:', iniPath);

// 创建INI助手实例
const iniHelper = new IniHelper(iniPath);

// 读取并显示INI文件内容
async function checkIniFile() {
  try {
    const data = await iniHelper.read();
    console.log('INI文件内容:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('读取INI文件失败:', error.message);
  }
}

checkIniFile();