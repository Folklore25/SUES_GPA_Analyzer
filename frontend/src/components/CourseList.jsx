import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Card, CardContent } from '@mui/material';

// Helper to group courses by credit
const groupCoursesByCredit = (courses) => {
  return courses.reduce((acc, course) => {
    const credit = course.course_weight || '0';
    if (!acc[credit]) {
      acc[credit] = [];
    }
    acc[credit].push(course);
    return acc;
  }, {});
};

function CreditGroupedTable({ title, courses }) {
  const groupedCourses = useMemo(() => groupCoursesByCredit(courses), [courses]);
  const sortedCredits = useMemo(() => Object.keys(groupedCourses).sort((a, b) => b - a), [groupedCourses]);

  if (courses.length === 0) {
    return null; // Don't render anything if there are no courses in this category
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom>
        {title}
      </Typography>
      {sortedCredits.map(credit => (
        <Card key={credit} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" component="h4" gutterBottom>
              {credit} 学分课程
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>课程名称</TableCell>
                    <TableCell>成绩</TableCell>
                    <TableCell>绩点</TableCell>
                    <TableCell>开课学期</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedCourses[credit].map((course) => (
                    <TableRow key={course.course_code}>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>{course.course_score}</TableCell>
                      <TableCell>{course.course_gpa}</TableCell>
                      <TableCell>{course.course_semester}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function CourseList({ courseData }) {
  const passedCourses = useMemo(() => 
    courseData.filter(c => c.pass === 'passed'), 
    [courseData]
  );

  const failedCourses = useMemo(() => 
    courseData.filter(c => c.pass === 'failed'), 
    [courseData]
  );

  const ungradedCourses = useMemo(() => 
    courseData.filter(c => c.pass === 'unrepaired'), // Match the new status from the crawler
    [courseData]
  );

  return (
    <Box>
      <CreditGroupedTable title="已通过课程" courses={passedCourses} />
      <CreditGroupedTable title="已挂科/重修课程" courses={failedCourses} />
      <CreditGroupedTable title="未修课程" courses={ungradedCourses} />
    </Box>
  );
}

export default CourseList;