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

// 主题切换功能
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.querySelector('.theme-toggle-icon');

// 检查本地存储中的主题设置
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
} else {
    // 检查系统主题偏好
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleIcon.textContent = '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleIcon.textContent = '☀️';
    }
}

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

// 主题切换按钮点击事件
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // 切换主题
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
});

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
        });
    }
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
    const targetGPAInput = document.getElementById('target-gpa');
    if (targetGPAInput) {
        targetGPAInput.addEventListener('input', async () => {
            // 重新加载并显示课程数据
            await loadAndDisplayCourseData();
        });
    }
});