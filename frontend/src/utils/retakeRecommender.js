/**
 * This file contains the canonical retake recommendation logic,
 * ported directly from data.js to ensure 100% accuracy.
 */

// Calculates the IPS (Improvement-Performance Score) for a course.
function calculateIPS(course, allCourses, targetGPA) {
    const totalCredits = allCourses.reduce((sum, c) => {
        return sum + (parseFloat(c.course_weight) || 0);
    }, 0);
    
    if (totalCredits === 0) return 0;
    
    const courseCredits = parseFloat(course.course_weight) || 0;
    const currentGPA = parseFloat(course.course_gpa) || 0;
    
    const creditWeight = courseCredits / totalCredits;
    const gap = Math.abs(targetGPA - currentGPA);
    const probabilityFactor = 1 / (1 + 0.2 * gap);
    const gpaImprovementSpace = (targetGPA - currentGPA) * probabilityFactor;
    const impactFactor = (targetGPA - currentGPA) * courseCredits / totalCredits;
    const ips = creditWeight * gpaImprovementSpace * impactFactor;
    
    return ips;
}

/**
 * Recommends courses to retake based on the IPS algorithm.
 * Rule: Recommends the top 7 courses with the highest IPS score.
 */
export function recommendRetakeCourses(data, targetGPA) {
    const passedCourses = data.filter(course => {
        return course.pass === 'passed' &&
               parseFloat(course.course_gpa) < targetGPA &&
               parseFloat(course.course_gpa) > 0;
    });
    
    const coursesWithIPS = passedCourses.map(course => ({
        ...course,
        ips: calculateIPS(course, data, targetGPA)
    }));
    
    coursesWithIPS.sort((a, b) => b.ips - a.ips);
    
    return coursesWithIPS.slice(0, 7);
}
