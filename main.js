const { app, BrowserWindow, ipcMain, Menu, dialog, utilityProcess } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
const IniHelper = require('./src/utils/iniHelper');
const keytar = require('keytar');

// Handle path for packaged app
const isDev = !app.isPackaged;
const appPath = isDev ? __dirname : path.join(process.resourcesPath, 'app');

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
    // Automatically open DevTools for debugging
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built file using file:// protocol
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'frontend', 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    // 取消对窗口对象的引用
    mainWindow = null;
  });
}

// --- Data Migration ---
async function migrateDataIfNeeded() {
  const oldConfigPath = path.join(__dirname, 'user-info.ini');

  try {
    await fs.access(oldConfigPath); // Check if old config exists
    console.log('发现旧的配置文件，开始迁移...');

    const oldIniHelper = new IniHelper(oldConfigPath);
    const username = await oldIniHelper.get('user', 'username', '');
    const password = await oldIniHelper.get('user', 'password', ''); // Plain text password
    const urlValue = await oldIniHelper.get('user', 'url', '');

    if (username && password) {
      const newIniHelper = getIniHelper();
      await newIniHelper.set('user', 'username', username);
      await newIniHelper.set('user', 'url', urlValue);
      await keytar.setPassword(SERVICE_NAME, username, password);
      console.log(`用户 ${username} 的凭据已成功迁移。`);
    }

    await fs.unlink(oldConfigPath);
    console.log('旧的配置文件已被成功删除。');

  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('迁移旧配置文件时发生错误:', error);
    }
  }
}


// Electron会在初始化后调用这个方法
app.whenReady().then(async () => {
  await migrateDataIfNeeded();
  createWindow();

  // Auto-updater
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-not-available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-error', err);
  });
  
  // Removed browser installation check

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口都关闭时退出
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

ipcMain.handle('start-crawler', async (event, loginInfo) => {
  try {
    return new Promise((resolve, reject) => {
      let settled = false;

      const crawlerPath = path.join(__dirname, 'src', 'crawler', 'crawler.js');

      // Create a message channel for communication
      const { MessageChannelMain } = require('electron');
      const { port1, port2 } = new MessageChannelMain();
      
      // Listen for messages from the child process
      port1.on('message', (e) => {
        const message = e.data;
        if (settled) return;
        if (message.type === 'complete') {
          settled = true;
          resolve(message.data);
        } else if (message.type === 'error') {
          settled = true;
          reject(new Error(message.data.message || JSON.stringify(message.data)));
        }
      });

      port1.start(); // Start listening for messages

      const crawlerProcess = utilityProcess.fork(crawlerPath, [], {
        serviceName: 'sues-gpa-crawler',
        stdio: 'pipe' // Ensure stdio streams are piped
      });

      crawlerProcess.on('error', (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });

      crawlerProcess.on('exit', (code) => {
        port1.close(); // Clean up the port
        if (settled) return;
        settled = true;
        if (code !== 0) {
          reject(new Error(`爬虫进程意外退出，退出码: ${code}`));
        } else {
          reject(new Error('爬虫进程已结束，但未返回有效数据。'));
        }
      });

      // Transfer port2 to the child process
      crawlerProcess.postMessage({ type: 'init' }, [port2]);
      
      // Send the start message with data
      crawlerProcess.postMessage({
        type: 'start',
        data: { loginInfo: loginInfo, userDataPath: app.getPath('userData') }
      });

      crawlerProcess.stdout.on('data', (data) => console.log(`Crawler stdout: ${data}`));
      crawlerProcess.stderr.on('data', (data) => console.error(`Crawler stderr: ${data}`));
    });
  } catch (error) {
    console.error("爬虫启动流程失败:", error);
    throw new Error('爬虫启动流程失败: ' + error.message);
  }
});

ipcMain.handle('load-course-data', async () => {
  const filePath = path.join(app.getPath('userData'), 'courses.csv');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data;
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw new Error('无法读取课程数据文件: ' + error.message);
  }
});

ipcMain.handle('save-user-info', async (event, userInfo) => {
  const iniHelper = getIniHelper();
  try {
    if (Object.keys(userInfo).length === 0 || !userInfo.username) {
      const oldUsername = await iniHelper.get('user', 'username', '');
      if (oldUsername) await keytar.deletePassword(SERVICE_NAME, oldUsername);
      await iniHelper.delete('user', 'username');
      await iniHelper.delete('user', 'url');
      await iniHelper.delete('user', 'showTutorialDialog');
    } else {
      await iniHelper.set('user', 'username', userInfo.username);
      await iniHelper.set('user', 'url', userInfo.url || '');
      // Save the showTutorialDialog preference
      if (userInfo.showTutorialDialog !== undefined) {
        await iniHelper.set('user', 'showTutorialDialog', userInfo.showTutorialDialog);
      }
      await keytar.setPassword(SERVICE_NAME, userInfo.username, userInfo.password);
    }
    return { success: true };
  } catch (error) {
    throw new Error('保存用户信息失败: ' + error.message);
  }
});

ipcMain.handle('load-user-info', async () => {
  const iniHelper = getIniHelper();
  try {
    const username = await iniHelper.get('user', 'username', '');
    if (!username) return {};
    const password = await keytar.getPassword(SERVICE_NAME, username);
    const urlValue = await iniHelper.get('user', 'url', '');
    // Load the showTutorialDialog preference
    const showTutorialDialog = await iniHelper.get('user', 'showTutorialDialog', 'true');
    return { username, password: password || '', url: urlValue, showTutorialDialog };
  } catch (error) {
    throw new Error('读取用户信息失败: ' + error.message);
  }
});

// New handlers for data deletion


ipcMain.handle('delete-user-data', async () => {
  const iniHelper = getIniHelper();
  const username = await iniHelper.get('user', 'username', '');
  const userData = app.getPath('userData');
  const coursesPath = path.join(userData, 'courses.csv');
  const iniPath = path.join(userData, 'user-info.ini');

  try {
    // Delete password from keychain
    if (username) {
      await keytar.deletePassword(SERVICE_NAME, username);
    }
    // Delete files
    await fs.unlink(coursesPath).catch(err => { if (err.code !== 'ENOENT') throw err; });
    await fs.unlink(iniPath).catch(err => { if (err.code !== 'ENOENT') throw err; });
    return { success: true };
  } catch (error) {
    console.error('删除用户数据时发生错误:', error);
    throw new Error('删除用户数据失败: ' + error.message);
  }
});

// Handler for opening external URLs
ipcMain.handle('open-external-url', async (event, url) => {
  const { shell } = require('electron');
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('打开外部链接时发生错误:', error);
    throw new Error('无法打开链接: ' + error.message);
  }
});

// --- Updater IPC Handlers ---

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('manual-check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.handle('restart-and-install', () => {
  autoUpdater.quitAndInstall();
});
