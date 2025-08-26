import React, { useState, useMemo } from 'react';
import { recommendRetakeCourses } from '../utils/retakeRecommender';
import { calculateCurrentGPA, getGpaTotalCredits } from '../utils/gpaCalculations';
import ReactECharts from 'echarts-for-react';
import { 
  Button, TextField, Card, CardContent, Typography, Box, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, Select, MenuItem, FormControl 
} from '@mui/material';

function RetakePlanner({ courseData }) {
  const theme = useTheme();
  const [targetGpa, setTargetGpa] = useState(3.8); // Default to 3.8 as requested
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [individualTargets, setIndividualTargets] = useState({});

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setPlan(null);
    try {
      const recommended = recommendRetakeCourses(courseData, parseFloat(targetGpa));
      const originalGPA = calculateCurrentGPA(courseData);
      
      const initialTargets = {};
      recommended.forEach(course => {
        initialTargets[course.course_code] = 4.0; // Default to 4.0
      });
      setIndividualTargets(initialTargets);

      setPlan({ 
        recommendedCourses: recommended, 
        originalGPA: originalGPA,
      });
    } catch (error) {
      console.error("Failed to generate retake plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetChange = (courseCode, newTarget) => {
    setIndividualTargets(prevTargets => ({
      ...prevTargets,
      [courseCode]: newTarget,
    }));
  };

  const projectedGPA = useMemo(() => {
    if (!plan) return null;

    const totalGpaCredits = getGpaTotalCredits(courseData);
    if (totalGpaCredits === 0) return plan.originalGPA;

    const gpaImprovement = plan.recommendedCourses.reduce((sum, course) => {
      const target = individualTargets[course.course_code] || 0;
      const improvement = (target - parseFloat(course.course_gpa)) * (parseFloat(course.course_weight) || 0);
      return sum + improvement;
    }, 0);

    return plan.originalGPA + (gpaImprovement / totalGpaCredits);
  }, [plan, individualTargets, courseData]);

  const gaugeOptions = useMemo(() => {
    if (!plan || projectedGPA === null) return {};
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: Math.floor(plan.originalGPA * 10) / 10,
          max: 4,
          splitNumber: 8,
          axisLine: {
            lineStyle: {
              width: 6,
              color: [[0.25, '#FF6E76'], [0.5, '#FDDD60'], [0.75, '#58D9F9'], [1, '#7CFFB2']]
            }
          },
          pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '60%', width: 8, offsetCenter: [0, '-60%'], itemStyle: { color: 'auto' } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { distance: 25, color: theme.palette.text.secondary, fontSize: 14 },
          title: { show: true, offsetCenter: [0, '70%'], fontSize: 18, color: theme.palette.text.primary },
          detail: { valueAnimation: true, fontSize: 28, offsetCenter: [0, '40%'], formatter: '{value}', color: 'auto' },
          data: [{ value: parseFloat(projectedGPA.toFixed(2)), name: '预计GPA' }]
        }
      ]
    };
  }, [plan, projectedGPA, theme.palette.text.secondary, theme.palette.text.primary]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>重修规划 (IPS算法)</Typography>
      <Card component={Paper} sx={{ p: 2, mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField label="目标GPA" type="number" id="target-gpa" value={targetGpa} onChange={(e) => setTargetGpa(e.target.value)} inputProps={{ step: "0.1", min: "1.0", max: "4" }} sx={{ maxWidth: 150 }} />
          <Button onClick={handleGeneratePlan} disabled={isLoading} variant="contained">{isLoading ? '生成中...' : '生成推荐列表'}</Button>
        </CardContent>
      </Card>

      {plan && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          <Box>
            <Card component={Paper} sx={{ p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6">最高性价比(IPS)重修推荐 (7门)</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>课程名称</TableCell>
                        <TableCell>原始绩点</TableCell>
                        <TableCell>IPS分数</TableCell>
                        <TableCell>预期绩点</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plan.recommendedCourses.map(course => (
                        <TableRow key={course.course_code}>
                          <TableCell>{course.course_name}</TableCell>
                          <TableCell>{course.course_gpa}</TableCell>
                          <TableCell>{course.ips.toFixed(4)}</TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={individualTargets[course.course_code] || 4.0}
                                onChange={(e) => handleTargetChange(course.course_code, e.target.value)}
                              >
                                <MenuItem value={4.0}>4.0</MenuItem>
                                <MenuItem value={3.7}>3.7</MenuItem>
                                <MenuItem value={3.3}>3.3</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card component={Paper} sx={{ p: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" align="center">提升效果预览</Typography>
                <ReactECharts option={gaugeOptions} style={{ height: 350 }} notMerge={true} lazyUpdate={true} />
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default RetakePlanner;