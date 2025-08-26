import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import {
  processGpaTrendData,
  processGradeDistributionData,
  processCourseAttributeData,
  processCreditGpaScatterData
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
          data: data.semesterGpa,
        },
        {
          name: '累计GPA',
          type: 'line',
          smooth: true,
          lineStyle: { type: 'dashed' },
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

  const attributeDistOptions = useMemo(() => {
    const data = processCourseAttributeData(courseData);
    return {
      ...baseOption,
      tooltip: { trigger: 'item' },
      legend: { show: false },
      series: [
        {
          name: '课程属性学分分布',
          type: 'pie',
          radius: '70%',
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }, [courseData, baseOption]);

  const scatterOptions = useMemo(() => {
    const data = processCreditGpaScatterData(courseData);
    return {
      ...baseOption,
      xAxis: { ...baseOption.xAxis, type: 'value', name: '学分' },
      yAxis: { ...baseOption.yAxis, type: 'value', name: '绩点' },
      tooltip: {
        trigger: 'item',
        formatter: (params) => `${params.data[2]}<br/>学分: ${params.data[0]}<br/>绩点: ${params.data[1]}`,
      },
      series: [
        {
          name: '课程',
          type: 'scatter',
          symbolSize: 10,
          data: data,
        },
      ],
    };
  }, [courseData, baseOption]);

  const chartList = [
    { title: '学期/累计GPA趋势图', options: gpaTrendOptions },
    { title: '学分 vs 绩点分布', options: scatterOptions },
    { title: '成绩等级分布', options: gradeDistOptions },
    { title: '课程属性学分分布', options: attributeDistOptions },
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