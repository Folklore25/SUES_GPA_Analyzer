export function getCurrentSemesterInfo() {
  const month = new Date().getMonth(); // 0-11 (Jan-Dec)
  if (month >= 8 || month === 0) { // Sep, Oct, Nov, Dec, Jan
    return { current: 1, next: 2 }; // Current is 1st sem, next is 2nd
  } else { // Feb-Aug
    return { current: 2, next: 1 }; // Current is 2nd sem/summer, next is 1st
  }
}
