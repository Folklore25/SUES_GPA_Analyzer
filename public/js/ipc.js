// 加载并显示用户信息的函数
async function loadAndDisplayCourseData() {
  try {
    // 调用API获取INI数据
    const iniData = await window.electronAPI.loadCourseData();
    
    // 解析INI数据
    const parsedData = parseINI(iniData);
    
    // 更新所有显示内容
    updateAllDisplays(parsedData);
    
    // 更新统计信息
    updateStatistics(parsedData);
  } catch (error) {
    console.error('加载数据失败:', error);
    alert('加载数据失败: ' + error.message);
  }
}

// 解析INI文件数据的函数
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