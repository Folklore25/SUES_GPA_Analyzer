/**
 * GPA重修规划系统 - 数据可视化模块
 * 实现文档中定义的数据可视化功能
 */

const Chart = require('chart.js');
const retakeEngine = require('./retake-engine');
const { getPriorityLevel } = retakeEngine;

class RetakeVisualizer {
  constructor(planner) {
    this.planner = planner;
    this.charts = {};
  }

  /**
   * 创建GPA提升路径图
   * @param {HTMLElement} canvas - Canvas元素
   */
  createGPAPathChart(canvas, data) {
    if (this.charts.gpaPath) {
      this.charts.gpaPath.destroy();
    }

    const ctx = canvas.getContext('2d');

    this.charts.gpaPath = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            min: Math.max(0, Math.min(report.currentGPA - 0.5, 2.0)),
            max: 4.0,
            title: {
              display: true,
              text: 'GPA'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * 创建成功概率图表
   * @param {HTMLElement} canvas - Canvas元素
   */
  createSuccessRateChart(canvas, data) {
    if (this.charts.successRate) {
      this.charts.successRate.destroy();
    }

    const ctx = canvas.getContext('2d');

    this.charts.successRate = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: '成功率 (%)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const course = report.selectedCourses[context.dataIndex];
                return [
                  `课程: ${course.course_name}`,
                  `学分: ${course.course_weight}`,
                  `当前GPA: ${course.course_gpa}`,
                  `目标GPA: ${course.targetGPA}`,
                  `成功率: ${(course.successRate * 100).toFixed(1)}%`
                ];
              }
            }
          }
        }
      }
    });
  }

  /**
   * 生成重修方案报告HTML
   * @returns {string} HTML内容
   */
  generateReportHTML() {
    const report = this.planner.generateRetakeReport();
    
    let coursesHTML = '';
    report.selectedCourses.forEach(course => {
      coursesHTML += `
        <tr>
          <td>${course.course_name}</td>
          <td>${course.course_weight}</td>
          <td>${course.course_gpa}</td>
          <td>${course.targetGPA}</td>
          <td>${(course.successRate * 100).toFixed(1)}%</td>
          <td style="color: ${getPriorityLevel(course).color}">
            ${getPriorityLevel(course).label}
          </td>
        </tr>
      `;
    });

    return `
      <div class="retake-report">
        <h3>GPA重修规划分析报告</h3>
        
        <div class="report-summary">
          <div class="summary-item">
            <span class="label">当前GPA:</span>
            <span class="value">${report.currentGPA.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span class="label">目标GPA:</span>
            <span class="value">${report.targetGPA.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span class="label">预计提升:</span>
            <span class="value">${(report.projectedGPA - report.currentGPA).toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span class="label">整体成功率:</span>
            <span class="value" style="color: ${report.riskLevel === '高风险' ? '#F44336' : 
              report.riskLevel === '中风险' ? '#FFC107' : '#4CAF50'}">
              ${(report.overallSuccessRate * 100).toFixed(1)}% (${report.riskLevel})
            </span>
          </div>
        </div>

        <h4>场景模拟分析</h4>
        <div class="scenario-analysis">
          <div class="scenario">
            <span class="label">最佳情况:</span>
            <span class="value">${report.bestCaseGPA.toFixed(2)}</span>
          </div>
          <div class="scenario">
            <span class="label">期望情况:</span>
            <span class="value">${report.expectedCaseGPA.toFixed(2)}</span>
          </div>
          <div class="scenario">
            <span class="label">保守情况:</span>
            <span class="value">${report.conservativeCaseGPA.toFixed(2)}</span>
          </div>
        </div>

        <h4>推荐重修课程</h4>
        <table class="retake-courses-table">
          <thead>
            <tr>
              <th>课程名称</th>
              <th>学分</th>
              <th>当前GPA</th>
              <th>目标GPA</th>
              <th>成功率</th>
              <th>优先级</th>
            </tr>
          </thead>
          <tbody>
            ${coursesHTML}
          </tbody>
        </table>

        <h4>执行建议</h4>
        <div class="recommendations">
          ${this.generateRecommendations(report)}
        </div>
      </div>
    `;
  }

  /**
   * 生成执行建议
   * @param {Object} report - 重修报告
   * @returns {string} HTML内容
   */
  generateRecommendations(report) {
    let recommendations = '<ul>';
    
    // 根据风险等级给出建议
    if (report.riskLevel === '高风险') {
      recommendations += `
        <li>当前方案风险较高，建议减少重修课程数量或降低部分课程目标</li>
        <li>优先重修高学分、低GPA的核心课程</li>
      `;
    } else if (report.riskLevel === '中风险') {
      recommendations += `
        <li>当前方案有一定风险，建议关注成功率较低的课程</li>
        <li>可以考虑调整1-2门课程的目标GPA以提高整体成功率</li>
      `;
    } else {
      recommendations += `
        <li>当前方案较为合理，可以按计划执行</li>
        <li>建议优先完成优先级为【紧急】和【推荐】的课程</li>
      `;
    }

    // 根据课程数量给出时间建议
    const courseCount = report.selectedCourses.length;
    if (courseCount >= 5) {
      recommendations += `
        <li>您选择了${courseCount}门课程，建议分两个学期完成</li>
        <li>预计需要200-300小时的学习时间</li>
      `;
    } else if (courseCount >= 3) {
      recommendations += `
        <li>您选择了${courseCount}门课程，建议一个学期内完成</li>
        <li>预计需要150-200小时的学习时间</li>
      `;
    } else {
      recommendations += `
        <li>您选择了${courseCount}门课程，可以集中精力完成</li>
        <li>预计需要80-120小时的学习时间</li>
      `;
    }

    // 根据优先级最高的课程给出具体建议
    const topPriorityCourse = report.selectedCourses
      .sort((a, b) => b.priority.level - a.priority.level)[0];
    
    if (topPriorityCourse) {
      recommendations += `
        <li>建议优先重修【${topPriorityCourse.course_name}】，该课程对GPA提升贡献最大</li>
      `;
    }

    recommendations += '</ul>';
    return recommendations;
  }

  /**
   * 销毁所有图表
   */
  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
  }
}

module.exports = RetakeVisualizer;

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.retakeVisualizer = {
    createGPAPathChart: (canvas, data) => new RetakeVisualizer().createGPAPathChart(canvas, data),
    createSuccessRateChart: (canvas, data) => new RetakeVisualizer().createSuccessRateChart(canvas, data)
  };
}
