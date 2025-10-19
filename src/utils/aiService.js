const keytar = require('keytar');
const fs = require('fs').promises;
const path = require('path');
const aiModels = require('./aiModels.json');
const { ZhipuAI } = require('zhipuai-sdk-nodejs-v4');
const { OpenAI } = require('openai');
const { getCurrentSemesterInfo } = require('../../frontend/src/utils/semesterHelper.js');

const sendLog = (event, message) => {
  event.sender.send('ai-planner-log', message);
};

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

async function _getAIRetakePlan(event, coursesData, username, modelId = 'glm-4.5-flash') {
  sendLog(event, 'AI服务已启动...');
  if (!username) {
    throw new Error('无法获取AI建议，因为没有找到用户信息。');
  }

  sendLog(event, `正在查找模型配置: ${modelId}`);
  const modelConfig = aiModels.find(m => m.id === modelId);
  if (!modelConfig) {
    throw new Error(`未找到指定的AI模型配置: ${modelId}`);
  }

  sendLog(event, '正在获取API Key...');
  let apiKey;
  if (modelConfig.type === 'freemium') {
    const keyPath = path.join(__dirname, '..', '..', 'private', 'assets.bin');
    try {
      apiKey = await fs.readFile(keyPath, 'utf8');
      sendLog(event, '已加载内置API Key。');
    } catch (error) {
      throw new Error('无法读取内置API密钥。请联系开发者。');
    }
  } else {
    apiKey = await keytar.getPassword(modelConfig.apiKeyService, username);
    sendLog(event, '已加载用户提供的API Key。');
  }

  if (!apiKey) {
    throw new Error(`请先在设置页面为 ${modelConfig.provider} 配置您的 API Key。`);
  }

  sendLog(event, '正在构建AI指令...');
  const semesterInfo = getCurrentSemesterInfo();
  const semesterMap = { 1: '第一学期', 2: '第二学期' };
  const currentSemesterStr = semesterInfo.current === 1 ? semesterMap[1] : semesterMap[2];
  const nextSemesterStr = semesterInfo.next === 1 ? semesterMap[1] : semesterMap[2];

  const formattedCourses = formatCoursesForAI(coursesData);

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
    - \`course_semester\` 字段代表课程的开课学期。
    - **奇数 (1, 3, 5, ...)** 代表 **第一学期** (秋季学期)。例如, \'3\' 代表大二第一学期。
    - **偶数 (2, 4, 6, ...)** 代表 **第二学期** (春季学期)。例如, \'4\' 代表大二第二学期。
    - \`(1,2)\` 或 \`(3,4)\` 这样的范围代表连续的两个学期都开设。
    - \`--\` 代表每个学期都开设。
4.  **推荐规则:**
    - 如果当前是第一学期，你应该推荐在即将到来的 **第二学期** (春季) 开设的课程 (即 \`course_semester\` 包含偶数或 \'--\')。
    - 如果当前是第二学期或暑假，你应该推荐在即将到来的 **第一学期** (秋季) 开设的课程 (即 \`course_semester\` 包含奇数或 \'--\')。

**学生课程数据:**
${formattedCourses}

**输出要求:**
请严格按照以下JSON格式返回你的建议，不要添加任何额外的解释或说明文字。返回的结果必须是一个可以直接被解析的JSON对象。
在 \`reason\` 字段中，请明确指出建议的重修学期，例如：“...且在即将到来的大二第一学期（学期3）开设...”。

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

  let stream;
  sendLog(event, 'AI指令构建完成，正在初始化AI客户端...');
  if (modelConfig.provider === 'Zhipu') {
    const zhipu = new ZhipuAI({ apiKey: apiKey.trim() });
    stream = await zhipu.createCompletions({
      model: modelConfig.id,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });
  } else if (modelConfig.provider === 'DeepSeek') {
    const deepseek = new OpenAI({ apiKey: apiKey.trim(), baseURL: modelConfig.apiUrl });
    stream = await deepseek.chat.completions.create({
      model: modelConfig.id,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });
  } else {
    throw new Error(`不支持的AI提供商: ${modelConfig.provider}`);
  }

  sendLog(event, '已连接到AI服务器，正在接收数据流...');
  let fullResponse = '';

  return new Promise((resolve, reject) => {
    // 设置超时
    const timeout = setTimeout(() => {
      reject(new Error('AI流式响应超时'));
    }, 60000); // 60秒超时

    if (modelConfig.provider === 'Zhipu') {
      // 对于ZhipuAI的流式响应，处理IncomingMessage对象
      let buffer = '';
      
      stream.on('data', (chunk) => {
        buffer += chunk;
        let boundary = buffer.lastIndexOf('\n');
        if (boundary !== -1) {
          let lines = buffer.substring(0, boundary).split('\n');
          buffer = buffer.substring(boundary + 1);
          
          for (const line of lines) {
            if (line.trim() === '') continue; // 跳过空行
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim(); // 移除 'data: ' 前缀并去除空格
              if (data === '[DONE]') {
                clearTimeout(timeout);
                try {
                  const parsedResult = JSON.parse(fullResponse);
                  sendLog(event, '解析完成，正在返回结果。');
                  resolve(parsedResult);
                } catch (parseError) {
                  reject(new Error('AI响应解析失败: ' + parseError.message + ' - 响应内容: ' + fullResponse));
                }
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed && parsed.choices && parsed.choices.length > 0) {
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    sendLog(event, content);
                  }
                }
              } catch (e) {
                // 忽略JSON解析错误
                console.error('解析SSE数据时出错:', e);
              }
            }
          }
        }
      });
      
      stream.on('end', () => {
        // 处理buffer中剩余的数据（如果有）
        if (buffer.trim() !== '') {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                clearTimeout(timeout);
                if (fullResponse) {
                  try {
                    const parsedResult = JSON.parse(fullResponse);
                    sendLog(event, '解析完成，正在返回结果。');
                    resolve(parsedResult);
                  } catch (parseError) {
                    reject(new Error('AI响应解析失败: ' + parseError.message + ' - 响应内容: ' + fullResponse));
                  }
                } else {
                  reject(new Error('AI响应为空或无效'));
                }
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed && parsed.choices && parsed.choices.length > 0) {
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    sendLog(event, content);
                  }
                }
              } catch (e) {
                console.error('解析剩余SSE数据时出错:', e);
              }
            }
          }
        }
        
        clearTimeout(timeout);
        if (fullResponse) { // 如果有收到响应内容
          try {
            const parsedResult = JSON.parse(fullResponse);
            sendLog(event, '解析完成，正在返回结果。');
            resolve(parsedResult);
          } catch (parseError) {
            reject(new Error('AI响应解析失败: ' + parseError.message + ' - 响应内容: ' + fullResponse));
          }
        } else {
          // 如果fullResponse为空，说明没有收到有效数据
          reject(new Error('AI响应为空或无效'));
        }
      });
      
      stream.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error('AI流式响应错误: ' + error.message));
      });
    } else {
      // 处理DeepSeek的异步迭代器流
      (async () => {
        try {
          for await (const chunk of stream) {
            if (chunk.choices && chunk.choices.length > 0) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                sendLog(event, content);
              }
            }
          }
          clearTimeout(timeout);
          if (fullResponse) {
            const parsedResult = JSON.parse(fullResponse);
            sendLog(event, '解析完成，正在返回结果。');
            resolve(parsedResult);
          } else {
            reject(new Error('AI响应为空或无效'));
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(new Error('AI响应处理错误: ' + error.message));
        }
      })();
    }
  });
}
module.exports = { getAIRetakePlan };

async function getAIRetakePlan(event, coursesData, username, modelId) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('AI服务响应超时 (60秒)，请稍后重试。'));
        }, 60000); // 60 seconds
    });

    const planningPromise = _getAIRetakePlan(event, coursesData, username, modelId);

    return Promise.race([planningPromise, timeoutPromise]);
}
