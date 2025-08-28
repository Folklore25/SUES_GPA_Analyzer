import React, { useState, useEffect, useMemo } from 'react';
import { parseCSV } from '../utils/csvParser';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import GitHubIcon from '@mui/icons-material/GitHub';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import { calculateCurrentGPA } from '../utils/gpaCalculations';
import CourseList from './CourseList';
import Charts from './Charts';
import RetakePlanner from './RetakePlanner';
import DownloadProgress from './DownloadProgress';
import PlanFAB from './PlanFAB'; // Import the new component

function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom>{title}</Typography>
          <Typography variant="h5" component="div">{value}</Typography>
        </Box>
        <Box>{icon}</Box>
      </CardContent>
    </Card>
  );
}

function Dashboard({ userCredentials, toggleTheme }) {
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isAboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [isTutorialDialogOpen, setIsTutorialDialogOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const theme = useTheme();

  // State for download progress dialog
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState({});

  // State for the global retake plan
  const [retakePlan, setRetakePlan] = useState([]);

  const handleAddToPlan = (course) => {
    if (!retakePlan.find(c => c.course_code === course.course_code)) {
      setRetakePlan([...retakePlan, course]);
    }
  };

  const handleRemoveFromPlan = (courseCode) => {
    setRetakePlan(retakePlan.filter(c => c.course_code !== courseCode));
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

  useEffect(() => {
    const initialLoad = async () => {
      try {
        const csvData = await window.electronAPI.loadCourseData();
        if (csvData && csvData.length > 0) {
          const jsonData = parseCSV(csvData);
          setCourseData(jsonData);
        }
      } catch (err) {
        console.error("Failed to initially load course data:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    initialLoad();

    // Check if tutorial dialog should be shown
    const checkTutorialDialog = async () => {
      try {
        const userInfo = await window.electronAPI.loadUserInfo();
        if (!userInfo || !userInfo.showTutorialDialog || userInfo.showTutorialDialog === 'true') {
          setIsTutorialDialogOpen(true);
        }
      } catch (err) {
        console.error("Failed to check tutorial dialog status:", err);
        // Show dialog by default if there's an error
        setIsTutorialDialogOpen(true);
      }
    };
    checkTutorialDialog();

    // Set up listener for browser download progress
    const unsubscribe = window.electronAPI.onBrowserDownloadProgress((data) => {
      console.log('Browser download progress update:', data);
      // As soon as download starts, take over the loading state from the button
      setIsLoading(false);
      setIsDownloading(true);
      setDownloadInfo({ message: data.message, progress: data.value });

      // When download is complete, wait 2 seconds then close the dialog
      if (data.value === 100) {
        setTimeout(() => {
          setIsDownloading(false);
        }, 2000);
      }
    });

    // Cleanup listener on component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, []);

  const handleGetData = async () => {
    setIsLoading(true);
    setError('');
    setDownloadInfo({});
    // Let the listener control the download dialog visibility
    // setIsDownloading(false); 

    try {
      const result = await window.electronAPI.startCrawler(userCredentials);
      if (result.success) {
        const csvData = await window.electronAPI.loadCourseData();
        const jsonData = parseCSV(csvData);
        setCourseData(jsonData);
      } else {
        throw new Error(result.message || '爬虫未能成功完成');
      }
    } catch (err) {
      console.error("Failed to get course data:", err);
      setError(err.message || '获取或解析课程数据时出错。');
      // If an error occurs, ensure the download dialog is closed
      setIsDownloading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setConfirmDialogOpen(false);
    try {
      await window.electronAPI.deleteUserData();
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete data:", err);
      setError(err.message || '删除数据时出错。');
    }
  };

  const summaryStats = useMemo(() => {
    if (!courseData) return null;
    const totalCredits = courseData
      .filter(c => c.pass === 'passed' || c.pass === 'failed')
      .reduce((sum, course) => sum + (parseFloat(course.course_weight) || 0), 0);
    const passedCount = courseData.filter(c => c.pass === 'passed').length;
    const failedCount = courseData.filter(c => c.pass === 'failed').length;
    const currentGPA = calculateCurrentGPA(courseData);
    return { totalCredits, passedCount, failedCount, currentGPA };
  }, [courseData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNavigateToPlanner = () => {
    setActiveTab(2); // 2 is the index for RetakePlanner tab
  };

  if (isInitialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>检查本地数据中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      <Paper elevation={1} square sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ ml: 2 }}>仪表盘</Typography>
        <Box>
          <Button onClick={() => setConfirmDialogOpen(true)} color="error" size="small" sx={{ mr: 1 }}>删除我的数据</Button>
          <Button onClick={handleGetData} disabled={isLoading || isDownloading} variant="outlined" size="small">{isLoading ? '加载中...' : '获取/刷新数据'}</Button>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit"><Brightness7Icon /></IconButton>
          <IconButton sx={{ ml: 1 }} onClick={() => setAboutDialogOpen(true)} color="inherit"><InfoIcon /></IconButton>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1, overflowY: 'auto' }}>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {summaryStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}><StatCard title="当前加权GPA" value={summaryStats.currentGPA.toFixed(2)} icon={<SchoolIcon color="primary" sx={{ fontSize: 40 }} />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="已修总学分" value={summaryStats.totalCredits} icon={<StarIcon color="primary" sx={{ fontSize: 40 }} />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="已通过课程" value={`${summaryStats.passedCount} 门`} icon={<CheckCircleIcon color="success" sx={{ fontSize: 40 }} />} /></Grid>
            <Grid item xs={12} sm={6} md={3}><StatCard title="已挂科课程" value={`${summaryStats.failedCount} 门`} icon={<CancelIcon color="error" sx={{ fontSize: 40 }} />} /></Grid>
          </Grid>
        )}

        <Paper>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="图表分析" />
              <Tab label="课程列表" />
              <Tab label="重修规划" />
            </Tabs>
          </Box>
          <Box sx={{ p: 3 }}>
            {!courseData && <Typography>暂无数据，请点击“获取/刷新数据”按钮。</Typography>}
            {courseData && activeTab === 0 && <Charts courseData={courseData} />}
            {courseData && activeTab === 1 && <CourseList courseData={courseData} retakePlan={retakePlan} onAddToPlan={handleAddToPlan} />}
            {courseData && activeTab === 2 && <RetakePlanner courseData={courseData} retakePlan={retakePlan} onRemoveFromPlan={handleRemoveFromPlan} />}
          </Box>
        </Paper>
      </Container>

      <DownloadProgress 
        open={isDownloading} 
        message={downloadInfo.message}
        progress={downloadInfo.progress} 
      />

      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>确认删除数据</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除所有本地数据吗？此操作将清除已保存的用户信息和课程数据，且不可逆。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDelete} color="error">删除</Button>
          <Button onClick={() => setConfirmDialogOpen(false)} autoFocus>取消</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isAboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>关于作者</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 2 }}>
            <Avatar
              alt="Folklore25"
              src="https://cdn.nlark.com/yuque/0/2025/jpeg/59114766/1755070767771-dd2d8439-b07a-48ae-b34d-1c4d74119e8b.jpeg?x-oss-process=image%2Fformat%2Cwebp%2Finterlace%2C1"
              sx={{ width: 80, height: 80, mb: 2 }}
            />
            <Typography variant="h6" component="h3">Folklore25</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              金融学老登，希望各位留子能好好利用这个玩具，申到大家心仪的大学。共勉。
            </Typography>
            <Divider sx={{ my: 2, width: '100%' }} />
            <Box>
              <IconButton href="https://github.com/Folklore25" target="_blank">
                <GitHubIcon />
              </IconButton>
              <IconButton onClick={() => window.electronAPI.openExternalUrl("https://space.bilibili.com/230217809")}>
                <OndemandVideoIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

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
            color: 'black'
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
                  您的所有数据均保存在本地，且不会被上传。若您想要删除数据，请点击右上角的"<Box component="span" color="error.main">删除我的数据</Box>"按钮。
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
              color="success"
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

      <PlanFAB 
        retakePlan={retakePlan} 
        onRemoveFromPlan={handleRemoveFromPlan} 
        onNavigateToPlanner={handleNavigateToPlanner} 
      />
    </Box>
  );
}

export default Dashboard;