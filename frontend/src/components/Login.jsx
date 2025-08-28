import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isTutorialDialogOpen, setIsTutorialDialogOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const theme = useTheme();

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
        
        // Check if tutorial dialog should be shown
        if (!userInfo || !userInfo.showTutorialDialog || userInfo.showTutorialDialog === 'true') {
          setIsTutorialDialogOpen(true);
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
        setError('读取用户信息失败。');
      }
    };
    loadInfo();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (rememberMe) {
        await window.electronAPI.saveUserInfo({ username, password, url });
      } else {
        await window.electronAPI.saveUserInfo({});
      }
      
      onLoginSuccess({ username, password, url });

    } catch (err) {
      console.error('Failed to save user info:', err);
      setError(err.message || '保存用户信息时发生错误。');
    }
  };

  const handleOpenTutorial = () => {
    window.electronAPI.openExternalUrl("https://www.bilibili.com/video/BV1BBcGebEru");
  };

  const handleCloseTutorial = async () => {
    if (dontShowAgain) {
      try {
        // Save the preference to not show the dialog again
        const userInfo = await window.electronAPI.loadUserInfo();
        await window.electronAPI.saveUserInfo({
          ...userInfo,
          showTutorialDialog: 'false'
        });
      } catch (err) {
        console.error("Failed to save tutorial dialog preference:", err);
      }
    }
    setIsTutorialDialogOpen(false);
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
              sx={{ mt: 2 }}
            >
              登录
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={isTutorialDialogOpen}
        onClose={handleCloseTutorial}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 24,
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            textAlign: 'center', 
            pb: 1,
            pt: 2,
            fontWeight: 'bold',
            color: 'text.primary'
          }}
        >
          欢迎使用 SUES GPA Analyzer
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            minHeight: 150,
            justifyContent: 'center'
          }}>
            <Box sx={{ width: '100%', textAlign: 'left', pl: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Box 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    backgroundColor: 'primary.main', 
                    mt: '0.7em',
                    mr: 2,
                    flexShrink: 0
                  }} 
                />
                <Typography 
                  variant="body1" 
                  color="text.primary" 
                  sx={{ 
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }} 
                >
                  第一次使用？请点击"查看教程"了解这个软件的所有功能！
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box 
                  sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    backgroundColor: 'primary.main', 
                    mt: '0.7em',
                    mr: 2,
                    flexShrink: 0
                  }} 
                />
                <Typography 
                  variant="body1" 
                  color="text.primary" 
                  sx={{ 
                    fontSize: '1.1rem',
                    fontWeight: 500
                  }} 
                >
                  您的密码被keytar加密后保存在本地，且不会被上传。若您想要删除数据，请点击右上角的"<Box component="span" color="error.main">删除我的数据</Box>"按钮。
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          px: 3, 
          pb: 3,
          pt: 1 
        }}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleOpenTutorial}
              size="large"
              sx={{ 
                borderRadius: 6,
                px: 4,
                py: 1.5,
                minWidth: 120,
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                }
              }}
            >
              查看教程
            </Button>
            <Button 
              onClick={handleCloseTutorial}
              variant="outlined"
              size="large"
              sx={{ 
                borderRadius: 6,
                px: 4,
                py: 1.5,
                minWidth: 120,
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              朕已阅
            </Button>
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label="不再提示"
              sx={{ 
                '& .MuiFormControlLabel-label': { 
                  fontSize: '0.875rem',
                  color: 'text.secondary'
                } 
              }}
            />
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Login;