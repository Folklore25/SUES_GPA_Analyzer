# GPA 重修功能开发 To-Do List

## 1. 核心算法模块（retake-engine.js）
- [x] 创建 `public/js/retake-engine.js` 文件
- [x] 实现 `window.retakeEngine.generatePlan(strategy, targetGPA)` 主入口
  - [ ] 从全局或数据源获取课程数据（复用 data.js 的数据结构）
  - [ ] 计算总学分（复用 data.js 方法）
  - [ ] 计算当前 GPA（调用 `calculateCurrentGPA`）
  - [ ] 根据文档规则计算：
    - [ ] 难度系数（`getDifficultyFactor`）
    - [ ] 成功率（`calculateSuccessRate`）
    - [ ] 价值评分（`calculateValueScore`）
    - [ ] 优先级标签（红/橙/黄/绿/灰）
  - [ ] 按策略（保守/平衡/激进）筛选课程
  - [ ] 生成报告 HTML（表格）
  - [ ] 生成图表数据（GPA 路径、成功率）
  - [ ] 返回符合 `events.js` 需求的对象

## 2. 图表可视化模块（retake-visualization.js）
- [x] 创建 `public/js/retake-visualization.js` 文件
- [x] 定义全局 `window.retakeVisualizer` 对象
  - [x] `createGPAPathChart(canvas, gpaPathData)`：绘制 GPA 提升路径图
  - [x] `createSuccessRateChart(canvas, successRateData)`：绘制成功率图
- [ ] 使用 Chart.js，保持与现有图表风格一致

## 3. 与现有系统集成
- [x] 确保 `retake-engine.js` 在 `index.html` 中加载顺序正确（在 data.js 之后、retake-planner.js 之前）
- [x] 确保 `retake-visualization.js` 在 `index.html` 中加载，并在 `events.js` 中被调用
- [x] 在 `events.js` 中点击“生成重修方案”时，调用新算法并渲染结果
- [x] 确保 `setupTargetGradeSelection`、`setupRealTimeGPACalculation`、`setupScenarioSimulation` 与新数据结构兼容

## 4. 数据与方法复用
- [x] 复用 `data.js` 中的：
  - [x] `calculateCurrentGPA`
  - [x] `calculateRequiredGPA`
  - [x] `groupCoursesByCredit`
  - [x] `recommendRetakeCourses`（作为备用算法）
- [ ] 遵循 `docs/retake-design.md` 中的数据结构要求

## 5. 测试与验证
- [ ] 使用示例 CSV 数据测试生成的重修方案
- [ ] 验证三种策略下的推荐结果是否符合文档规则
- [ ] 验证图表渲染是否正确
- [ ] 验证实时 GPA 计算与场景模拟功能是否正常
- [ ] 验证智能建议系统输出是否合理

## 6. Bug 修复任务
### 问题1：目标GPA输入无法输入小数
- [x] 检查 `index.html` 中 `<input type="number" id="target-gpa">` 的 `step` 和输入限制，确保允许输入包含两位小数的值（如3.7, 3.8）
- [x] 确认 `events.js` 中读取 `targetGPA` 时正确解析浮点数（使用 `parseFloat`），并避免 `isNaN` 判断导致小数被拦截
- [x] 在 `retake-engine.js` 处理逻辑中测试传入的 `targetGPA` 是浮点数并被有效运算

### 问题2：生成重修方案时GPA提升路径和重修成功率图表无数据
- [x] 检查 `retake-engine.js` 中 `gpaPathData` 和 `successRateData` 构建部分是否引用了正确的候选课程数据
- [x] 检查 `events.js` 中 `window.retakeVisualizer.createGPAPathChart` 与 `createSuccessRateChart` 调用时传入的数据结构是否匹配 Chart.js 要求（labels 和 datasets 数组）
- [x] 确保 `generatePlan` 返回的 `gpaPathData` 与 `successRateData` 的数值为浮点数，非字符串，并且 `successRate` 已乘以 100 转为百分比
- [x] 添加调试日志输出 `retakePlan.gpaPathData` 与 `retakePlan.successRateData` 确定位何无数据绘制
- [x] 在 `retake-visualization.js` 中确保 Chart.js 初始化时销毁旧图表并渲染新数据

### 问题3：点击生成重修方案后模块未接收数据
#### 可能原因拆解：
1. `events.js` 的 `generateRetakeBtn` 点击事件未正确获取或引用 `window.courseData`，导致传入 `generatePlan` 的数据源为空
2. `retake-engine.js` 依赖 `window.courseData`，但该全局变量可能尚未在点击之前被初始赋值（需要确认数据加载顺序）
3. `loadAndDisplayCourseData()` 加载课程数据后未将结果赋值给 `window.courseData`
4. `generatePlan()` 返回的对象虽包含 `gpaPathData`、`successRateData`、`courses` 等，但 `events.js` 内的数据传递链未正常把这些数据用于后续模块（图表渲染、目标绩点设置、实时GPA计算、场景模拟分析）
5. 点击事件后 UI 渲染模块 (`retake-visualization.js` / 相关 setup 函数) 可能在调用时机上早于数据返回，造成调用的是 `undefined`

#### 修复计划：
- [ ] 在 `loadAndDisplayCourseData()` 完成时，确保 `window.courseData` 被赋值为已解析的课程数据
- [ ] 确认 `loadAndDisplayCourseData()` 启动时机正确（程序启动或页面加载时），可检测 `courses.csv` 是否存在并自动加载数据
- [ ] 确认 `generatePlan` 能接收到 `targetGPA` 和 `strategy` 以及有效的课程数组
- [ ] 在 `events.js` 调用 `retakeVisualizer` 传入的 `gpaPathData` 和 `successRateData` 参数前加调试日志确认数据结构正确
- [ ] 确保 `retake-visualization.js` 绘图函数在接收数据后才能执行渲染，避免空调用

## 新页面“重修规划”功能
- [x] 在左侧栏新增“重修规划”入口
- [x] 新建 panel 容器 #retake-planning-panel 并移植原“推荐重修课程”全部 DOM
- [ ] 更新 events.js 点击事件逻辑以适配新容器
- [ ] 确保 window.courseData 在页面切换后依然可用
- [ ] 验证生成方案、图表、数据填充在新页面中正常工作

## 成功率计算现行规则
- 基础成功率 `baseRate` 固定为 0.8
- 难度系数 `getDifficultyFactor(credits)`：
  - ≤1 学分: 0.7
  - 2 学分: 0.85
  - 3 学分: 1.0
  - ≥4 学分: 1.2
- 历史成绩系数 `historyFactor = (4.0 - originalGPA) / 4.0`
- 目标系数 `targetFactor`：
  - 提升幅度 gap > 2.0 → 0.4
  - 提升幅度 gap > 1.5 → 0.6
  - 提升幅度 gap > 1.0 → 0.8
  - 其它 → 1.0
- 成功率公式：
  ```
  successRate = baseRate * (1 / difficultyFactor) * historyFactor * targetFactor
  ```
  最终限制在 [0, 1] 之间

## 成功率调整方案候选
**方案A（温和提升全局基线）**
- baseRate 增加到 0.9 或 1.0
- historyFactor 放宽：`(4.0 - originalGPA) / 3.5`
- targetFactor 缓和：gap > 2.0→0.6, gap >1.5→0.8, gap >1.0→0.9

**方案B（倾向中高分可达）**
- 难度系数削减影响：使用 `Math.sqrt(difficultyFactor)` 替代直接除
- 历史成绩系数上限调高到 1.2
- 对 gap <= 1.0 的目标直接给 100%

**方案C（动态加权策略）**
- 对低学分课程（≤2 学分）减少难度惩罚系数至 0.5
- 引入课程类型加权（核心课 successRate *1.1，选修课 *0.95）
- 历史系数按 `Math.max(0.5, historyFactor)` 保底

选择方案后将改写 `calculateSuccessRate()` 实现

## 6. 文档与维护
- [ ] 更新 `docs/retake-design.md`，记录实现细节
- [ ] 在代码中添加注释，标明复用方法与数据来源
- [ ] 保留 `data.js` 中的 IPS 算法作为备用方案
