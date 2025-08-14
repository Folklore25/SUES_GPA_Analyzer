# GPA 重修功能设计文档（retake-design.md）

## 1. 项目结构（相关部分）
```
public/
  index.html                  # UI结构，包含重修规划模块和图表区域
  js/
    data.js                   # 课程数据处理、IPS推荐算法（保留为备用）
    utils.js                  # 通用工具函数（CSV解析、排序）
    events.js                 # 事件绑定与UI交互逻辑
    retake-planner.js         # 重修规划交互控制类（使用 retake-engine 算法）
    retake-engine.js          # [待实现] 核心算法模块（价值评分、优先级、策略选择、生成报告/图表数据）
    retake-visualization.js   # [待实现] 图表绘制模块（Chart.js渲染GPA路径图/成功率图）
docs/
  gpa-retake-planning-doc.md  # 重修算法完整需求说明
```

## 2. 核心流程关系
1. 用户点击“生成重修方案”
2. `events.js` 调用 `window.retakeEngine.generatePlan(strategy, targetGPA)`
3. `retake-engine.js`：
   - 接收策略+目标GPA
   - 按 `gpa-retake-planning-doc.md` 计算推荐课程
   - 生成：
     - `reportHTML`（表格）
     - `gpaPathData`（Chart.js用）
     - `successRateData`（Chart.js用）
     - 课程数组（包含原绩点、目标绩点、成功率、学分等）
     - 总学分和原始GPA
4. `events.js`：
   - 将 `reportHTML` 放入 `#retake-plan-report`
   - 调用 `retakeVisualizer.createGPAPathChart` / `createSuccessRateChart`
   - 调用 `setupTargetGradeSelection` 监听用户目标绩点调整
   - 触发实时GPA计算和场景模拟
5. 用户可调整目标绩点，前端实时调用 `updateGPADisplay` & `calculateScenarios` 更新结果

## 3. 模块职责
### `retake-engine.js`
- `generatePlan(strategy, targetGPA)`
  - 读取课程数据
  - 调用内部算法：
    - `getDifficultyFactor(credits)`
    - `calculateSuccessRate(originalGPA, targetGPA, credits)`
    - `calculateValueScore(course, totalCredits)`
    - 筛选课程并打标（红/橙/黄…）
    - 按策略选出课程并生成报告/图表数据
- 返回符合 `events.js` 需求的结果对象

### `retake-visualization.js`
- 全局 `window.retakeVisualizer`：
  - `createGPAPathChart(canvas, gpaPathData)`
  - `createSuccessRateChart(canvas, successRateData)`

### `retake-planner.js`
- 管理用户选择的重修课程
- 维持目标绩点设置
- 调用 `retake-engine` 进行推荐与计算

### `data.js`
- IPS算法建议（备用、不在主流程）
- GPA计算工具（当前GPA/Required GPA等）
- 课程分组等辅助函数

### `utils.js`
- CSV解析
- 学期值→中文描述
- 课程排序

## 4. 函数关系图（简化）
```
[events.js] --点击生成方案--> [retake-engine.js: generatePlan]
    --> 调用算法函数 (难度系数/成功率/价值评分/优先级/策略)
    --> 返回 { reportHTML, gpaPathData, successRateData, courses, totalCredits, originalGPA }
[events.js] --渲染报告--> DOM
[events.js] --调用--> [retake-visualization.js: createGPAPathChart / createSuccessRateChart]
[events.js] --绑定--> setupTargetGradeSelection / setupRealTimeGPACalculation / setupScenarioSimulation
```

## 5. 数据结构要求
### `generatePlan` 返回对象
```js
{
  reportHTML: "<table>...</table>",
  gpaPathData: { labels: [...], datasets: [...] },
  successRateData: { labels: [...], datasets: [...] },
  courses: [
    {
      id: "course_code",
      name: "课程名称",
      credits: 4,
      originalGrade: 2.3,
      targetGrade: 3.7,
      successRate: 0.85
    }
  ],
  totalCredits: 120,
  originalGPA: 3.12
}
```

## 6. 数据来源与结构（来自 data.js）

### CSV 数据加载方式
- `data.js` 的数据处理函数依赖于已经解析为对象数组的课程数据。
- CSV 文件通过 `utils.js` 提供的 `parseCSV()` 方法解析，返回的数组中每个元素对应一门课程。
- `parseCSV()` 会将 CSV 表头作为对象键名，字段值为字符串（必要时需使用 `parseFloat()` 转换为数值）。

### 课程对象字段（参考 data.js 使用）
```js
{
  course_name: "微观经济学",   // 课程名称
  course_code: "ECO101",       // 课程代码
  course_semester: "1",        // 学期（字符串，可能带逗号，parseSemesterValue可辅助解析）
  course_weight: "4",          // 学分（字符串类型，计算需 parseFloat）
  course_score: "B",           // 课程成绩（可能是字母等级或 '--'）
  course_gpa: "2.3",           // 绩点（字符串类型，计算需 parseFloat）
  pass: "passed",              // 课程状态，可为 'passed' 或 'failed'
  ips: 0.045                   // [可选] 仅在 recommendRetakeCourses 返回时附加的重修性价比值
}
```

### 已有可复用的核心方法
- `calculateCurrentGPA(data)`：基于已通过课程计算当前 GPA（加权平均分）
- `calculateRequiredGPA(data, targetGPA)`：计算未修课程需要达到的平均绩点
- `calculateIPS(course, allCourses, targetGPA)`：IPS 重修性价比评分算法
- `recommendRetakeCourses(data, targetGPA)`：基于 IPS 推荐课程（备用）
- `groupCoursesByCredit(data)`：按学分（1/2/3/4）分组
- `calculateIdealGPA(data, retakeCourses)`：假设重修课程全部 4.0 时的理想 GPA
- `calculateRequiredGPAAfterRetake(data, targetGPA, retakeCourses)`：在重修指定课程后，未修课程需达到的绩点

### 总学分与统计
- 总学分可通过 `reduce` 汇总所有 `parseFloat(course_weight)` 得出
- 原始 GPA 可通过 `calculateCurrentGPA()`（data.js 内已实现）基于已通过课程计算

### 复用建议
- 在 `retake-engine.js` 内直接调用 `calculateCurrentGPA()` 以避免重复实现当前 GPA 计算
- 遍历课程列表时遵循以上字段名和数据类型，以确保兼容 `events.js`、`retake-planner.js` 的逻辑

## 7. 图表要求
- GPA路径图：横轴为课程顺序，纵轴为累计GPA
- 成功率图：横轴为课程名，纵轴为成功率百分比
