import React, { useState, useEffect, useMemo } from 'react';
import { parseCSV } from '../utils/csvParser';
import { Box, Button, IconButton, Typography, Container, Paper, CircularProgress, Grid, Card, CardContent, Tabs, Tab } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { calculateCurrentGPA } from '../utils/gpaCalculations';
import CourseList from './CourseList';
import Charts from './Charts';
import RetakePlanner from './RetakePlanner';

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
  const theme = useTheme();

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
      await window.electronAPI.startCrawler(userCredentials);
      const csvData = await window.electronAPI.loadCourseData();
      const jsonData = parseCSV(csvData);
      setCourseData(jsonData);
    } catch (err) {
      console.error("Failed to get course data:", err);
      setError(err.message || '获取或解析课程数据时出错。');
    } finally {
      setIsLoading(false);
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
        <Typography variant="h6" sx={{ ml: 2 }}>今天你学习了吗？</Typography>
        <Box>
          <Button onClick={handleGetData} disabled={isLoading} variant="outlined" size="small">{isLoading ? '加载中...' : '获取/刷新数据'}</Button>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">{theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}</IconButton>
        </Box>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1, overflowY: 'auto' }}>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {summaryStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}><StatCard title="当前加权GPA" value={summaryStats.currentGPA.toFixed(3)} icon={<SchoolIcon color="primary" sx={{ fontSize: 40 }} />} /></Grid>
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
            {courseData && activeTab === 1 && <CourseList courseData={courseData} />}
            {courseData && activeTab === 2 && <RetakePlanner courseData={courseData} />}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Dashboard;