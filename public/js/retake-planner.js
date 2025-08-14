/**
 * GPA重修规划系统 - 交互式规划模块
 * 实现文档中定义的交互式规划功能
 */

const retakeEngine = require('./retake-engine');


class RetakePlanner {
  constructor(courseData) {
    this.courses = courseData;
    this.selectedRetakes = [];
    this.targetSettings = {};
    this.currentGPA = this.calculateCurrentGPA();
    this.targetGPA = this.currentGPA;
  }

  /**
   * 计算当前GPA
   * @returns {number} 当前GPA
   */
  calculateCurrentGPA() {
    let totalPoints = 0;
    let totalCredits = 0;

    this.courses.forEach(course => {
      const credits = parseFloat(course.course_weight || 0);
      const gpa = parseFloat(course.course_gpa || 0);
      totalPoints += credits * gpa;
      totalCredits += credits;
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  /**
   * 设置整体目标GPA
   * @param {number} targetGPA - 目标GPA
   */
  setTargetGPA(targetGPA) {
    this.targetGPA = Math.min(Math.max(targetGPA, 0), 4.0);
    this.updateRecommendedRetakes();
  }

  /**
   * 更新推荐重修课程
   */
  updateRecommendedRetakes() {
    this.recommendedRetakes = retakeEngine.analyzeRetakeCourses(
      this.courses, 
      this.targetGPA
    );
  }

  /**
   * 添加重修课程
   * @param {string} courseCode - 课程代码
   * @param {number} targetGPA - 目标绩点
   */
  addRetakeCourse(courseCode, targetGPA) {
    if (!this.selectedRetakes.includes(courseCode)) {
      this.selectedRetakes.push(courseCode);
      this.targetSettings[courseCode] = targetGPA;
    }
  }

  /**
   * 移除重修课程
   * @param {string} courseCode - 课程代码
   */
  removeRetakeCourse(courseCode) {
    const index = this.selectedRetakes.indexOf(courseCode);
    if (index !== -1) {
      this.selectedRetakes.splice(index, 1);
      delete this.targetSettings[courseCode];
    }
  }

  /**
   * 更新课程目标绩点
   * @param {string} courseCode - 课程代码
   * @param {number} targetGPA - 目标绩点
   */
  updateCourseTarget(courseCode, targetGPA) {
    if (this.selectedRetakes.includes(courseCode)) {
      this.targetSettings[courseCode] = targetGPA;
    }
  }

  /**
   * 计算预计GPA
   * @returns {number} 预计GPA
   */
  calculateProjectedGPA() {
    return retakeEngine.calculateRealtimeGPA(
      this.courses,
      this.selectedRetakes,
      this.targetSettings
    );
  }

  /**
   * 获取最佳情况GPA
   * @returns {number} 最佳情况GPA
   */
  getBestCaseGPA() {
    const bestCaseSettings = {};
    this.selectedRetakes.forEach(courseCode => {
      bestCaseSettings[courseCode] = 4.0;
    });
    return retakeEngine.calculateRealtimeGPA(
      this.courses,
      this.selectedRetakes,
      bestCaseSettings
    );
  }

  /**
   * 获取期望情况GPA
   * @returns {number} 期望情况GPA
   */
  getExpectedCaseGPA() {
    let totalPoints = 0;
    let totalCredits = 0;

    // 计算原有课程
    this.courses.forEach(course => {
      const credits = parseFloat(course.course_weight || 0);
      const gpa = parseFloat(course.course_gpa || 0);
      totalPoints += credits * gpa;
      totalCredits += credits;
    });

    // 计算重修课程的影响
    this.selectedRetakes.forEach(courseCode => {
      const course = this.courses.find(c => c.course_code === courseCode);
      if (course && this.targetSettings[courseCode]) {
        const targetGPA = this.targetSettings[courseCode];
        const credits = parseFloat(course.course_weight || 0);
        const originalGPA = parseFloat(course.course_gpa || 0);
        const successRate = retakeEngine.calculateSuccessRate(
          originalGPA,
          targetGPA,
          credits
        );

        // 加权计算期望值
        totalPoints += credits * (
          (targetGPA * successRate) + 
          (originalGPA * (1 - successRate)) - 
          originalGPA
        );
      }
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  /**
   * 获取保守情况GPA
   * @returns {number} 保守情况GPA
   */
  getConservativeCaseGPA() {
    const conservativeSettings = {};
    this.selectedRetakes.forEach(courseCode => {
      const course = this.courses.find(c => c.course_code === courseCode);
      if (course) {
        const originalGPA = parseFloat(course.course_gpa || 0);
        const targetGPA = this.targetSettings[courseCode];
        
        // 保守估计：高目标仅提升一个等级
        if (targetGPA >= 3.7) {
          conservativeSettings[courseCode] = originalGPA < 3.0 ? 3.3 : 3.7;
        } else if (targetGPA >= 3.3) {
          conservativeSettings[courseCode] = 3.0;
        } else {
          conservativeSettings[courseCode] = targetGPA;
        }
      }
    });

    return retakeEngine.calculateRealtimeGPA(
      this.courses,
      this.selectedRetakes,
      conservativeSettings
    );
  }

  /**
   * 生成重修方案报告
   * @returns {Object} 报告对象
   */
  generateRetakeReport() {
    const projectedGPA = this.calculateProjectedGPA();
    const bestCaseGPA = this.getBestCaseGPA();
    const expectedCaseGPA = this.getExpectedCaseGPA();
    const conservativeCaseGPA = this.getConservativeCaseGPA();

    // 计算整体成功率
    let totalSuccessRate = 0;
    let count = 0;
    
    this.selectedRetakes.forEach(courseCode => {
      const course = this.courses.find(c => c.course_code === courseCode);
      if (course && this.targetSettings[courseCode]) {
        const credits = parseFloat(course.course_weight || 0);
        const originalGPA = parseFloat(course.course_gpa || 0);
        const targetGPA = this.targetSettings[courseCode];
        
        totalSuccessRate += retakeEngine.calculateSuccessRate(
          originalGPA,
          targetGPA,
          credits
        ) * credits;
        count += credits;
      }
    });

    const overallSuccessRate = count > 0 ? totalSuccessRate / count : 0;

    // 风险等级评估
    let riskLevel = '低风险';
    if (overallSuccessRate < 0.6) riskLevel = '高风险';
    else if (overallSuccessRate < 0.8) riskLevel = '中风险';

    return {
      currentGPA: this.currentGPA,
      targetGPA: this.targetGPA,
      projectedGPA,
      bestCaseGPA,
      expectedCaseGPA,
      conservativeCaseGPA,
      overallSuccessRate,
      riskLevel,
      selectedCourses: this.selectedRetakes.map(courseCode => {
        const course = this.courses.find(c => c.course_code === courseCode);
        return {
          ...course,
          targetGPA: this.targetSettings[courseCode],
          successRate: retakeEngine.calculateSuccessRate(
            parseFloat(course.course_gpa || 0),
            this.targetSettings[courseCode],
            parseFloat(course.course_weight || 0))
        };
      })
    };
  }
}

module.exports = {
  RetakePlanner,
  targetOptions
};
