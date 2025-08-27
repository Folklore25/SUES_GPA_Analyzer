import React, { useState, useEffect } from 'react';
import {
  Button, 
  TextField, 
  Checkbox, 
  FormControlLabel, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress
} from '@mui/material';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState({ message: '', progress: 0 });

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const userInfo = await window.electronAPI.loadUserInfo();
        if (userInfo && userInfo.username) {
          setUsername(userInfo.username);
          setPassword(userInfo.password);
          setUrl(userInfo.url);
          setRememberMe(true);
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
        setError('读取用户信息失败。');
      }
    };
    loadInfo();

    // Set up listener for browser download progress
    const unsubscribe = window.electronAPI.onBrowserDownloadProgress((data) => {
      console.log('Browser download progress update:', data);
      setIsDownloadDialogOpen(true); // Show dialog when progress starts
      setDownloadInfo({ message: data.message, progress: data.value });

      // When download is complete, wait 2 seconds then close the dialog
      if (data.value === 100) {
        console.log('Download completed, closing dialog in 2 seconds...');
        setTimeout(() => {
          setIsDownloadDialogOpen(false);
        }, 2000);
      }
    });

    // Cleanup listener on component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      // Check and download browser
      const result = await window.electronAPI.checkAndDownloadBrowser();
      
      if (!result.success) {
        setError(result.error || '浏览器检查/下载失败。');
        return;
      }
      
      // Save user info and proceed to dashboard
      if (rememberMe) {
        await window.electronAPI.saveUserInfo({ username, password, url });
      } else {
        await window.electronAPI.saveUserInfo({});
      }
      
      onLoginSuccess({ username, password, url });

    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || '登录时发生错误。');
    }
  };

  return (
    <Box 
      sx={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}
    >
      <Card sx={{
        minWidth: 275, 
        maxWidth: 400, 
        padding: 2,
        borderRadius: 4, // 16px
        // Glassmorphism effect
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
      }}>
        <CardContent>
          <Typography variant="h5" component="div" sx={{ 
            textAlign: 'center', 
            marginBottom: 2,
            animation: 'fadeIn 0.6s ease-in-out',
            animationFillMode: 'forwards',
          }}>
            上海工程技术大学 GPA 分析工具
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="学号"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              sx={{ animation: 'fadeIn 0.6s ease-in-out', animationFillMode: 'forwards', animationDelay: '0.2s', opacity: 0 }}
            />
            <TextField
              label="密码"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ animation: 'fadeIn 0.6s ease-in-out', animationFillMode: 'forwards', animationDelay: '0.3s', opacity: 0 }}
            />
            <TextField
              label="培养方案URL"
              variant="outlined"
              fullWidth
              margin="normal"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              sx={{ animation: 'fadeIn 0.6s ease-in-out', animationFillMode: 'forwards', animationDelay: '0.4s', opacity: 0 }}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
              }
              label="保留我的用户信息"
            />
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={isDownloadDialogOpen}
              sx={{ mt: 2 }}
            >
              {isDownloadDialogOpen ? '环境准备中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Download Progress Dialog */}
      <Dialog
        open={isDownloadDialogOpen}
        aria-labelledby="download-progress-title"
      >
        <DialogTitle id="download-progress-title">环境准备</DialogTitle>
        <DialogContent sx={{ width: 400 }}>
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography gutterBottom>{downloadInfo.message || '正在准备...'}</Typography>
            <LinearProgress variant="determinate" value={downloadInfo.progress} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">{downloadInfo.progress}%</Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Login;