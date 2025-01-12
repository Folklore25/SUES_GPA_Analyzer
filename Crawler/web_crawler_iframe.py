import os
import pandas as pd
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time
import traceback
import configparser
from PyQt6.QtWidgets import QApplication, QMessageBox
from PyQt6.QtCore import Qt

class CoursesScraper:
    def __init__(self, initial_url, username, password, on_complete=None):
        config = configparser.ConfigParser()
        config.read('config.ini')
        self.username = config.get('LOGIN', 'username')
        self.password = config.get('LOGIN', 'password')
        self.url = config.get('LOGIN', 'url')
        self.playwright = sync_playwright().start()
        self.setup_browser()
        self.on_complete = on_complete

    def setup_browser(self):
        """设置 Playwright 浏览器"""
        self.browser = self.playwright.chromium.launch(
            headless=False,
            args=[
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--start-maximized'
            ]
        )
        self.context = self.browser.new_context()
        self.page = self.context.new_page()

    def perform_first_login(self):
        """执行第一次登录"""
        try:
            print("开始第一次登录...")
            self.page.goto(self.url)
          # 输入用户名
            self.page.fill("//input[@id='username']", self.username)
            # 输入密码
            self.page.fill("//input[@id='password']", self.password)
            # 点击登录按钮
            self.page.click("//input[@id='passbutton']")
            
            # 等待跳转
            self.page.wait_for_timeout(3000)
            return True
            
        except Exception as e:
            print(f"第一次登录失败: {e}")
            return False

    def perform_second_login(self):
        try:
            print("开始第二次登录...")
            app = QApplication([])
            msg_box = QMessageBox()
            msg_box.setWindowFlags(msg_box.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)
            msg_box.information(None, "提示", "自己划拉一下拼图呗")
            app.processEvents()

            # 输入用户名
            self.page.fill("//input[@placeholder='用户名']", self.username)
            # 输入密码
            self.page.fill("//input[@placeholder='密码']", self.password)
            # 点击登录按钮
            self.page.click("//button[@type='button']")
            
            self.page.wait_for_timeout(3000)
            QMessageBox.information(None, "提示", "进首页之后自己点一下培养方案完成情况")
            app.processEvents()
            self.page.wait_for_timeout(3000)
            return True
            
        except Exception as e:
            print(f"第二次登录失败: {e}")
            return False
    
    def switch_to_frame(self, frame_selector, timeout=3000):
        """切换到指定的iframe"""
        try:
            # 等待iframe加载
            frame = self.page.wait_for_selector(frame_selector, timeout=timeout)
            self.page.wait_for_timeout(1000)  # 小延迟确保iframe加载完成
            
            # 切换到iframe
            frame = frame.content_frame()
            if frame:
                print(f"成功切换到iframe: {frame_selector}")
                return True
            return False
        except Exception as e:
            print(f"切换iframe失败: {e}")
            traceback.print_exc()
            return False

    def find_and_switch_to_frame(self, timeout=5000):
        """查找并切换到包含课程表的iframe"""
        try:
            # 等待特定的 iframe 加载
            frame = self.page.wait_for_selector(
                'iframe[name="e-home-iframe-1"]',
                timeout=timeout
            )
            
            print("找到目标iframe，准备切换")
            # 切换到iframe
            frame = frame.content_frame()
            if frame:
                print("成功切换到目标iframe")
                return True
            return False
            
        except Exception as e:
            print(f"查找iframe失败: {e}")
            traceback.print_exc()
            return False

    def get_course_table_content(self):
        """获取课程表内容"""
        try:
            if not self.find_and_switch_to_frame():
                print("未能找到包含课程表的iframe")
                return None
            
            print("正在等待课程表加载...")
            self.page.wait_for_timeout(5000)  # 等待页面加载
            
            frame = self.page.frame_locator('iframe[name="e-home-iframe-1"]').first
            
            # 获取iframe内容
            content = frame.locator('body').inner_html()
            print("成功获取课程表内容")
            return content
                
        except Exception as e:
            print(f"获取课程表失败: {e}")
            traceback.print_exc()
            return None

    def parse_course_row(self, row):
        """解析单个课程行的数据"""
        try:
            # 获取课程名称
            course_name_elem = row.find('td', class_='course-name')
            course_name = course_name_elem.get('data-text', '').strip() if course_name_elem else ''
            
            # 获取所有列
            columns = row.find_all('td')
            
            if len(columns) < 7:
                print(f"警告：行数据不完整 - {columns}")
                return None
            
            # 获取成绩和绩点
            score = columns[5].text.strip() if len(columns) > 5 else '--'
            gpa = columns[6].text.strip() if len(columns) > 6 else '--'
            
            # 处理数值转换
            try:
                course_weight = float(columns[4].text.strip())
                if score.replace('.', '').isdigit():
                    score = float(score)
                if gpa.replace('.', '').isdigit():
                    gpa = float(gpa)
            except ValueError:
                course_weight = 0.0
            
            return {
                'course_name': course_name,
                'course_code': columns[1].text.strip(),
                'course_semester': columns[2].text.strip(),
                'course_attribute': columns[3].text.strip(),
                'course_weight': course_weight,
                'course_score': score,
                'course_gpa': gpa,
                'pass': 'passed' if row.get('data-result', '').upper() == 'PASSED' else 'failed'
            }
        except Exception as e:
            print(f"解析行数据失败: {e}")
            traceback.print_exc()
            return None


    def save_to_csv(self, data, filename='courses.csv'):
        """保存数据到CSV文件"""
        save_path = os.path.join(os.getcwd(), filename)
        print(f"准备保存数据到 {save_path}")
        
        if not data:
            print("没有数据可保存")
            return False
            
        print(f"数据样本：{data[0]}")
        print(f"数据总数：{len(data)}")
        
        # 调试：打印当前工作目录
        print(f"当前工作目录：{os.getcwd()}")
        # 调试：检查文件路径是否存在
        print(f"文件路径是否存在：{os.path.exists(os.path.dirname(save_path))}")
        # 调试：检查是否有写入权限
        print(f"是否有写入权限：{os.access(os.path.dirname(save_path), os.W_OK)}")
        
        try:
            # 创建DataFrame
            df = pd.DataFrame(data)
            print("DataFrame创建成功")
            
            # 检查列名
            required_columns = ['course_name', 'course_code', 'course_semester', 
                              'course_attribute', 'course_weight', 'course_score', 
                              'course_gpa', 'pass']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                print(f"缺少必要列：{missing_columns}")
                return False
                
            # 选择需要的列
            df = df[required_columns]
            
            # 检查文件路径
            print(f"尝试写入文件：{save_path}")
            try:
                # 测试文件写入权限
                with open(save_path, 'w', encoding='utf-8-sig') as f:
                    f.write('test')
                print("文件写入权限检查通过")
            except Exception as e:
                print(f"文件写入权限检查失败: {e}")
                return False
                
            # 保存CSV
            df.to_csv(save_path, index=False, encoding='utf-8-sig')
            print(f"数据已成功保存到 {save_path}")
            return True
            
        except pd.errors.EmptyDataError:
            print("错误：数据为空")
            return False
        except pd.errors.ParserError:
            print("错误：数据解析失败")
            return False
        except PermissionError:
            print("错误：没有文件写入权限")
            return False
        except Exception as e:
            print(f"保存CSV文件失败: {str(e)}")
            traceback.print_exc()
            return False

    def scrape_courses(self):
        """爬取所有课程信息"""
        try:
            if not self.perform_first_login():
                return []
                
            if not self.perform_second_login():
                return []

            print("登录成功，开始爬取课程信息...")
            # 增加等待时间
            self.page.wait_for_timeout(3000)
            
            # 获取课程表内容
            table_html = self.get_course_table_content()
            
            # 解析页面
            soup = BeautifulSoup(table_html, 'html.parser')
            course_rows = soup.find_all('tr', attrs={'data-result': True})
            
            courses_data = []
            for row in course_rows:
                course_data = self.parse_course_row(row)
                if course_data:
                    courses_data.append(course_data)
            
            print(f"成功爬取到 {len(courses_data)} 条课程数据")
            if courses_data:
                print("正在保存数据到CSV...")
                self.save_to_csv(courses_data)
            else:
                print("没有爬取到任何课程数据")
            if self.on_complete:
                self.on_complete()
            
            # 保持浏览器打开状态
            self.page.wait_for_timeout(3000)
            return courses_data
            
        except Exception as e:
            print(f"爬取课程信息失败: {e}")
            traceback.print_exc()
            return []

def main():
    initial_url = "https://your_initial_login_url.com"
    username = "your_username"
    password = "your_password"
    
    scraper = CoursesScraper(initial_url, username, password)
    courses_data = scraper.scrape_courses()
    scraper.save_to_csv(courses_data)

if __name__ == "__main__":
    main()

# written by Github@Folklore25