/**
 * 数字标准化工具函数
 * 统一处理各种格式的数字输入
 */

function normalizeNumber(value) {
  if (!value) return 0;
  
  // 如果已经是数字，直接返回
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.floor(value);
  }
  
  // 如果是字符串，进行处理
  if (typeof value === 'string') {
    let stringValue = value.toString().trim();
    
    // 处理中文数字单位
    if (stringValue.includes('万')) {
      // 提取数字部分（包含小数点）
      const numberPart = stringValue.replace(/[^\d.]/g, '');
      if (numberPart) {
        const num = parseFloat(numberPart);
        return isNaN(num) ? 0 : Math.floor(num * 10000);
      }
    }
    
    if (stringValue.includes('千')) {
      const numberPart = stringValue.replace(/[^\d.]/g, '');
      if (numberPart) {
        const num = parseFloat(numberPart);
        return isNaN(num) ? 0 : Math.floor(num * 1000);
      }
    }
    
    if (stringValue.includes('百')) {
      const numberPart = stringValue.replace(/[^\d.]/g, '');
      if (numberPart) {
        const num = parseFloat(numberPart);
        return isNaN(num) ? 0 : Math.floor(num * 100);
      }
    }
    
    // 处理英文单位
    if (stringValue.toLowerCase().includes('k')) {
      const numberPart = stringValue.replace(/[^\d.]/gi, '');
      if (numberPart) {
        const num = parseFloat(numberPart);
        return isNaN(num) ? 0 : Math.floor(num * 1000);
      }
    }
    
    if (stringValue.toLowerCase().includes('m')) {
      const numberPart = stringValue.replace(/[^\d.]/gi, '');
      if (numberPart) {
        const num = parseFloat(numberPart);
        return isNaN(num) ? 0 : Math.floor(num * 1000000);
      }
    }
    
    // 移除所有非数字字符（保留小数点）
    const cleanValue = stringValue.replace(/[^\d.]/g, '');
    
    // 如果清理后为空，返回0
    if (!cleanValue) return 0;
    
    // 转换为数字并取整
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : Math.floor(num);
  }
  
  return 0;
}

/**
 * 标准化达人数据中的数字字段
 */
function normalizeDarenData(data) {
  const normalized = { ...data };
  
  // 标准化主要字段 - 只处理实际存在的字段
  const numericFields = ['followers', 'likesAndCollections', 'likes', 'collections', 'comments', 'fee', 'forwards'];
  
  numericFields.forEach(field => {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      normalized[field] = normalizeNumber(normalized[field]);
    }
  });
  
  // 标准化期数数据 - 只处理实际存在的字段
  if (normalized.periodData && Array.isArray(normalized.periodData)) {
    normalized.periodData = normalized.periodData.map(period => {
      const normalizedPeriod = { ...period };
      
      // 只标准化实际存在的数字字段
      const periodNumericFields = ['likes', 'collections', 'comments', 'fee', 'forwards'];
      periodNumericFields.forEach(field => {
        if (normalizedPeriod[field] !== undefined && normalizedPeriod[field] !== null) {
          normalizedPeriod[field] = normalizeNumber(normalizedPeriod[field]);
        }
      });
      
      return normalizedPeriod;
    });
  }
  
  return normalized;
}

/**
 * 智能标准化期数数据 - 只标准化传入的字段
 * 用于部分更新场景，避免意外覆盖未传入的字段
 */
function normalizePartialPeriodData(data) {
  const normalized = { ...data };
  
  // 只标准化实际传入的数字字段
  const numericFields = ['likes', 'collections', 'comments', 'fee', 'forwards'];
  
  numericFields.forEach(field => {
    if (normalized[field] !== undefined && normalized[field] !== null && normalized[field] !== '') {
      normalized[field] = normalizeNumber(normalized[field]);
    }
  });
  
  return normalized;
}

module.exports = {
  normalizeNumber,
  normalizeDarenData,
  normalizePartialPeriodData
};