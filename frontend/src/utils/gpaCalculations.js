/**
 * This file contains the canonical GPA calculation and chart data processing logic,
 * ported from the original data.js and adapted for the ECharts library.
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
 * Processes data for the GPA Trend chart.
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
 * Processes data for the Grade Distribution chart (by letter grade).
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

    return Object.keys(gradeCount)
        .map(grade => ({ name: grade, value: gradeCount[grade] })) // Use 'value' for ECharts
        .filter(item => item.value > 0);
}

/**
 * Processes data for the Course Attribute Distribution chart.
 */
export function processCourseAttributeData(data) {
    const attributeCredits = {};

    data.forEach(course => {
        const attribute = course.course_attribute || '未知属性';
        const credits = parseFloat(course.course_weight) || 0;
        if (credits > 0) {
            if (!attributeCredits[attribute]) {
                attributeCredits[attribute] = 0;
            }
            attributeCredits[attribute] += credits;
        }
    });

    return Object.keys(attributeCredits)
        .map(attr => ({ name: attr, value: attributeCredits[attr] }))
        .filter(item => item.value > 0);
}

/**
 * Processes data for the Credit vs. GPA scatter plot.
 */
export function processCreditGpaScatterData(data) {
    return data
        .map(course => {
            const credits = parseFloat(course.course_weight);
            const gpa = parseFloat(course.course_gpa);
            if (!isNaN(credits) && !isNaN(gpa)) {
                return [credits, gpa, course.course_name]; // [x, y, courseName]
            }
            return null;
        })
        .filter(item => item !== null);
}

/**
 * Calculates the current overall GPA, matching the original logic.
 * @param {Array} data The course data.
 * @returns {number} The current GPA.
 */
export function calculateCurrentGPA(data) {
    if (!data || data.length === 0) {
        return 0;
    }
    // Filter for passed courses with GPA > 0, as per original logic.
    const passedCourses = data.filter(course => course.pass === 'passed' && parseFloat(course.course_gpa) > 0);
    
    if (passedCourses.length === 0) {
        return 0;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    passedCourses.forEach(course => {
        const credits = parseFloat(course.course_weight) || 0;
        const gpa = parseFloat(course.course_gpa) || 0;
        totalPoints += credits * gpa;
        totalCredits += credits;
    });

    if (totalCredits === 0) {
        return 0;
    }

    return totalPoints / totalCredits;
}

/**
 * Calculates all summary statistics.
 * @param {Array} courseData The course data.
 * @returns {object} An object with totalCredits, passedCount, failedCount, and currentGPA.
 */
export function calculateSummaryStats(courseData) {
  if (!courseData) {
    return {
      totalCredits: 0,
      passedCount: 0,
      failedCount: 0,
      currentGPA: 0,
    };
  }

  // "已修总学分" (Total Taken Credits) - only passed and failed courses
  const totalCredits = courseData
    .filter(c => c.pass === 'passed' || c.pass === 'failed')
    .reduce((sum, course) => sum + (parseFloat(course.course_weight) || 0), 0);

  // "已通过课程" (Passed Courses)
  const passedCount = courseData.filter(c => c.pass === 'passed').length;

  // "已挂科课程" (Failed Courses)
  const failedCount = courseData.filter(c => c.pass === 'failed').length;

  // "当前加权GPA" (Current Weighted GPA)
  const currentGPA = calculateCurrentGPA(courseData);

  return { totalCredits, passedCount, failedCount, currentGPA };
}