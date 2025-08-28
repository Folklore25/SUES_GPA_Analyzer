import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { parseCSV } from '../utils/csvParser';
import { 
  Box, Button, IconButton, Typography, Container, Paper, CircularProgress, Grid, 
  Card, CardContent, Tabs, Tab, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Avatar
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';
import { calculateCurrentGPA } from '../utils/gpaCalculations';

// Dynamic imports for components
const CourseList = lazy(() => import('./CourseList'));
const Charts = lazy(() => import('./Charts'));
const RetakePlanner = lazy(() => import('./RetakePlanner'));
const PlanFAB = lazy(() => import('./PlanFAB'));

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
  const theme = useTheme();

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
  }, []);

  const handleGetData = async () => {
    setIsLoading(true);
    setError('');
    
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

  // Loading fallback component
  const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>检查本地数据中...</Typography>
    </Box>
  );

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
          <Button onClick={handleGetData} disabled={isLoading} variant="outlined" size="small">{isLoading ? '加载中...' : '获取/刷新数据'}</Button>
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
            {!courseData && <Typography>暂无数据，请点击"获取/刷新数据"按钮。</Typography>}
            {courseData && activeTab === 0 && (
              <Suspense fallback={<LoadingFallback />}>
                <Charts courseData={courseData} />
              </Suspense>
            )}
            {courseData && activeTab === 1 && (
              <Suspense fallback={<LoadingFallback />}>
                <CourseList courseData={courseData} retakePlan={retakePlan} onAddToPlan={handleAddToPlan} />
              </Suspense>
            )}
            {courseData && activeTab === 2 && (
              <Suspense fallback={<LoadingFallback />}>
                <RetakePlanner courseData={courseData} retakePlan={retakePlan} onRemoveFromPlan={handleRemoveFromPlan} />
              </Suspense>
            )}
          </Box>
        </Paper>
      </Container>

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
              SUES里一位默默热爱着这个学校的金融学学生，希望各位留子能好好利用这个玩具，申到大家心仪的大学。共勉。
            </Typography>
            <Divider sx={{ my: 2, width: '100%' }} />
            <Box>
              <IconButton href="https://github.com/Folklore25" target="_blank">
                <GitHubIcon />
              </IconButton>
              <IconButton href="mailto:rockboy1125@gmail.com">
                <EmailIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Suspense fallback={null}>
        <PlanFAB 
          retakePlan={retakePlan} 
          onRemoveFromPlan={handleRemoveFromPlan} 
          onNavigateToPlanner={handleNavigateToPlanner} 
        />
      </Suspense>
    </Box>
  );
}

export default Dashboard;