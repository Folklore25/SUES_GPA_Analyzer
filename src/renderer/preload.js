// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 启动爬虫
  startCrawler: (loginInfo) => ipcRenderer.invoke('start-crawler', loginInfo),
  
  // 监听爬虫进度更新
  onCrawlerProgress: (callback) => ipcRenderer.on('crawler-progress', (_event, data) => callback(data)),
  
  // 移除爬虫进度监听器
  removeCrawlerProgressListener: (callback) => ipcRenderer.removeListener('crawler-progress', callback),
  
  // 加载课程数据
  loadCourseData: () => ipcRenderer.invoke('load-course-data'),
  
  // 监听课程数据加载完成
  onLoadCourseData: (callback) => ipcRenderer.on('course-data-loaded', (_event, data) => callback(data)),
  
  // 移除课程数据监听器
  removeLoadCourseDataListener: (callback) => ipcRenderer.removeListener('course-data-loaded', callback),
  
  // 保存用户信息
  saveUserInfo: (userInfo) => ipcRenderer.invoke('save-user-info', userInfo),
  
  // 读取用户信息
  loadUserInfo: () => ipcRenderer.invoke('load-user-info')
});