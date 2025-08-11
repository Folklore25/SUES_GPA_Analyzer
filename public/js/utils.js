// GPA转换函数（从分数到绩点）
function scoreToGPA(score) {
    if (score === '--' || score === '') return 0;
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 0;
    
    if (numScore >= 90) return 4.0;
    if (numScore >= 85) return 3.7;
    if (numScore >= 82) return 3.3;
    if (numScore >= 78) return 3.0;
    if (numScore >= 75) return 2.7;
    if (numScore >= 72) return 2.3;
    if (numScore >= 68) return 2.0;
    if (numScore >= 64) return 1.5;
    if (numScore >= 60) return 1.0;
    return 0;
}

// 绩点转换函数（从绩点到分数范围）
function gpaToScoreRange(gpa) {
    if (gpa >= 4.0) return "90-100";
    if (gpa >= 3.7) return "85-89";
    if (gpa >= 3.3) return "82-84";
    if (gpa >= 3.0) return "78-81";
    if (gpa >= 2.7) return "75-77";
    if (gpa >= 2.3) return "72-74";
    if (gpa >= 2.0) return "68-71";
    if (gpa >= 1.5) return "64-67";
    if (gpa >= 1.0) return "60-63";
    return "0-59";
}

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
        
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                // 移除可能存在的引号和空白字符
                let value = values[j].trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                row[headers[j]] = value;
            }
            data.push(row);
        }
    }
    
    return data;
}