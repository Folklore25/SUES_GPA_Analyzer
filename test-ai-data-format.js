const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// 模拟AI服务中的formatCoursesForAI函数
function formatCoursesForAI(courses) {
    return JSON.stringify(courses.map(c => ({
        course_name: c.course_name,
        course_weight: c.course_weight,
        course_score: c.course_score,
        course_gpa: c.course_gpa,
        pass: c.pass,
        course_semester: c.course_semester
    })));
}

// 检查AI数据格式
async function testAIDataFormat() {
  console.log('检查AI数据格式...');

  // 模拟课程数据
  const sampleCourseData = [
    {
      course_name: "高等数学A",
      course_code: "MATH101", 
      course_semester: "1",
      course_attribute: "必修",
      course_weight: 5,
      course_score: "75",
      course_gpa: "2.7",
      pass: "passed"
    },
    {
      course_name: "大学英语",
      course_code: "ENG101",
      course_semester: "1", 
      course_attribute: "必修",
      course_weight: 4,
      course_score: "65",
      course_gpa: "1.5", 
      pass: "failed"
    },
    {
      course_name: "计算机基础",
      course_code: "CS101",
      course_semester: "1",
      course_attribute: "必修", 
      course_weight: 3,
      course_score: "85",
      course_gpa: "3.7",
      pass: "passed"
    }
  ];

  console.log('原始课程数据:', JSON.stringify(sampleCourseData, null, 2));

  // 格式化数据
  const formattedData = formatCoursesForAI(sampleCourseData);
  console.log('\n格式化后的AI输入数据:');
  console.log(formattedData);

  // 检查数据大小
  console.log('\n数据大小分析:');
  console.log('原始数据长度:', JSON.stringify(sampleCourseData).length, '字符');
  console.log('格式化后数据长度:', formattedData.length, '字符');

  // 从本地文件读取真实数据（如果存在）
  const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'sues-gpa-analyzer');
  const csvPath = path.join(userDataPath, 'courses.csv');
  
  try {
    const csvData = await fs.readFile(csvPath, 'utf8');
    console.log('\n✅ 找到本地courses.csv文件');
    console.log('CSV文件大小:', csvData.length, '字符');
    
    // 简单解析CSV数据
    const lines = csvData.split('\n').slice(1); // 跳过标题行
    const courses = [];
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      // 简单的CSV解析（不处理引号内的逗号等复杂情况）
      const fields = line.split(',');
      if (fields.length >= 8) {
        courses.push({
          course_name: fields[0]?.replace(/^"|"$/g, '') || '',
          course_code: fields[1]?.replace(/^"|"$/g, '') || '',
          course_semester: fields[2]?.replace(/^"|"$/g, '') || '',
          course_attribute: fields[3]?.replace(/^"|"$/g, '') || '',
          course_weight: parseFloat(fields[4]) || 0,
          course_score: fields[5]?.replace(/^"|"$/g, '') || '',
          course_gpa: fields[6]?.replace(/^"|"$/g, '') || '',
          pass: fields[7]?.replace(/^"|"$/g, '') || ''
        });
      }
    }
    
    console.log(`从本地读取到 ${courses.length} 条课程数据`);
    if (courses.length > 0) {
      console.log('第一门课程:', JSON.stringify(courses[0], null, 2));
      
      // 格式化真实数据
      const realFormattedData = formatCoursesForAI(courses);
      console.log('\n真实数据格式化后长度:', realFormattedData.length, '字符');
      
      // 检查数据是否过大（可能导致超时）
      if (realFormattedData.length > 100000) { // 100KB
        console.log('⚠️  警告：格式化后的数据较大，可能导致API超时');
      } else {
        console.log('✅ 数据大小适中');
      }
    }
  } catch (error) {
    console.log('❌ 无法读取本地courses.csv文件:', error.message);
    console.log('使用示例数据进行测试');
  }

  // 检查提示模板
  console.log('\n检查AI提示模板构造...');
  const semesterInfo = { current: 1, next: 2 }; // 模拟学期信息
  const semesterMap = { 1: '第一学期', 2: '第二学期' };
  const currentSemesterStr = semesterMap[semesterInfo.current];
  const nextSemesterStr = semesterMap[semesterInfo.next];

  const prompt = `
你是一位专业的大学学业导师，特别熟悉上海工程技术大学的GPA计算规则和课程安排。

**任务:**
请根据以下学生的所有课程成绩，为他/她设计一个最优的重修方案，以最大化提升总加权GPA。

**GPA计算规则:**
- 加权 GPA = Σ(课程学分 × 课程绩点) / Σ(总学分)
- 只有成绩通过的课程才计入总学分。
- 绩点换算：90-100分=4.0, 85-89分=3.7, 82-84分=3.3, 78-81分=3.0, 75-77分=2.7, 72-74分=2.3, 68-71分=2.0, 66-67分=1.7, 64-65分=1.5, 60-63分=1.0, 60分以下=0。

**重要约束:**
1.  **当前学期:** 现在是 **${currentSemesterStr}**。
2.  **规划目标:** 你的所有重修建议都必须是针对即将到来的 **${nextSemesterStr}**。
3.  **课程可用性解释:**
    - \\`course_semester\\` 字段代表课程的开课学期。
    - **奇数 (1, 3, 5, ...)** 代表 **第一学期** (秋季学期)。例如, \\'3\\' 代表大二第一学期。
    - **偶数 (2, 4, 6, ...)** 代表 **第二学期** (春季学期)。例如, \\'4\\' 代表大二第二学期。
    - \\`(1,2)\\` 或 \\`(3,4)\\` 这样的范围代表连续的两个学期都开设。
    - \\`--\\` 代表每个学期都开设。
4.  **推荐规则:**
    - 如果当前是第一学期，你应该推荐在即将到来的 **第二学期** (春季) 开设的课程 (即 \\`course_semester\\` 包含偶数或 \\'--\\')。
    - 如果当前是第二学期或暑假，你应该推荐在即将到来的 **第一学期** (秋季) 开设的课程 (即 \\`course_semester\\` 包含奇数或 \\'--\\')。

**学生课程数据:**
${formattedData}

**输出要求:**
请严格按照以下JSON格式返回你的建议，不要添加任何额外的解释或说明文字。返回的结果必须是一个可以直接被解析的JSON对象。
在 \\`reason\\` 字段中，请明确指出建议的重修学期，例如："...且在即将到来的大二第一学期（学期3）开设..."。

{
  "recommendations": [
    {
      "course_name": "课程A",
      "reason": "该课程学分权重高，且在即将到来的大二第一学期（学期3）开设，重修性价比最高。",
      "expected_gpa_impact": "+0.25"
    }
  ],
  "summary": "综合来看，按此方案在${nextSemesterStr}进行重修，并将推荐课程的成绩提升至85分以上，你的总GPA预计可以从当前的 X.XX 提升至 Y.YY。"
}
  `;
  
  console.log('完整提示模板长度:', prompt.length, '字符');
  if (prompt.length > 50000) { // 50KB
    console.log('⚠️  警告：提示模板过大，可能导致API问题');
  } else {
    console.log('✅ 提示模板大小适中');
  }
}

testAIDataFormat()
  .then(() => console.log('\n数据格式检查完成'))
  .catch(error => console.error('检查过程中出现错误:', error));