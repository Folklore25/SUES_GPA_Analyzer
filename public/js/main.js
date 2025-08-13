// 导入所有需要的函数
// 注意：在实际项目中，可能需要根据浏览器支持情况使用适当的模块系统或打包工具

// 当DOM加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('GPA分析工具已启动');
    
    // 初始化主题
    initializeTheme();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 其他初始化逻辑...
});

// 初始化主题功能
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleIcon = document.querySelector('.theme-toggle-icon');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (themeToggleIcon) {
            themeToggleIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        }
    } else {
        // 检查系统主题偏好
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const defaultTheme = prefersDarkScheme.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', defaultTheme);
        if (themeToggleIcon) {
            themeToggleIcon.textContent = defaultTheme === 'dark' ? '🌙' : '☀️';
        }
    }
    
    // 绑定主题切换事件
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// 切换主题功能
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // 切换主题
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新图标
    const themeToggleIcon = document.querySelector('.theme-toggle-icon');
    if (themeToggleIcon) {
        themeToggleIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    }
}

// 绑定事件监听器
function bindEventListeners() {
    // 密码显示/隐藏功能
    const passwordToggle = document.getElementById('password-toggle');
    const passwordInput = document.getElementById('password');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            passwordToggle.textContent = type === 'password' ? '👁️' : '🔒';
        });
        // 左侧栏导航功能
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 移除所有侧边栏项的active类
                sidebarItems.forEach(btn => btn.classList.remove('active'));
                
                // 为当前项添加active类
                item.classList.add('active');
                
                // 隐藏所有内容面板
                const contentPanels = document.querySelectorAll('.content-panel');
                contentPanels.forEach(panel => panel.classList.remove('active'));
                
                // 显示对应的内容面板
                const targetPanel = item.getAttribute('data-target');
                const panel = document.getElementById(targetPanel);
                if (panel) {
                    panel.classList.add('active');
                }
            });
        });
    }
    
    // 选项卡切换功能
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
    
}