// 计算当前GPA
function calculateCurrentGPA(data) {
    const passedCourses = data.filter(course => course.pass === 'passed');
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
    
    // 更新界面显示
    const avgGpaElement = document.getElementById('avg-gpa');
    const totalCreditsElement = document.getElementById('total-credits');
    const passedCoursesElement = document.getElementById('passed-courses');
    const needRetakeElement = document.getElementById('need-retake');
    
    if (avgGpaElement) avgGpaElement.textContent = avgGPA;
    if (totalCreditsElement) totalCreditsElement.textContent = totalCredits;
    if (passedCoursesElement) passedCoursesElement.textContent = passedCourses;
    if (needRetakeElement) needRetakeElement.textContent = needRetake;
}

// 更新所有显示内容
function updateAllDisplays(data) {
    // 获取目标GPA
    const targetGPAInput = document.getElementById('target-gpa');
    const targetGPA = targetGPAInput ? parseFloat(targetGPAInput.value) || 0 : 0;
    
    // 计算当前GPA
    const currentGPA = calculateCurrentGPA(data);
    document.getElementById('current-gpa').textContent = currentGPA.toFixed(2);
    
    // 计算未修课程需要的GPA
    const requiredGPA = calculateRequiredGPA(data, targetGPA);
    document.getElementById('required-gpa').textContent = requiredGPA.toFixed(2);
    
    // 显示已修课程
    displayCompletedCourses(data);
    
    // 显示未修课程
    displayUncompletedCourses(data);
    
    // 显示推荐重修课程
    displayRetakeCourses(data, targetGPA);
}