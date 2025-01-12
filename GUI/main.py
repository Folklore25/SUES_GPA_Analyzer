from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                           QHBoxLayout, QPushButton, QLabel, QFrame, QMessageBox)
from PyQt6.QtCore import Qt,QTimer,QUrl
from PyQt6.QtGui import QFont, QIcon,QDesktopServices
import sys
import time 
from src.gui import GPACalculator
import configparser

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        # 初始化config
        self.config = configparser.ConfigParser()
        self.config.read('config.ini')
        
        self.setWindowTitle("上海工程技术大学留子GPA规划系统")
        self.setMinimumSize(800, 600)
        self.setWindowIcon(QIcon("material/icon.png"))
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f5f5f5;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 4px;
                min-width: 200px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QLabel {
                color: #666;
            }
        """)
        
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
         
        # 添加标题
        title = QLabel("上海工程技术大学留子GPA规划系统")
        title.setFont(QFont("Arial", 24, QFont.Weight.Bold))
        title.setStyleSheet("color: #333; margin-bottom: 20px;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        # 添加分割线
        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setFrameShadow(QFrame.Shadow.Sunken)
        line.setStyleSheet("color: #ddd;")
        layout.addWidget(line)
        
        # 按钮布局
        btn_layout = QVBoxLayout()
        btn_layout.setSpacing(20)
        btn_layout.setContentsMargins(50, 20, 50, 20)
        
        # 获取培养方案数据按钮
        self.crawl_btn = QPushButton("Step1.获取培养方案数据")
        self.crawl_btn.clicked.connect(self.run_crawler)
        btn_layout.addWidget(self.crawl_btn)
        
        # 分析GPA情况按钮
        self.gpa_btn = QPushButton("Step2.分析GPA情况")
        self.gpa_btn.clicked.connect(self.run_gpa_calculator)
        btn_layout.addWidget(self.gpa_btn)
        
        layout.addLayout(btn_layout)
        
        # 添加作者信息
        footer = QFrame()
        footer.setFrameShape(QFrame.Shape.HLine)
        footer.setFrameShadow(QFrame.Shadow.Sunken)
        footer.setStyleSheet("color: #ddd; margin-top: 30px;")
        layout.addWidget(footer)
        
        author_label = QLabel("作者：Github@Folklore25")
        author_label.setFont(QFont("Arial", 25))
        author_label.setStyleSheet("color: #888; margin-top: 10px;")
        author_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(author_label)
        
    def run_crawler(self):
        """运行爬虫获取培养方案数据"""
        QMessageBox.information(self, "提示", "请运行独立的爬虫程序crawler.py")
        
    def run_gpa_calculator(self):
        """运行GPA分析工具"""
        self.gpa_calculator = GPACalculator()
        self.gpa_calculator.show()

def get_login_info():
    """获取学生登录信息"""
    import configparser
    from PyQt6.QtWidgets import QDialog, QVBoxLayout, QLabel, QLineEdit, QPushButton
    from PyQt6.QtCore import Qt
    from PyQt6.QtGui import QFont, QIcon
    
    # 读取保存的登录信息
    config = configparser.ConfigParser()
    config.read('config.ini')
    saved_username = config.get('LOGIN', 'username', fallback='')
    saved_password = config.get('LOGIN', 'password', fallback='')
    saved_url = config.get('LOGIN', 'url', fallback='')
    
    login_dialog = QDialog()
    login_dialog.setWindowTitle('学生登录')
    login_dialog.setFixedSize(800, 600)
    login_dialog.setStyleSheet("""
        QDialog {
            background-color: #f5f5f5;
        }
        QLabel {
            color: #333;
            font-size: 14px;
            margin-bottom: 5px;
        }
        QLineEdit {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            margin-bottom: 15px;
        }
        QPushButton {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 4px;
            margin-top: 20px;
        }
        QPushButton:hover {
            background-color: #45a049;
        }
    """)
    
    layout = QVBoxLayout()
    layout.setContentsMargins(30, 30, 30, 30)
    layout.setSpacing(15)
    
    # 标题
    title = QLabel('学生信息登录')
    title.setFont(QFont('Arial', 18, QFont.Weight.Bold))
    title.setStyleSheet("color: #333; margin-bottom: 20px;")
    title.setAlignment(Qt.AlignmentFlag.AlignCenter)
    layout.addWidget(title)
    
    # 学号输入
    layout.addWidget(QLabel('学号：'))
    username_entry = QLineEdit()
    username_entry.setPlaceholderText('请输入学号')
    if saved_username:
        username_entry.setText(saved_username)
    layout.addWidget(username_entry)
    
    # 密码输入
    layout.addWidget(QLabel('密码：'))
    password_entry = QLineEdit()
    password_entry.setPlaceholderText('请输入密码')
    if saved_password:
        password_entry.setText(saved_password)
    password_entry.setEchoMode(QLineEdit.EchoMode.Password)
    layout.addWidget(password_entry)

    # 培养方案URL输入
    layout.addWidget(QLabel('培养方案URL：'))
    url_entry = QLineEdit()
    url_entry.setPlaceholderText('请输入培养方案URL')
    if saved_url:
        url_entry.setText(saved_url)
    layout.addWidget(url_entry)
    get_url_btn = QPushButton('获取培养方案URL(没问题别点)')
    # 点击后自动打开默认浏览器，访问https://webvpn.sues.edu.cn/
    get_url_btn.setCursor(Qt.CursorShape.PointingHandCursor)
    layout.addWidget(get_url_btn)
    def open_url():
        QDesktopServices.openUrl(QUrl('https://webvpn.sues.edu.cn/'))
        QMessageBox.information(None, "提示", "打开培养方案完成情况后，把地址栏url粘贴到输入框中")
    get_url_btn.clicked.connect(open_url)

    
    # 登录按钮
    login_btn = QPushButton('登录系统')
    login_btn.setCursor(Qt.CursorShape.PointingHandCursor)
    
    # 存储登录信息
    login_info = {}
    
    def on_login():
        login_info['username'] = username_entry.text()
        login_info['password'] = password_entry.text()
        login_info['url'] = url_entry.text()
        
        # 保存登录信息到ini文件
        config['LOGIN'] = {
            'username': login_info['username'],
            'password': login_info['password'],
            'url': login_info['url']
        }
        with open('config.ini', 'w') as configfile:
            config.write(configfile)
            
        login_dialog.accept()
    
    login_btn.clicked.connect(on_login)
    layout.addWidget(login_btn)
    
    login_dialog.setLayout(layout)
    if login_dialog.exec() == QDialog.DialogCode.Accepted:
        return login_info
    return None

def main():
    app = QApplication(sys.argv)
    
    # 获取登录信息
    login_info = get_login_info()
    if not login_info:
        return
    
    # 初始化主窗口
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()

# written by Github@Folklore25
# 如果能重来一次，我或许会花更多的时间在期末考试上，但我珍惜一切曾经美好的时光。
# 如果你有任何问题，欢迎联系我，我会尽力帮助你。
# QQ：3536204666