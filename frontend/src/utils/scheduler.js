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
    ...c, 
    hours: getCourseHours(c),
    duration: getCourseDurationInWeeks(c),
  }));
  coursesWithHours.sort((a, b) => b.hours - a.hours); // Sort by hours descending

  let semesters = Array.from({ length: numSemesters }, () => ({ courses: [], hours: 0 }));

  // --- Course Distribution Logic (same as before) ---
  switch (strategy) {
    case 'burnout':
      semesters = [];
      coursesWithHours.forEach(course => {
        let placed = false;
        for (const semester of semesters) {
          const currentLoad = semester.hours / 60;
          if (currentLoad < 2.5) {
            semester.courses.push(course);
            semester.hours += course.hours;
            placed = true;
            break;
          }
        }
        if (!placed) {
          semesters.push({ courses: [course], hours: course.hours });
        }
      });
      break;
    case 'aggressive':
      coursesWithHours.forEach(course => {
        let placed = false;
        for (let i = 0; i < semesters.length; i++) {
          const semesterLoad = semesters[i].hours / 60;
          if (semesterLoad < 1.8) {
            semesters[i].courses.push(course);
            semesters[i].hours += course.hours;
            placed = true;
            break;
          }
        }
        if (!placed) {
          const targetSemester = semesters.reduce((prev, curr) => curr.hours < prev.hours ? curr : prev);
          targetSemester.courses.push(course);
          targetSemester.hours += course.hours;
        }
      });
      break;
    case 'conservative':
    default:
      coursesWithHours.forEach(course => {
        const targetSemester = semesters.reduce((prev, curr) => curr.hours < prev.hours ? curr : prev);
        targetSemester.courses.push(course);
        targetSemester.hours += course.hours;
      });
      break;
  }

  const finalSchedule = semesters
    .map((s, i) => ({ ...s, semester: i + 1 }))
    .filter(s => s.courses.length > 0);

  // --- Heatmap Data Generation ---
  const heatmapData = [];
  const semesterLabels = [];
  const weekLabels = Array.from({ length: 16 }, (_, i) => `第 ${i + 1} 周`);

  finalSchedule.forEach((semester, semesterIndex) => {
    semesterLabels.push(`第 ${semester.semester} 学期`);
    const weeklyHours = Array(16).fill(0);
    semester.courses.forEach(course => {
      const weeklyCourseHours = course.hours / course.duration;
      for (let week = 0; week < course.duration; week++) {
        weeklyHours[week] += weeklyCourseHours;
      }
    });

    weeklyHours.forEach((hours, weekIndex) => {
      if (hours > 0) {
        heatmapData.push([weekIndex, semesterIndex, parseFloat(hours.toFixed(1))]);
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