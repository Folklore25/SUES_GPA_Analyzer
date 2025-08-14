/**
 * GPA重修规划核心算法模块
 * 实现 docs/gpa-retake-planning-doc.md 中的规则
 * 并与 RetakePlanner / events.js 对接
 */

(function () {
  const { calculateCurrentGPA, groupCoursesByCredit } = window; // 复用 data.js 方法

  /**
   * 学分对应难度系数
   */
  function getDifficultyFactor(credits) {
    if (credits <= 1) return 0.65;
    if (credits === 2) return 0.7;
    if (credits === 3) return 0.75;
    if (credits >= 4) return 1.0;
    return 1.0;
  }

  /**
   * 成功率计算
   */
  function calculateSuccessRate(originalGPA, targetGPA, credits, courseType = 'core') {
    // 方案C实现
    let baseRate = 0.8;
    
    // 低学分课程减少难度惩罚
    let adjustedDifficulty = getDifficultyFactor(credits);
    if (credits <= 2) {
      adjustedDifficulty = Math.max(0.5, adjustedDifficulty - 0.2);
    }

    // 历史成绩系数保底
    let historyFactor = (4.0 - originalGPA) / 4.0;
    historyFactor = Math.max(0.5, historyFactor);

    // 目标难度系数
    const gap = targetGPA - originalGPA;
    let targetFactor = 1.0;
    if (gap > 2.0) targetFactor = 0.65;
    else if (gap > 1.5) targetFactor = 0.7;
    else if (gap > 1.0) targetFactor = 0.75;

    // 课程类型加权
    let typeFactor = 1.0;
    if (courseType === 'core') typeFactor = 1.05;
    if (courseType === 'elective') typeFactor = 0.95;

    const rate = baseRate * (1 / adjustedDifficulty) * historyFactor * targetFactor * typeFactor;
    return Math.max(0, Math.min(1, rate));
  }

  /**
   * 价值评分计算
   */
  function calculateValueScore(course, totalCredits) {
    const credits = parseFloat(course.course_weight) || 0;
    const currentGPA = parseFloat(course.course_gpa) || 0;
    const targetGPA = 4.0; // 默认满分目标
    const difficultyFactor = getDifficultyFactor(credits);

    const potential = (4.0 - currentGPA) * credits / difficultyFactor;
    const impact = (credits / totalCredits) * 100;
    const effortReturn = ((targetGPA - currentGPA) / (difficultyFactor * credits));

    return (potential * 0.4) + (impact * 0.3) + (effortReturn * 0.3);
  }

  /**
   * 优先级标签
   */
  function getPriorityLabel(course) {
    const gpa = parseFloat(course.course_gpa) || 0;
    const credits = parseFloat(course.course_weight) || 0;
    // 方案C下优化优先级规则：结合绩点差距、学分和价值评分动态调整
    const gap = 4.0 - gpa;
    if (gap >= 1.5 && credits >= 2) return { label: "紧急", color: "red" };
    if (gap >= 1.0) return { label: "推荐", color: "green" };
    if (gap >= 0.7) return { label: "可选", color: "green" };
    if (gap >= 0.5) return { label: "备选", color: "blue" };
    return { label: "不建议", color: "gray" };
  }

  /**
   * 主入口
   */
  async function generatePlan(strategy, targetGPA) {
    const data = window.courseData || []; // 假设全局有课程数据
    const totalCredits = data.reduce((sum, c) => sum + (parseFloat(c.course_weight) || 0), 0);
    const originalGPA = calculateCurrentGPA(data);

    // 过滤不建议重修的课程
    let candidates = data.filter(c => parseFloat(c.course_gpa) < 3.5 && parseFloat(c.course_weight) > 1);

    // 计算附加信息
    candidates = candidates.map(c => {
      const credits = parseFloat(c.course_weight) || 0;
      const successRate = calculateSuccessRate(parseFloat(c.course_gpa), targetGPA, credits);
      const valueScore = calculateValueScore(c, totalCredits);
      const priority = getPriorityLabel(c);
      return { ...c, successRate, valueScore, priority };
    });

    // 按策略筛选
    if (strategy === "conservative") {
      candidates = candidates.filter(c => c.successRate >= 0.7).slice(0, 4);
    } else if (strategy === "balanced") {
      candidates = candidates.filter(c => c.successRate >= 0.5).slice(0, 7);
    } else if (strategy === "aggressive") {
      candidates = candidates.filter(c => c.successRate >= 0.3).slice(0, 9);
      // 激进策略不过滤
    }

    // 生成报告HTML
    const reportHTML = `
      <table>
        <tr><th>课程名称</th><th>学分</th><th>当前绩点</th><th>成功率</th><th>优先级</th></tr>
        ${candidates.map(c => `
          <tr>
            <td>${c.course_name}</td>
            <td>${c.course_weight}</td>
            <td>${c.course_gpa}</td>
            <td>${(c.successRate * 100).toFixed(0)}%</td>
            <td style="color:${c.priority.color}">${c.priority.label}</td>
          </tr>
        `).join("")}
      </table>
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
      originalGPA
    };
  }

  window.retakeEngine = { generatePlan };
})();
