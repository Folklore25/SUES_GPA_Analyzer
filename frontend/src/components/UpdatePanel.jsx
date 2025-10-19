import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, LinearProgress, Box, Chip } from '@mui/material';

const UpdatePanel = () => {
  const [appVersion, setAppVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, not-available, downloading, downloaded, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const getVersion = async () => {
      const version = await window.electronAPI.getAppVersion();
      setAppVersion(version);
    };
    getVersion();

    const handleUpdateAvailable = (info) => {
      setUpdateInfo(info);
      setUpdateStatus('available');
    };

    const handleUpdateNotAvailable = () => {
      setUpdateStatus('not-available');
    };

    const handleDownloadProgress = (progressObj) => {
      setUpdateStatus('downloading');
      setDownloadProgress(progressObj.percent);
    };

    const handleUpdateDownloaded = () => {
      setUpdateStatus('downloaded');
    };

    const handleUpdateError = (err) => {
      setUpdateStatus('error');
      setError(err);
    };

    window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
    window.electronAPI.onUpdateNotAvailable(handleUpdateNotAvailable);
    window.electronAPI.onDownloadProgress(handleDownloadProgress);
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
    window.electronAPI.onUpdateError(handleUpdateError);

    return () => {
      window.electronAPI.removeAllUpdateListeners();
    };
  }, []);

  const handleCheckForUpdates = () => {
    setUpdateStatus('checking');
    window.electronAPI.manualCheckForUpdates();
  };

  const handleRestartAndInstall = () => {
    window.electronAPI.restartAndInstall();
  };

  const renderStatus = () => {
    switch (updateStatus) {
      case 'checking':
        return <Typography>正在检查更新...</Typography>;
      case 'available':
        return (
          <Box>
            <Typography>发现新版本: {updateInfo?.version}</Typography>
            <Button variant="contained" onClick={handleCheckForUpdates} disabled>开始下载</Button>
          </Box>
        );
      case 'not-available':
        return <Typography>已是最新版本。</Typography>;
      case 'downloading':
        return (
          <Box sx={{ width: '100%' }}>
            <Typography>下载中... {downloadProgress.toFixed(2)}%</Typography>
            <LinearProgress variant="determinate" value={downloadProgress} />
          </Box>
        );
      case 'downloaded':
        return (
          <Box>
            <Typography>下载完成！</Typography>
            <Button variant="contained" onClick={handleRestartAndInstall}>立即重启并更新</Button>
          </Box>
        );
      case 'error':
        return <Typography color="error">更新出错: {error?.message}</Typography>;
      default:
        return <Button variant="outlined" onClick={handleCheckForUpdates}>检查更新</Button>;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">软件更新</Typography>
        <Chip label={`当前版本: ${appVersion}`} sx={{ my: 1 }} />
        <Box mt={2}>
          {renderStatus()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UpdatePanel;
