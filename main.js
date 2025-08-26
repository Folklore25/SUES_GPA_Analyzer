const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const IniHelper = require('./src/utils/iniHelper');
const keytar = require('keytar');

const SERVICE_NAME = 'SUES_GPA_Analyzer';

// 保持对窗口对象的全局引用，如果不这么做，当JavaScript对象被垃圾回收时，窗口会自动关闭
let mainWindow;

// --- Path Setup ---
// Get the userData path once app is ready
let userDataPath;
app.on('ready', () => {
  userDataPath = app.getPath('userData');
});

// Function to get IniHelper with the correct path
function getIniHelper() {
  // Ensure userDataPath is available
  if (!userDataPath) {
    userDataPath = app.getPath('userData');
  }
  return new IniHelper(path.join(userDataPath, 'user-info.ini'));
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src/renderer/preload.js')
    }
  });

  // Remove the application menu
  Menu.setApplicationMenu(null);

  // Load from Vite dev server in development, or from local file in production
  if (!app.isPackaged) {
    // Development: Load from Vite server
    mainWindow.loadURL('http://localhost:5173');
    // Optional: Open DevTools for debugging
    // mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built file
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    // 取消对窗口对象的引用
    mainWindow = null;
  });
}

// --- Data Migration ---
async function migrateDataIfNeeded() {
  const fs = require('fs').promises;
  const oldConfigPath = path.join(__dirname, 'user-info.ini');

  try {
    await fs.access(oldConfigPath); // Check if old config exists
    console.log('发现旧的配置文件，开始迁移...');

    const oldIniHelper = new IniHelper(oldConfigPath);
    const username = await oldIniHelper.get('user', 'username', '');
    const password = await oldIniHelper.get('user', 'password', ''); // Plain text password
    const url = await oldIniHelper.get('user', 'url', '');

    if (username && password) {
      // Data needs migration
      const newIniHelper = getIniHelper();
      
      // 1. Save non-sensitive data to new location
      await newIniHelper.set('user', 'username', username);
      await newIniHelper.set('user', 'url', url);

      // 2. Save password securely
      await keytar.setPassword(SERVICE_NAME, username, password);
      
      console.log(`用户 ${username} 的凭据已成功迁移。`);
    }

    // 3. Delete the old, insecure config file
    await fs.unlink(oldConfigPath);
    console.log('旧的配置文件已被成功删除。');

  } catch (error) {
    if (error.code === 'ENOENT') {
      // Old config file doesn't exist, no migration needed.
      // This is the normal case for new users or post-migration.
    } else {
      // Log any other errors during migration
      console.error('迁移旧配置文件时发生错误:', error);
    }
  }
}


// Electron会在初始化后调用这个方法
// 部分API只能在此事件发生后使用
app.whenReady().then(async () => {
  // Run migration before creating the window
  await migrateDataIfNeeded();

  createWindow();

  app.on('activate', function () {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口都关闭时退出
app.on('window-all-closed', function () {
  // 在macOS上，除非用户按下Cmd + Q，否则应用会保持活动状态
  if (process.platform !== 'darwin') app.quit();
});

// IPC处理程序
// 启动爬虫进程
ipcMain.handle('start-crawler', async (event, loginInfo) => {
  return new Promise((resolve, reject) => {
    // Fork子进程执行爬虫，传递环境变量
    const crawlerProcess = fork(path.join(__dirname, 'src/crawler/crawler.js'), [], {
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0'
      },
      // Use 'pipe' to avoid conflicts with the main process's stdio
      silent: true 
    });
    
    // Pass data to the crawler, including the writable userData path
    crawlerProcess.send({ 
      type: 'start', 
      data: {
        loginInfo: loginInfo,
        userDataPath: app.getPath('userData')
      }
    });
    
    // 监听爬虫进程的消息
    crawlerProcess.on('message', (message) => {
      if (message.type === 'progress') {
        // 向渲染进程发送进度更新
        mainWindow.webContents.send('crawler-progress', message.data);
      } else if (message.type === 'complete') {
        // 爬虫完成，返回结果
        resolve(message.data);
      } else if (message.type === 'error') {
        // 爬虫出错
        reject(new Error(message.data));
      }
    });
    
    // 监听爬虫进程的错误
    crawlerProcess.on('error', (error) => {
      reject(error);
    });

    // Optional: Log stdout/stderr from the crawler for debugging
    crawlerProcess.stdout.on('data', (data) => {
      console.log(`Crawler stdout: ${data}`);
    });
    crawlerProcess.stderr.on('data', (data) => {
      console.error(`Crawler stderr: ${data}`);
    });
  });
});

// 读取课程数据文件
ipcMain.handle('load-course-data', async () => {
  const fs = require('fs').promises;
  const filePath = path.join(app.getPath('userData'), 'courses.csv');
  
  console.log('正在尝试从可写目录读取课程数据文件:', filePath);
  
  try {
    // 检查文件是否存在
    await fs.access(filePath);
    console.log('课程数据文件存在');
    
    // 使用UTF-8编码读取CSV文件
    const data = await fs.readFile(filePath, 'utf8');
    console.log('课程数据文件读取成功，数据长度:', data.length);
    
    // 移除BOM标记（如果存在）
    const cleanedData = data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data;
    console.log('清理BOM后的数据长度:', cleanedData.length);
    
    return cleanedData;
  } catch (error) {
    console.error('读取课程数据文件失败:', error);
    // It's okay if the file doesn't exist on first run
    if (error.code === 'ENOENT') {
        return ''; // Return empty string if not found
    }
    throw new Error('无法读取课程数据文件: ' + error.message);
  }
});

// 保存用户信息
ipcMain.handle('save-user-info', async (event, userInfo) => {
  const iniHelper = getIniHelper();
  try {
    // If userInfo is empty, clear all info
    if (Object.keys(userInfo).length === 0 || !userInfo.username) {
      const oldUsername = await iniHelper.get('user', 'username', '');
      if (oldUsername) {
        await keytar.deletePassword(SERVICE_NAME, oldUsername);
      }
      await iniHelper.delete('user', 'username');
      await iniHelper.delete('user', 'url');
    } else {
      // Save non-sensitive info to INI
      await iniHelper.set('user', 'username', userInfo.username);
      await iniHelper.set('user', 'url', userInfo.url || '');
      // Save password securely
      await keytar.setPassword(SERVICE_NAME, userInfo.username, userInfo.password);
    }
    return { success: true };
  } catch (error) {
    console.error('保存用户信息失败:', error);
    throw new Error('保存用户信息失败: ' + error.message);
  }
});

// 读取用户信息
ipcMain.handle('load-user-info', async () => {
  const iniHelper = getIniHelper();
  try {
    const username = await iniHelper.get('user', 'username', '');
    const url = await iniHelper.get('user', 'url', '');
    
    if (!username) {
      return {};
    }
    
    const password = await keytar.getPassword(SERVICE_NAME, username);
    
    return {
      username,
      password: password || '',
      url
    };
  } catch (error) {
    console.error('读取用户信息失败:', error);
    throw new Error('读取用户信息失败: ' + error.message);
  }
});