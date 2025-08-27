import React, { useMemo, useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Card, 
  TextField, Slider, ToggleButton, ToggleButtonGroup, TableSortLabel
} from '@mui/material';

// Helper to sort arrays
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator(a, b, orderBy) {
  // Treat non-numeric values as lowest
  const valA = isNaN(parseFloat(a[orderBy])) ? -Infinity : parseFloat(a[orderBy]);
  const valB = isNaN(parseFloat(b[orderBy])) ? -Infinity : parseFloat(b[orderBy]);
  if (valB < valA) return -1;
  if (valB > valA) return 1;
  return 0;
}

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

const headCells = [
  { id: 'course_name', label: '课程名称' },
  { id: 'course_weight', label: '学分' },
  { id: 'course_score', label: '成绩' },
  { id: 'course_gpa', label: '绩点' },
  { id: 'course_semester', label: '开课学期' },
];

function CreditGroupedTable({ title, courses, order, orderBy, onRequestSort }) {
  const groupedCourses = useMemo(() => groupCoursesByCredit(courses), [courses]);
  const sortedCredits = useMemo(() => Object.keys(groupedCourses).sort((a, b) => b - a), [groupedCourses]);

  const createSortHandler = (property) => (event) => {
    onRequestSort(property);
  };

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
          <Box sx={{
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#007ccc' : '#007ccc',
            color: (theme) => theme.palette.mode === 'dark' ? '#e8e8e8' : '#ffffffff',
            p: 1.5, 
            borderBottom: 1, 
            borderColor: 'divider' 
          }}>
            <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold' }}>
              {credit} 学分课程
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell key={headCell.id}>
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={createSortHandler(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stableSort(groupedCourses[credit], getComparator(order, orderBy)).map((course) => (
                  <TableRow key={course.course_code}>
                    <TableCell>{course.course_name}</TableCell>
                    <TableCell>{course.course_weight}</TableCell>
                    <TableCell>{course.course_score}</TableCell>
                    <TableCell>{course.course_gpa}</TableCell>
                    <TableCell>{course.course_semester}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ))}
    </Box>
  );
}

function CourseList({ courseData }) {
  // State for sorting and filtering
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('course_semester');
  const [searchText, setSearchText] = useState('');
  const [creditFilter, setCreditFilter] = useState('all');
  const [gpaRange, setGpaRange] = useState([0, 4]);

  const handleCreditChange = (event, newCredit) => {
    if (newCredit !== null) {
      setCreditFilter(newCredit);
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredCourseData = useMemo(() => {
    return courseData.filter(course => {
      const gpa = parseFloat(course.course_gpa);
      const name = course.course_name || '';
      const credit = parseFloat(course.course_weight);

      // GPA Range Filter
      if (!isNaN(gpa) && (gpa < gpaRange[0] || gpa > gpaRange[1])) {
        return false;
      }

      // Credit Filter
      if (creditFilter !== 'all') {
        if (creditFilter === 'other') {
          if ([1, 2, 3, 4].includes(credit)) return false;
        } else {
          if (credit !== creditFilter) return false;
        }
      }

      // Search Text Filter
      if (searchText && !name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [courseData, gpaRange, creditFilter, searchText]);

  const passedCourses = useMemo(() => 
    filteredCourseData.filter(c => c.pass === 'passed'), 
    [filteredCourseData]
  );

  const failedCourses = useMemo(() => 
    filteredCourseData.filter(c => c.pass === 'failed'), 
    [filteredCourseData]
  );

  const unrepairedCourses = useMemo(() => 
    filteredCourseData.filter(c => c.pass === 'unrepaired'),
    [filteredCourseData]
  );

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>筛选与排序</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, alignItems: 'center' }}>
          <TextField 
            label="按课程名称搜索"
            variant="outlined"
            size="small"
            fullWidth
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Box>
            <Typography gutterBottom>按绩点范围筛选</Typography>
            <Slider
              value={gpaRange}
              onChange={(e, newValue) => setGpaRange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={4}
              step={0.1}
            />
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>按学分筛选</Typography>
          <ToggleButtonGroup
            value={creditFilter}
            exclusive
            onChange={handleCreditChange}
            size="small"
          >
            <ToggleButton value="all">全部</ToggleButton>
            <ToggleButton value={4}>4学分</ToggleButton>
            <ToggleButton value={3}>3学分</ToggleButton>
            <ToggleButton value={2}>2学分</ToggleButton>
            <ToggleButton value={1}>1学分</ToggleButton>
            <ToggleButton value="other">其它</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      <CreditGroupedTable title="已通过课程" courses={passedCourses} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
      <CreditGroupedTable title="已挂科/重修课程" courses={failedCourses} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
      <CreditGroupedTable title="未修课程" courses={unrepairedCourses} order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
    </Box>
  );
}

export default CourseList;