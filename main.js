const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const Store = require('electron-store');

// 保持对窗口对象的全局引用，如果不这么做，当JavaScript对象被垃圾回收时，窗口会自动关闭
let mainWindow;

// 初始化electron-store
const store = new Store();

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

// 保存用户信息
ipcMain.handle('save-user-info', async (event, userInfo) => {
  try {
    store.set('user-info', userInfo);
    return { success: true };
  } catch (error) {
    throw new Error('保存用户信息失败');
  }
});

// 读取用户信息
ipcMain.handle('load-user-info', async () => {
  try {
    const userInfo = store.get('user-info');
    return userInfo || {};
  } catch (error) {
    throw new Error('读取用户信息失败');
  }
});