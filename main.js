const { app, BrowserWindow, ipcMain, Menu, dialog, utilityProcess } = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
// IniHelper will be imported dynamically when needed
// keytar will be imported dynamically when needed

// @Github:Folklore25
const SERVICE_NAME = 'SUES_GPA_Analyzer'; // @Github:Folklore25

// 保持对窗口对象的全局引用，如果不这么做，当JavaScript对象被垃圾回收时，窗口会自动关闭
let mainWindow; // @Github:Folklore25

// --- Path Setup ---
// Get the userData path once app is ready
let userDataPath; // @Github:Folklore25
app.on('ready', () => {
  userDataPath = app.getPath('userData'); // @Github:Folklore25
});

// Function to get IniHelper with the correct path
async function getIniHelper() { // @Github:Folklore25
  // Ensure userDataPath is available
  if (!userDataPath) { // @Github:Folklore25
    userDataPath = app.getPath('userData');
  }
  const IniHelper = require('./src/utils/iniHelper');
  return new IniHelper(path.join(userDataPath, 'user-info.ini')); // @Github:Folklore25
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({ // @Github:Folklore25
    width: 1200,
    height: 800,
    webPreferences: { // @Github:Folklore25
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src/renderer/preload.js') // @Github:Folklore25
    }
  });

  // Remove the application menu
  Menu.setApplicationMenu(null); // @Github:Folklore25

  // Load from Vite dev server in development, or from local file in production
  if (!app.isPackaged) { // @Github:Folklore25
    // Development: Load from Vite server
    mainWindow.loadURL('http://localhost:5173');
    // Automatically open DevTools for debugging
    mainWindow.webContents.openDevTools(); // @Github:Folklore25
  } else {
    // Production: Load from built file using file:// protocol
    mainWindow.loadURL(url.format({ // @Github:Folklore25
      pathname: path.join(__dirname, 'frontend', 'dist', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', function () { // @Github:Folklore25
    // 取消对窗口对象的引用
    mainWindow = null; // @Github:Folklore25
  });
}

// --- Data Migration ---
async function migrateDataIfNeeded() { // @Github:Folklore25
  const oldConfigPath = path.join(__dirname, 'user-info.ini');

  try {
    await fs.access(oldConfigPath); // Check if old config exists // @Github:Folklore25
    console.log('发现旧的配置文件，开始迁移...');

    const IniHelper = require('./src/utils/iniHelper');
    const oldIniHelper = new IniHelper(oldConfigPath);
    const username = await oldIniHelper.get('user', 'username', ''); // @Github:Folklore25
    const password = await oldIniHelper.get('user', 'password', ''); // Plain text password
    const urlValue = await oldIniHelper.get('user', 'url', ''); // @Github:Folklore25

    if (username && password) { // @Github:Folklore25
      const newIniHelper = await getIniHelper();
      await newIniHelper.set('user', 'username', username);
      await newIniHelper.set('user', 'url', urlValue); // @Github:Folklore25
      const keytar = require('keytar');
      await keytar.setPassword(SERVICE_NAME, username, password);
      console.log(`用户 ${username} 的凭据已成功迁移。`); // @Github:Folklore25
    }

    await fs.unlink(oldConfigPath);
    console.log('旧的配置文件已被成功删除。'); // @Github:Folklore25

  } catch (error) {
    if (error.code !== 'ENOENT') { // @Github:Folklore25
      console.error('迁移旧配置文件时发生错误:', error);
    }
  }
}


// Electron会在初始化后调用这个方法
app.whenReady().then(async () => { // @Github:Folklore25
  // Set PLAYWRIGHT_BROWSERS_PATH for packaged app
  if (app.isPackaged) { // @Github:Folklore25
    // When packaged with Electron Forge and extraResource, browsers are in 
    // resources/playwright-core/.local-browsers
    const path = require('path');
    const browsersPath = path.join(process.resourcesPath, 'playwright-core', '.local-browsers'); // @Github:Folklore25
    process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;
  }
  
  await migrateDataIfNeeded();
  createWindow(); // @Github:Folklore25
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(); // @Github:Folklore25
  });
});

// 当所有窗口都关闭时退出
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Add a new IPC handler for checking and downloading browser





// --- IPC Handlers ---

ipcMain.handle('start-crawler', async (event, loginInfo) => {
  try {
    // Determine the correct browsers path，it's installed in node_modules/playwright/.local-browsers by default
    let browsersPath = path.join(__dirname, 'node_modules', 'playwright-core', '.local-browsers');
    
    // Check if PLAYWRIGHT_BROWSERS_PATH is already set in the environment and not '0'
    if (process.env.PLAYWRIGHT_BROWSERS_PATH && process.env.PLAYWRIGHT_BROWSERS_PATH !== '0') {
      browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
    }
    // If PLAYWRIGHT_BROWSERS_PATH is '0', we keep the default browsersPath
    
    // Check if browser is installed
    let browserInstalled = false;
    try {
      const browserDirs = await fs.readdir(browsersPath);
      for (const dir of browserDirs) {
        if (dir.startsWith('chromium')) {
          const exePath = path.join(browsersPath, dir, 'chrome-win', 'chrome.exe');
          await fs.access(exePath); // Check for executable existence
          browserInstalled = true;
          break;
        }
      }
    } catch (error) {
      browserInstalled = false; // Directory or executable not found
    }

    return new Promise((resolve, reject) => {
      let settled = false;

      // When packaged in asar, we need to extract the path correctly
      const isProduction = app.isPackaged;
      const crawlerPath = isProduction 
        ? path.join(app.getAppPath(), 'src', 'crawler', 'crawler.js')// @Github:Folklore25
        : path.join(__dirname, 'src', 'crawler', 'crawler.js');

      // Create a message channel for communication
      const { MessageChannelMain } = require('electron');// @Github:Folklore25
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

      // Handle PLAYWRIGHT_BROWSERS_PATH environment variable
      const env = { 
        ...process.env, 
        NODE_ENV: app.isPackaged ? 'production' : 'development'// @Github:Folklore25
      };
      
      // Only set PLAYWRIGHT_BROWSERS_PATH if it's not "0"
      if (browsersPath !== '0') {
        env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;
      }
      // If browsersPath is "0", we don't set it at all, letting Playwright use default behavior

      const crawlerProcess = utilityProcess.fork(crawlerPath, [], {
        env: env,
        serviceName: 'sues-gpa-crawler',
        stdio: 'pipe' // Ensure stdio streams are piped
      });

      // Add error logging for debugging
      crawlerProcess.on('error', (error) => {
        console.error('爬虫进程启动失败:', error);
        if (settled) return;
        settled = true;
        reject(new Error(`爬虫进程启动失败: ${error.message}`));
      });

      crawlerProcess.on('spawn', () => {
        console.log('爬虫进程已成功启动');
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
          reject(new Error('爬虫进程已结束，但未返回有效数据。'));// @Github:Folklore25
        }
      });

      // Transfer port2 to the child process
      crawlerProcess.postMessage({ type: 'init' }, [port2]);
      
      // Send the start message with data
      crawlerProcess.postMessage({
        type: 'start',
        data: { loginInfo: loginInfo, userDataPath: app.getPath('userData') }
      });

      // Capture stdout and stderr for debugging
      crawlerProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Crawler stdout: ${output}`);
        // If we get an error message, we might want to report it
        if (output.toLowerCase().includes('error') || output.toLowerCase().includes('exception')) {
          console.error('Crawler error in stdout:', output);
        }
      });
      
      crawlerProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error(`Crawler stderr: ${output}`);
        // Forward error messages to the renderer if needed
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('crawler-error', output);
        }
      });
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
  const iniHelper = await getIniHelper();
  try {
    if (Object.keys(userInfo).length === 0 || !userInfo.username) {
      const oldUsername = await iniHelper.get('user', 'username', '');
      const keytar = require('keytar');// @Github:Folklore25
      if (oldUsername) await keytar.deletePassword(SERVICE_NAME, oldUsername);
      await iniHelper.delete('user', 'username');
      await iniHelper.delete('user', 'url');
    } else {
      await iniHelper.set('user', 'username', userInfo.username);
      await iniHelper.set('user', 'url', userInfo.url || '');
      const keytar = require('keytar');
      await keytar.setPassword(SERVICE_NAME, userInfo.username, userInfo.password);
    }
    return { success: true };
  } catch (error) {
    throw new Error('保存用户信息失败: ' + error.message);
  }
});

ipcMain.handle('load-user-info', async () => {
  const iniHelper = await getIniHelper();
  try {
    const username = await iniHelper.get('user', 'username', '');
    if (!username) return {};
    const keytar = require('keytar');
    const password = await keytar.getPassword(SERVICE_NAME, username);
    const urlValue = await iniHelper.get('user', 'url', '');
    return { username, password: password || '', url: urlValue };
  } catch (error) {
    throw new Error('读取用户信息失败: ' + error.message);
  }
});

// New handlers for data deletion


ipcMain.handle('delete-user-data', async () => {
  const iniHelper = await getIniHelper();
  const username = await iniHelper.get('user', 'username', '');
  const userData = app.getPath('userData');
  const coursesPath = path.join(userData, 'courses.csv');
  const iniPath = path.join(userData, 'user-info.ini');

  try {
    // Delete password from keychain
    if (username) {
      const keytar = require('keytar');
      await keytar.deletePassword(SERVICE_NAME, username);
    }
    // Delete files
    await fs.unlink(coursesPath).catch(err => { if (err.code !== 'ENOENT') throw err; });
    await fs.unlink(iniPath).catch(err => { if (err.code !== 'ENOENT') throw err; });
    return { success: true };
  } catch (error) {
    console.error('删除用户数据时发生错误:', error);// @Github:Folklore25
    throw new Error('删除用户数据失败: ' + error.message);
  }
});


