import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import {
  processGpaTrendData,
  processGradeDistributionData,
  processCreditGpaBubbleData // Changed from scatter to bubble
} from '../utils/gpaCalculations';

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

  const gpaTrendOptions = useMemo(() => {
    const data = processGpaTrendData(courseData);
    return {
      ...baseOption,
      xAxis: {
        ...baseOption.xAxis,
        type: 'category',
        data: data.labels,
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
          data: data.semesterGpa,
        },
        {
          name: '累计GPA',
          type: 'line',
          smooth: true,
          symbolSize: 8, // Restore the nodes
          lineStyle: { width: 3, type: 'dashed' },
          areaStyle: { opacity: 0.15 },
          data: data.cumulativeGpa,
        },
      ],
    };
  }, [courseData, baseOption]);

  const gradeDistOptions = useMemo(() => {
    const data = processGradeDistributionData(courseData);
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
          data: data,
        },
      ],
    };
  }, [courseData, baseOption]);

  const bubbleOptions = useMemo(() => {
    const data = processCreditGpaBubbleData(courseData);
    return {
      ...baseOption,
      xAxis: { ...baseOption.xAxis, type: 'value', name: '学分', min: 0 },
      yAxis: { ...baseOption.yAxis, type: 'value', name: '绩点', min: 0, max: 4 },
      visualMap: {
        show: false,
        min: 1,
        max: Math.max(...data.map(d => d[2])),
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
      },
      series: [
        {
          name: '课程',
          type: 'scatter',
          data: data,
        },
      ],
    };
  }, [courseData, baseOption]);

  const chartList = [
    { title: '学期/累计GPA趋势图', options: gpaTrendOptions },
    { title: '学分 vs 绩点气泡图', options: bubbleOptions },
    { title: '成绩等级分布', options: gradeDistOptions },
    // The 4th chart is temporarily removed as requested
  ];

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        数据可视化
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {chartList.map((chart, index) => (
          <Card key={index}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                {chart.title}
              </Typography>
              <ReactECharts option={chart.options} style={{ height: 400 }} notMerge={true} lazyUpdate={true} theme={theme.palette.mode} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default Charts;
