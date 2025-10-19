// 简化测试，仅验证语法和基本逻辑
const { ZhipuAI } = require('zhipuai-sdk-nodejs-v4');
const aiModels = require('./src/utils/aiModels.json');

console.log('AI Models:', aiModels);

// 模拟测试数据
const sampleCourseData = [
  {
    course_name: "高等数学A",
    course_weight: 5,
    course_score: "75",
    course_gpa: "2.7",
    pass: "passed",
    course_semester: "1"
  }
];

// 创建一个模拟事件对象
const mockEvent = {
  sender: {
    send: (channel, message) => {
      console.log(`[Mock Event] ${channel}: ${message}`);
    }
  }
};

// 测试ZhipuAI的API结构
console.log('Testing ZhipuAI SDK structure...');
try {
  // 创建实例但不实际调用API
  const zhipu = new ZhipuAI({ apiKey: 'dummy' });
  console.log('ZhipuAI SDK structure:', Object.keys(zhipu));
  console.log('ZhipuAI methods:', typeof zhipu.createCompletions);
  console.log('ZhipuAI completions:', zhipu.completions ? 'exists' : 'not exists');
} catch (e) {
  console.log('Error creating ZhipuAI instance:', e.message);
}

// 测试格式化函数
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

const formatted = formatCoursesForAI(sampleCourseData);
console.log('Formatted courses:', formatted);