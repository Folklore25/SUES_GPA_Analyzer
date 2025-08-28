const numberToChinese = (num) => {
  const map = ['', '一', '二', '三', '四', '五', '六']; // Can be extended if needed
  return map[num] || num;
};

export function formatSemester(semesterString) {
  if (!semesterString || typeof semesterString !== 'string') {
    return '--';
  }

  const semesters = semesterString.split(',').map(s => parseInt(s.trim(), 10));

  return semesters.map(num => {
    if (isNaN(num) || num < 1) {
      return '第二课堂选修'; // Handle invalid numbers
    }
    const year = Math.ceil(num / 2);
    const term = num % 2 === 1 ? '上' : '下';
    return `大${numberToChinese(year)}${term}`;
  }).join(', ');
}
