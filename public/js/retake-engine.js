/**
 * GPA重修规划系统 - 核心分析引擎
 * 实现文档中定义的重修分析算法
 */

// 基于学分的难度系数
const difficultyCoefficients = {
  1: 0.7,   // 通识/选修课
  2: 0.85,  // 专业基础课
  3: 1.0,   // 专业核心课
  4: 1.2    // 专业进阶课
};

/**
 * 计算重修成功概率
 * @param {number} originalGPA - 原始绩点
 * @param {number} targetGPA - 目标绩点
 * @param {number} credits - 课程学分
 * @returns {number} 成功概率(0-1)
 */
function calculateSuccessRate(originalGPA, targetGPA, credits) {
  const baseSuccessRate = 0.8;
  const difficultyFactor = 1 / (difficultyCoefficients[credits] || 1.0);
  const historyFactor = (4.0 - originalGPA) / 4.0;
  const gap = targetGPA - originalGPA;
  
  let reasonablenessFactor = 1.0;
  if (gap > 2.0) reasonablenessFactor = 0.4;
  else if (gap > 1.5) reasonablenessFactor = 0.6;
  else if (gap > 1.0) reasonablenessFactor = 0.8;
  
  return baseSuccessRate * difficultyFactor * historyFactor * reasonablenessFactor;
}

/**
 * 计算重修价值评分
 * @param {Object} course - 课程对象
 * @param {Array} allCourses - 所有课程数组
 * @returns {number} 重修价值分数
 */
function calculateRetakeValue(course, allCourses) {
  const totalCredits = allCourses.reduce((sum, c) => sum + parseFloat(c.course_weight || 0), 0);
  const credits = parseFloat(course.course_weight || 0);
  const currentGPA = parseFloat(course.course_gpa || 0);
  
  // 提升潜力分
  const improvementPotential = (4.0 - currentGPA) * credits / (difficultyCoefficients[credits] || 1.0);
  
  // 影响权重分
  const impactWeight = credits > 0 ? (credits / totalCredits) * 100 : 0;
  
  // 努力回报比
  const effortReturnRatio = credits > 0 ? 
    (4.0 - currentGPA) / ((difficultyCoefficients[credits] || 1.0) * credits) : 0;
  
  return (improvementPotential * 0.4) + (impactWeight * 0.3) + (effortReturnRatio * 0.3);
}

/**
 * 获取课程优先级等级
 * @param {Object} course - 课程对象
 * @returns {Object} 优先级信息 {level, label, color}
 */
function getPriorityLevel(course) {
  const gpa = parseFloat(course.course_gpa || 0);
  const credits = parseFloat(course.course_weight || 0);
  
  if (gpa < 2.0 && credits >= 4) return { level: 1, label: '【紧急】', color: 'red' };
  if (gpa >= 2.0 && gpa < 2.5 && credits >= 3) return { level: 2, label: '【推荐】', color: 'orange' };
  if (gpa >= 2.5 && gpa < 3.0 && credits >= 3) return { level: 3, label: '【可选】', color: 'yellow' };
  if (gpa >= 3.0 && gpa < 3.3) return { level: 4, label: '【备选】', color: 'green' };
  return { level: 0, label: '不推荐', color: 'gray' };
}

/**
 * 分析推荐重修课程
 * @param {Array} courses - 所有课程数组
 * @param {number} targetGPA - 目标GPA
 * @returns {Array} 推荐重修课程数组
 */
function analyzeRetakeCourses(courses, targetGPA) {
  const passedCourses = courses.filter(course => 
    course.pass === 'passed' && parseFloat(course.course_gpa || 0) < targetGPA
  );
  
  return passedCourses.map(course => {
    const credits = parseFloat(course.course_weight || 0);
    const currentGPA = parseFloat(course.course_gpa || 0);
    
    return {
      ...course,
      priority: getPriorityLevel(course),
      successRate: calculateSuccessRate(currentGPA, targetGPA, credits),
      retakeValue: calculateRetakeValue(course, courses),
      recommendedTarget: getRecommendedTarget(currentGPA)
    };
  }).sort((a, b) => b.retakeValue - a.retakeValue);
}

/**
 * 获取推荐目标绩点
 * @param {number} originalGPA - 原始绩点
 * @returns {number} 推荐目标绩点
 */
function getRecommendedTarget(originalGPA) {
  if (originalGPA < 2.0) return 3.0;
  if (originalGPA < 2.5) return 3.3;
  if (originalGPA < 3.0) return 3.7;
  return 3.7;
}

/**
 * 计算重修后的GPA
 * @param {Array} currentCourses - 当前所有课程
 * @param {Array} selectedRetakes - 选择重修的课程代码数组
 * @param {Object} targetSettings - 各课程目标绩点设置
 * @returns {number} 预计GPA
 */
function calculateRealtimeGPA(currentCourses, selectedRetakes, targetSettings) {
  let totalPoints = 0;
  let totalCredits = 0;
  
  // 计算原有课程
  currentCourses.forEach(course => {
    const credits = parseFloat(course.course_weight || 0);
    const gpa = parseFloat(course.course_gpa || 0);
    totalPoints += credits * gpa;
    totalCredits += credits;
  });
  
  // 计算重修课程的影响
  selectedRetakes.forEach(courseCode => {
    const course = currentCourses.find(c => c.course_code === courseCode);
    if (course && targetSettings[courseCode]) {
      const targetGPA = targetSettings[courseCode];
      const credits = parseFloat(course.course_weight || 0);
      const originalGPA = parseFloat(course.course_gpa || 0);
      
      // 更新绩点贡献
      totalPoints += credits * (targetGPA - originalGPA);
    }
  });
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// 导出函数并附加到window对象
if (typeof window !== 'undefined') {
  window.retakeEngine = {
    calculateSuccessRate,
    calculateRetakeValue,
    getPriorityLevel,
    analyzeRetakeCourses,
    getRecommendedTarget,
    calculateRealtimeGPA,
    generatePlan: function(strategy, targetGPA) {
      // 这里实现生成重修方案的逻辑
      // 返回包含报告HTML、图表数据等的对象
      // 获取课程数据（实际应用中应该从外部传入）
      const courses = window.courseData || [];
      
      // 计算总学分
      const totalCredits = courses.reduce((sum, course) => {
        return sum + (parseFloat(course.course_weight) || 0);
      }, 0);
      
      // 计算当前GPA
      let currentGPA = 0;
      if (totalCredits > 0) {
        const totalPoints = courses.reduce((sum, course) => {
          const credits = parseFloat(course.course_weight) || 0;
          const gpa = parseFloat(course.course_gpa) || 0;
          return sum + credits * gpa;
        }, 0);
        currentGPA = totalPoints / totalCredits;
      }
      
      return {
        reportHTML: '<div>重修方案报告</div>',
        gpaPathData: {
          labels: ['当前', '重修后'],
          datasets: [
            {label: '最佳情况', data: [currentGPA, 3.5]},
            {label: '期望情况', data: [currentGPA, 3.2]},
            {label: '保守情况', data: [currentGPA, 3.0]},
            {label: '目标GPA', data: [currentGPA, targetGPA], borderDash: [5, 5]}
          ]
        },
        successRateData: {
          labels: ['成功率'],
          datasets: [
            {label: '最佳情况', data: [85]},
            {label: '期望情况', data: [75]},
            {label: '保守情况', data: [65]}
          ]
        },
        courses: courses,
        totalCredits: totalCredits,
        originalGPA: currentGPA
      };
    }
  };
}
