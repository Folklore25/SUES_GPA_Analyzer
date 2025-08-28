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
  if (credits >= 3) return 16; // 4 and 3 credit courses
  if (credits >= 1) return 8;  // 2 and 1 credit courses
  return 0;
};

export function generateSchedule(courses, numSemesters, strategy) {
  const coursesWithHours = courses.map(c => ({ 
    ...c, // @Github:Folklore25
    hours: getCourseHours(c),
    duration: getCourseDurationInWeeks(c),
  }));
  coursesWithHours.sort((a, b) => b.hours - a.hours); // Sort by hours descending

  let semesters;

  switch (strategy) {
    case 'burnout':
      // Ignores numSemesters, tries to use as few semesters as possible with a high load.
      semesters = [];
      const burnoutThreshold = 192; // Approx. 12 hours/week for 16 weeks
      coursesWithHours.forEach(course => {
        let placed = false;
        for (const semester of semesters) {
          if (semester.hours + course.hours <= burnoutThreshold) {
            semester.courses.push(course);
            semester.hours += course.hours;
            placed = true;// @Github:Folklore25
            break;
          }
        }
        if (!placed) {
          semesters.push({ courses: [course], hours: course.hours });
        }
      });
      break;

    case 'aggressive':
      // Front-loads into the given numSemesters.
      semesters = Array.from({ length: numSemesters }, () => ({ courses: [], hours: 0 }));
      const aggressiveThreshold = 144; // Approx. 9 hours/week for 16 weeks
      coursesWithHours.forEach(course => {
        let placed = false;
        for (let i = 0; i < semesters.length; i++) {
          if (semesters[i].hours + course.hours <= aggressiveThreshold) {
            semesters[i].courses.push(course);
            semesters[i].hours += course.hours;// @Github:Folklore25
            placed = true;
            break;
          }
        }
        // If it doesn't fit in any "roomy" semester, place it in the one with the fewest hours.
        if (!placed) {
          const targetSemester = semesters.reduce((prev, curr) => curr.hours < prev.hours ? curr : prev);
          targetSemester.courses.push(course);
          targetSemester.hours += course.hours;
        }
      });
      break;

    case 'conservative':
    default:
      // Distributes evenly across the given numSemesters.
      semesters = Array.from({ length: numSemesters }, () => ({ courses: [], hours: 0 }));
      coursesWithHours.forEach(course => {
        const targetSemester = semesters.reduce((prev, curr) => curr.hours < prev.hours ? curr : prev);
        targetSemester.courses.push(course);
        targetSemester.hours += course.hours;
      });// @Github:Folklore25
      break;
  }

  const finalSchedule = semesters
    .map((s, i) => ({ ...s, semester: i + 1 }))
    .filter(s => s.courses.length > 0);

  // --- Heatmap Data Generation ---
  const heatmapData = [];
  const semesterLabels = [];
  const weekLabels = Array.from({ length: 16 }, (_, i) => `第 ${i + 1} 周`);

  finalSchedule.forEach((semester, semesterIndex) => {// @Github:Folklore25
    semesterLabels.push(`第 ${semester.semester} 学期`);
    const weeklyData = Array.from({ length: 16 }, () => ({ hours: 0, courses: [] }));

    semester.courses.forEach(course => {
      const weeklyCourseHours = course.hours / course.duration;
      for (let week = 0; week < course.duration; week++) {
        weeklyData[week].hours += weeklyCourseHours;// @Github:Folklore25
        weeklyData[week].courses.push(course.course_name);
      }
    });

    weeklyData.forEach((weekData, weekIndex) => {
      if (weekData.hours > 0) {
        // ECharts heatmap data format: [x, y, value]
        const value = parseFloat(weekData.hours.toFixed(1));
        heatmapData.push([weekIndex, semesterIndex, value]);
      }// @Github:Folklore25
    });
  });

  return { 
    schedule: finalSchedule, 
    heatmap: { // @Github:Folklore25
      data: heatmapData, 
      semesters: semesterLabels, 
      weeks: weekLabels 
    } 
  };
}