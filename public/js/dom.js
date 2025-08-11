// 显示已修课程
function displayCompletedCourses(data) {
    const passedCourses = data.filter(course => course.pass === 'passed');
    const groupedCourses = groupCoursesByCredit(passedCourses);
    
    // 显示4学分课程
    const credit4Body = document.getElementById('completed-4-credit-body');
    if (credit4Body) {
        credit4Body.innerHTML = '';
        groupedCourses[4].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'passed' ? '通过' : '未通过'}</td>
            `;
            credit4Body.appendChild(row);
        });
    }
    
    // 显示3学分课程
    const credit3Body = document.getElementById('completed-3-credit-body');
    if (credit3Body) {
        credit3Body.innerHTML = '';
        groupedCourses[3].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'passed' ? '通过' : '未通过'}</td>
            `;
            credit3Body.appendChild(row);
        });
    }
    
    // 显示2学分课程
    const credit2Body = document.getElementById('completed-2-credit-body');
    if (credit2Body) {
        credit2Body.innerHTML = '';
        groupedCourses[2].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'passed' ? '通过' : '未通过'}</td>
            `;
            credit2Body.appendChild(row);
        });
    }
    
    // 显示1学分课程
    const credit1Body = document.getElementById('completed-1-credit-body');
    if (credit1Body) {
        credit1Body.innerHTML = '';
        groupedCourses[1].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'passed' ? '通过' : '未通过'}</td>
            `;
            credit1Body.appendChild(row);
        });
    }
}

// 显示未修课程
function displayUncompletedCourses(data) {
    const uncompletedCourses = data.filter(course => course.pass === 'failed' || course.course_score === '--' || course.course_score === '');
    const groupedCourses = groupCoursesByCredit(uncompletedCourses);
    
    // 显示4学分课程
    const credit4Body = document.getElementById('uncompleted-4-credit-body');
    if (credit4Body) {
        credit4Body.innerHTML = '';
        groupedCourses[4].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'failed' ? '未通过' : '未修'}</td>
            `;
            credit4Body.appendChild(row);
        });
    }
    
    // 显示3学分课程
    const credit3Body = document.getElementById('uncompleted-3-credit-body');
    if (credit3Body) {
        credit3Body.innerHTML = '';
        groupedCourses[3].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'failed' ? '未通过' : '未修'}</td>
            `;
            credit3Body.appendChild(row);
        });
    }
    
    // 显示2学分课程
    const credit2Body = document.getElementById('uncompleted-2-credit-body');
    if (credit2Body) {
        credit2Body.innerHTML = '';
        groupedCourses[2].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'failed' ? '未通过' : '未修'}</td>
            `;
            credit2Body.appendChild(row);
        });
    }
    
    // 显示1学分课程
    const credit1Body = document.getElementById('uncompleted-1-credit-body');
    if (credit1Body) {
        credit1Body.innerHTML = '';
        groupedCourses[1].forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td class="course-status ${course.pass}">${course.pass === 'failed' ? '未通过' : '未修'}</td>
            `;
            credit1Body.appendChild(row);
        });
    }
}

// 显示推荐重修课程
function displayRetakeCourses(data, targetGPA) {
    const retakeCourses = recommendRetakeCourses(data, targetGPA);
    const groupedCourses = groupCoursesByCredit(retakeCourses);
    
    // 计算重修后的理想GPA
    const idealGPA = calculateIdealGPA(data, retakeCourses);
    document.getElementById('ideal-gpa').textContent = idealGPA.toFixed(2);
    
    // 计算重修后未修课程需要的GPA
    const requiredAfterRetakeGPA = calculateRequiredGPAAfterRetake(data, targetGPA, retakeCourses);
    document.getElementById('required-after-retake-gpa').textContent = requiredAfterRetakeGPA.toFixed(2);
    
    // 显示4学分课程
    const credit4Body = document.getElementById('retake-4-credit-body');
    if (credit4Body) {
        credit4Body.innerHTML = '';
        groupedCourses[4].forEach(course => {
            const row = document.createElement('tr');
            const targetGPA = 4.0; // 目标绩点为4.0
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td>${targetGPA.toFixed(1)}</td>
            `;
            credit4Body.appendChild(row);
        });
    }
    
    // 显示3学分课程
    const credit3Body = document.getElementById('retake-3-credit-body');
    if (credit3Body) {
        credit3Body.innerHTML = '';
        groupedCourses[3].forEach(course => {
            const row = document.createElement('tr');
            const targetGPA = 4.0; // 目标绩点为4.0
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td>${targetGPA.toFixed(1)}</td>
            `;
            credit3Body.appendChild(row);
        });
    }
    
    // 显示2学分课程
    const credit2Body = document.getElementById('retake-2-credit-body');
    if (credit2Body) {
        credit2Body.innerHTML = '';
        groupedCourses[2].forEach(course => {
            const row = document.createElement('tr');
            const targetGPA = 4.0; // 目标绩点为4.0
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td>${targetGPA.toFixed(1)}</td>
            `;
            credit2Body.appendChild(row);
        });
    }
    
    // 显示1学分课程
    const credit1Body = document.getElementById('retake-1-credit-body');
    if (credit1Body) {
        credit1Body.innerHTML = '';
        groupedCourses[1].forEach(course => {
            const row = document.createElement('tr');
            const targetGPA = 4.0; // 目标绩点为4.0
            row.innerHTML = `
                <td>${course.course_name}</td>
                <td>${course.course_code}</td>
                <td>${course.course_semester}</td>
                <td>${course.course_weight}</td>
                <td>${course.course_score}</td>
                <td>${course.course_gpa}</td>
                <td>${targetGPA.toFixed(1)}</td>
            `;
            credit1Body.appendChild(row);
        });
    }
}

// 显示课程数据的函数
function displayCourseData(data) {
    const tableBody = document.getElementById('courses-table-body');
    if (!tableBody) return;
    
    // 清空现有数据
    tableBody.innerHTML = '';
    
    // 添加新数据
    data.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.course_name}</td>
            <td>${course.course_code}</td>
            <td>${course.course_semester}</td>
            <td>${course.course_weight}</td>
            <td>${course.course_score}</td>
            <td>${course.course_gpa}</td>
            <td class="course-status ${course.pass}">${course.pass === 'passed' ? '通过' : '未通过'}</td>
        `;
        tableBody.appendChild(row);
    });
}