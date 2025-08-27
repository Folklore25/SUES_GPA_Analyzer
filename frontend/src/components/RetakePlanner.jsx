import React, { useState, useMemo } from 'react';
import { calculateCurrentGPA, getGpaTotalCredits } from '../utils/gpaCalculations';
import { generateSchedule } from '../utils/scheduler';
import ReactECharts from 'echarts-for-react';
import { 
  Button, Card, CardContent, Typography, Box, Paper, useTheme, Slider, 
  ToggleButton, ToggleButtonGroup, Divider
} from '@mui/material';

// Main component for the new Scheduling Workbench
function RetakePlanner({ courseData, retakePlan, onRemoveFromPlan }) {
  const theme = useTheme();
  const [numSemesters, setNumSemesters] = useState(2);
  const [strategy, setStrategy] = useState('conservative');
  const [plan, setPlan] = useState(null); // This will hold the entire result from generateSchedule

  const handleStrategyChange = (event, newStrategy) => {
    if (newStrategy !== null) {
      setStrategy(newStrategy);
    }
  };

  const handleGenerateSchedule = () => {
    const result = generateSchedule(retakePlan, numSemesters, strategy);
    setPlan(result);
  };

  const heatmapOptions = useMemo(() => {
    if (!plan || !plan.heatmap) return {};
    
    const maxHours = Math.max(...plan.heatmap.data.map(item => item[2]), 5);

    return {
      tooltip: {
        position: 'top',
        formatter: (params) => `第 ${params.value[0] + 1} 周<br/>课时: ${params.value[2]}h`
      },
      grid: { height: '60%', top: '10%' },
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
        bottom: '5%',
        inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'].reverse() },
        textStyle: { color: theme.palette.text.primary }
      },
      series: [{
        name: '周学习压力',
        type: 'heatmap',
        data: plan.heatmap.data,
        label: { show: true, formatter: (params) => params.value[2] > 0 ? params.value[2] : '' },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    };
  }, [plan, theme.palette.text.primary]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>智能排课工作台</Typography>
      
      {/* --- CONTROLS --- */}
      <Card component={Paper} sx={{ p: 2, mb: 3 }}>
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
  );
}

export default RetakePlanner;