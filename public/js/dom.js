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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
                <td>${convertSemesterToChinese(course.course_year, course.course_semester)}</td>
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
    // 使用新的IPS算法推荐重修课程
    const retakeCourses = recommendRetakeCourses(data, targetGPA);
    
    // 按学分分组课程
    const groupedCourses = groupCoursesByCredit(retakeCourses);
    
    // 隐藏原来的容器
    const container = document.getElementById('retake-courses-container');
    if (container) {
        container.style.display = 'none';
    }
    
    // 显示按学分分组的课程
    const creditGroups = document.querySelectorAll('.credit-group[data-credit]');
    creditGroups.forEach(group => {
        const credit = parseInt(group.getAttribute('data-credit'));
        const tbody = group.querySelector('tbody');
        const courses = groupedCourses[credit] || [];
        
        if (tbody) {
            tbody.innerHTML = '';
            
            if (courses.length === 0) {
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6; // 现在有6列
                cell.textContent = '暂无推荐课程';
                cell.style.textAlign = 'center';
            } else {
                courses.forEach(course => {
                    const row = tbody.insertRow();
                    // 使用新的显示格式：删除任课教师列，修改学年学期显示格式
                    const cells = [
                        course.course_name,
                        course.course_weight,
                        course.course_gpa,
                        course.ips ? course.ips.toFixed(4) : 'N/A',
                        convertSemesterToChinese(course.course_year, course.course_semester)
                    ];
                    
                    cells.forEach(text => {
                        const cell = row.insertCell();
                        cell.textContent = text;
                    });
                });
            }
        }
    });
    
    // 更新理想GPA和重修后需要的GPA显示
    const idealGPA = calculateIdealGPA(data, retakeCourses);
    const idealGPAElement = document.getElementById('ideal-gpa');
    if (idealGPAElement) {
        idealGPAElement.textContent = idealGPA.toFixed(2);
    }
    
    const requiredAfterRetakeGPA = calculateRequiredGPAAfterRetake(data, targetGPA, retakeCourses);
    const requiredAfterRetakeGPAElement = document.getElementById('required-after-retake-gpa');
    if (requiredAfterRetakeGPAElement) {
        requiredAfterRetakeGPAElement.textContent = requiredAfterRetakeGPA.toFixed(2);
    }
}

// 显示课程数据的函数
function displayCourseData(data) {
    const tableBody = document.getElementById('courses-table-body');
    if (!tableBody) return;
    
    // 清空现有数据
    tableBody.innerHTML = '';
    
    // 添加新数据
    if (data && data.length > 0) {
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
}