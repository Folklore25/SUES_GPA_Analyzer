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

  // Updater API
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, value) => callback(value)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (_event, value) => callback(value)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, value) => callback(value)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, value) => callback(value)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_event, value) => callback(value)),
  manualCheckForUpdates: () => ipcRenderer.invoke('manual-check-for-updates'),
  restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
  // Function to remove all listeners
  removeAllUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-not-available');
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.removeAllListeners('update-downloaded');
    ipcRenderer.removeAllListeners('update-error');
  },

  // AI Planner API
  getAiModels: () => ipcRenderer.invoke('get-ai-models'),
  saveApiKey: (apiKey, serviceName) => ipcRenderer.invoke('save-api-key', { apiKey, serviceName }),
  loadApiKey: (serviceName) => ipcRenderer.invoke('load-api-key', serviceName),
  startAiPlanner: (coursesData, modelId) => ipcRenderer.send('start-ai-planner', { coursesData, modelId }),
  onAiPlannerLog: (callback) => ipcRenderer.on('ai-planner-log', (_event, value) => callback(value)),
  onAiPlannerResult: (callback) => ipcRenderer.on('ai-planner-result', (_event, value) => callback(value)),
  onAiPlannerError: (callback) => ipcRenderer.on('ai-planner-error', (_event, value) => callback(value)),
  removeAllAiPlannerListeners: () => {
    ipcRenderer.removeAllListeners('ai-planner-log');
    ipcRenderer.removeAllListeners('ai-planner-result');
    ipcRenderer.removeAllListeners('ai-planner-error');
  },
  saveSelectedModel: (modelId) => ipcRenderer.invoke('save-selected-model', modelId),
  loadSelectedModel: () => ipcRenderer.invoke('load-selected-model'),
  getAiCallCount: () => ipcRenderer.invoke('get-ai-call-count'),
  incrementAiCallCount: () => ipcRenderer.invoke('increment-ai-call-count'),
});
