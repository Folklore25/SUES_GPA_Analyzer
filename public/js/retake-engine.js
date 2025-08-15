/**
 * GPA重修规划核心算法模块
 * 实现 docs/gpa-retake-planning-doc.md 中的规则
 * 并与 RetakePlanner / events.js 对接
 * 
 * 优化重点：优先选择低绩点+高学分的课程
 */

(function () {
  const { calculateCurrentGPA, groupCoursesByCredit } = window; // 复用 data.js 方法

  /**
   * 学分对应难度系数
   * 优化：调整系数使高学分课程更有吸引力
   */
  function getDifficultyFactor(credits) {
    if (credits <= 1) return 0.85;  // 降低小学分课程难度
    if (credits === 2) return 0.8;   // 稍微降低
    if (credits === 3) return 0.75;  // 保持原值
    if (credits >= 4) return 0.7;    // 提高大学分课程的吸引力
    return 1.0;
  }

  /**
   * 成功率计算
   * 优化：让高学分课程获得更好的成功率
   */
  function calculateSuccessRate(originalGPA, targetGPA, credits, courseType = 'core') {
    // 方案C实现
    let baseRate = 0.8;

    // 优化：高学分课程获得额外加成
    let adjustedDifficulty = getDifficultyFactor(credits);
    if (credits >= 3) {
      // 高学分课程获得额外的成功率加成
      adjustedDifficulty = adjustedDifficulty * 0.9;
    }

    // 历史成绩系数 - 低绩点课程获得更高权重
    let historyFactor = (4.0 - originalGPA) / 4.0;
    // 优化：低绩点课程(GPA<2.5)获得额外加成
    if (originalGPA < 2.5) {
      historyFactor = Math.min(1.0, historyFactor * 1.2);
    }
    historyFactor = Math.max(0.5, historyFactor);

    // 目标难度系数
    const gap = targetGPA - originalGPA;
    let targetFactor = 1.0;
    if (gap > 2.0) targetFactor = 0.8;   // 优化：提高系数
    else if (gap > 1.5) targetFactor = 0.85;
    else if (gap > 1.0) targetFactor = 0.9;

    // 课程类型加权
    let typeFactor = 1.0;
    if (courseType === 'core') typeFactor = 1.05;
    if (courseType === 'elective') typeFactor = 0.95;

    // 添加日志输出各系数的值
    console.log(`成功率计算详情 - 基础系数: ${baseRate}, 难度系数: ${adjustedDifficulty}, 历史系数: ${historyFactor}, 目标系数: ${targetFactor}, 类型系数: ${typeFactor}`);
    console.log(`各系数对结果的影响 - 难度影响: ${1 / adjustedDifficulty}, 其他系数乘积: ${historyFactor * targetFactor * typeFactor}`);

    const rate = baseRate * (1 / adjustedDifficulty) * historyFactor * targetFactor * typeFactor;
    console.log(`最终计算结果: ${rate}`);
    return Math.max(0, Math.min(1, rate));
  }

  /**
   * 价值评分计算
   * 优化：更强调低绩点和高学分的组合
   */
  function calculateValueScore(course, totalCredits) {
    const credits = parseFloat(course.course_weight) || 0;
    const currentGPA = parseFloat(course.course_gpa) || 0;
    const targetGPA = 4.0; // 默认满分目标
    const difficultyFactor = getDifficultyFactor(credits);

    // 优化：绩点提升潜力 - 低绩点课程获得更高分数
    const gpaPotential = Math.pow((4.0 - currentGPA) / 4.0, 0.8); // 使用幂函数增强低绩点的权重

    // 优化：学分影响力 - 高学分课程获得更高分数
    const creditImpact = Math.pow(credits / 4.0, 0.9); 

    // 综合潜力分数
    const potential = gpaPotential * creditImpact * 100;

    // 对总GPA的影响
    const impact = (credits / totalCredits) * 100;

    // 努力回报率
    const effortReturn = ((targetGPA - currentGPA) * credits) / (difficultyFactor * 4.0);

    // 优化权重分配：更重视潜力和影响力
    return (potential * 0.7) + (impact * 0.2) + (effortReturn * 0.1);
  }

  /**
   * 优先级标签
   * 优化：结合绩点和学分的综合评判
   */
  function getPriorityLabel(course) {
    const gpa = parseFloat(course.course_gpa) || 0;
    const credits = parseFloat(course.course_weight) || 0;
    const gap = 4.0 - gpa;

    // 优化：综合考虑绩点差距和学分
    const score = gap * credits; // 绩点差距 × 学分 = 影响力分数

    if (score >= 6.0) return { label: "紧急", color: "red" };      // 如 GPA=2.0, 学分=3
    if (score >= 4.0) return { label: "强烈推荐", color: "orange" }; // 如 GPA=2.0, 学分=2
    if (score >= 2.5) return { label: "推荐", color: "green" };     // 如 GPA=2.5, 学分=2
    if (score >= 1.5) return { label: "可选", color: "blue" };      // 如 GPA=3.0, 学分=2
    return { label: "不建议", color: "gray" };
  }

  /**
   * 综合排序分数
   * 新增：用于更精确的课程排序
   */
  function calculateSortingScore(course, totalCredits) {
    const gpa = parseFloat(course.course_gpa) || 0;
    const credits = parseFloat(course.course_weight) || 0;

    // 绩点差距分数（低绩点得高分）
    const gpaGapScore = (4.0 - gpa) / 4.0 * 100;
    
    // 对低绩点课程给予额外加权
    let gpaWeight = 1.0;
    if (gpa < 2.0) {
      gpaWeight = 1.5;  // GPA低于2.0的课程权重增加50%
    } else if (gpa < 2.5) {
      gpaWeight = 1.3;  // GPA低于2.5的课程权重增加30%
    }
    
    // 学分权重分数（高学分得高分）
    const creditScore = credits / 5.0 * 100; // 假设5学分为最大值

    // 综合影响力（绩点提升空间 × 学分占比）
    const impactScore = ((4.0 - gpa) * credits / totalCredits) * 100;
    
    // 增强低绩点课程的影响力分数
    const enhancedImpactScore = impactScore * gpaWeight;

    // 综合排序分数：低绩点和高学分都很重要，但更偏向低绩点
    return gpaGapScore * 0.5 + creditScore * 0.2 + enhancedImpactScore * 0.3;
  }

  /**
   * 主入口
   */
  async function generatePlan(strategy, targetGPA) {
    const data = window.courseData || []; // 假设全局有课程数据
    const totalCredits = data.reduce((sum, c) => sum + (parseFloat(c.course_weight) || 0), 0);
    const originalGPA = calculateCurrentGPA(data);

    // 优化过滤条件：放宽限制，让更多课程进入候选
    let candidates = data.filter(c => {
      const gpa = parseFloat(c.course_gpa);
      const credits = parseFloat(c.course_weight);
      // 低绩点（<3.0）或高学分（>=2）的课程都可以考虑
      return gpa < 3.7 && (gpa < 3.0 || credits >= 2);
    });

    // 计算附加信息
    candidates = candidates.map(c => {
      const credits = parseFloat(c.course_weight) || 0;
      const successRate = calculateSuccessRate(parseFloat(c.course_gpa), targetGPA, credits);
      const valueScore = calculateValueScore(c, totalCredits);
      const priority = getPriorityLabel(c);
      const sortingScore = calculateSortingScore(c, totalCredits);
      return { ...c, successRate, valueScore, priority, sortingScore };
    });

    // 优化排序：综合考虑多个因素
    candidates.sort((a, b) => {
      // 主要排序：综合排序分数（考虑低绩点和高学分）
      const scoreDiff = b.sortingScore - a.sortingScore;
      if (Math.abs(scoreDiff) > 5) return scoreDiff;

      // 次要排序：如果分数接近，优先选择成功率较高的
      const successDiff = b.successRate - a.successRate;
      if (Math.abs(successDiff) > 0.1) return successDiff;

      // 第三排序：价值评分
      return b.valueScore - a.valueScore;
    });

    // 按策略筛选数量
    let selectedCount;
    let minSuccessRate;

    if (strategy === "conservative") {
      selectedCount = 3;  // 保守策略：选3-4门
      minSuccessRate = 0.65; // 降低门槛，让更多高价值课程入选
    } else if (strategy === "balanced") {
      selectedCount = 5;  // 平衡策略：选5-6门
      minSuccessRate = 0.45;
    } else if (strategy === "aggressive") {
      selectedCount = 8;  // 激进策略：选8-10门
      minSuccessRate = 0.25;
    }

    // 优化筛选逻辑：优先保留高价值课程
    let filtered = [];
    let mustInclude = candidates.filter(c => c.priority.label === "紧急" || c.priority.label === "强烈推荐");
    let others = candidates.filter(c => c.priority.label !== "紧急" && c.priority.label !== "强烈推荐");

    // 先加入必选课程
    filtered = filtered.concat(mustInclude.slice(0, Math.min(mustInclude.length, selectedCount)));

    // 再从其他课程中选择
    if (filtered.length < selectedCount) {
      const remaining = selectedCount - filtered.length;
      filtered = filtered.concat(
        others.filter(c => c.successRate >= minSuccessRate).slice(0, remaining)
      );
    }

    // 如果还不够，放宽成功率要求
    if (filtered.length < selectedCount) {
      const remaining = selectedCount - filtered.length;
      const notSelected = candidates.filter(c => !filtered.includes(c));
      filtered = filtered.concat(notSelected.slice(0, remaining));
    }

    candidates = filtered;

    // 计算预计GPA
    const projectedGPA = originalGPA + (candidates.reduce((sum, c) => {
        const credits = parseFloat(c.course_weight) || 0;
        const originalGPA = parseFloat(c.course_gpa) || 0;
        // 假设重修后能达到目标GPA
        return sum + credits * (targetGPA - originalGPA);
    }, 0) / totalCredits);

    // 计算最佳情况GPA（所有课程都达到4.0）
    const bestCaseGPA = originalGPA + (candidates.reduce((sum, c) => {
        const credits = parseFloat(c.course_weight) || 0;
        const originalGPA = parseFloat(c.course_gpa) || 0;
        return sum + credits * (4.0 - originalGPA);
    }, 0) / totalCredits);

    // 计算整体成功率
    const overallSuccessRate = candidates.reduce((sum, c) => sum + c.successRate, 0) / candidates.length;

    // 确定风险等级
    let riskLevel = '低风险';
    if (overallSuccessRate < 0.6) {
        riskLevel = '高风险';
    } else if (overallSuccessRate < 0.8) {
        riskLevel = '中风险';
    }

    // 生成报告HTML
    const reportHTML = `
      <table>
        <tr>
          <th>课程名称</th>
          <th>学分</th>
          <th>当前绩点</th>
          <th>成功率</th>
          <th>价值分</th>
          <th>优先级</th>
        </tr>
        ${candidates.map(c => `
          <tr>
            <td>${c.course_name}</td>
            <td>${c.course_weight}</td>
            <td>${c.course_gpa}</td>
            <td>${(c.successRate * 100).toFixed(0)}%</td>
            <td>${c.valueScore.toFixed(1)}</td>
            <td style="color:${c.priority.color}">${c.priority.label}</td>
          </tr>
        `).join("")}
      </table>
      <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
        <p>📊 推荐理由：优先选择了绩点较低且学分较高的课程，这些课程重修后对GPA提升效果最显著。</p>
      </div>
    `;

    // 图表数据
    const successRateData = {
      labels: candidates.map(c => c.course_name),
      datasets: [{
        label: "成功率(%)",
        data: candidates.map(c => Number((c.successRate * 100).toFixed(2))),
        backgroundColor: "#03dac6"
      }]
    };

    console.log("调试: successRateData=", successRateData);
    console.log("选中课程详情:", candidates.map(c => ({
      name: c.course_name,
      gpa: c.course_gpa,
      credits: c.course_weight,
      sortingScore: c.sortingScore.toFixed(2)
    })));

    return {
      reportHTML,
      successRateData,
      courses: candidates.map(c => ({
        id: c.course_code,
        name: c.course_name,
        credits: parseFloat(c.course_weight),
        originalGrade: parseFloat(c.course_gpa),
        targetGrade: targetGPA,
        successRate: c.successRate
      })),
      totalCredits,
      originalGPA,
      projectedGPA: projectedGPA || originalGPA,
      bestCaseGPA: bestCaseGPA || originalGPA,
      overallSuccessRate: overallSuccessRate || 0,
      riskLevel: riskLevel
    };
  }

  // 添加实时GPA计算功能
  function calculateRealtimeGPA(courseData, selectedCourses, targetSettings) {
    if (!courseData || !selectedCourses || !targetSettings) return 0;
    
    // 计算总学分
    let totalPoints = 0;
    let totalCredits = 0;
    
    // 计算原有课程的绩点
    courseData.forEach(course => {
      const credits = parseFloat(course.course_weight) || 0;
      const gpa = parseFloat(course.course_gpa) || 0;
      totalPoints += credits * gpa;
      totalCredits += credits;
    });
    
    // 计算重修课程的影响
    selectedCourses.forEach(courseCode => {
      const course = courseData.find(c => c.course_code === courseCode);
      if (course && targetSettings[courseCode]) {
        const targetGPA = targetSettings[courseCode];
        const credits = parseFloat(course.course_weight) || 0;
        const originalGPA = parseFloat(course.course_gpa) || 0;
        
        // 从总绩点中减去原始绩点，加上目标绩点
        totalPoints += credits * (targetGPA - originalGPA);
      }
    });
    
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }
  
  // 添加成功率计算功能
  function calculateSuccessRate(originalGPA, targetGPA, credits) {
    // 基础成功率
    let baseRate = 0.8;
    
    // 根据绩点差距调整成功率
    const gap = targetGPA - originalGPA;
    let gapFactor = 1.0;
    if (gap > 2.0) gapFactor = 0.7;
    else if (gap > 1.5) gapFactor = 0.8;
    else if (gap > 1.0) gapFactor = 0.9;
    
    // 根据学分调整成功率
    let creditFactor = 1.0;
    if (credits >= 4) creditFactor = 0.85;
    else if (credits >= 3) creditFactor = 0.9;
    else if (credits <= 1) creditFactor = 1.1;
    
    const rate = baseRate * gapFactor * creditFactor;
    return Math.max(0, Math.min(1, rate));
  }

  window.retakeEngine = { generatePlan, calculateRealtimeGPA, calculateSuccessRate };
})();