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

    // 将解析结果保存到全局变量，供 retake-engine.js 使用
    window.courseData = parsedData;
    console.log("window.courseData 已更新，数量:", window.courseData.length);

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

  // 移除可能存在的BOM标记
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  // 处理不同的换行符
  const lines = cleanText.trim().split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  // 处理表头
  const headersLine = lines[0];
  const headers = headersLine.split(',');

  // 清理表头中的BOM标记和空白字符
  if (headers.length > 0) {
    headers[0] = headers[0].replace(/^\uFEFF/, '').trim();
  }

  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // 跳过空行

    // 解析CSV行，正确处理引号中的逗号
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        let value = values[j];

        // 对course_semester字段进行特殊处理，只保留第一个数字
        if (headers[j] === 'course_semester' && value.includes(',')) {
          // 移除可能的引号并提取第一个数字
          const semesterValue = value.replace(/["']/g, '').trim();
          const firstSemester = semesterValue.split(',')[0].trim();
          row[headers[j]] = firstSemester;
        } else {
          row[headers[j]] = value;
        }
      }
      result.push(row);
    }
  }

  console.log('CSV数据解析完成，解析结果数量:', result.length);
  return result;
}

// 解析CSV行的辅助函数，正确处理引号中的逗号
function parseCSVLine(line) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // 双引号转义
        currentValue += '"';
        i++; // 跳过下一个引号
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 逗号分隔符（不在引号内）
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      // 普通字符
      currentValue += char;
    }
  }

  // 添加最后一个值
  values.push(currentValue.trim());

  return values;
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
