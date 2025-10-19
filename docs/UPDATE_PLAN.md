# SUES GPA Analyzer - 更新功能实现方案

本文档旨在详细规划 `SUES GPA Analyzer` 的两大核心新功能：**软件内更新机制** 和 **AI 原生重修规划**的实现步骤。

## 第一阶段：软件内更新机制

此阶段的目标是集成 `electron-updater`，为应用提供无缝的自动和手动更新能力。

### 步骤 1: 项目集成与配置

1.  **添加依赖:**
    *   在 `package.json` 的 `devDependencies` 中添加 `electron-updater`。

2.  **配置 `package.json`:**
    *   在 `build` 部分添加 `publish` 字段，用于指定更新的来源。我们将使用 GitHub Releases。
    ```json
    "build": {
      "publish": [
        {
          "provider": "github",
          "owner": "your-github-username",
          "repo": "sues-gpa-analyzer"
        }
      ],
      ...
    }
    ```
    *   *注意: `owner` 和 `repo` 需要替换为实际的 GitHub 用户名和仓库名。*

### 步骤 2: 主进程 (`main.js`) 逻辑实现

1.  **引入 `autoUpdater`:**
    *   在 `main.js` 顶部引入 `electron-updater` 的 `autoUpdater` 模块。

2.  **实现自动更新检查:**
    *   在 `app.whenReady()` 的回调中，调用 `autoUpdater.checkForUpdatesAndNotify()`。这将在应用启动时自动检查更新并（在有可用更新时）显示一个系统通知。

3.  **监听更新事件并与渲染进程通信:**
    *   监听 `autoUpdater` 的核心事件，并将状态通过 `ipcMain` 发送给渲染进程。
    *   `update-available`: 发现新版本。
    *   `update-not-available`: 当前已是最新版本。
    *   `download-progress`: 更新下载进度。
    *   `update-downloaded`: 更新下载完成。
    *   `error`: 更新过程中发生错误。
    *   示例:
        ```javascript
        autoUpdater.on('update-available', (info) => {
          mainWindow.webContents.send('update-available', info);
        });
        ```

4.  **创建 IPC Handlers:**
    *   `manual-check-for-updates`: 响应渲染进程的手动检查请求，调用 `autoUpdater.checkForUpdates()`。
    *   `restart-and-install`: 响应渲染进程的重启安装请求，调用 `autoUpdater.quitAndInstall()`。

### 步骤 3: 渲染进程 (Frontend) 逻辑实现

1.  **更新 `preload.js`:**
    *   安全地暴露一个 API 对象给渲染进程，该对象包含调用主进程 IPC Handlers (`manual-check-for-updates`, `restart-and-install`) 的方法，以及监听主进程事件 (`update-available`, etc.) 的方法。

2.  **创建 `Settings.jsx` 页面:**
    *   创建一个新的路由或视图，用于承载设置功能。这将是未来 API Key 管理和手动更新的入口。

3.  **创建 `UpdatePanel.jsx` 组件:**
    *   此组件将是更新功能的用户界面。
    *   **状态显示:** 根据从主进程接收到的事件，显示不同的状态信息，例如：“正在检查更新...”、“已是最新版本”、“发现新版本 v{version}”、“下载中... {progress}%”、“下载完成，等待安装”。
    *   **交互按钮:**
        *   提供一个“检查更新”按钮，点击后调用 `preload` 暴露的 `manual-check-for-updates` 方法。
        *   当更新下载完成后，显示一个“立即重启并更新”按钮，点击后调用 `restart-and-install`。
    *   **版本信息:** 显示当前应用版本 (`app.getVersion()`) 和检测到的最新版本。

4.  **集成 UI:**
    *   将 `UpdatePanel.jsx` 嵌入到 `Settings.jsx` 页面中。
    *   在主界面（例如 `Dashboard.jsx` 的侧边栏或菜单）添加入口，导航到 `Settings.jsx` 页面。
    *   实现一个非侵入式的更新提示，例如在“设置”入口上显示一个小红点徽章。

### 步骤 4: 端到端测试

1.  **创建 GitHub Release:**
    *   在 GitHub 仓库的 Releases 页面为当前版本（例如 `v1.1.0`）创建一个 Release 和对应的 tag。
    *   打包当前版本的应用并上传安装包作为 Release 的附件。

2.  **模拟更新:**
    *   修改 `package.json`，将版本号提升至 `v1.2.0`。
    *   再次打包应用，并为 `v1.2.0` 创建一个新的 GitHub Release。
    *   安装并运行 `v1.1.0` 版本的应用。
    *   **验证:**
        *   应用启动时应能自动检测到 `v1.2.0`。
        *   手动检查更新功能应能正常工作。
        *   下载进度应能正确显示。
        *   下载完成后，点击重启按钮，应用应能自动关闭并启动新版本的安装程序。

---

## 第二阶段：AI 原生重修规划

此阶段将在第一阶段完成后进行。
