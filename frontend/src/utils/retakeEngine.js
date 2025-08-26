/**
 * This is the advanced retake planning engine with multiple strategies.
 */
import { calculateCurrentGPA } from './gpaCalculations';

function getDifficultyFactor(credits) {
    if (credits <= 1) return 0.85;
    if (credits === 2) return 0.8;
    if (credits === 3) return 0.75;
    if (credits >= 4) return 0.7;
    return 1.0;
}

function calculateSuccessRate(originalGPA, targetGPA, credits, courseType = 'core') {
    let baseRate = 0.8;
    let adjustedDifficulty = getDifficultyFactor(credits);
    if (credits >= 3) {
      adjustedDifficulty = adjustedDifficulty * 0.9;
    }
    let historyFactor = (4.0 - originalGPA) / 4.0;
    if (originalGPA < 2.5) {
      historyFactor = Math.min(1.0, historyFactor * 1.2);
    }
    historyFactor = Math.max(0.5, historyFactor);
    const gap = targetGPA - originalGPA;
    let targetFactor = 1.0;
    if (gap > 2.0) targetFactor = 0.8;
    else if (gap > 1.5) targetFactor = 0.85;
    else if (gap > 1.0) targetFactor = 0.9;
    let typeFactor = 1.0;
    if (courseType === 'core') typeFactor = 1.05;
    if (courseType === 'elective') typeFactor = 0.95;
    const rate = baseRate * (1 / adjustedDifficulty) * historyFactor * targetFactor * typeFactor;
    return Math.max(0, Math.min(1, rate));
}

function calculateValueScore(course, totalCredits) {
    const credits = parseFloat(course.course_weight) || 0;
    const currentGPA = parseFloat(course.course_gpa) || 0;
    const targetGPA = 4.0;
    const difficultyFactor = getDifficultyFactor(credits);
    const gpaPotential = Math.pow((4.0 - currentGPA) / 4.0, 0.8);
    const creditImpact = Math.pow(credits / 4.0, 0.9);
    const potential = gpaPotential * creditImpact * 100;
    const impact = (credits / totalCredits) * 100;
    const effortReturn = ((targetGPA - currentGPA) * credits) / (difficultyFactor * 4.0);
    return (potential * 0.7) + (impact * 0.2) + (effortReturn * 0.1);
}

function getPriorityLabel(course) {
    const gpa = parseFloat(course.course_gpa) || 0;
    const credits = parseFloat(course.course_weight) || 0;
    const gap = 4.0 - gpa;
    const score = gap * credits;
    if (score >= 6.0) return { label: "紧急", color: "red" };
    if (score >= 4.0) return { label: "强烈推荐", color: "orange" };
    if (score >= 2.5) return { label: "推荐", color: "green" };
    if (score >= 1.5) return { label: "可选", color: "blue" };
    return { label: "不建议", color: "gray" };
}

function calculateSortingScore(course, totalCredits) {
    const gpa = parseFloat(course.course_gpa) || 0;
    const credits = parseFloat(course.course_weight) || 0;
    const gpaGapScore = (4.0 - gpa) / 4.0 * 100;
    let gpaWeight = 1.0;
    if (gpa < 2.0) gpaWeight = 1.5;
    else if (gpa < 2.5) gpaWeight = 1.3;
    const creditScore = credits / 5.0 * 100;
    const impactScore = ((4.0 - gpa) * credits / totalCredits) * 100;
    const enhancedImpactScore = impactScore * gpaWeight;
    return gpaGapScore * 0.5 + creditScore * 0.2 + enhancedImpactScore * 0.3;
}

async function generatePlan(allCourses, strategy, targetGPA) {
    const data = allCourses || [];
    if (data.length === 0) {
        return { 
            recommendedCourses: [], originalGPA: 0, projectedGPA: 0, bestCaseGPA: 0,
            overallSuccessRate: 0, riskLevel: 'N/A'
        };
    }
    const totalCredits = data.reduce((sum, c) => sum + (parseFloat(c.course_weight) || 0), 0);
    const originalGPA = calculateCurrentGPA(data);

    let candidates = data.filter(c => {
      const gpa = parseFloat(c.course_gpa);
      const credits = parseFloat(c.course_weight);
      return c.pass === 'passed' && gpa < 3.7 && (gpa < 3.0 || credits >= 2);
    });

    candidates = candidates.map(c => {
      const credits = parseFloat(c.course_weight) || 0;
      const successRate = calculateSuccessRate(parseFloat(c.course_gpa), targetGPA, credits);
      const valueScore = calculateValueScore(c, totalCredits);
      const priority = getPriorityLabel(c);
      const sortingScore = calculateSortingScore(c, totalCredits);
      return { ...c, successRate, valueScore, priority, sortingScore };
    });

    candidates.sort((a, b) => {
      const scoreDiff = b.sortingScore - a.sortingScore;
      if (Math.abs(scoreDiff) > 5) return scoreDiff;
      const successDiff = b.successRate - a.successRate;
      if (Math.abs(successDiff) > 0.1) return successDiff;
      return b.valueScore - a.valueScore;
    });

    let selectedCount;
    if (strategy === "conservative") selectedCount = 3;
    else if (strategy === "balanced") selectedCount = 5;
    else selectedCount = 8;

    candidates = candidates.slice(0, selectedCount);

    const projectedGPA = originalGPA + (candidates.reduce((sum, c) => {
        const credits = parseFloat(c.course_weight) || 0;
        const originalGPA = parseFloat(c.course_gpa) || 0;
        return sum + credits * (targetGPA - originalGPA);
    }, 0) / totalCredits);

    const bestCaseGPA = originalGPA + (candidates.reduce((sum, c) => {
        const credits = parseFloat(c.course_weight) || 0;
        const originalGPA = parseFloat(c.course_gpa) || 0;
        return sum + credits * (4.0 - originalGPA);
    }, 0) / totalCredits);

    const overallSuccessRate = candidates.length > 0 ? candidates.reduce((sum, c) => sum + c.successRate, 0) / candidates.length : 0;

    let riskLevel = '低风险';
    if (overallSuccessRate < 0.6) riskLevel = '高风险';
    else if (overallSuccessRate < 0.8) riskLevel = '中风险';

    return {
      recommendedCourses: candidates,
      originalGPA,
      projectedGPA: projectedGPA || originalGPA,
      bestCaseGPA: bestCaseGPA || originalGPA,
      overallSuccessRate: overallSuccessRate || 0,
      riskLevel: riskLevel
    };
}

export const retakeEngine = {
    generatePlan
};