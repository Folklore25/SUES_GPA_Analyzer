// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // Crawler
  startCrawler: (loginInfo) => ipcRenderer.invoke('start-crawler', loginInfo),
  onCrawlerProgress: (callback) => ipcRenderer.on('crawler-progress', (_event, data) => callback(data)),
  removeCrawlerProgressListener: (callback) => ipcRenderer.removeListener('crawler-progress', callback),
  
  // Course Data
  loadCourseData: () => ipcRenderer.invoke('load-course-data'),
  
  // User Info
  saveUserInfo: (userInfo) => ipcRenderer.invoke('save-user-info', userInfo),
  loadUserInfo: () => ipcRenderer.invoke('load-user-info'),

  // Data Deletion
  deleteUserData: () => ipcRenderer.invoke('delete-user-data'),
});