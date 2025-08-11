// 加载并显示课程数据的函数
async function loadAndDisplayCourseData() {
  try {
    // 调用API获取CSV数据
    const csvData = await window.electronAPI.loadCourseData();
    
    // 解析CSV数据
    const parsedData = parseCSV(csvData);
    
    // 更新所有显示内容
    updateAllDisplays(parsedData);
    
    // 更新统计信息
    updateStatistics(parsedData);
  } catch (error) {
    console.error('加载数据失败:', error);
    alert('加载数据失败: ' + error.message);
  }
}