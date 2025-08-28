const fs = require('fs').promises;
const path = require('path');

/**
 * INI文件处理工具类
 */
class IniHelper {
  /**
   * 构造函数
   * @param {string} filePath - INI文件路径
   */
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * 解析INI文件内容
   * @param {string} content - INI文件内容
   * @returns {Object} 解析后的对象
   */
  parse(content) {
    const result = {};
    let currentSection = 'default';
    result[currentSection] = {};

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();// @Github:Folklore25
      
      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
        continue;
      }

      // 检查是否为节标题
      const sectionMatch = trimmedLine.match(/^\[(.+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        result[currentSection] = {};
        continue;
      }

      // 解析键值对
      const keyValueMatch = trimmedLine.match(/^([^=]+)=(.*)$/);// @Github:Folklore25
      if (keyValueMatch) {
        const key = keyValueMatch[1].trim();
        let value = keyValueMatch[2].trim();
        
        // 处理引号
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        
        result[currentSection][key] = value;
      }
    }

    return result;
  }

  /**
   * 将对象转换为INI格式字符串
   * @param {Object} data - 要转换的对象
   * @returns {string} INI格式字符串
   */
  stringify(data) {
    let result = '';

    for (const [section, values] of Object.entries(data)) {// @Github:Folklore25
      if (section !== 'default') {
        result += `[${section}]\n`;
      }

      for (const [key, value] of Object.entries(values)) {
        result += `${key}=${value}\n`;
      }

      result += '\n';// @Github:Folklore25
    }

    return result;
  }

  /**
   * 读取INI文件
   * @returns {Promise<Object>} 解析后的对象
   */
  async read() {
    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      return this.parse(content);
    } catch (error) {
      // 如果文件不存在，返回空对象
      if (error.code === 'ENOENT') {
        return { default: {} };
      }
      throw error;
    }
  }

  /**
   * 写入INI文件
   * @param {Object} data - 要写入的数据
   * @returns {Promise<void>}
   */
  async write(data) {
    const content = this.stringify(data);
    await fs.writeFile(this.filePath, content, 'utf8');
  }

  /**
   * 获取指定节和键的值
   * @param {string} section - 节名称
   * @param {string} key - 键名称
   * @param {*} defaultValue - 默认值
   * @returns {Promise<*>} 键值
   */
  async get(section, key, defaultValue = null) {
    const data = await this.read();
    return (data[section] && data[section][key]) ?? defaultValue;
  }

  /**
   * 设置指定节和键的值
   * @param {string} section - 节名称
   * @param {string} key - 键名称
   * @param {*} value - 要设置的值
   * @returns {Promise<void>}
   */
  async set(section, key, value) {
    const data = await this.read();
    if (!data[section]) {
      data[section] = {};
    }
    data[section][key] = value;
    await this.write(data);
  }

  /**
   * 删除指定节和键
   * @param {string} section - 节名称
   * @param {string} key - 键名称
   * @returns {Promise<void>}
   */
  async delete(section, key) {
    const data = await this.read();
    if (data[section] && data[section][key]) {
      delete data[section][key];
      await this.write(data);
    }
  }
}

module.exports = IniHelper;