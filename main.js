const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const IniHelper = require('./src/utils/iniHelper');

// 保持对窗口对象的全局引用，如果不这么做，当JavaScript对象被垃圾回收时，窗口会自动关闭
let mainWindow;

// 初始化INI文件助手，将用户信息保存在程序运行目录中
const iniHelper = new IniHelper(path.join(__dirname, 'user-info.ini'));

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

  // 加载应用的index.html
  mainWindow.loadFile('public/index.html');

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    // 取消对窗口对象的引用
    mainWindow = null;
  });
}

// Electron会在初始化后调用这个方法
// 部分API只能在此事件发生后使用
app.whenReady().then(() => {
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
    // Fork子进程执行爬虫
    const crawlerProcess = fork(path.join(__dirname, 'src/crawler/crawler.js'));
    
    // 向爬虫进程发送登录信息
    crawlerProcess.send({ type: 'login', data: loginInfo });
    
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
  });
});

// 读取课程数据
ipcMain.handle('load-course-data', async () => {
  const fs = require('fs').promises;
  const filePath = path.join(__dirname, 'courses.csv');
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    throw new Error('无法读取课程数据文件');
  }
});

// 保存用户信息到INI文件
ipcMain.handle('save-user-info', async (event, userInfo) => {
  try {
    // 如果userInfo为空对象，表示要清除用户信息
    if (Object.keys(userInfo).length === 0) {
      // 清除INI文件中的用户信息
      await iniHelper.delete('user', 'username');
      await iniHelper.delete('user', 'password');
      await iniHelper.delete('user', 'url');
    } else {
      // 保存用户信息到INI文件
      await iniHelper.set('user', 'username', userInfo.username || '');
      await iniHelper.set('user', 'password', userInfo.password || '');
      await iniHelper.set('user', 'url', userInfo.url || '');
    }
    return { success: true };
  } catch (error) {
    throw new Error('保存用户信息失败: ' + error.message);
  }
});

// 从INI文件读取用户信息
ipcMain.handle('load-user-info', async () => {
  try {
    const username = await iniHelper.get('user', 'username', '');
    const password = await iniHelper.get('user', 'password', '');
    const url = await iniHelper.get('user', 'url', '');
    
    // 如果用户名为空，返回空对象
    if (!username) {
      return {};
    }
    
    return {
      username,
      password,
      url
    };
  } catch (error) {
    throw new Error('读取用户信息失败: ' + error.message);
  }
});