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

// CSV解析函数
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                // 移除可能存在的BOM标记和引号
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