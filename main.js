const { app, BrowserWindow, ipcMain, Menu, dialog, utilityProcess } = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
// IniHelper will be imported dynamically when needed
// keytar will be imported dynamically when needed

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
async function getIniHelper() {
  // Ensure userDataPath is available
  if (!userDataPath) {
    userDataPath = app.getPath('userData');
  }
  const IniHelper = require('./src/utils/iniHelper');
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

    const IniHelper = require('./src/utils/iniHelper');
    const oldIniHelper = new IniHelper(oldConfigPath);
    const username = await oldIniHelper.get('user', 'username', '');
    const password = await oldIniHelper.get('user', 'password', ''); // Plain text password
    const urlValue = await oldIniHelper.get('user', 'url', '');

    if (username && password) {
      const newIniHelper = await getIniHelper();
      await newIniHelper.set('user', 'username', username);
      await newIniHelper.set('user', 'url', urlValue);
      const keytar = require('keytar');
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
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口都关闭时退出
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Add a new IPC handler for checking and downloading browser
ipcMain.handle('check-and-download-browser', async () => {
  try {
    console.log('Starting browser check/download process...');
    const browsersPath = await ensureBrowserInstalled();
    console.log('Browser check/download completed successfully');
    return { success: true, browsersPath };
  } catch (error) {
    console.error('Browser check/download failed:', error);
    return { success: false, error: error.message };
  }
});

// Add a new IPC handler for checking browser existence only
ipcMain.handle('check-browser-existence', async () => {
  const browsersPath = path.join(app.getPath('userData'), 'pw-browsers');
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

  return { installed: browserInstalled };
});

// --- Browser Installation ---
async function ensureBrowserInstalled() {
  const browsersPath = path.join(app.getPath('userData'), 'pw-browsers');
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

  if (browserInstalled) {
    console.log('Playwright browser is already installed.');
    return browsersPath;
  }

  // Browser not found, proceed with installation
  console.log('Browser not found, starting download process...');
  return new Promise((resolve, reject) => {
    console.log('Sending initial download progress message...');
    // Check if mainWindow exists before sending message
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('browser-download-progress', { message: '首次运行，正在下载浏览器...', value: 0 });
    }

    // When packaged in asar, we need to adjust the path to playwright CLI
    const isProduction = app.isPackaged;
    const playwrightCliPath = isProduction
      ? path.join(app.getAppPath(), 'node_modules', 'playwright', 'cli.js')
      : path.join(__dirname, 'node_modules', 'playwright', 'cli.js');

    console.log('Playwright CLI path:', playwrightCliPath);
    console.log('Browsers path:', browsersPath);
    console.log('Working directory:', isProduction ? app.getAppPath() : app.getAppPath());

    const downloaderProcess = utilityProcess.fork(
      playwrightCliPath,
      ['install', 'chromium'],
      {
        env: { 
          ...process.env, 
          PLAYWRIGHT_BROWSERS_PATH: browsersPath,
          NODE_ENV: app.isPackaged ? 'production' : 'development'
        },
        cwd: isProduction ? app.getAppPath() : app.getAppPath(),
        serviceName: 'playwright-browser-installer',
        stdio: 'pipe' // Explicitly set stdio to ensure streams are created
      }
    );

    console.log('Downloader process started with PID:', downloaderProcess.pid);

    downloaderProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Playwright Installer stdout: ${output}`); // Log for debugging

      // Regex to parse the percentage from Playwright's output
      const progressRegex = /(\d+)\%\s+of/;
      const match = output.match(progressRegex);

      if (match && match[1]) {
        const progressValue = parseInt(match[1], 10);
        let message = '正在下载依赖文件...';
        if (output.includes('Chromium')) {
          message = '正在下载 Chromium 浏览器...';
        } else if (output.includes('FFMPEG')) {
          message = '正在下载 FFMPEG (视频解码器)...';
        }
        console.log(`Download progress: ${progressValue}% - ${message}`);
        // Check if mainWindow exists before sending message
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('browser-download-progress', { message: message, value: progressValue });
        }
      }
    });

    downloaderProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`Playwright Installer stderr: ${output}`);
    });

    downloaderProcess.on('spawn', () => {
      console.log('Downloader process spawned successfully');
    });

    downloaderProcess.on('error', (err) => {
      console.error('Failed to start browser downloader process:', err);
      // Check if mainWindow exists before sending message
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('browser-download-progress', { message: '浏览器下载启动失败', value: 0 });
      }
      reject(err);
    });

    downloaderProcess.on('exit', (code) => {
      console.log(`Downloader process exited with code: ${code}`);
      // Check if mainWindow exists before sending message
      if (mainWindow && mainWindow.webContents) {
        if (code === 0) {
          mainWindow.webContents.send('browser-download-progress', { message: '浏览器下载完成!', value: 100 });
          console.log('Playwright browser downloaded successfully.');
          resolve(browsersPath);
        } else {
          const errorMessage = `浏览器下载失败，退出码: ${code}`;
          mainWindow.webContents.send('browser-download-progress', { message: errorMessage, value: 0 });
          reject(new Error(errorMessage));
        }
      } else {
        // If mainWindow is not available, just resolve/reject without sending message
        if (code === 0) {
          console.log('Playwright browser downloaded successfully.');
          resolve(browsersPath);
        } else {
          const errorMessage = `浏览器下载失败，退出码: ${code}`;
          reject(new Error(errorMessage));
        }
      }
    });
  });
}


// --- IPC Handlers ---

ipcMain.handle('start-crawler', async (event, loginInfo) => {
  try {
    // Instead of downloading browser here, just check if it exists
    const browsersPath = path.join(app.getPath('userData'), 'pw-browsers');
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

    if (!browserInstalled) {
      throw new Error('浏览器未安装，请重新登录以下载浏览器。');
    }

    return new Promise((resolve, reject) => {
      let settled = false;

      // When packaged in asar, we need to extract the path correctly
      const isProduction = app.isPackaged;
      const crawlerPath = isProduction 
        ? path.join(app.getAppPath(), 'src', 'crawler', 'crawler.js')
        : path.join(__dirname, 'src', 'crawler', 'crawler.js');

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
        env: { 
          ...process.env, 
          PLAYWRIGHT_BROWSERS_PATH: browsersPath,
          NODE_ENV: app.isPackaged ? 'production' : 'development'
        },
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
      const keytar = require('keytar');
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
    console.error('删除用户数据时发生错误:', error);
    throw new Error('删除用户数据失败: ' + error.message);
  }
});
