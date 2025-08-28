// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Securely expose APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  startCrawler: (loginInfo) => ipcRenderer.invoke('start-crawler', loginInfo),
  loadCourseData: () => ipcRenderer.invoke('load-course-data'),
  saveUserInfo: (userInfo) => ipcRenderer.invoke('save-user-info', userInfo),
  loadUserInfo: () => ipcRenderer.invoke('load-user-info'),
  deleteUserData: () => ipcRenderer.invoke('delete-user-data'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),

  onBrowserDownloadProgress: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('browser-download-progress', subscription);
    return () => ipcRenderer.removeListener('browser-download-progress', subscription);
  },
});
