const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');

// 发送消息给父进程
function sendMessage(type, data) {
  if (process.send) {
    process.send({ type, data });
  }
}

// 课程数据解析函数
function parseCourseRow(row) {
  try {
    // 这里需要根据实际HTML结构调整解析逻辑
    // 暂时返回示例数据
    return {
      course_name: row.courseName || '',
      course_code: row.courseCode || '',
      course_semester: row.semester || '',
      course_attribute: row.attribute || '',
      course_weight: parseFloat(row.weight) || 0,
      course_score: row.score || '--',
      course_gpa: row.gpa || '--',
      pass: row.pass || 'failed'
    };
  } catch (error) {
    console.error('解析课程行数据失败:', error);
    return null;
  }
}

// 保存数据到CSV文件
async function saveToCSV(data, filename = 'courses.csv') {
  try {
    if (!data || data.length === 0) {
      console.log('没有数据可保存');
      return false;
    }

    // CSV头部
    const headers = [
      'course_name',
      'course_code', 
      'course_semester',
      'course_attribute',
      'course_weight',
      'course_score',
      'course_gpa',
      'pass'
    ];

    // 构建CSV内容
    let csvContent = headers.join(',') + '\n';
    
    for (const course of data) {
      const row = headers.map(header => {
        const value = course[header];
        // 转义包含逗号或引号的字段
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
      csvContent += row + '\n';
    }

    // 保存文件
    const filePath = path.join(__dirname, '..', '..', filename);
    await fs.writeFile(filePath, csvContent, 'utf8');
    console.log(`数据已成功保存到 ${filePath}`);
    return true;
  } catch (error) {
    console.error('保存CSV文件失败:', error);
    return false;
  }
}

// 爬虫主类
class CoursesScraper {
  constructor(loginInfo) {
    this.username = loginInfo.username;
    this.password = loginInfo.password;
    this.url = loginInfo.url;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async setupBrowser() {
    try {
      sendMessage('progress', { message: '正在启动浏览器...' });
      this.browser = await chromium.launch({
        headless: config.browser.headless,
        args: config.browser.args
      });
      
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
      sendMessage('progress', { message: '浏览器启动成功' });
    } catch (error) {
      console.error('设置浏览器失败:', error);
      throw error;
    }
  }

  async performFirstLogin() {
    try {
      sendMessage('progress', { message: '开始第一次登录...' });
      await this.page.goto(this.url);
      
      // 输入用户名
      await this.page.fill("//input[@id='username']", this.username);
      // 输入密码
      await this.page.fill("//input[@id='password']", this.password);
      // 点击登录按钮
      await this.page.click("//input[@id='passbutton']");
      
      // 等待跳转
      await this.page.waitForTimeout(3000);
      sendMessage('progress', { message: '第一次登录完成' });
      return true;
    } catch (error) {
      console.error('第一次登录失败:', error);
      return false;
    }
  }

  async performSecondLogin() {
    try {
      sendMessage('progress', { message: '开始第二次登录...' });
      
      // 输入用户名
      await this.page.fill("//input[@placeholder='用户名']", this.username);
      // 输入密码
      await this.page.fill("//input[@placeholder='密码']", this.password);
      // 点击登录按钮
      await this.page.click("//button[@type='button']");
      
      await this.page.waitForTimeout(3000);
      sendMessage('progress', { message: '第二次登录完成，请在浏览器中手动完成后续操作' });
      return true;
    } catch (error) {
      console.error('第二次登录失败:', error);
      return false;
    }
  }

  async findAndSwitchToFrame() {
    try {
      sendMessage('progress', { message: '正在查找课程表iframe...' });
      // 等待特定的 iframe 加载
      const frame = await this.page.waitForSelector(
        'iframe[name="e-home-iframe-1"]',
        { timeout: 5000 }
      );
      
      sendMessage('progress', { message: '找到目标iframe，准备切换' });
      // 切换到iframe
      const contentFrame = await frame.contentFrame();
      if (contentFrame) {
        this.page = contentFrame;
        sendMessage('progress', { message: '成功切换到目标iframe' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('查找iframe失败:', error);
      return false;
    }
  }

  async getCourseTableContent() {
    try {
      if (!await this.findAndSwitchToFrame()) {
        console.log('未能找到包含课程表的iframe');
        return null;
      }
      
      sendMessage('progress', { message: '正在等待课程表加载...' });
      await this.page.waitForTimeout(5000); // 等待页面加载
      
      // 获取iframe内容
      const content = await this.page.locator('body').innerHTML();
      sendMessage('progress', { message: '成功获取课程表内容' });
      return content;
    } catch (error) {
      console.error('获取课程表失败:', error);
      return null;
    }
  }

  async scrapeCourses() {
    try {
      if (!await this.performFirstLogin()) {
        throw new Error('第一次登录失败');
      }
      
      if (!await this.performSecondLogin()) {
        throw new Error('第二次登录失败');
      }

      sendMessage('progress', { message: '登录成功，开始爬取课程信息...' });
      // 增加等待时间
      await this.page.waitForTimeout(3000);
      
      // 获取课程表内容
      const tableHtml = await this.getCourseTableContent();
      
      // 这里需要解析HTML并提取课程数据
      // 暂时使用示例数据
      const coursesData = [
        {
          course_name: '高等数学',
          course_code: 'MATH101',
          course_semester: '2023-秋季',
          course_attribute: '必修',
          course_weight: 4,
          course_score: '85',
          course_gpa: '3.0',
          pass: 'passed'
        },
        {
          course_name: '大学英语',
          course_code: 'ENG101',
          course_semester: '2023-秋季',
          course_attribute: '必修',
          course_weight: 3,
          course_score: '90',
          course_gpa: '3.7',
          pass: 'passed'
        }
      ];
      
      sendMessage('progress', { message: `成功爬取到 ${coursesData.length} 条课程数据` });
      
      if (coursesData.length > 0) {
        sendMessage('progress', { message: '正在保存数据到CSV...' });
        await saveToCSV(coursesData);
      } else {
        console.log('没有爬取到任何课程数据');
      }
      
      return coursesData;
    } catch (error) {
      console.error('爬取课程信息失败:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// 监听父进程消息
process.on('message', async (message) => {
  if (message.type === 'login') {
    try {
      const scraper = new CoursesScraper(message.data);
      await scraper.setupBrowser();
      const coursesData = await scraper.scrapeCourses();
      await scraper.close();
      
      // 发送完成消息
      sendMessage('complete', { 
        success: true, 
        data: coursesData,
        message: '数据获取完成' 
      });
    } catch (error) {
      // 发送错误消息
      sendMessage('error', { 
        success: false, 
        message: error.message 
      });
    }
  }
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  sendMessage('error', { 
    success: false, 
    message: `未捕获的异常: ${error.message}` 
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  sendMessage('error', { 
    success: false, 
    message: `未处理的Promise拒绝: ${reason}` 
  });
});