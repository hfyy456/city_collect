const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 用户设置模型
 * 存储系统配置和用户偏好设置
 */
const SettingsSchema = new Schema({
  // 设置分类
  category: {
    type: String,
    required: true,
    enum: ['system', 'user', 'scraping', 'notification', 'display', 'api'],
    index: true
  },
  
  // 设置键
  key: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // 设置值
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // 设置类型
  valueType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  
  // 设置描述
  description: {
    type: String,
    trim: true
  },
  
  // 默认值
  defaultValue: {
    type: Schema.Types.Mixed
  },
  
  // 是否为敏感信息
  sensitive: {
    type: Boolean,
    default: false
  },
  
  // 设置范围
  scope: {
    type: String,
    enum: ['global', 'user', 'session'],
    default: 'global'
  },
  
  // 用户ID（用户级设置）
  userId: {
    type: String,
    index: true
  },
  
  // 验证规则
  validation: {
    required: { type: Boolean, default: false },
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
    enum: [{ type: String }]
  },
  
  // 设置组
  group: {
    type: String,
    trim: true,
    index: true
  },
  
  // 排序权重
  order: {
    type: Number,
    default: 0
  },
  
  // 是否启用
  enabled: {
    type: Boolean,
    default: true
  },
  
  // 最后修改者
  lastModifiedBy: {
    type: String,
    default: 'system'
  },
  
  // 修改历史
  history: [{
    value: Schema.Types.Mixed,
    modifiedBy: String,
    modifiedAt: { type: Date, default: Date.now },
    reason: String
  }],
  
  // 标签
  tags: [{ type: String, trim: true }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
SettingsSchema.index({ category: 1, key: 1, userId: 1 }, { unique: true });
SettingsSchema.index({ scope: 1, enabled: 1 });

// 虚拟字段
SettingsSchema.virtual('fullKey').get(function() {
  return `${this.category}.${this.key}`;
});

SettingsSchema.virtual('isDefault').get(function() {
  return JSON.stringify(this.value) === JSON.stringify(this.defaultValue);
});

// 实例方法
SettingsSchema.methods.updateValue = function(newValue, modifiedBy = 'system', reason = '') {
  // 记录历史
  this.history.push({
    value: this.value,
    modifiedBy: this.lastModifiedBy,
    modifiedAt: this.updatedAt,
    reason: reason || 'Value updated'
  });
  
  // 更新值
  this.value = newValue;
  this.lastModifiedBy = modifiedBy;
  
  return this.save();
};

SettingsSchema.methods.resetToDefault = function(modifiedBy = 'system') {
  if (this.defaultValue !== undefined) {
    return this.updateValue(this.defaultValue, modifiedBy, 'Reset to default');
  }
  return Promise.resolve(this);
};

SettingsSchema.methods.validate = function() {
  const { validation, value } = this;
  
  if (validation.required && (value === null || value === undefined || value === '')) {
    throw new Error(`Setting ${this.fullKey} is required`);
  }
  
  if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
    throw new Error(`Setting ${this.fullKey} must be >= ${validation.min}`);
  }
  
  if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
    throw new Error(`Setting ${this.fullKey} must be <= ${validation.max}`);
  }
  
  if (validation.pattern && typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
    throw new Error(`Setting ${this.fullKey} does not match required pattern`);
  }
  
  if (validation.enum && validation.enum.length > 0 && !validation.enum.includes(value)) {
    throw new Error(`Setting ${this.fullKey} must be one of: ${validation.enum.join(', ')}`);
  }
  
  return true;
};

// 静态方法
SettingsSchema.statics.getSetting = async function(category, key, userId = null) {
  const query = { category, key, enabled: true };
  if (userId) {
    query.userId = userId;
  }
  
  const setting = await this.findOne(query);
  return setting ? setting.value : null;
};

SettingsSchema.statics.setSetting = async function(category, key, value, options = {}) {
  const {
    userId = null,
    description = '',
    modifiedBy = 'system',
    reason = 'Setting updated'
  } = options;
  
  const query = { category, key };
  if (userId) {
    query.userId = userId;
  }
  
  let setting = await this.findOne(query);
  
  if (setting) {
    await setting.updateValue(value, modifiedBy, reason);
  } else {
    setting = new this({
      category,
      key,
      value,
      valueType: typeof value,
      description,
      userId,
      lastModifiedBy: modifiedBy
    });
    await setting.save();
  }
  
  return setting;
};

SettingsSchema.statics.getSettingsByCategory = function(category, userId = null) {
  const query = { category, enabled: true };
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).sort({ group: 1, order: 1, key: 1 });
};

SettingsSchema.statics.getSettingsByGroup = function(group, userId = null) {
  const query = { group, enabled: true };
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).sort({ order: 1, key: 1 });
};

SettingsSchema.statics.getAllSettings = function(userId = null) {
  const query = { enabled: true };
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).sort({ category: 1, group: 1, order: 1, key: 1 });
};

SettingsSchema.statics.initializeDefaults = async function() {
  const defaults = [
    // 系统设置
    {
      category: 'system',
      key: 'app_name',
      value: 'City Collect',
      valueType: 'string',
      description: '应用名称',
      group: 'basic'
    },
    {
      category: 'system',
      key: 'app_version',
      value: '2.0.0',
      valueType: 'string',
      description: '应用版本',
      group: 'basic'
    },
    
    // 爬虫设置
    {
      category: 'scraping',
      key: 'default_delay',
      value: 2000,
      valueType: 'number',
      description: '默认请求延迟（毫秒）',
      group: 'performance',
      validation: { min: 500, max: 10000 }
    },
    {
      category: 'scraping',
      key: 'max_retries',
      value: 3,
      valueType: 'number',
      description: '最大重试次数',
      group: 'performance',
      validation: { min: 1, max: 10 }
    },
    {
      category: 'scraping',
      key: 'user_agent',
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      valueType: 'string',
      description: '默认User-Agent',
      group: 'headers'
    },
    
    // 显示设置
    {
      category: 'display',
      key: 'items_per_page',
      value: 20,
      valueType: 'number',
      description: '每页显示条数',
      group: 'pagination',
      validation: { min: 10, max: 100 }
    },
    {
      category: 'display',
      key: 'theme',
      value: 'light',
      valueType: 'string',
      description: '界面主题',
      group: 'appearance',
      validation: { enum: ['light', 'dark', 'auto'] }
    },
    
    // API设置
    {
      category: 'api',
      key: 'rate_limit',
      value: 100,
      valueType: 'number',
      description: 'API速率限制（每分钟）',
      group: 'limits',
      validation: { min: 10, max: 1000 }
    }
  ];
  
  for (const defaultSetting of defaults) {
    const existing = await this.findOne({
      category: defaultSetting.category,
      key: defaultSetting.key,
      userId: null
    });
    
    if (!existing) {
      defaultSetting.defaultValue = defaultSetting.value;
      await this.create(defaultSetting);
    }
  }
};

// 中间件
SettingsSchema.pre('save', function(next) {
  // 验证设置值
  try {
    this.validate();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);