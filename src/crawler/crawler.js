const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

// Log the current working directory and filename for debugging
console.log('爬虫脚本启动');
console.log('当前工作目录:', process.cwd());
console.log('脚本文件路径:', __filename);
console.log('脚本目录路径:', __dirname);

// Handle config path differently when packaged in asar
const isProduction = process.env.NODE_ENV === 'production';
console.log('运行环境:', isProduction ? 'production' : 'development');

const configPath = isProduction
  ? path.join(path.dirname(__filename), 'config.json')
  : './config.json';
  
console.log('配置文件路径:', configPath);

// Check if config file exists
try {
  const configStats = fs.statSync(configPath);
  console.log('配置文件存在，大小:', configStats.size, '字节');
} catch (err) {
  console.error('配置文件不存在或无法访问:', err.message);
}

const config = require(configPath);

let parentPort = null;

// 发送消息给父进程
function sendMessage(type, data) {
  // Progress reporting is disabled as per user request.
  // Only send final 'complete' or 'error' messages.
  if (parentPort && (type === 'complete' || type === 'error')) {
    parentPort.postMessage({ type, data });
  }
}

// 课程数据解析函数
function parseCourseRow(rowElement) {
  try {
    // 获取所有td元素
    const tds = rowElement.querySelectorAll('td');
    
    if (tds.length < 7) {
      console.log('警告：行数据不完整');
      return null;
    }
    
    // 获取课程名称（从data-text属性）
    const courseNameElement = rowElement.querySelector('.course-name');
    const courseName = courseNameElement ? (courseNameElement.getAttribute('data-text') || '').trim() : '';
    
    // 获取成绩和绩点
    const score = tds[5] ? tds[5].textContent.trim() : '--';
    const gpa = tds[6] ? tds[6].textContent.trim() : '--';
    
    // 处理数值转换
    let courseWeight = 0;
    try {
      courseWeight = parseFloat(tds[4].textContent.trim()) || 0;
    } catch (e) {
      courseWeight = 0;
    }
    
    // Get pass status based on the new 3-state rule
    const passStatus = (rowElement.getAttribute('data-result') || '').toUpperCase();
    let pass;
    if (passStatus === 'PASSED') {
      pass = 'passed';
    } else if (passStatus === 'UNREPAIRED' || passStatus === 'TAKING') {
      pass = 'unrepaired';
    } else {
      pass = 'failed';
    }
    
    return {
      course_name: courseName,
      course_code: tds[1] ? tds[1].textContent.trim() : '',
      course_semester: tds[2] ? tds[2].textContent.trim() : '',
      course_attribute: tds[3] ? tds[3].textContent.trim() : '',
      course_weight: courseWeight,
      course_score: score,
      course_gpa: gpa,
      pass: pass
    };
  } catch (error) {
    console.error('解析课程行数据失败:', error);
    return null;
  }
}

// 保存数据到CSV文件
async function saveToCSV(data, filePath) {
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
    await fs.writeFile(filePath, '\uFEFF' + csvContent, 'utf8');
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
      console.log('浏览器配置:', config.browser);
      
      // 确保PLAYWRIGHT_BROWSERS_PATH环境变量已设置
      if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
        console.log('Playwright浏览器路径:', process.env.PLAYWRIGHT_BROWSERS_PATH);
      } else {
        console.warn('PLAYWRIGHT_BROWSERS_PATH环境变量未设置');
      }
      
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
      
      // 解析HTML内容
      const coursesData = [];
      if (tableHtml) {
        // 使用JSDOM解析HTML
        const dom = new JSDOM(tableHtml);
        const doc = dom.window.document;
        
        // 查找所有包含课程数据的行
        const courseRows = doc.querySelectorAll('tr[data-result]');
        
        // 解析每一行数据
        for (const row of courseRows) {
          const courseData = parseCourseRow(row);
          if (courseData) {
            coursesData.push(courseData);
          }
        }
      }
      
      sendMessage('progress', { message: `成功爬取到 ${coursesData.length} 条课程数据` });
      
      if (coursesData.length > 0) {
        sendMessage('progress', { message: '正在保存数据到CSV...' });
        // Use the userDataPath to save the file to the correct location
        const csvFilePath = path.join(userDataPath, 'courses.csv');
        await saveToCSV(coursesData, csvFilePath);
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
let userDataPath; // Variable to hold the user data path

// Listen for messages from the parent process
process.parentPort.on('message', async (e) => {
  const message = e.data;
  
  if (message.type === 'init') {
    // Store the port for communication
    parentPort = e.ports[0];
    console.log('爬虫进程已初始化');
  } else if (message.type === 'start') {
    try {
      console.log('开始执行爬虫任务');
      // Store the userDataPath and get loginInfo from the new data structure
      userDataPath = message.data.userDataPath;
      const scraper = new CoursesScraper(message.data.loginInfo);
      
      await scraper.setupBrowser();
      const coursesData = await scraper.scrapeCourses();
      await scraper.close();
      
      console.log(`爬虫任务完成，共获取到 ${coursesData.length} 条数据`);
      
      // 发送完成消息
      sendMessage('complete', { 
        success: true, 
        data: coursesData,
        message: '数据获取完成' 
      });
    } catch (error) {
      console.error('爬虫执行过程中发生错误:', error);
      // 发送错误消息
      sendMessage('error', { 
        success: false, 
        message: error.message 
      });
    }
  }
});

// Start listening for messages
process.parentPort.start();

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('爬虫进程中未捕获的异常:', error);
  sendMessage('error', { 
    success: false, 
    message: `未捕获的异常: ${error.message}` 
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('爬虫进程中未处理的Promise拒绝:', reason);
  sendMessage('error', {
    success: false,
    message: `未处理的Promise拒绝: ${reason}`
  });
});
