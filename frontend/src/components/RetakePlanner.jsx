import React, { useState, useMemo } from 'react';
import { recommendRetakeCourses } from '../utils/retakeRecommender';
import { calculateCurrentGPA, getGpaTotalCredits } from '../utils/gpaCalculations';
import ReactECharts from 'echarts-for-react';
import { 
  Button, TextField, Card, CardContent, Typography, Box, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, useTheme, Select, MenuItem, FormControl, Chip,
  Tabs, Tab, List, ListItem, ListItemText, IconButton, Divider
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const getIpsRating = (ips) => {
  if (ips >= 0.0006) {
    return { label: '高', color: 'success.main' }; // Green
  } else if (ips >= 0.0003) {
    return { label: '中', color: 'warning.main' }; // Orange
  } else {
    return { label: '低', color: 'text.secondary' }; // Gray
  }
};

const HeatBar = ({ label, value, maxValue, unit }) => {
  const theme = useTheme();

  const getBarColor = () => {
    const percentage = (value / maxValue) * 100;
    if (percentage > 85) return theme.palette.error.main;
    if (percentage > 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const options = useMemo(() => ({
    grid: { left: 1, top: 5, right: 1, bottom: 0 },
    xAxis: { show: false, type: 'value', max: maxValue },
    yAxis: { show: false, type: 'category' },
    tooltip: { show: false },
    series: [{
      type: 'bar',
      data: [value],
      barWidth: '100%',
      showBackground: true,
      backgroundStyle: {
        color: theme.palette.action.hover
      },
      itemStyle: {
        color: getBarColor(),
        borderRadius: 5
      }
    }]
  }), [value, maxValue, theme]);

  return (
    <Box sx={{ my: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2">{value} {unit}</Typography>
      </Box>
      <Box sx={{ height: 20 }}>
        <ReactECharts option={options} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
      </Box>
    </Box>
  );
};

function RetakePlanner({ courseData }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // State for original planner
  const [targetGpa, setTargetGpa] = useState(3.8);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [individualTargets, setIndividualTargets] = useState({});

  // State for new manual planner
  const [cart, setCart] = useState([]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
          progress: { show: true, width: 18 },
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

  // --- LOGIC FOR TAB 2: MANUAL PLANNER ---
  const availableCourses = useMemo(() => {
    // Use the same targetGPA from the intelligent planner for consistency
    const manualTargetGpa = parseFloat(targetGpa) || 4.0;
    return courseData
      .filter(c => parseFloat(c.course_gpa) < 3.0 && c.pass !== 'unrepaired')
      .map(c => ({
        ...c,
        sortScore: (manualTargetGpa - parseFloat(c.course_gpa)) * (parseFloat(c.course_weight) || 0)
      }))
      .sort((a, b) => b.sortScore - a.sortScore);
  }, [courseData, targetGpa]);

  const handleAddToCart = (course) => {
    if (!cart.find(c => c.course_code === course.course_code)) {
      setCart([...cart, course]);
    }
  };

  const handleRemoveFromCart = (courseCode) => {
    setCart(cart.filter(c => c.course_code !== courseCode));
  };

  const analysis = useMemo(() => {
    const totalStress = cart.reduce((sum, course) => sum + (parseFloat(course.course_weight) || 0), 0);

    const totalTime = cart.reduce((sum, course) => {
      const credits = parseFloat(course.course_weight) || 0;
      if (credits >= 4) return sum + 48;
      if (credits >= 3) return sum + 24;
      if (credits >= 1) return sum + 12;
      return sum;
    }, 0);

    const originalGPA = calculateCurrentGPA(courseData);
    const totalGpaCredits = getGpaTotalCredits(courseData);
    let projectedGpa = originalGPA;

    if (totalGpaCredits > 0) {
      const gpaImprovement = cart.reduce((sum, course) => {
        const targetGpaForCalc = 4.0; // Assume a target of 4.0 for any retaken course in the cart
        const improvement = (targetGpaForCalc - parseFloat(course.course_gpa)) * (parseFloat(course.course_weight) || 0);
        return sum + improvement;
      }, 0);
      projectedGpa = originalGPA + (gpaImprovement / totalGpaCredits);
    }

    return { totalTime, totalStress, projectedGpa };
  }, [cart, courseData]);

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>重修规划</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="智能推荐" />
          <Tab label="手动规划 (课程购物车)" />
        </Tabs>
      </Box>

      {/* Tab 1: Intelligent Recommendation (Existing Content) */}
      {activeTab === 0 && (
        <Box>
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
                            <TableCell>学分</TableCell>
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
                                <TableCell>{course.course_weight}</TableCell>
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
      )}

      {/* Tab 2: Manual Planner (New Content) */}
      {activeTab === 1 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          {/* Left Column: Available Courses */}
          <Card component={Paper}>
            <CardContent>
              <Typography variant="h6" gutterBottom>可选课程 (绩点 &lt; 3.0)</Typography>
              <List dense sx={{ height: 400, overflowY: 'auto' }}>
                {availableCourses.map(course => (
                  <ListItem key={course.course_code} secondaryAction={<IconButton edge="end" aria-label="add" onClick={() => handleAddToCart(course)} disabled={cart.some(c => c.course_code === course.course_code)}><AddCircleOutlineIcon /></IconButton>}>
                    <ListItemText primary={course.course_name} secondary={`绩点: ${course.course_gpa} | 学分: ${course.course_weight}`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Middle Column: Shopping Cart */}
          <Card component={Paper}>
            <CardContent>
              <Typography variant="h6" gutterBottom>我的重修计划</Typography>
              <List dense sx={{ height: 400, overflowY: 'auto' }}>
                {cart.length > 0 ? cart.map(course => (
                  <ListItem key={course.course_code} secondaryAction={<IconButton edge="end" aria-label="remove" onClick={() => handleRemoveFromCart(course.course_code)}><RemoveCircleOutlineIcon /></IconButton>}>
                    <ListItemText primary={course.course_name} />
                  </ListItem>
                )) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    请从左侧添加课程
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Right Column: Analysis Panel */}
          <Card component={Paper}>
            <CardContent>
              <Typography variant="h6" gutterBottom>效果分析</Typography>
              {cart.length > 0 ? (
                <Box>
                  <HeatBar label="重修时间" value={analysis.totalTime} maxValue={120} unit="学时" />
                  <HeatBar label="重修压力" value={analysis.totalStress} maxValue={20} unit="学分" />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" align="center">
                    预估新GPA: {analysis.projectedGpa.toFixed(2)}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  添加课程后查看分析
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default RetakePlanner;