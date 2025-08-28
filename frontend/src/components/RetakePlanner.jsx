import React, { useState, useMemo } from 'react';
import { calculateCurrentGPA, getGpaTotalCredits } from '../utils/gpaCalculations';
import { generateSchedule } from '../utils/scheduler';
import ReactECharts from 'echarts-for-react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Divider from '@mui/material/Divider';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Main component for the new Scheduling Workbench
function RetakePlanner({ courseData, retakePlan, onRemoveFromPlan }) {
  const theme = useTheme();
  const [numSemesters, setNumSemesters] = useState(2);
  const [strategy, setStrategy] = useState('conservative');
  const [plan, setPlan] = useState(null); // This will hold the entire result { schedule, heatmap }

  const handleStrategyChange = (event, newStrategy) => {
    if (newStrategy !== null) {
      setStrategy(newStrategy);
    }
  };

  const handleGenerateSchedule = () => {
    const result = generateSchedule(retakePlan, numSemesters, strategy);
    setPlan(result);
  };

  const projectedGpa = useMemo(() => {
    if (!plan) return null;
    const originalGPA = calculateCurrentGPA(courseData);
    const totalGpaCredits = getGpaTotalCredits(courseData);
    if (totalGpaCredits === 0) return originalGPA;

    const gpaImprovement = retakePlan.reduce((sum, course) => {
      const targetGpaForCalc = 4.0; // Assume a target of 4.0 for any retaken course
      const improvement = (targetGpaForCalc - parseFloat(course.course_gpa)) * (parseFloat(course.course_weight) || 0);
      return sum + improvement;
    }, 0);

    return originalGPA + (gpaImprovement / totalGpaCredits);
  }, [plan, courseData, retakePlan]);

  const gaugeOptions = useMemo(() => {
    if (projectedGpa === null) return {};
    const originalGPA = calculateCurrentGPA(courseData);
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: Math.floor(originalGPA * 10) / 10,
          max: 4,
          splitNumber: 8,
          axisLine: { lineStyle: { width: 18, color: [[0.25, '#FF6E76'], [0.5, '#ee8b2fff'], [0.75, '#f4f958ff'], [1, '#1ea911ff']] } },
          progress: { show: true, width: 18, itemStyle: { color: 'auto' } },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: { valueAnimation: true, fontSize: 30, offsetCenter: [0, '10%'], formatter: '{value}', color: 'auto' },
          data: [{ value: parseFloat(projectedGpa.toFixed(3)) }]
        }
      ]
    };
  }, [projectedGpa, courseData]);

  const heatmapOptions = useMemo(() => {
    if (!plan || !plan.heatmap) return {};
    
    const maxHours = Math.max(...plan.heatmap.data.map(item => item[2]), 5);

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => `第 ${params.value[0] + 1} 周<br/>总课时: ${params.value[2]}h`
      },
      grid: { height: '60%', top: '10%', left: '10%', right: '5%' },
      xAxis: {
        type: 'category',
        data: plan.heatmap.weeks,
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: plan.heatmap.semesters,
        splitArea: { show: true }
      },
      visualMap: {
        min: 0,
        max: maxHours,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '2%',
        inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'] },
        textStyle: { color: theme.palette.text.primary }
      },
      series: [{
        name: '周学习压力',
        type: 'heatmap',
        data: plan.heatmap.data,
        label: { 
          show: true, 
          color: '#000',
          formatter: (params) => params.value[2] > 0 ? params.value[2] : '' 
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    };
  }, [plan, theme.palette.text.primary]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>智能排课工作台</Typography>
      
      {retakePlan.length === 0 ? (
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
          <InfoOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h6">您的重修计划为空</Typography>
          <Typography color="text.secondary">
            请先前往“课程列表”标签页，点击课程右侧的 `+` 号，将课程添加至您的计划中。
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 3 }}>
            {/* --- CONTROLS --- */}
            <Card component={Paper} sx={{ p: 2 }}>
              <CardContent>
                <Typography gutterBottom>重修周期 (学期数)</Typography>
                <Slider
                  value={numSemesters}
                  onChange={(e, newValue) => setNumSemesters(newValue)}
                  aria-labelledby="retake-semesters-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={4}
                  sx={{ maxWidth: 400, mb: 2 }}
                />
  
                <Typography gutterBottom>排课策略</Typography>
                <ToggleButtonGroup
                  value={strategy}
                  exclusive
                  onChange={handleStrategyChange}
                  aria-label="scheduling strategy"
                  color="primary"
                >
                  <ToggleButton value="conservative">保守</ToggleButton>
                  <ToggleButton value="aggressive">激进</ToggleButton>
                  <ToggleButton value="burnout">爆肝</ToggleButton>
                </ToggleButtonGroup>
  
                <Divider sx={{ my: 2 }} />
  
                <Button 
                  variant="contained" 
                  onClick={handleGenerateSchedule}
                  disabled={retakePlan.length === 0}
                >
                  生成学期计划
                </Button>
              </CardContent>
            </Card>
            {/* --- GAUGE CHART --- */}
            <Card component={Paper} sx={{ p: 2 }}>
              <CardContent>
                <Typography variant="h6" align="center">预估新GPA</Typography>
                {plan ? (
                  <ReactECharts option={gaugeOptions} style={{ height: 220 }} notMerge={true} />
                ) : (
                  <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">点击生成计划后显示</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* --- RESULTS DISPLAY --- */}
          {plan && (
            <Box>
              <Typography variant="h6" gutterBottom>生成的学习计划</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${plan.schedule.length}, 1fr)` }, gap: 2, mb: 3 }}>
                {plan.schedule.map(semesterPlan => (
                  <Card component={Paper} key={semesterPlan.semester}>
                    <CardContent>
                      <Typography variant="h6">第 {semesterPlan.semester} 学期</Typography>
                      <Typography variant="body2" color="text.secondary">预估总课时: {semesterPlan.hours}</Typography>
                      <ul style={{ paddingLeft: 20, marginTop: 10 }}>
                        {semesterPlan.courses.map(course => (
                          <li key={course.course_code}>{course.course_name}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>周学习压力热力图</Typography>
              <Card component={Paper}>
                <CardContent>
                  <ReactECharts option={heatmapOptions} style={{ height: 250 }} notMerge={true} />
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default RetakePlanner;