// 页面加载时自动填充用户信息
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const userInfo = await window.electronAPI.loadUserInfo();
        if (userInfo && userInfo.username) {
            document.getElementById('username').value = userInfo.username;
            document.getElementById('password').value = userInfo.password || '';
            document.getElementById('url').value = userInfo.url || '';
            document.getElementById('remember-me').checked = true;
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
});

// 登录按钮事件处理
document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const url = document.getElementById('url').value;
    const rememberMe = document.getElementById('remember-me').checked;

    if (!username || !password || !url) {
        alert('请输入完整的登录信息');
        return;
    }

    try {
        // 保存用户信息（如果勾选了保留用户信息）
        if (rememberMe) {
            await window.electronAPI.saveUserInfo({
                username,
                password,
                url
            });
        } else {
            // 如果没有勾选保留用户信息，则清除已保存的用户信息
            await window.electronAPI.saveUserInfo({});
        }

        // 隐藏登录界面，显示GPA分析界面
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('gpa-section').classList.remove('hidden');

        // 更新页面标题
        document.querySelector('h1').textContent = 'GPA分析工具';

    } catch (error) {
        alert('登录失败: ' + error.message);
        console.error('登录错误:', error);
    }
});

// 监听爬虫进度更新
window.electronAPI.onCrawlerProgress((data) => {
    document.getElementById('progress-text').textContent = data.message || '';
});



// 密码显示/隐藏功能
const passwordToggle = document.getElementById('password-toggle');
const passwordInput = document.getElementById('password');

if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.textContent = type === 'password' ? '👁️' : '🔒';
    });
}



// GPA分析界面功能
document.addEventListener('DOMContentLoaded', () => {
    // 获取数据按钮事件
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const refreshDataBtn = document.getElementById('refresh-data-btn');
    const gpaProgress = document.getElementById('gpa-progress');
    const gpaProgressText = document.getElementById('gpa-progress-text');

    if (fetchDataBtn) {
        fetchDataBtn.addEventListener('click', async () => {
            // 显示进度条
            gpaProgress.classList.remove('hidden');
            fetchDataBtn.disabled = true;
            if (refreshDataBtn) refreshDataBtn.disabled = true;

            try {
                // 获取存储的用户信息
                const userInfo = await window.electronAPI.loadUserInfo();
                if (!userInfo || !userInfo.username || !userInfo.password || !userInfo.url) {
                    throw new Error('用户信息不完整，请重新登录');
                }

                // 监听爬虫进度更新（使用GPA界面的进度显示）
                const progressListener = (data) => {
                    gpaProgressText.textContent = data.message || '';
                };
                window.electronAPI.onCrawlerProgress(progressListener);

                // 启动爬虫
                const result = await window.electronAPI.startCrawler({
                    username: userInfo.username,
                    password: userInfo.password,
                    url: userInfo.url
                });

                // 移除进度监听器
                window.electronAPI.removeCrawlerProgressListener(progressListener);

                // 隐藏进度条
                gpaProgress.classList.add('hidden');
                fetchDataBtn.disabled = false;
                if (refreshDataBtn) refreshDataBtn.disabled = false;

                // 显示结果
                alert('数据获取完成！');
                console.log('爬虫结果:', result);

                // 加载并显示CSV数据
                await loadAndDisplayCourseData();
                
                // 获取目标GPA值并更新推荐重修课程显示
                const targetGPAInput = document.getElementById('target-gpa');
                if (targetGPAInput && window.courseData) {
                    const targetGPA = parseFloat(targetGPAInput.value) || 0;
                    console.log('正在调用updateRetakeCoursesDisplay函数，目标GPA:', targetGPA);
                    updateRetakeCoursesDisplay(window.courseData, targetGPA);
                    console.log('updateRetakeCoursesDisplay函数执行完成');
                }

            } catch (error) {
                // 移除进度监听器
                // 隐藏进度条
                gpaProgress.classList.add('hidden');
                fetchDataBtn.disabled = false;
                if (refreshDataBtn) refreshDataBtn.disabled = false;

                alert('获取数据失败: ' + error.message);
                console.error('爬虫错误:', error);
            }
        });
    }

    // 刷新数据按钮事件
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', async () => {
            await loadAndDisplayCourseData();
            
            // 获取目标GPA值并更新推荐重修课程显示
            const targetGPAInput = document.getElementById('target-gpa');
            if (targetGPAInput && window.courseData) {
                const targetGPA = parseFloat(targetGPAInput.value) || 0;
                console.log('正在调用updateRetakeCoursesDisplay函数，目标GPA:', targetGPA);
                updateRetakeCoursesDisplay(window.courseData, targetGPA);
                console.log('updateRetakeCoursesDisplay函数执行完成');
            }
        });
    }

    // 页面加载完成后自动尝试加载数据
    setTimeout(async () => {
        try {
            await loadAndDisplayCourseData();
            
            // 获取目标GPA值并更新推荐重修课程显示
            const targetGPAInput = document.getElementById('target-gpa');
            if (targetGPAInput && window.courseData) {
                const targetGPA = parseFloat(targetGPAInput.value) || 0;
                console.log('正在调用updateRetakeCoursesDisplay函数，目标GPA:', targetGPA);
                updateRetakeCoursesDisplay(window.courseData, targetGPA);
                console.log('updateRetakeCoursesDisplay函数执行完成');
            }
        } catch (error) {
            console.log('自动加载用户信息失败:', error.message);
        }
    }, 1000);
});

// 选项卡切换功能
document.addEventListener('DOMContentLoaded', () => {
    // 选项卡按钮点击事件
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // 为当前按钮添加active类
            button.classList.add('active');

            // 隐藏所有选项卡内容
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));

            // 显示对应的选项卡内容
            const tabId = button.getAttribute('data-tab');
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
});

// 目标GPA输入框事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 先尝试查找重修规划面板中的目标GPA输入框（用于向后兼容）
    let targetGPAInput = document.querySelector('#retake-planning-panel #target-gpa');
    let targetGPAInputLocation = '#retake-planning-panel #target-gpa';
    
    // 如果没找到，再尝试查找主界面的目标GPA输入框
    if (!targetGPAInput) {
        targetGPAInput = document.querySelector('#target-gpa');
        targetGPAInputLocation = '#target-gpa';
    }
    
    console.log('正在查找目标GPA输入框，查找路径:', targetGPAInputLocation);
    
    if (targetGPAInput) {
        console.log('目标GPA输入框已找到，正在绑定事件监听器');
        targetGPAInput.addEventListener('input', async () => {
            console.log('目标GPA输入框内容已更改，正在调用loadAndDisplayCourseData函数');
            try {
                // 重新加载并显示课程数据
                await loadAndDisplayCourseData();
                console.log('loadAndDisplayCourseData函数执行完成');
                
                // 获取目标GPA值并更新推荐重修课程显示
                const targetGPA = parseFloat(targetGPAInput.value) || 0;
                if (window.courseData) {
                    console.log('正在调用updateRetakeCoursesDisplay函数，目标GPA:', targetGPA);
                    updateRetakeCoursesDisplay(window.courseData, targetGPA);
                    console.log('updateRetakeCoursesDisplay函数执行完成');
                }
            } catch (error) {
                console.error('loadAndDisplayCourseData函数执行出错:', error);
            }
        });
    } else {
        console.error('未找到目标GPA输入框');
        // 添加额外的诊断信息
        console.log('页面上存在的相关元素:');
        console.log('ID为target-gpa的元素数量:', document.querySelectorAll('#target-gpa').length);
        console.log('ID为retake-planning-panel的元素数量:', document.querySelectorAll('#retake-planning-panel').length);
        console.log('重修规划面板中的target-gpa元素数量:', document.querySelectorAll('#retake-planning-panel #target-gpa').length);
    }
});

// 重修规划生成按钮事件
const generateRetakeBtn = document.querySelector('#retake-planning-panel #generate-retake-plan');
if (generateRetakeBtn) {
    generateRetakeBtn.addEventListener('click', async () => {
        try {
            const strategy = document.getElementById('retake-strategy').value;
            const targetGPA = parseFloat(document.getElementById('target-gpa').value);

            if (!targetGPA || targetGPA < 0 || targetGPA > 4) {
                alert('请输入有效的目标GPA(0-4)');
                return;
            }

            // 显示加载状态
            generateRetakeBtn.disabled = true;
            generateRetakeBtn.textContent = '生成中...';


            // 调用重修规划引擎
            console.log('调用 window.retakeEngine.generatePlan，参数:', strategy, targetGPA);
            const retakePlan = await window.retakeEngine.generatePlan(strategy, targetGPA);
            console.log('window.retakeEngine.generatePlan 返回值:', retakePlan);

            // 检查返回值是否包含需要的属性
            // 将返回的结果存储到 window.retakePlanData 中
            window.retakePlanData = retakePlan;
            if (!retakePlan) {
                throw new Error('重修规划引擎返回空结果');
            }

            // 渲染结果
            document.getElementById('retake-plan-results').classList.remove('hidden');
            document.getElementById('retake-plan-report').innerHTML = retakePlan.reportHTML;

            // 渲染图表（传递数据参数）
            if (window.retakeVisualizer) {
                window.retakeVisualizer.createGPAPathChart(
                    document.getElementById('gpa-path-chart'),
                    retakePlan.gpaPathData
                );
                window.retakeVisualizer.createSuccessRateChart(
                    document.getElementById('retake-success-chart'),
                    retakePlan.successRateData
                );
            }


            // 添加实时GPA计算（设计文档要求）
            setupRealTimeGPACalculation();


        } catch (error) {
            console.error('生成重修方案失败:', error);
            alert('生成重修方案失败: ' + error.message);
        } finally {
            generateRetakeBtn.disabled = false;
            generateRetakeBtn.textContent = '生成重修方案';
        }
    });
}

// 实时GPA计算引擎（设计文档第152行）
function setupRealTimeGPACalculation() {
    const targetSelects = document.querySelectorAll('.target-grade-select');

    // 获取总学分（从全局变量或DOM中）
    console.log('检查 window.retakePlanData:', window.retakePlanData);
    const totalCredits = window.retakePlanData.totalCredits || 0;

    targetSelects.forEach(select => {
        select.addEventListener('change', () => {
            // 计算单科重修影响（设计文档第156行）
            const courseId = select.dataset.courseId;
            const newGrade = parseFloat(select.value);

            // 获取原始绩点
            const row = select.closest('tr');
            const originalGrade = parseFloat(row.cells[2].textContent);
            const credits = parseFloat(row.cells[1].textContent);

            // 计算GPA贡献值（设计文档第156行）
            const gpaContribution = (newGrade - originalGrade) * credits / totalCredits;

            // 更新课程GPA贡献显示
            if (!row.cells[6]) {
                const gpaCell = document.createElement('td');
                row.appendChild(gpaCell);
            }
            row.cells[6].textContent = gpaContribution.toFixed(3);

            // 更新整体GPA显示
            updateGPADisplay();
        });
    });
}


// 更新GPA显示（设计文档第174行）
function updateGPADisplay() {
    // 获取所有课程数据
    const courses = [];
    document.querySelectorAll('#retake-plan-report tr').forEach((row, index) => {
        if (index === 0) return; // 跳过表头

        const course = {
            id: row.cells[0].textContent,
            credits: parseFloat(row.cells[1].textContent),
            originalGrade: parseFloat(row.cells[2].textContent),
            targetGrade: parseFloat(row.querySelector('.target-grade-select').value),
            successRate: parseFloat(row.cells[5].textContent),
            gpaContribution: parseFloat(row.cells[6].textContent)
        };
        courses.push(course);
    });

    // 计算总GPA提升
    const totalGPAImprovement = courses.reduce((sum, course) =>
        sum + course.gpaContribution, 0);

    // 获取原始GPA
    const originalGPA = parseFloat(document.getElementById('current-gpa').textContent);
    const newGPA = originalGPA + totalGPAImprovement;

    // 更新GPA显示
    document.getElementById('expected-gpa').textContent = newGPA.toFixed(3);

    // 计算整体成功率（平均成功率）
    const avgSuccessRate = courses.reduce((sum, course) =>
        sum + course.successRate, 0) / courses.length;

    // 更新成功率显示
    document.getElementById('overall-success-rate').textContent =
        (avgSuccessRate * 100).toFixed(0) + '%';

    // 更新风险等级
    let riskLevel = '低风险';
    let riskColor = 'green';
    if (avgSuccessRate < 0.6) {
        riskLevel = '高风险';
        riskColor = 'red';
    } else if (avgSuccessRate < 0.8) {
        riskLevel = '中风险';
        riskColor = 'orange';
    }

    const riskElement = document.getElementById('risk-level');
    riskElement.textContent = riskLevel;
    riskElement.style.color = riskColor;

    // 重新计算场景
    calculateScenarios();

    // 生成智能建议
    generateSmartAdvice();
}

// 智能建议系统（设计文档第236行）
function generateSmartAdvice() {
    const courses = window.retakePlanData.courses;
    const adviceContainer = document.getElementById('retake-advice');
    if (!adviceContainer) return;

    adviceContainer.innerHTML = '';

    // 1. 目标合理性评估
    courses.forEach(course => {
        const gap = course.targetGrade - course.originalGrade;
        if (gap > 1.5) {
            const advice = document.createElement('p');
            advice.className = 'advice warning';
            advice.textContent = `⚠ 您为${course.name}设定的目标${course.targetGrade}与原成绩${course.originalGrade}差距较大，建议调整为${course.targetGrade - 0.7}或${course.targetGrade - 0.3}`;
            adviceContainer.appendChild(advice);
        }
    });

    // 2. 优化方案推荐
    if (courses.length > 4) {
        const advice = document.createElement('p');
        advice.className = 'advice warning';
        advice.textContent = `⚠ 当前选择${courses.length}门课程，建议不超过4门`;
        adviceContainer.appendChild(advice);
    }

    // 3. 时间规划建议
    const totalHours = courses.reduce((sum, course) => {
        const gap = course.targetGrade - course.originalGrade;
        return sum + (gap * 25); // 每提升0.3绩点约25小时
    }, 0);

    const advice = document.createElement('p');
    advice.className = 'advice info';
    advice.textContent = `ℹ 预计需要${Math.round(totalHours)}小时，建议每周投入15小时，约${Math.round(totalHours / 15 / 4)}个月完成`;
    adviceContainer.appendChild(advice);

    // 4. 风险预警提示
    const avgSuccessRate = courses.reduce((sum, course) =>
        sum + course.successRate, 0) / courses.length;

    if (avgSuccessRate < 0.6) {
        const advice = document.createElement('p');
        advice.className = 'advice danger';
        advice.textContent = '❌ 目标过于激进，强烈建议重新规划';
        adviceContainer.appendChild(advice);
    } else if (avgSuccessRate < 0.8) {
        const advice = document.createElement('p');
        advice.className = 'advice warning';
        advice.textContent = '⚠ 建议适当调低1-2门课程目标';
        adviceContainer.appendChild(advice);
    } else {
        const advice = document.createElement('p');
        advice.className = 'advice success';
        advice.textContent = '✅ 方案合理，预期成功率高';
        adviceContainer.appendChild(advice);
    }
}

// 绑定排序控件事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 已修课程排序控件
    const completedSortSelect = document.getElementById('completed-sort-by');
    if (completedSortSelect) {
        completedSortSelect.addEventListener('change', async () => {
            try {
                // 重新加载并显示课程数据
                await loadAndDisplayCourseData();
                
                // 获取目标GPA值并更新推荐重修课程显示
                const targetGPAInput = document.getElementById('target-gpa');
                if (targetGPAInput && window.courseData) {
                    const targetGPA = parseFloat(targetGPAInput.value) || 0;
                    console.log('正在调用updateRetakeCoursesDisplay函数，目标GPA:', targetGPA);
                    updateRetakeCoursesDisplay(window.courseData, targetGPA);
                    console.log('updateRetakeCoursesDisplay函数执行完成');
                }
            } catch (error) {
                console.error('排序已修课程时出错:', error);
            }
        });
    }

    // 未修课程排序控件
    const uncompletedSortSelect = document.getElementById('uncompleted-sort-by');
    if (uncompletedSortSelect) {
        uncompletedSortSelect.addEventListener('change', async () => {
            try {
                // 重新加载并显示课程数据
                await loadAndDisplayCourseData();
                
                // 获取目标GPA值并更新推荐重修课程显示
                const targetGPAInput = document.getElementById('target-gpa');
                if (targetGPAInput && window.courseData) {
                    const targetGPA = parseFloat(targetGPAInput.value) || 0;
                    console.log('正在调用updateRetakeCoursesDisplay函数，目标GPA:', targetGPA);
                    updateRetakeCoursesDisplay(window.courseData, targetGPA);
                    console.log('updateRetakeCoursesDisplay函数执行完成');
                }
            } catch (error) {
                console.error('排序未修课程时出错:', error);
            }
        });
    }

    // 推荐重修课程排序控件
    const retakeSortSelect = document.getElementById('retake-sort-by');
    if (retakeSortSelect) {
        retakeSortSelect.addEventListener('change', async () => {
            try {
                // 重新加载并显示课程数据
                await loadAndDisplayCourseData();
                
                // 获取目标GPA值并更新推荐重修课程显示
                const targetGPAInput = document.getElementById('target-gpa');
                if (targetGPAInput && window.courseData) {
                    const targetGPA = parseFloat(targetGPAInput.value) || 0;
                    console.log('正在调用updateRetakeCoursesDisplay函数，目标GPA:', targetGPA);
                    updateRetakeCoursesDisplay(window.courseData, targetGPA);
                    console.log('updateRetakeCoursesDisplay函数执行完成');
                }
            } catch (error) {
                console.error('排序推荐重修课程时出错:', error);
            }
        });
    }
});
