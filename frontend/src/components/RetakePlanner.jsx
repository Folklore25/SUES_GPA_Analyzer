import React, { useState, useMemo } from 'react';
import { recommendRetakeCourses } from '../utils/retakeRecommender';
import { calculateCurrentGPA, getGpaTotalCredits } from '../utils/gpaCalculations';
import ReactECharts from 'echarts-for-react';
import { 
  Button, TextField, Card, CardContent, Typography, Box, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, Select, MenuItem, FormControl, Chip
} from '@mui/material';

const getIpsRating = (ips) => {
  if (ips >= 0.0006) {
    return { label: '高', color: 'success.main' }; // Green
  } else if (ips >= 0.0003) {
    return { label: '中', color: 'warning.main' }; // Orange
  } else {
    return { label: '低', color: 'text.secondary' }; // Gray
  }
};

function RetakePlanner({ courseData }) {
  const theme = useTheme();
  const [targetGpa, setTargetGpa] = useState(3.8);
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
              width: 18,
              color: [[0.25, '#FF6E76'], [0.5, '#ee8b2fff'], [0.75, '#f4f958ff'], [1, '#1ea911ff']]
            }
          },
          progress: {
            show: true,
            width: 18
          },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 40,
            offsetCenter: [0, '0%'],
            formatter: '{value}',
            color: 'auto'
          },
          data: [{ value: parseFloat(projectedGPA.toFixed(2)) }]
        }
      ]
    };
  }, [plan, projectedGPA]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>重修规划</Typography>
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
                <Typography variant="h6">最高性价比重修推荐 (7门)</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>课程名称</TableCell>
                        <TableCell>原始绩点</TableCell>
                        <TableCell>重修性价比</TableCell> 
                        <TableCell>预期绩点</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plan.recommendedCourses.map(course => {
                        const rating = getIpsRating(course.ips);
                        return (
                          <TableRow key={course.course_code}>
                            <TableCell>{course.course_name}</TableCell>
                            <TableCell>{course.course_gpa}</TableCell>
                            <TableCell>
                              <Chip label={rating.label} color={rating.color.split('.')[0]} size="small" />
                            </TableCell>
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
                        );
                      })}
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