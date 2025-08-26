import React, { useState, useMemo } from 'react';
import { retakeEngine } from '../utils/retakeEngine';
import ReactECharts from 'echarts-for-react';
import { Button, Select, MenuItem, TextField, FormControl, InputLabel, Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme } from '@mui/material';

function RetakePlanner({ courseData }) {
  const theme = useTheme();
  const [strategy, setStrategy] = useState('balanced');
  const [targetGpa, setTargetGpa] = useState(3.5);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setPlan(null);
    try {
      const generatedPlan = await retakeEngine.generatePlan(courseData, strategy, parseFloat(targetGpa));
      setPlan(generatedPlan);
    } catch (error) {
      console.error("Failed to generate retake plan:", error);
    }
    setIsLoading(false);
  };

  const successRateChartOptions = useMemo(() => {
    if (!plan || !plan.recommendedCourses || plan.recommendedCourses.length === 0) {
      return null;
    }
    return {
      grid: { top: 40, right: 20, bottom: 40, left: 50 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: plan.recommendedCourses.map(c => c.course_name),
        axisLabel: {
          color: theme.palette.text.secondary,
          interval: 0, // Show all labels
          rotate: 30, // Rotate labels to prevent overlap
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value} %',
          color: theme.palette.text.secondary,
        },
      },
      series: [
        {
          name: '成功率',
          type: 'bar',
          data: plan.recommendedCourses.map(c => (c.successRate * 100).toFixed(0)),
        },
      ],
    };
  }, [plan, theme]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        重修规划 (高级算法)
      </Typography>
      <Card component={Paper} sx={{ p: 2, mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>选择策略</InputLabel>
            <Select
              value={strategy}
              label="选择策略"
              onChange={(e) => setStrategy(e.target.value)}
            >
              <MenuItem value="conservative">保守型</MenuItem>
              <MenuItem value="balanced">平衡型</MenuItem>
              <MenuItem value="aggressive">激进型</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="目标GPA"
            type="number"
            value={targetGpa}
            onChange={(e) => setTargetGpa(e.target.value)}
            inputProps={{ step: "0.1", min: "0", max: "4" }}
            sx={{ maxWidth: 120 }}
          />
          <Button onClick={handleGeneratePlan} disabled={isLoading} variant="contained">
            {isLoading ? '生成中...' : '生成规划'}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Card component={Paper} sx={{ p: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h6">规划结果</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, my: 2 }}>
                  <Typography><b>原始GPA:</b> {plan.originalGPA.toFixed(3)}</Typography>
                  <Typography><b>预计GPA:</b> {plan.projectedGPA.toFixed(3)}</Typography>
                  <Typography><b>最佳GPA:</b> {plan.bestCaseGPA.toFixed(3)}</Typography>
                  <Typography><b>成功率:</b> {(plan.overallSuccessRate * 100).toFixed(0)}%</Typography>
                  <Typography><b>风险等级:</b> {plan.riskLevel}</Typography>
                </Box>
              </CardContent>
            </Card>
            <Card component={Paper} sx={{ p: 2 }}>
              <CardContent>
                <Typography variant="h6">推荐重修课程</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>课程名称</TableCell>
                        <TableCell>学分</TableCell>
                        <TableCell>原始绩点</TableCell>
                        <TableCell>优先级</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plan.recommendedCourses.map(course => (
                        <TableRow key={course.course_code}>
                          <TableCell>{course.course_name}</TableCell>
                          <TableCell>{course.course_weight}</TableCell>
                          <TableCell>{course.course_gpa}</TableCell>
                          <TableCell sx={{ color: course.priority.color }}>{course.priority.label}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>

          <Card component={Paper} sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6">推荐课程成功率</Typography>
              {successRateChartOptions && 
                <ReactECharts option={successRateChartOptions} style={{ height: 500 }} notMerge={true} lazyUpdate={true} theme={theme.palette.mode} />
              }
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default RetakePlanner;