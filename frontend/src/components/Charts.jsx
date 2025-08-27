import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

// Dynamic import for ReactECharts
const ReactECharts = lazy(() => import('echarts-for-react'));

// ECharts base option for styling to match MUI theme
const useEChartsBaseOption = () => {
  const theme = useTheme();
  return {
    grid: { top: 40, right: 20, bottom: 40, left: 50 },
    legend: {
      textStyle: {
        color: theme.palette.text.primary,
      },
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      axisLine: {
        lineStyle: {
          color: theme.palette.text.secondary,
        },
      },
      axisLabel: {
        color: theme.palette.text.secondary,
      },
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          color: theme.palette.text.secondary,
        },
      },
      axisLabel: {
        color: theme.palette.text.secondary,
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
    },
  };
};

function Charts({ courseData }) {
  const theme = useTheme();
  const baseOption = useEChartsBaseOption();
  
  // State for chart data
  const [gpaTrendData, setGpaTrendData] = useState(null);
  const [gradeDistributionData, setGradeDistributionData] = useState(null);
  const [creditGpaBubbleData, setCreditGpaBubbleData] = useState(null);
  const [gpaHeatmapData, setGpaHeatmapData] = useState(null);

  // Load chart data when courseData changes
  useEffect(() => {
    if (!courseData || courseData.length === 0) return;
    
    // Import utilities and process data
    import('../utils/gpaCalculations').then(({ 
      processGpaTrendData, 
      processGradeDistributionData, 
      processCreditGpaBubbleData, 
      processGpaHeatmapData 
    }) => {
      // Process GPA trend data
      setGpaTrendData(processGpaTrendData(courseData));
      
      // Process grade distribution data
      setGradeDistributionData(processGradeDistributionData(courseData));
      
      // Process credit vs GPA bubble data
      setCreditGpaBubbleData(processCreditGpaBubbleData(courseData));
      
      // Process heatmap data
      const filteredCourses = courseData.filter(c => (parseFloat(c.course_weight) || 0) <= 4);
      setGpaHeatmapData(processGpaHeatmapData(filteredCourses));
    });
  }, [courseData]);

  const gpaTrendOptions = useMemo(() => {
    if (!gpaTrendData) return {};
    
    return {
      ...baseOption,
      xAxis: {
        ...baseOption.xAxis,
        type: 'category',
        data: gpaTrendData.labels,
      },
      yAxis: {
        ...baseOption.yAxis,
        type: 'value',
        min: 0,
        max: 4,
      },
      series: [
        {
          name: '学期GPA',
          type: 'line',
          smooth: true,
          symbolSize: 8, // Restore the nodes
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.3 },
          data: gpaTrendData.semesterGpa,
        },
        {
          name: '累计GPA',
          type: 'line',
          smooth: true,
          symbolSize: 8, // Restore the nodes
          lineStyle: { width: 3, type: 'dashed' },
          areaStyle: { opacity: 0.15 },
          data: gpaTrendData.cumulativeGpa,
        },
      ],
    };
  }, [gpaTrendData, baseOption]);

  const gradeDistOptions = useMemo(() => {
    if (!gradeDistributionData) return {};
    
    return {
      ...baseOption,
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left', top: 'center' },
      series: [
        {
          name: '成绩等级分布',
          type: 'pie',
          radius: ['40%', '70%'], // Doughnut chart
          avoidLabelOverlap: false,
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
          labelLine: { show: false },
          data: gradeDistributionData,
        },
      ],
    };
  }, [gradeDistributionData, baseOption]);

  const bubbleOptions = useMemo(() => {
    if (!creditGpaBubbleData) return {};
    
    return {
      ...baseOption,
      grid: { ...baseOption.grid, right: 65 }, // Increase right margin for axis name
      xAxis: { ...baseOption.xAxis, type: 'value', name: '学分', min: 0 },
      yAxis: { ...baseOption.yAxis, type: 'value', name: '绩点', min: 0, max: 4 },
      visualMap: {
        show: false,
        min: 1,
        max: creditGpaBubbleData.length > 0 ? Math.max(...creditGpaBubbleData.map(d => d[2])) : 1,
        dimension: 2, // Map size to the 3rd item in data array (count)
        inRange: {
          symbolSize: [10, 40] // Bubble size range
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const [credit, gpa, count, courseNames] = params.data;
          return `<b>${count} 门课程</b><br/>
                  学分: ${credit}<br/>
                  绩点: ${gpa.toFixed(2)}<br/>
                  <hr style="margin: 5px 0"/>
                  ${courseNames.replace(/\n/g, '<br/>')}`;
        },
        position: function (point, params, dom, rect, size) {
          // If the bubble is in the top 30% of the chart, move the tooltip down and right
          if (point[1] < size.viewSize[1] * 0.3) {
            return [point[0] + 10, point[1] + 10];
          }
          // Otherwise, use default positioning
          return null;
        },
      },
      series: [
        {
          name: '课程',
          type: 'scatter',
          data: creditGpaBubbleData,
        },
      ],
    };
  }, [creditGpaBubbleData, baseOption]);

  const heatmapOptions = useMemo(() => {
    if (!gpaHeatmapData) return {};
    
    const maxHours = gpaHeatmapData.data.length > 0 ? Math.max(...gpaHeatmapData.data.map(item => item[2]), 5) : 5;

    return {
      ...baseOption,
      tooltip: {
        position: 'top',
        formatter: (params) => `平均绩点: ${params.value[2].toFixed(2)}`
      },
      grid: { height: '60%', top: '10%' },
      xAxis: {
        type: 'category',
        data: gpaHeatmapData.semesters,
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: gpaHeatmapData.credits,
        splitArea: { show: true }
      },
      visualMap: {
        min: 1,
        max: 4,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: { color: ['#313695', '#4575b4ff', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'] },
        textStyle: { color: theme.palette.text.primary }
      },
      series: [{
        name: '学期表现',
        type: 'heatmap',
        data: gpaHeatmapData.data,
        label: { 
          show: true, 
          formatter: (params) => params.value[2] 
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    };
  }, [gpaHeatmapData, baseOption, theme.palette.text.primary]);

  const chartList = [
    { title: '学期/累计GPA趋势图', options: gpaTrendOptions },
    { title: '成绩等级分布', options: gradeDistOptions },    
    { title: '学分 vs 绩点气泡图', options: bubbleOptions },
    { title: '学期表现热力图', options: heatmapOptions },
  ];

  // Loading fallback component
  const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Typography>图表加载中...</Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {chartList.map((chart, index) => (
          <Card key={index}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                {chart.title}
              </Typography>
              <Suspense fallback={<LoadingFallback />}>
                <ReactECharts option={chart.options} style={{ height: 400 }} notMerge={true} lazyUpdate={true} theme={theme.palette.mode} />
              </Suspense>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default Charts;