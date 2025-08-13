// 加载并显示用户信息的函数
async function loadAndDisplayCourseData() {
  console.log('开始执行loadAndDisplayCourseData函数');
  try {
    // 调用API获取课程数据
    console.log('正在调用window.electronAPI.loadCourseData()');
    const courseData = await window.electronAPI.loadCourseData();
    console.log('window.electronAPI.loadCourseData()执行完成，返回数据长度:', courseData.length);
    
    // 解析CSV数据
    console.log('正在解析CSV数据');
    const parsedData = parseCSV(courseData);
    console.log('CSV数据解析完成，解析结果数量:', parsedData.length);
    console.log('解析结果示例:', parsedData.slice(0, 2)); // 显示前两个结果作为示例
    
    // 更新所有显示内容
    console.log('正在调用updateAllDisplays函数');
    updateAllDisplays(parsedData);
    console.log('updateAllDisplays函数执行完成');
    
    // 更新统计信息
    console.log('正在调用updateStatistics函数');
    updateStatistics(parsedData);
    console.log('updateStatistics函数执行完成');
    
    console.log('loadAndDisplayCourseData函数执行完成');
  } catch (error) {
    console.error('加载数据失败:', error);
    alert('加载数据失败: ' + error.message);
  }
}

// 解析CSV文件数据的函数
function parseCSV(csvText) {
  console.log('正在解析CSV数据');
  const lines = csvText.split(/\r?\n/);
  const result = [];
  
  // 跳过空行
  const validLines = lines.filter(line => line.trim() !== '');
  
  if (validLines.length === 0) {
    console.log('CSV数据为空');
    return result;
  }
  
  // 解析标题行
  const headers = validLines[0].split(',').map(header => header.trim());
  console.log('CSV标题行:', headers);
  
  // 解析数据行
  for (let i = 1; i < validLines.length; i++) {
    const line = validLines[i].trim();
    if (line === '') continue;
    
    // 简单的CSV解析（不处理引号中的逗号）
    const values = line.split(',').map(value => value.trim());
    
    // 确保值的数量与标题数量匹配
    if (values.length === headers.length) {
      const course = {};
      for (let j = 0; j < headers.length; j++) {
        course[headers[j]] = values[j];
      }
      result.push(course);
    } else {
      console.warn(`第${i + 1}行数据列数不匹配，跳过该行:`, line);
    }
  }
  
  console.log('CSV数据解析完成，解析结果数量:', result.length);
  return result;
}

// 解析INI文件数据的函数（保留以兼容旧格式）
function parseINI(iniText) {
  const result = [];
  let currentSection = '';
  
  // 按行分割
  const lines = iniText.split(/\r?\n/);
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过空行和注释
    if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // 检查是否为节标题
    const sectionMatch = trimmedLine.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }
    
    // 解析键值对
    const keyValueMatch = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim();
      let value = keyValueMatch[2].trim();
      
      // 处理引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      // 将INI数据转换为课程数据格式
      result.push({
        course_name: `${currentSection}.${key}`,
        course_code: key,
        course_semester: currentSection,
        course_attribute: 'user_info',
        course_weight: 0,
        course_score: value || '--',
        course_gpa: '--',
        pass: 'passed'
      });
    }
  }
  
  return result;
}