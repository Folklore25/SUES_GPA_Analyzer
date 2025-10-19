import { getCurrentSemesterInfo } from './semesterHelper.js';

const getCourseHours = (course) => {
  const credits = parseFloat(course.course_weight) || 0;
  if (credits >= 4) return 48;
  if (credits >= 3) return 36;
  if (credits >= 2) return 24;
  if (credits >= 1) return 12;
  return 0;
};

const getCourseDurationInWeeks = (course) => {
  const credits = parseFloat(course.course_weight) || 0;
  if (credits >= 3) return 16;
  if (credits >= 1) return 8;
  return 0;
};

const semesterNumToName = (num) => {
    const year = Math.ceil(num / 2);
    const term = num % 2 === 1 ? '第一学期' : '第二学期';
    const yearStr = ['一', '二', '三', '四', '五'][year - 1] || year;
    return `大${yearStr}${term}`;
}

// Checks if a course is available in a given semester type (1 for Fall, 2 for Spring)
function isCourseAvailable(course, semesterType) {
    const offered = course.course_semester;
    if (offered === '--') {
        return true;
    }

    // Parse numbers from strings like '1', '1,2', '(3,4)'
    const offeredNums = (offered.match(/\d+/g) || []).map(Number);
    if (offeredNums.length === 0) {
        return false; // No valid semester found
    }

    if (semesterType === 1) { // Fall semester
        return offeredNums.some(n => n % 2 === 1);
    } else { // Spring semester
        return offeredNums.some(n => n % 2 === 0);
    }
}

export function generateSchedule(courses, numSemesters, strategy) {
  const coursesWithHours = courses.map(c => ({ 
    ...c, 
    hours: getCourseHours(c),
    duration: getCourseDurationInWeeks(c),
  }));
  coursesWithHours.sort((a, b) => b.hours - a.hours);

  // 1. Generate the sequence of upcoming semesters
  const semesterInfo = getCurrentSemesterInfo();
  let nextSemesterType = semesterInfo.next;
  let nextSemesterNum = semesterInfo.current; // A bit tricky, we need to find the lowest possible semester number to start from

  const semesters = Array.from({ length: numSemesters }, (_, i) => {
      const semesterType = (nextSemesterType + i) % 2 === 0 ? 2 : 1;
      // This logic for semester number is simplified and might not be academically perfect
      // but it provides a reasonable progression for planning.
      nextSemesterNum += (i > 0 && semesterType === 1) ? 1 : 0;
      return {
          semesterType: semesterType,
          semesterName: semesterNumToName(nextSemesterNum + i + 1), // A plausible future semester name
          courses: [],
          hours: 0
      };
  });

  // 2. Place courses according to strategy and availability
  switch (strategy) {
    case 'burnout':
      // This strategy is complex to reconcile with availability, so we use a simplified approach
      // It will just try to fit courses wherever possible, respecting availability.
    case 'aggressive':
      coursesWithHours.forEach(course => {
        let placed = false;
        for (const semester of semesters) {
          if (isCourseAvailable(course, semester.semesterType)) {
            semester.courses.push(course);
            semester.hours += course.hours;
            placed = true;
            break; // Place in the first available semester
          }
        }
        if (!placed) {
          // If not available in any future semester, add to a separate list (or handle as error)
          console.warn(`Course ${course.course_name} could not be scheduled in the next ${numSemesters} semesters.`);
        }
      });
      break;

    case 'conservative':
    default:
      // Distributes evenly, respecting availability
      coursesWithHours.forEach(course => {
        const availableSemesters = semesters.filter(s => isCourseAvailable(course, s.semesterType));
        if (availableSemesters.length > 0) {
            const targetSemester = availableSemesters.reduce((prev, curr) => curr.hours < prev.hours ? curr : prev);
            targetSemester.courses.push(course);
            targetSemester.hours += course.hours;
        } else {
            console.warn(`Course ${course.course_name} could not be scheduled in the next ${numSemesters} semesters.`);
        }
      });
      break;
  }

  const finalSchedule = semesters
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter(s => s.courses.length > 0);

  // --- Heatmap Data Generation ---
  const heatmapData = [];
  const semesterLabels = [];
  const weekLabels = Array.from({ length: 16 }, (_, i) => `第 ${i + 1} 周`);

  finalSchedule.forEach((semester) => {
    semesterLabels.push(semester.semesterName);
    const weeklyData = Array.from({ length: 16 }, () => ({ hours: 0, courses: [] }));

    semester.courses.forEach(course => {
      const weeklyCourseHours = course.hours / course.duration;
      for (let week = 0; week < course.duration; week++) {
        weeklyData[week].hours += weeklyCourseHours;
        weeklyData[week].courses.push(course.course_name);
      }
    });

    weeklyData.forEach((weekData, weekIndex) => {
      if (weekData.hours > 0) {
        const value = parseFloat(weekData.hours.toFixed(1));
        heatmapData.push([weekIndex, semesterLabels.length - 1, value]);
      }
    });
  });

  return { 
    schedule: finalSchedule, 
    heatmap: { 
      data: heatmapData, 
      semesters: semesterLabels, 
      weeks: weekLabels 
    } 
  };
}