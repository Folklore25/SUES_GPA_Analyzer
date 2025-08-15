/**
 * GPA重修规划系统 - 交互式规划模块
 * 实现文档中定义的交互式规划功能
 * 优化重点：强化低绩点+高学分课程的选择和评估
 */

const retakeEngine = require('./retake-engine');


class RetakePlanner {
  constructor(courseData) {
    this.courses = courseData;
    this.selectedRetakes = [];
    this.targetSettings = {};
    this.currentGPA = this.calculateCurrentGPA();
    this.targetGPA = this.currentGPA;
    this.priorityScores = {}; // 新增：存储每门课程的优先级分数
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
   * 计算课程优先级分数
   * 优化：综合考虑低绩点和高学分
   * @param {Object} course - 课程对象
   * @returns {number} 优先级分数
   */
  calculatePriorityScore(course) {
    const gpa = parseFloat(course.course_gpa || 0);
    const credits = parseFloat(course.course_weight || 0);

    // 绩点提升潜力（低绩点得高分）
    const gpaPotential = Math.pow((4.0 - gpa) / 4.0, 0.8) * 100;
    
    // 对低绩点课程给予额外加权
    let gpaWeight = 1.0;
    if (gpa < 2.0) {
      gpaWeight = 1.5;  // GPA低于2.0的课程权重增加50%
    } else if (gpa < 2.5) {
      gpaWeight = 1.3;  // GPA低于2.5的课程权重增加30%
    }

    // 学分影响力（高学分得高分）
    const creditImpact = Math.pow(credits / 5.0, 0.9) * 100;

    // 综合影响力
    const overallImpact = ((4.0 - gpa) * credits) / 20.0 * 100;
    
    // 增强低绩点课程的综合影响力
    const enhancedOverallImpact = overallImpact * gpaWeight;

    // 加权计算最终分数：更偏向低绩点课程
    return gpaPotential * 0.5 + creditImpact * 0.2 + enhancedOverallImpact * 0.3;
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
   * 优化：基于优先级分数推荐
   */
  updateRecommendedRetakes() {
    // 计算所有课程的优先级分数
    this.courses.forEach(course => {
      this.priorityScores[course.course_code] = this.calculatePriorityScore(course);
    });

    // 使用优化后的引擎分析
    this.recommendedRetakes = retakeEngine.analyzeRetakeCourses(
      this.courses,
      this.targetGPA
    );

    // 根据优先级分数排序推荐课程
    this.recommendedRetakes.sort((a, b) => {
      return this.priorityScores[b.course_code] - this.priorityScores[a.course_code];
    });
  }

  /**
   * 添加重修课程
   * 优化：添加智能建议功能
   * @param {string} courseCode - 课程代码
   * @param {number} targetGPA - 目标绩点
   * @returns {Object} 添加结果和建议
   */
  addRetakeCourse(courseCode, targetGPA) {
    const course = this.courses.find(c => c.course_code === courseCode);
    const result = {
      success: false,
      message: '',
      suggestion: null
    };

    if (!course) {
      result.message = '课程不存在';
      return result;
    }

    const gpa = parseFloat(course.course_gpa || 0);
    const credits = parseFloat(course.course_weight || 0);

    // 检查是否已选择
    if (this.selectedRetakes.includes(courseCode)) {
      result.message = '课程已在重修列表中';
      return result;
    }

    // 智能建议：高绩点低学分课程不建议重修
    if (gpa >= 3.5 && credits <= 2) {
      result.suggestion = {
        type: 'warning',
        message: '该课程绩点较高且学分较低，重修性价比不高',
        alternativeCourses: this.getSuggestedAlternatives(courseCode)
      };
    }

    // 智能建议：低绩点高学分课程强烈推荐
    if (gpa < 2.5 && credits >= 3) {
      result.suggestion = {
        type: 'success',
        message: '优秀选择！该课程重修后对GPA提升效果显著'
      };
    }

    this.selectedRetakes.push(courseCode);
    this.targetSettings[courseCode] = targetGPA;
    result.success = true;
    result.message = '成功添加重修课程';

    return result;
  }

  /**
   * 获取替代课程建议
   * @param {string} excludeCourseCode - 要排除的课程代码
   * @returns {Array} 建议的替代课程
   */
  getSuggestedAlternatives(excludeCourseCode) {
    return this.courses
      .filter(c =>
        c.course_code !== excludeCourseCode &&
        !this.selectedRetakes.includes(c.course_code) &&
        parseFloat(c.course_gpa || 0) < 3.0 &&
        parseFloat(c.course_weight || 0) >= 2
      )
      .map(c => ({
        ...c,
        priorityScore: this.calculatePriorityScore(c)
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);
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
   * 优化：添加合理性检查
   * @param {string} courseCode - 课程代码
   * @param {number} targetGPA - 目标绩点
   * @returns {Object} 更新结果
   */
  updateCourseTarget(courseCode, targetGPA) {
    const result = {
      success: false,
      message: '',
      adjustedTarget: targetGPA
    };

    if (!this.selectedRetakes.includes(courseCode)) {
      result.message = '课程不在重修列表中';
      return result;
    }

    const course = this.courses.find(c => c.course_code === courseCode);
    const originalGPA = parseFloat(course.course_gpa || 0);
    const credits = parseFloat(course.course_weight || 0);

    // 智能调整：根据原始成绩和学分建议合理目标
    if (targetGPA - originalGPA > 2.0) {
      // 目标过高，建议调整
      if (credits >= 3) {
        result.adjustedTarget = Math.min(originalGPA + 1.5, 4.0);
        result.message = `目标设置过高，建议调整为 ${result.adjustedTarget.toFixed(1)}`;
      } else {
        result.adjustedTarget = Math.min(originalGPA + 1.7, 4.0);
        result.message = `小学分课程可以设置稍高目标，建议 ${result.adjustedTarget.toFixed(1)}`;
      }
    }

    this.targetSettings[courseCode] = result.adjustedTarget || targetGPA;
    result.success = true;
    return result;
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
   * 优化：考虑课程难度和学分的影响
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

        // 优化：调整成功率计算，考虑学分影响
        let successRate = retakeEngine.calculateSuccessRate(
          originalGPA,
          targetGPA,
          credits
        );

        // 高学分课程获得额外成功率加成
        if (credits >= 3) {
          successRate = Math.min(1.0, successRate * 1.1);
        }

        // 低绩点课程获得额外成功率加成
        if (originalGPA < 2.5) {
          successRate = Math.min(1.0, successRate * 1.15);
        }

        // 加权计算期望值
        const expectedGPA = (targetGPA * successRate) + (originalGPA * (1 - successRate));
        totalPoints += credits * (expectedGPA - originalGPA);
      }
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  /**
   * 获取保守情况GPA
   * 优化：根据课程特征调整保守估计
   * @returns {number} 保守情况GPA
   */
  getConservativeCaseGPA() {
    const conservativeSettings = {};

    this.selectedRetakes.forEach(courseCode => {
      const course = this.courses.find(c => c.course_code === courseCode);
      if (course) {
        const originalGPA = parseFloat(course.course_gpa || 0);
        const targetGPA = this.targetSettings[courseCode];
        const credits = parseFloat(course.course_weight || 0);

        // 优化：根据学分调整保守估计
        if (credits >= 4) {
          // 高学分课程：更保守的估计
          conservativeSettings[courseCode] = Math.min(
            originalGPA + 0.7,
            targetGPA * 0.8
          );
        } else if (credits >= 3) {
          // 中等学分课程
          conservativeSettings[courseCode] = Math.min(
            originalGPA + 1.0,
            targetGPA * 0.85
          );
        } else {
          // 低学分课程：可以稍微乐观
          conservativeSettings[courseCode] = Math.min(
            originalGPA + 1.3,
            targetGPA * 0.9
          );
        }

        // 确保不超过4.0
        conservativeSettings[courseCode] = Math.min(
          conservativeSettings[courseCode],
          4.0
        );
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
   * 优化：添加更多分析维度
   * @returns {Object} 报告对象
   */
  generateRetakeReport() {
    const projectedGPA = this.calculateProjectedGPA();
    const bestCaseGPA = this.getBestCaseGPA();
    const expectedCaseGPA = this.getExpectedCaseGPA();
    const conservativeCaseGPA = this.getConservativeCaseGPA();

    // 计算整体成功率（加权平均）
    let totalWeightedSuccessRate = 0;
    let totalCredits = 0;
    let lowGPAHighCreditCount = 0; // 统计低绩点高学分课程数
    let totalPotentialGain = 0; // 总潜在提升

    this.selectedRetakes.forEach(courseCode => {
      const course = this.courses.find(c => c.course_code === courseCode);
      if (course && this.targetSettings[courseCode]) {
        const credits = parseFloat(course.course_weight || 0);
        const originalGPA = parseFloat(course.course_gpa || 0);
        const targetGPA = this.targetSettings[courseCode];

        // 统计低绩点高学分课程
        if (originalGPA < 2.5 && credits >= 3) {
          lowGPAHighCreditCount++;
        }

        // 计算潜在提升
        totalPotentialGain += (targetGPA - originalGPA) * credits;

        const successRate = retakeEngine.calculateSuccessRate(
          originalGPA,
          targetGPA,
          credits
        );

        totalWeightedSuccessRate += successRate * credits;
        totalCredits += credits;
      }
    });

    const overallSuccessRate = totalCredits > 0 ? totalWeightedSuccessRate / totalCredits : 0;
    const averagePotentialGain = totalCredits > 0 ? totalPotentialGain / totalCredits : 0;

    // 风险等级评估（优化版）
    let riskLevel = '低风险';
    let riskReason = '';

    if (overallSuccessRate < 0.5) {
      riskLevel = '高风险';
      riskReason = '整体成功率较低，建议调整目标或选择更合适的课程';
    } else if (overallSuccessRate < 0.7) {
      riskLevel = '中风险';
      riskReason = '成功率适中，需要付出较大努力';
    } else {
      riskLevel = '低风险';
      riskReason = '方案合理可行，成功率较高';
    }

    // 方案质量评估
    let planQuality = '一般';
    if (lowGPAHighCreditCount >= this.selectedRetakes.length * 0.5) {
      planQuality = '优秀';
    } else if (lowGPAHighCreditCount >= this.selectedRetakes.length * 0.3) {
      planQuality = '良好';
    }

    return {
      // 基础信息
      currentGPA: this.currentGPA,
      targetGPA: this.targetGPA,

      // GPA预测
      projectedGPA,
      bestCaseGPA,
      expectedCaseGPA,
      conservativeCaseGPA,

      // 风险评估
      overallSuccessRate,
      riskLevel,
      riskReason,

      // 方案质量
      planQuality,
      lowGPAHighCreditCount,
      averagePotentialGain,

      // 选中课程详情
      selectedCourses: this.selectedRetakes.map(courseCode => {
        const course = this.courses.find(c => c.course_code === courseCode);
        const credits = parseFloat(course.course_weight || 0);
        const originalGPA = parseFloat(course.course_gpa || 0);
        const targetGPA = this.targetSettings[courseCode];

        return {
          ...course,
          targetGPA,
          successRate: retakeEngine.calculateSuccessRate(
            originalGPA,
            targetGPA,
            credits
          ),
          priorityScore: this.calculatePriorityScore(course),
          potentialGain: (targetGPA - originalGPA) * credits,
          isHighValue: originalGPA < 2.5 && credits >= 3 // 标记高价值课程
        };
      }).sort((a, b) => b.priorityScore - a.priorityScore), // 按优先级排序

      // 统计信息
      statistics: {
        totalSelectedCredits: totalCredits,
        averageOriginalGPA: this.selectedRetakes.length > 0 ?
          this.selectedRetakes.reduce((sum, code) => {
            const course = this.courses.find(c => c.course_code === code);
            return sum + parseFloat(course.course_gpa || 0);
          }, 0) / this.selectedRetakes.length : 0,
        averageTargetGPA: this.selectedRetakes.length > 0 ?
          Object.values(this.targetSettings).reduce((sum, gpa) => sum + gpa, 0) /
          this.selectedRetakes.length : 0
      }
    };
  }

  /**
   * 获取智能推荐
   * 新增方法：基于当前选择提供智能建议
   * @returns {Object} 推荐信息
   */
  getSmartRecommendations() {
    const report = this.generateRetakeReport();
    const recommendations = [];

    // 检查是否选择了足够的高价值课程
    if (report.lowGPAHighCreditCount < 2) {
      const highValueCourses = this.courses
        .filter(c =>
          !this.selectedRetakes.includes(c.course_code) &&
          parseFloat(c.course_gpa || 0) < 2.5 &&
          parseFloat(c.course_weight || 0) >= 3
        )
        .slice(0, 3);

      if (highValueCourses.length > 0) {
        recommendations.push({
          type: 'suggestion',
          message: '建议添加更多低绩点高学分课程以最大化GPA提升',
          courses: highValueCourses
        });
      }
    }

    // 检查目标设置是否合理
    if (report.overallSuccessRate < 0.6) {
      recommendations.push({
        type: 'warning',
        message: '当前目标设置可能过高，建议适当降低部分课程的目标绩点'
      });
    }

    // 检查是否有低效选择
    const inefficientCourses = report.selectedCourses.filter(c =>
      c.course_gpa >= 3.3 && c.course_weight <= 2
    );

    if (inefficientCourses.length > 0) {
      recommendations.push({
        type: 'optimization',
        message: '部分选择的课程重修性价比较低，可考虑替换',
        courses: inefficientCourses
      });
    }

    return {
      recommendations,
      summary: {
        hasHighValueChoices: report.lowGPAHighCreditCount >= 2,
        isBalanced: report.overallSuccessRate >= 0.6 && report.overallSuccessRate <= 0.85,
        expectedImprovement: report.expectedCaseGPA - this.currentGPA
      }
    };
  }
}

// 目标选项配置
const targetOptions = {
  conservative: {
    label: '保守型',
    description: '稳步提升，风险较低',
    defaultTarget: 3.3
  },
  balanced: {
    label: '平衡型',
    description: '风险与收益平衡',
    defaultTarget: 3.7
  },
  aggressive: {
    label: '激进型',
    description: '追求最大提升',
    defaultTarget: 4.0
  }
};

module.exports = {
  RetakePlanner,
  targetOptions
};