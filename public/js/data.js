// 计算当前GPA
function calculateCurrentGPA(data) {
    // 只包括通过且绩点大于0的课程
    const passedCourses = data.filter(course => course.pass === 'passed' && parseFloat(course.course_gpa) > 0);
    if (passedCourses.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    passedCourses.forEach(course => {
        const credits = parseFloat(course.course_weight) || 0;
        const gpa = parseFloat(course.course_gpa) || 0;
        totalPoints += credits * gpa;
        totalCredits += credits;
    });
    
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// 计算需要的GPA以达到目标
function calculateRequiredGPA(data, targetGPA) {
    const passedCourses = data.filter(course => course.pass === 'passed');
    const uncompletedCourses = data.filter(course => course.pass === 'failed' || course.course_score === '--' || course.course_score === '');
    
    // 计算已完成课程的总绩点和总学分
    let completedPoints = 0;
    let completedCredits = 0;
    
    passedCourses.forEach(course => {
        const credits = parseFloat(course.course_weight) || 0;
        const gpa = parseFloat(course.course_gpa) || 0;
        completedPoints += credits * gpa;
        completedCredits += credits;
    });
    
    // 计算未修课程的总学分
    let uncompletedCredits = 0;
    uncompletedCourses.forEach(course => {
        const credits = parseFloat(course.course_weight) || 0;
        uncompletedCredits += credits;
    });
    
    // 如果没有未修课程，返回0
    if (uncompletedCredits === 0) return 0;
    
    // 计算需要的总绩点以达到目标GPA
    const requiredTotalPoints = targetGPA * (completedCredits + uncompletedCredits);
    const requiredPoints = requiredTotalPoints - completedPoints;
    
    // 计算未修课程需要的平均GPA
    return requiredPoints / uncompletedCredits;
}


// 计算课程的重修性价比(IPS)
function calculateIPS(course, allCourses, targetGPA) {
    // 计算总学分
    const totalCredits = allCourses.reduce((sum, c) => {
        return sum + (parseFloat(c.course_weight) || 0);
    }, 0);
    
    if (totalCredits === 0) return 0;
    
    // 获取当前课程信息
    const courseCredits = parseFloat(course.course_weight) || 0;
    const currentGPA = parseFloat(course.course_gpa) || 0;
    
    // 计算学分权重
    const creditWeight = courseCredits / totalCredits;
    
    // 计算可达成概率因子
    const gap = Math.abs(targetGPA - currentGPA);
    const probabilityFactor = 1 / (1 + 0.2 * gap);
    
    // 计算绩点提升空间
    const gpaImprovementSpace = (targetGPA - currentGPA) * probabilityFactor;
    
    // 计算对总GPA的影响系数
    const impactFactor = (targetGPA - currentGPA) * courseCredits / totalCredits;
    
    // 计算IPS值
    const ips = creditWeight * gpaImprovementSpace * impactFactor;
    
    return ips;
}

// 推荐重修课程（基于IPS算法）
function recommendRetakeCourses(data, targetGPA) {
    // 筛选已通过但绩点较低的课程（绩点小于目标GPA的课程）
    const passedCourses = data.filter(course => {
        return course.pass === 'passed' &&
               parseFloat(course.course_gpa) < targetGPA &&
               parseFloat(course.course_gpa) > 0; // 排除绩点为0的课程
    });
    
    // 计算每门课程的IPS值
    const coursesWithIPS = passedCourses.map(course => {
        return {
            ...course,
            ips: calculateIPS(course, data, targetGPA)
        };
    });
    
    // 按IPS值降序排序
    coursesWithIPS.sort((a, b) => b.ips - a.ips);
    
    // 选出IPS值最高的7门课程
    return coursesWithIPS.slice(0, 7);
}

// 按学分分组课程
function groupCoursesByCredit(data) {
    const groups = {
        1: [],
        2: [],
        3: [],
        4: []
    };
    
    data.forEach(course => {
        // 将学分四舍五入到最接近的整数
        const credits = Math.round(parseFloat(course.course_weight) || 0);
        if (credits in groups) {
            groups[credits].push(course);
        }
    });
    
    return groups;
}

// 计算理想GPA（重修所有不及格课程后的GPA）
function calculateIdealGPA(data, retakeCourses) {
    // 复制数据以避免修改原始数据
    const courses = [...data];
    
    // 将重修课程的绩点更新为4.0
    retakeCourses.forEach(retakeCourse => {
        const index = courses.findIndex(course => course.course_code === retakeCourse.course_code);
        if (index !== -1) {
            courses[index].course_gpa = '4.0';
            courses[index].pass = 'passed';
        }
    });
    
    // 计算更新后的GPA
    return calculateCurrentGPA(courses);
}

// 计算重修后未修课程需要的GPA
function calculateRequiredGPAAfterRetake(data, targetGPA, retakeCourses) {
    // 复制数据以避免修改原始数据
    const courses = [...data];
    
    // 将重修课程的绩点更新为4.0
    retakeCourses.forEach(retakeCourse => {
        const index = courses.findIndex(course => course.course_code === retakeCourse.course_code);
        if (index !== -1) {
            courses[index].course_gpa = '4.0';
            courses[index].pass = 'passed';
        }
    });
    
    // 计算重修后需要的GPA
    return calculateRequiredGPA(courses, targetGPA);
}

// Animate number changes
function animateValue(id, start, end, duration, suffix = '') {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);
    
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    let timer;
    
    function run() {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const value = end - (remaining * range);
        
        if (value == end) {
            clearInterval(timer);
        }
        
        element.textContent = value.toFixed(value % 1 === 0 ? 0 : 2) + suffix;
    }
    
    timer = setInterval(run, stepTime);
    run();
}

// 更新统计信息的函数
function updateStatistics(data) {
    if (!data || data.length === 0) return;
    
    // 计算当前GPA（加权平均）
    const currentGPA = calculateCurrentGPA(data);
    const avgGPA = currentGPA.toFixed(2);
    
    // 计算总学分
    const totalCredits = data.reduce((sum, course) => {
        const weight = parseFloat(course.course_weight) || 0;
        return sum + weight;
    }, 0);
    
    // 计算通过课程数
    const passedCourses = data.filter(course => course.pass === 'passed').length;
    
    // 计算需要重修的课程数
    const needRetake = data.filter(course => course.pass === 'failed').length;
    
    // 使用动画效果更新界面显示
    animateValue('avg-gpa', 0, parseFloat(avgGPA), 1000);
    animateValue('total-credits', 0, totalCredits, 1000);
    animateValue('passed-courses', 0, passedCourses, 1000);
    animateValue('need-retake', 0, needRetake, 1000);
    
    // 同时更新选项卡面板中的统计信息
    animateValue('avg-gpa2', 0, parseFloat(avgGPA), 1000);
    animateValue('total-credits2', 0, totalCredits, 1000);
    animateValue('passed-courses2', 0, passedCourses, 1000);
    animateValue('need-retake2', 0, needRetake, 1000);
}

// 更新推荐重修课程显示
function updateRetakeCoursesDisplay(data, targetGPA) {
    // 获取排序选项
    const retakeSortBy = document.getElementById('retake-sort-by')?.value || 'name-asc';
    
    // 显示推荐重修课程
    displayRetakeCourses(data, targetGPA, retakeSortBy);
}

// 更新所有显示内容
function updateAllDisplays(data) {
    // 添加日志以诊断问题
    console.log('updateAllDisplays函数被调用');
    
    // 获取排序选项
    const completedSortBy = document.getElementById('completed-sort-by')?.value || 'name-asc';
    const uncompletedSortBy = document.getElementById('uncompleted-sort-by')?.value || 'name-asc';
    
    // 计算当前GPA
    const currentGPA = calculateCurrentGPA(data);
    console.log('当前GPA计算结果:', currentGPA);
    // 使用动画效果更新当前GPA显示
    animateValue('current-gpa', 0, currentGPA, 1000);
    
    // 显示已修课程
    displayCompletedCourses(data, completedSortBy);
    
    // 显示未修课程
    displayUncompletedCourses(data, uncompletedSortBy);
    
    // 更新图表
    console.log('准备调用图表绘制函数');
    if (typeof createGPATrendChart === 'function' && typeof createGradeDistributionChart === 'function') {
        console.log('调用createGPATrendChart函数');
        createGPATrendChart(data);
        console.log('调用createGradeDistributionChart函数');
        createGradeDistributionChart(data);
        console.log('图表绘制函数调用完成');
    }
    
    // 移除对目标GPA的读取，因为图表绘制不需要它
    // displayRetakeCourses函数依赖于目标GPA值，所以不在此处调用
}

// Create GPA trend chart
function createGPATrendChart(data) {
    const ctx = document.getElementById('gpa-trend-chart').getContext('2d');
    
    // Destroy existing chart if exists
    if (window.gpaTrendChart) {
        window.gpaTrendChart.destroy();
    }
    
    // Process semester data
    const semesterGPAs = {};
    const semesterCredits = {};
    
    data.forEach(course => {
        const semester = course.course_semester;
        const gpa = parseFloat(course.course_gpa);
        const weight = parseFloat(course.course_weight);
        
        if (semester && gpa !== null && !isNaN(gpa) && weight !== null && !isNaN(weight)) {
            // 处理像"1,2"这样的多个学期
            const semesters = semester.toString().split(',');
            semesters.forEach(sem => {
                const semKey = sem.trim();
                if (semKey !== "--" && semKey !== "undefined") {
                    const semNum = parseInt(semKey);
                    if (!isNaN(semNum)) {
                        if (!semesterGPAs[semNum]) {
                            semesterGPAs[semNum] = 0;
                            semesterCredits[semNum] = 0;
                        }
                        semesterGPAs[semNum] += gpa * weight;
                        semesterCredits[semNum] += weight;
                    }
                }
            });
        }
    });
    
    // 获取所有有数据的学期并排序
    const semesters = Object.keys(semesterGPAs).map(Number).sort((a, b) => a - b);
    
    // 计算每个学期的GPA
    const gpas = semesters.map(sem =>
        semesterCredits[sem] > 0 ? parseFloat((semesterGPAs[sem] / semesterCredits[sem]).toFixed(2)) : 0
    );
    
    // 计算累积GPA
    let cumulativeGPA = [];
    let totalWeight = 0;
    let totalGPA = 0;
    
    semesters.forEach(sem => {
        totalGPA += semesterGPAs[sem];
        totalWeight += semesterCredits[sem];
        cumulativeGPA.push(parseFloat((totalGPA / totalWeight).toFixed(2)));
    });
    
    // 转换学期为中文标签
    const semesterLabels = semesters.map(s => convertSemesterToChinese(null, s));
    
    // 添加调试日志
    console.log('GPA Trend Chart Data:', {
        semesters: semesters,
        semesterLabels: semesterLabels,
        gpas: gpas,
        cumulativeGPA: cumulativeGPA
    });
    
    window.gpaTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: semesterLabels,
            datasets: [{
                label: '学期 GPA',
                data: gpas,
                borderColor: '#007acc',
                backgroundColor: 'rgba(0, 122, 204, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#007acc',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }, {
                label: '累计 GPA',
                data: cumulativeGPA,
                borderColor: '#03dac6',
                backgroundColor: 'rgba(3, 218, 198, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                borderDash: [5, 5],
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#03dac6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#666666',
                        font: { size: 12 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 4.0,
                    ticks: {
                        color: '#666666',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#666666',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            }
        }
    });
}

// Create grade distribution chart
function createGradeDistributionChart(data) {
    console.log('Using createGradeDistributionChart from data.js');
    const ctx = document.getElementById('grade-distribution-chart').getContext('2d');
    
    // Destroy existing chart if exists
    if (window.gradeDistChart) {
        window.gradeDistChart.destroy();
    }
    
    // 定义需要显示的等级和初始计数
    const gradeCount = {
        'A': 0,
        'A-': 0,
        'B+': 0,
        'B': 0,
        'B-': 0,
        'C+': 0,
        'C': 0,
        'C-': 0,
        'D': 0,
        'F': 0
    };
    
    // 统计各等级成绩数量
    console.log('Processing grade distribution data, total courses:', data.length);
    let processedCount = 0;
    data.forEach(course => {
        const score = course.course_score;
        if (score && score !== '--') {
            // 直接使用course_score中的字母等级
            if (gradeCount.hasOwnProperty(score)) {
                gradeCount[score]++;
                processedCount++;
            }
        }
    });
    console.log('Processed grade distribution courses:', processedCount);
    
    // 准备图表数据
    const grades = Object.keys(gradeCount);
    const counts = Object.values(gradeCount);
    
    // 添加调试日志
    console.log('Grade Distribution Chart Data:', {
        grades: grades,
        counts: counts
    });
    
    // 定义颜色
    const backgroundColors = [
        'rgba(16, 185, 129, 0.8)', // A - 绿色
        'rgba(20, 185, 140, 0.8)', // A- - 浅绿
        'rgba(59, 130, 246, 0.8)', // B+ - 蓝色
        'rgba(79, 130, 250, 0.8)', // B - 浅蓝
        'rgba(99, 130, 255, 0.8)', // B- - 更浅蓝
        'rgba(245, 158, 11, 0.8)', // C+ - 黄色
        'rgba(245, 165, 20, 0.8)', // C - 浅黄
        'rgba(245, 175, 30, 0.8)', // C- - 更浅黄
        'rgba(239, 68, 68, 0.8)',  // D - 红色
        'rgba(107, 114, 128, 0.8)' // F - 灰色
    ];
    
    const borderColors = [
        '#10b981', // A
        '#14b98c', // A-
        '#3b82f6', // B+
        '#4f82fa', // B
        '#6382ff', // B-
        '#f59e0b', // C+
        '#f5a514', // C
        '#f5af1e', // C-
        '#ef4444', // D
        '#6b7280'  // F
    ];
    
    window.gradeDistChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: grades,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#666666',
                        font: { size: 12 },
                        padding: 15,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: ${data.datasets[0].data[i]}门`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                strokeStyle: data.datasets[0].borderColor[i],
                                lineWidth: 2,
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${label}: ${value}门 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}