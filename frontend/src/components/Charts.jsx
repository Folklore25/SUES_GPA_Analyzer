import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import {
  processGpaTrendData,
  processGradeDistributionData,
  processCreditGpaBubbleData,
  processGpaHeatmapData // Import the new heatmap data processor
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
      grid: { ...baseOption.grid, right: 65 }, // Increase right margin for axis name
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
          data: data,
        },
      ],
    };
  }, [courseData, baseOption]);

  const heatmapOptions = useMemo(() => {
    // Filter out courses with credits greater than 4
    const filteredCourses = courseData.filter(c => (parseFloat(c.course_weight) || 0) <= 4);
    const data = processGpaHeatmapData(filteredCourses);
    return {
      ...baseOption,
      tooltip: {
        position: 'top',
        formatter: (params) => `平均绩点: ${params.value[2].toFixed(2)}`
      },
      grid: { height: '60%', top: '10%' },
      xAxis: {
        type: 'category',
        data: data.semesters,
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: data.credits,
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
        data: data.data,
        label: { show: true, formatter: (params) => params.value[2] },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    };
  }, [courseData, baseOption, theme.palette.text.primary]);

  const chartList = [
    { title: '学期/累计GPA趋势图', options: gpaTrendOptions },
    { title: '成绩等级分布', options: gradeDistOptions },    
    { title: '学分 vs 绩点气泡图', options: bubbleOptions },
    { title: '学期表现热力图', options: heatmapOptions },
  ];

  return (
    <Box>
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