
// 学年学期转换函数
function convertSemesterToChinese(courseYear, courseSemester) {
    // 如果courseYear是"undefined"或不存在，则只根据semester判断
    if (!courseYear || courseYear === "undefined") {
        // 根据semester推断学年
        const semesterNum = parseInt(courseSemester) || 0;
        if (semesterNum > 0) {
            const year = Math.ceil(semesterNum / 2);
            const isSpring = semesterNum % 2 === 0; // 偶数为下学期
            return `大${getChineseNumber(year)}${isSpring ? '下' : '上'}`;
        }
        return "第二课堂";
    }
    
    // 如果有明确的学年信息
    const year = parseInt(courseYear) || 0;
    const semester = parseInt(courseSemester) || 0;
    
    if (year > 0 && semester > 0) {
        return `大${getChineseNumber(year)}${semester === 1 ? '上' : semester === 2 ? '下' : '第' + semester + '学期'}`;
    }
    
    // 默认返回原始值
    return `${courseYear}-${courseSemester}`;
}

// 数字转中文函数
function getChineseNumber(num) {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (num <= 10) {
        return chineseNumbers[num];
    } else if (num < 20) {
        return '十' + (num % 10 > 0 ? chineseNumbers[num % 10] : '');
    } else {
        return chineseNumbers[Math.floor(num / 10)] + '十' + (num % 10 > 0 ? chineseNumbers[num % 10] : '');
    }
}

// CSV解析函数
function parseCSV(csvText) {
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
    
    const data = [];
    
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
            data.push(row);
        }
    }
    
    return data;
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