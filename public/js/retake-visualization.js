/**
 * GPA重修规划可视化模块
 * 提供 GPA 提升路径图 和 成功率图 的绘制方法
 * 使用 Chart.js
 */

(function () {
  function createGPAPathChart(canvas, gpaPathData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (canvas.gpaChart instanceof Chart) {
      canvas.gpaChart.destroy();
    }
    console.log("绘制GPAPathChart数据:", gpaPathData);
    canvas.gpaChart = new Chart(ctx, {
      type: "bar",
      data: gpaPathData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top"
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 4.0
          }
        }
      }
    });
  }

  function createSuccessRateChart(canvas, successRateData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (canvas.successChart) {
      canvas.successChart.destroy();
    }
    canvas.successChart = new Chart(ctx, {
      type: "bar",
      data: successRateData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.parsed.y + "%";
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function (value) {
                return value + "%";
              }
            }
          }
        }
      }
    });
  }

  window.retakeVisualizer = {
    createGPAPathChart,
    createSuccessRateChart
  };
})();
