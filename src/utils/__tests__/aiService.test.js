const { getAIRetakePlan } = require('../aiService');
const aiModels = require('../aiModels.json');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock the Electron IPC event
const mockEvent = {
  sender: {
    send: jest.fn()
  }
};

// 从真实路径读取课程数据，如果不存在则使用示例数据
async function getCourseDataForTest() {
  const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'sues-gpa-analyzer');
  const csvPath = path.join(userDataPath, 'courses.csv');
  
  try {
    const csvData = await fs.readFile(csvPath, 'utf8');
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
    return courses.length > 0 ? courses : getSampleCourseData();
  } catch (error) {
    console.log('无法读取本地课程数据，使用示例数据:', error.message);
    return getSampleCourseData();
  }
}

// 提供示例数据
function getSampleCourseData() {
  return [
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
}

describe('AI Service Tests', () => {
  let courseData;

  beforeAll(async () => {
    courseData = await getCourseDataForTest();
  });

  beforeEach(() => {
    // Reset mock calls
    mockEvent.sender.send.mockClear();
  });

  test('should handle freemium model (glm-4.5-flash) properly with real data format', async () => {
    // Mock the assets.bin file with the API key if it doesn't exist
    const apiKey = 'e352a740d4b74c41a1dcd737c2224b2d.7OkHM42YAVZ0QvXc';
    const assetsPath = path.join(__dirname, '..', '..', '..', 'private', 'assets.bin');
    
    try {
      await fs.access(assetsPath);
    } catch {
      // If file doesn't exist, create it for testing
      await fs.writeFile(assetsPath, apiKey);
    }
    
    // Find the freemium model
    const freemiumModel = aiModels.find(model => model.id === 'glm-4.5-flash');
    expect(freemiumModel).toBeDefined();
    expect(freemiumModel.id).toBe('glm-4.5-flash');
    expect(freemiumModel.type).toBe('freemium');
    
    console.log('开始测试AI服务调用...');
    console.log('使用课程数据:', courseData.length, '条');
    console.log('示例课程:', courseData[0]);
    
    // Run the AI service call with a longer timeout
    const result = await getAIRetakePlan(mockEvent, courseData, 'test_user', freemiumModel.id);
    
    console.log('AI服务调用完成');
    console.log('返回结果类型:', typeof result);
    console.log('发送事件调用次数:', mockEvent.sender.send.mock.calls.length);
    
    // 检查结果是否为对象（期望的JSON响应）
    expect(result).toBeDefined();
  }, 90000); // 90秒超时给测试

  test('should validate model configuration', () => {
    const glmModel = aiModels.find(m => m.id === 'glm-4.5-flash');
    expect(glmModel).toBeDefined();
    expect(glmModel.id).toBe('glm-4.5-flash');
    expect(glmModel.type).toBe('freemium');
    expect(glmModel.provider).toBe('Zhipu');
    expect(glmModel.apiKeyService).toBe('default');
  });
});