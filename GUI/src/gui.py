import sys
import pandas as pd
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                           QHBoxLayout, QLabel, QLineEdit, QPushButton,
                           QTableWidget, QTableWidgetItem, QTabWidget,
                           QScrollArea, QGroupBox, QButtonGroup, QRadioButton,
                           QDialog, QMessageBox)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor, QFont, QIcon

class LoginWindow(QDialog):
    def __init__(self, on_login):
        super().__init__()
        self.on_login = on_login
        self.init_ui()
        
    def init_ui(self):
        self.setWindowTitle('学生登录')
        self.setFixedSize(800, 600)
        self.setStyleSheet("""
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
        self.username_entry = QLineEdit()
        self.username_entry.setPlaceholderText('请输入学号')
        layout.addWidget(self.username_entry)
        
        # 密码输入
        layout.addWidget(QLabel('密码：'))
        self.password_entry = QLineEdit()
        self.password_entry.setPlaceholderText('请输入密码')
        self.password_entry.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.password_entry)
        
        # 登录按钮
        login_btn = QPushButton('登录系统')
        login_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        login_btn.clicked.connect(self.handle_login)
        layout.addWidget(login_btn)
        
        self.setLayout(layout)
        
    def handle_login(self):
        username = self.username_entry.text()
        password = self.password_entry.text()
        
        if not username or not password:
            QMessageBox.warning(self, '错误', '请输入学号和密码')
            return
            
        self.on_login(username, password)
        self.close()

class GPACalculator(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("GPA 计算器")
        self.setMinimumSize(1000, 600)
        # 数据相关
        self.courses_data = None
        self.target_gpa = 0.0
        
        # 初始化UI
        self.init_ui()
        
        # 加载数据
        self.load_data()

    def init_ui(self):
        """初始化UI布局"""
        # 创建中央部件
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        
        # 顶部控制区
        control_layout = QHBoxLayout()
        
        # GPA目标输入
        target_label = QLabel("目标GPA：")
        self.target_input = QLineEdit()
        self.target_input.setMaximumWidth(100)
        self.target_input.textChanged.connect(self.update_gpa_coloring)
        
        # 当前GPA显示
        current_gpa_label = QLabel("当前GPA：")
        self.current_gpa_display = QLabel("0.00")
        
        # 所需GPA显示
        required_gpa_label = QLabel("未修课程需要平均GPA：")
        self.required_gpa_display = QLabel("0.00")
        
        # 添加到控制布局
        control_layout.addWidget(target_label)
        control_layout.addWidget(self.target_input)
        control_layout.addWidget(current_gpa_label)
        control_layout.addWidget(self.current_gpa_display)
        control_layout.addWidget(required_gpa_label)
        control_layout.addWidget(self.required_gpa_display)
        control_layout.addStretch()
        
        # 添加到主布局
        main_layout.addLayout(control_layout)
        
        # 创建选项卡
        tab_widget = QTabWidget()
        
        # 已修课程选项卡
        completed_widget = self.create_courses_widget("已修")
        tab_widget.addTab(completed_widget, "已修课程")
        
        # 未修课程选项卡
        uncompleted_widget = self.create_courses_widget("未修")
        tab_widget.addTab(uncompleted_widget, "未修课程")
        
        # 推荐重修课程选项卡
        retake_widget = self.create_retake_widget()
        tab_widget.addTab(retake_widget, "推荐重修课程")
        
        main_layout.addWidget(tab_widget)

    def create_courses_widget(self, course_type):
        """创建课程显示区域"""
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # 按学分分组
        credits = [4, 3, 2, 1]
        
        for credit in credits:
            group = QGroupBox(f"{credit}学分课程")
            group_layout = QVBoxLayout()
            
            # 创建表格
            table = QTableWidget()
            table.setColumnCount(7)
            table.setHorizontalHeaderLabels([
                "课程名称", "课程代码", "开课学期",
                "课程属性", "学分", "成绩", "绩点"
            ])
            
            # 设置表格格式
            header = table.horizontalHeader()
            header.setStretchLastSection(True)
            for i in range(7):
                header.setSectionResizeMode(i, header.ResizeMode.ResizeToContents)
            
            group_layout.addWidget(table)
            group.setLayout(group_layout)
            layout.addWidget(group)
            
            # 保存表格引用
            table_key = f"{course_type}_{credit}"
            if not hasattr(self, 'course_tables'):
                self.course_tables = {}
            self.course_tables[table_key] = table
        
        scroll.setWidget(widget)
        return scroll

    def load_data(self):
        """加载课程数据"""
        try:
            # 读取CSV文件并清理数据
            self.courses_data = pd.read_csv('courses.csv')
            
            # 将 "--" 替换为 0.0
            self.courses_data['course_gpa'] = self.courses_data['course_gpa'].replace('--', 0.0)
            # 将 course_gpa 列转换为浮点数
            self.courses_data['course_gpa'] = self.courses_data['course_gpa'].astype(float)
            
            # 更新显示
            self.update_tables()
            self.calculate_current_gpa()
            self.update_retake_tables()
            
        except Exception as e:
            print(f"加载数据失败: {e}")

    def update_tables(self):
        """更新表格显示"""
        if self.courses_data is None:
            return
            
        # 清空所有表格
        for table in self.course_tables.values():
            table.setRowCount(0)
        
        # 打印调试信息
        print("Available tables:", self.course_tables.keys())
        
        # 分类处理数据
        for _, course in self.courses_data.iterrows():
            # 确定课程状态（已修/未修）
            course_type = "已修" if str(course['pass']).strip().lower() == 'passed' else "未修"
            credit = int(course['course_weight'])
            
            # 获取对应表格
            table_key = f"{course_type}_{credit}"
            print(f"Processing: {table_key} - {course['course_name']}")
            
            if table_key not in self.course_tables:
                print(f"Table {table_key} not found!")
                continue
                
            table = self.course_tables[table_key]
            row = table.rowCount()
            table.insertRow(row)
            
            # 填充数据
            table.setItem(row, 0, QTableWidgetItem(str(course['course_name'])))
            table.setItem(row, 1, QTableWidgetItem(str(course['course_code'])))
            table.setItem(row, 2, QTableWidgetItem(str(course['course_semester'])))
            table.setItem(row, 3, QTableWidgetItem(str(course['course_attribute'])))
            table.setItem(row, 4, QTableWidgetItem(str(course['course_weight'])))
            table.setItem(row, 5, QTableWidgetItem(str(course['course_score'])))
            table.setItem(row, 6, QTableWidgetItem(str(course['course_gpa'])))

    def calculate_current_gpa(self):
        """计算当前GPA"""
        if self.courses_data is None:
            return 0.0
            
        completed_courses = self.courses_data[self.courses_data['pass'] == 'passed']
        
        total_weight = completed_courses['course_weight'].sum()
        total_weighted_gpa = (completed_courses['course_gpa'] * 
                            completed_courses['course_weight']).sum()
        
        if total_weight > 0:
            current_gpa = total_weighted_gpa / total_weight
            self.current_gpa_display.setText(f"{current_gpa:.2f}")
            return current_gpa
        return 0.0

    def update_gpa_coloring(self):
        """更新GPA颜色标记"""
        try:
            self.target_gpa = float(self.target_input.text())
        except ValueError:
            return
            
        if self.courses_data is None:
            return
            
        # 更新所有表格中的颜色
        for table in self.course_tables.values():
            for row in range(table.rowCount()):
                try:
                    gpa = float(table.item(row, 6).text())
                    color = QColor(144, 238, 144) if gpa >= self.target_gpa else QColor(255, 182, 193)
                    
                    for col in range(table.columnCount()):
                        table.item(row, col).setBackground(color)
                except:
                    continue
        
        # 计算未修课程所需GPA
        self.calculate_required_gpa()
        # 更新重修课程表格
        self.update_retake_tables()

    def create_retake_widget(self):
        """创建推荐重修课程显示区域"""
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # 按学分分组
        credits = [4, 3, 2, 1]
        
        for credit in credits:
            group = QGroupBox(f"{credit}学分课程")
            group_layout = QVBoxLayout()
            
            # 创建表格
            table = QTableWidget()
            table.setColumnCount(8)
            table.setHorizontalHeaderLabels([
                "课程名称", "课程代码", "开课学期",
                "课程属性", "学分", "当前成绩", "当前绩点", "目标绩点"
            ])
            
            # 设置表格格式
            header = table.horizontalHeader()
            header.setStretchLastSection(True)
            for i in range(8):
                header.setSectionResizeMode(i, header.ResizeMode.ResizeToContents)
            
            group_layout.addWidget(table)
            group.setLayout(group_layout)
            layout.addWidget(group)
            
            # 保存表格引用
            table_key = f"retake_{credit}"
            if not hasattr(self, 'retake_tables'):
                self.retake_tables = {}
            self.retake_tables[table_key] = table
        
        # 添加GPA显示
        gpa_layout = QHBoxLayout()
        
        # 理想GPA
        ideal_gpa_label = QLabel("理想GPA：")
        self.ideal_gpa_display = QLabel("0.00")
        gpa_layout.addWidget(ideal_gpa_label)
        gpa_layout.addWidget(self.ideal_gpa_display)
        
        # 重修后所需GPA
        required_after_retake_label = QLabel("重修后未修课程需要GPA：")
        self.required_after_retake_display = QLabel("0.00")
        gpa_layout.addWidget(required_after_retake_label)
        gpa_layout.addWidget(self.required_after_retake_display)
        
        layout.addLayout(gpa_layout)
        scroll.setWidget(widget)
        return scroll

    def update_retake_tables(self):
        """更新推荐重修课程表格"""
        if self.courses_data is None or self.target_gpa <= 0:
            return
            
        # 清空所有表格
        for table in self.retake_tables.values():
            table.setRowCount(0)
        
        # 查找需要重修的课程
        completed_courses = self.courses_data[self.courses_data['pass'] == 'passed']
        print(f"Target GPA: {self.target_gpa}")
        print(f"Completed courses count: {len(completed_courses)}")
        print(f"Course GPA types: {completed_courses['course_gpa'].dtype}")
        
        # 筛选需要重修的课程，最多显示7门
        retake_courses = completed_courses.copy()
        retake_courses['weight'] = retake_courses['course_weight'] * (self.target_gpa - retake_courses['course_gpa'])
        retake_courses = retake_courses.sort_values('weight', ascending=False).head(7)
        
        print(f"Retake courses count: {len(retake_courses)}")
        
        # 填充数据
        for _, course in retake_courses.iterrows():
            credit = int(course['course_weight'])
            table_key = f"retake_{credit}"
            
            if table_key not in self.retake_tables:
                continue
                
            table = self.retake_tables[table_key]
            row = table.rowCount()
            table.insertRow(row)
            
            # 填充课程信息
            table.setItem(row, 0, QTableWidgetItem(str(course['course_name'])))
            table.setItem(row, 1, QTableWidgetItem(str(course['course_code'])))
            table.setItem(row, 2, QTableWidgetItem(str(course['course_semester'])))
            table.setItem(row, 3, QTableWidgetItem(str(course['course_attribute'])))
            table.setItem(row, 4, QTableWidgetItem(str(course['course_weight'])))
            table.setItem(row, 5, QTableWidgetItem(str(course['course_score'])))
            table.setItem(row, 6, QTableWidgetItem(str(course['course_gpa'])))
            
            # 添加目标绩点单选按钮
            radio_group = QButtonGroup(table)
            radio_layout = QHBoxLayout()
            
            # 创建4个绩点选项
            gpa_options = [4.0, 3.7, 3.3, 3.0]
            current_gpa = float(course['course_gpa'])
            closest_gpa = min(gpa_options, key=lambda x: abs(x - current_gpa))
            
            for gpa in gpa_options:
                radio = QRadioButton(str(gpa))
                radio.setChecked(gpa == closest_gpa)
                radio_group.addButton(radio)
                radio_layout.addWidget(radio)
            
            # 将布局添加到容器widget
            radio_widget = QWidget()
            radio_widget.setLayout(radio_layout)
            
            # 连接信号
            def update_gpa():
                self.calculate_ideal_gpa()
                self.calculate_required_after_retake_gpa()
            radio_group.buttonClicked.connect(update_gpa)
            
            # 设置单元格widget
            table.setColumnWidth(7, 200)
            table.setRowHeight(row, 30)
            table.setCellWidget(row, 7, radio_widget)
            
        # 计算理想GPA
        self.calculate_ideal_gpa()

    def calculate_ideal_gpa(self):
        """计算理想GPA"""
        if self.courses_data is None:
            return 0.0
            
        # 获取所有课程
        all_courses = self.courses_data.copy()
        
        # 更新重修课程的绩点（最多7门）
        for credit, table in self.retake_tables.items():
            for row in range(min(table.rowCount(), 7)):  # 限制最多7门
                course_code = table.item(row, 1).text()
                # 获取选中的单选按钮的值
                radio_widget = table.cellWidget(row, 7)
                selected_radio = None
                for child in radio_widget.children():
                    if isinstance(child, QRadioButton) and child.isChecked():
                        selected_radio = child
                        break
                new_gpa = float(selected_radio.text()) if selected_radio else 0.0
                
                # 更新数据框中的绩点
                all_courses.loc[all_courses['course_code'] == course_code, 'course_gpa'] = new_gpa
        
        # 计算GPA
        completed_courses = all_courses[all_courses['pass'] == 'passed']
        total_weight = completed_courses['course_weight'].sum()
        total_weighted_gpa = (completed_courses['course_gpa'] * 
                            completed_courses['course_weight']).sum()
        
        if total_weight > 0:
            ideal_gpa = total_weighted_gpa / total_weight
            self.ideal_gpa_display.setText(f"{ideal_gpa:.2f}")
            return ideal_gpa
        return 0.0

    def calculate_required_after_retake_gpa(self):
        """计算重修后未修课程所需平均GPA"""
        if self.courses_data is None or self.target_gpa <= 0:
            return
            
        # 获取所有课程
        all_courses = self.courses_data.copy()
        
        # 更新重修课程的绩点
        for credit, table in self.retake_tables.items():
            for row in range(table.rowCount()):
                course_code = table.item(row, 1).text()
                radio_widget = table.cellWidget(row, 7)
                selected_radio = None
                for child in radio_widget.children():
                    if isinstance(child, QRadioButton) and child.isChecked():
                        selected_radio = child
                        break
                new_gpa = float(selected_radio.text()) if selected_radio else 0.0
                all_courses.loc[all_courses['course_code'] == course_code, 'course_gpa'] = new_gpa
        
        # 分离已修和未修课程
        completed = all_courses[all_courses['pass'] == 'passed']
        uncompleted = all_courses[all_courses['pass'] != 'passed']
        
        # 计算已修课程的总绩点
        completed_weighted_gpa = sum([gpa * weight for gpa, weight in zip(completed['course_gpa'], completed['course_weight'])])
        completed_weight = completed['course_weight'].sum()
        
        # 计算未修课程的总学分
        uncompleted_weight = uncompleted['course_weight'].sum()
        
        if uncompleted_weight > 0:
            # 计算所需GPA
            total_target = self.target_gpa * (completed_weight + uncompleted_weight)
            required_total = total_target - completed_weighted_gpa
            required_gpa = required_total / uncompleted_weight
            
            self.required_after_retake_display.setText(f"{required_gpa:.2f}")
        else:
            self.required_after_retake_display.setText("N/A")

    def calculate_required_gpa(self):
        """计算达到目标所需的未修课程平均GPA"""
        if self.courses_data is None or self.target_gpa <= 0:
            return
            
        # 分离已修和未修课程
        completed = self.courses_data[self.courses_data['pass'] == 'passed']
        uncompleted = self.courses_data[self.courses_data['pass'] != 'passed']
        
        # 计算已修课程的总绩点
        completed_weighted_gpa = sum([gpa * weight for gpa, weight in zip(completed['course_gpa'], completed['course_weight'])])
        completed_weight = completed['course_weight'].sum()
        
        # 计算未修课程的总学分
        uncompleted_weight = uncompleted['course_weight'].sum()
        
        if uncompleted_weight > 0:
            # 计算所需GPA
            total_target = self.target_gpa * (completed_weight + uncompleted_weight)
            required_total = total_target - completed_weighted_gpa
            required_gpa = required_total / uncompleted_weight
            
            self.required_gpa_display.setText(f"{required_gpa:.2f}")
        else:
            self.required_gpa_display.setText("N/A")

def main():
    app = QApplication(sys.argv)
    calculator = GPACalculator()
    calculator.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()

# wirtten by Folklore25
# School of Management, SUES
