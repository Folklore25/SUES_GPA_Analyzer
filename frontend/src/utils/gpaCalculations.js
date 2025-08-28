/**
 * This file contains the canonical GPA calculation and chart data processing logic,
 * ported directly from the original data.js to ensure 100% accuracy.
 */

// Helper to convert semester code to Chinese representation
const convertSemesterToChinese = (semesterCode) => {
  if (!semesterCode) return 'N/A';
  const code = String(semesterCode).split(',')[0].trim();
  const num = parseInt(code, 10);
  if (isNaN(num)) return semesterCode;

  const year = Math.ceil(num / 2);
  const term = (num % 2 === 1) ? '上' : '下';
  const yearChinese = ['一', '二', '三', '四', '五'][year - 1] || year;

  return `大${yearChinese}${term}`;
};

/**
 * Calculates the current GPA.
 * Rule: Only includes courses where pass === 'passed' and GPA > 0.
 */
export function calculateCurrentGPA(data) {
    const passedCourses = data.filter(course => course.pass === 'passed' && parseFloat(course.course_gpa) > 0);
    if (passedCourses.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    passedCourses.forEach(course => {
        const credits = parseFloat(course.course_weight) || 0;
        const gpa = parseFloat(course.course_gpa) || 0;
        totalPoints += credits * gpa;
        totalCredits += credits;
    });
    
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

/**
 * Gets the total credits of courses that are included in GPA calculation.
 */
export function getGpaTotalCredits(data) {
    const passedCourses = data.filter(course => course.pass === 'passed' && parseFloat(course.course_gpa) > 0);
    return passedCourses.reduce((sum, course) => sum + (parseFloat(course.course_weight) || 0), 0);
}

/**
 * Processes data for the GPA Trend chart.
 * Returns data for both semester GPA and cumulative GPA.
 */
export function processGpaTrendData(data) {
    const semesterGPAs = {};
    const semesterCredits = {};
    
    data.forEach(course => {
        const semester = course.course_semester;
        const gpa = parseFloat(course.course_gpa);
        const weight = parseFloat(course.course_weight);
        
        if (semester && gpa !== null && !isNaN(gpa) && weight !== null && !isNaN(weight)) {
            const semesters = semester.toString().split(',');
            semesters.forEach(sem => {
                const semKey = sem.trim();
                if (semKey !== "--" && semKey !== "undefined") {
                    const semNum = parseInt(semKey);
                    if (!isNaN(semNum)) {
                        if (!semesterGPAs[semNum]) {
                            semesterGPAs[semNum] = 0;
                            semesterCredits[semNum] = 0;
                        }
                        semesterGPAs[semNum] += gpa * weight;
                        semesterCredits[semNum] += weight;
                    }
                }
            });
        }
    });
    
    const semesters = Object.keys(semesterGPAs).map(Number).sort((a, b) => a - b);
    
    const gpas = semesters.map(sem =>
        semesterCredits[sem] > 0 ? parseFloat((semesterGPAs[sem] / semesterCredits[sem]).toFixed(2)) : 0
    );
    
    // Calculate the final, overall current GPA to be displayed as a flat line
    const finalCurrentGPA = calculateCurrentGPA(data);
    const cumulativeGpa = Array(semesters.length).fill(parseFloat(finalCurrentGPA.toFixed(2)));
    
    const labels = semesters.map(s => convertSemesterToChinese(s));

    return { labels, semesterGpa: gpas, cumulativeGpa };
}

/**
 * Processes data for the Grade Distribution chart.
 * Rule: Counts letter grades from the 'course_score' field.
 */
export function processGradeDistributionData(data) {
    const gradeCount = {
        'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0,
        'C+': 0, 'C': 0, 'C-': 0, 'D': 0, 'F': 0
    };
    
    data.forEach(course => {
        const score = course.course_score;
        if (score && score !== '--' && gradeCount.hasOwnProperty(score)) {
            gradeCount[score]++;
        }
    });

    // Filter out grades with zero counts for a cleaner chart
    return Object.keys(gradeCount)
        .map(grade => ({ name: grade, value: gradeCount[grade] })) // ECharts uses name/value
        .filter(item => item.value > 0);
}

/**
 * Processes data for the Credit vs. GPA bubble chart.
 * Each bubble represents a (credit, gpa) coordinate.
 * The size of the bubble represents the number of courses at that coordinate.
 */
export function processCreditGpaBubbleData(data) {
  const pointMap = new Map();

  data.forEach(course => {
    const credits = parseFloat(course.course_weight);
    const gpa = parseFloat(course.course_gpa);

    if (isNaN(credits) || isNaN(gpa)) return;

    const key = `${credits}-${gpa}`;
    if (pointMap.has(key)) {
      const point = pointMap.get(key);
      point.count += 1;
      point.courseNames.push(course.course_name);
    } else {
      pointMap.set(key, {
        credits,
        gpa,
        count: 1,
        courseNames: [course.course_name],
      });
    }
  });

  // ECharts scatter data format: [credit, gpa, count, courseNames]
  return Array.from(pointMap.values()).map(p => [
    p.credits,
    p.gpa,
    p.count,
    p.courseNames.join('\n') // Join course names for tooltip
  ]);
}

/**
 * Processes data for the Performance Heatmap.
 * X-axis: Semester, Y-axis: Credits, Color: Average GPA
 */
export function processGpaHeatmapData(data) {
  const heatmapData = new Map(); // Key: "semester-credit", Value: { totalGpa: 0, count: 0 }

  data.forEach(course => {
    const semester = course.course_semester.split(',')[0].trim(); // Use first semester if multiple
    const credits = parseFloat(course.course_weight);
    const gpa = parseFloat(course.course_gpa);

    if (!semester || isNaN(credits) || isNaN(gpa)) return;

    const key = `${semester}-${credits}`;
    if (heatmapData.has(key)) {
      const entry = heatmapData.get(key);
      entry.totalGpa += gpa;
      entry.count += 1;
    } else {
      heatmapData.set(key, { totalGpa: gpa, count: 1 });
    }
  });

  const semesters = [...new Set(data.map(c => c.course_semester.split(',')[0].trim()))].sort();
  const creditValues = [...new Set(data.map(c => parseFloat(c.course_weight)))].filter(c => !isNaN(c)).sort((a, b) => a - b);

  const echartsData = [];
  semesters.forEach((semester, sIndex) => {
    creditValues.forEach((credit, cIndex) => {
      const key = `${semester}-${credit}`;
      if (heatmapData.has(key)) {
        const entry = heatmapData.get(key);
        const avgGpa = parseFloat((entry.totalGpa / entry.count).toFixed(2));
        echartsData.push([sIndex, cIndex, avgGpa]);
      }
    });
  });

  return {
    data: echartsData,
    semesters: semesters.map(s => convertSemesterToChinese(s)),
    credits: creditValues.map(c => `${c}学分`)
  };
}