const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Cookie管理模型
 * 用于存储和管理小红书等平台的Cookie信息
 */
const CookieSchema = new Schema({
  // Cookie标识
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // 平台信息
  platform: {
    type: String,
    required: true,
    enum: ['xiaohongshu', 'douyin', 'weibo', 'bilibili', 'other'],
    default: 'xiaohongshu',
    index: true
  },
  
  // Cookie值
  value: {
    type: String,
    required: true
  },
  
  // Cookie描述
  description: {
    type: String,
    trim: true
  },
  
  // 域名
  domain: {
    type: String,
    trim: true
  },
  
  // 路径
  path: {
    type: String,
    default: '/',
    trim: true
  },
  
  // 是否为HttpOnly
  httpOnly: {
    type: Boolean,
    default: false
  },
  
  // 是否为Secure
  secure: {
    type: Boolean,
    default: false
  },
  
  // 过期时间
  expiresAt: {
    type: Date
  },
  
  // Cookie状态
  status: {
    type: String,
    enum: ['active', 'expired', 'invalid', 'disabled'],
    default: 'active',
    index: true
  },
  
  // 使用统计
  usage: {
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    lastUsed: { type: Date },
    lastSuccess: { type: Date },
    lastFailure: { type: Date },
    failureCount: { type: Number, default: 0 }
  },
  
  // 验证信息
  validation: {
    isValid: { type: Boolean, default: true },
    lastValidated: { type: Date },
    validationMethod: { type: String }, // 'manual', 'auto', 'api'
    validationResult: { type: String }
  },
  
  // 标签
  tags: [{ type: String, trim: true }],
  
  // 创建者
  createdBy: {
    type: String,
    default: 'system'
  },
  
  // 备注
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
CookieSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

CookieSchema.virtual('successRate').get(function() {
  return this.usage.totalRequests > 0 ? 
    (this.usage.successfulRequests / this.usage.totalRequests * 100) : 0;
});

CookieSchema.virtual('daysSinceLastUsed').get(function() {
  if (!this.usage.lastUsed) return null;
  return Math.floor((new Date() - this.usage.lastUsed) / (1000 * 60 * 60 * 24));
});

// 实例方法
CookieSchema.methods.recordUsage = function(success = true) {
  this.usage.totalRequests += 1;
  this.usage.lastUsed = new Date();
  
  if (success) {
    this.usage.successfulRequests += 1;
    this.usage.lastSuccess = new Date();
    this.usage.failureCount = 0; // 重置失败计数
  } else {
    this.usage.lastFailure = new Date();
    this.usage.failureCount += 1;
    
    // 连续失败超过5次，标记为无效
    if (this.usage.failureCount >= 5) {
      this.status = 'invalid';
    }
  }
  
  return this.save();
};

CookieSchema.methods.validate = async function(method = 'manual', result = '') {
  this.validation.lastValidated = new Date();
  this.validation.validationMethod = method;
  this.validation.validationResult = result;
  
  // 根据验证结果更新状态
  if (result.includes('success') || result.includes('valid')) {
    this.validation.isValid = true;
    this.status = 'active';
  } else if (result.includes('expired')) {
    this.validation.isValid = false;
    this.status = 'expired';
  } else if (result.includes('invalid')) {
    this.validation.isValid = false;
    this.status = 'invalid';
  }
  
  return this.save();
};

CookieSchema.methods.disable = function() {
  this.status = 'disabled';
  return this.save();
};

CookieSchema.methods.enable = function() {
  this.status = 'active';
  return this.save();
};

// 静态方法
CookieSchema.statics.findByPlatform = function(platform) {
  return this.find({ platform, status: 'active' }).sort({ 'usage.lastUsed': -1 });
};

CookieSchema.statics.findValidCookies = function(platform = null) {
  const query = { 
    status: 'active',
    'validation.isValid': true
  };
  
  if (platform) {
    query.platform = platform;
  }
  
  return this.find(query).sort({ 'usage.successfulRequests': -1 });
};

CookieSchema.statics.getRandomCookie = function(platform = 'xiaohongshu') {
  return this.aggregate([
    { 
      $match: { 
        platform, 
        status: 'active',
        'validation.isValid': true
      } 
    },
    { $sample: { size: 1 } }
  ]);
};

CookieSchema.statics.getCookieStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$platform',
        total: { $sum: 1 },
        active: { 
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
        },
        expired: { 
          $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } 
        },
        invalid: { 
          $sum: { $cond: [{ $eq: ['$status', 'invalid'] }, 1, 0] } 
        },
        avgSuccessRate: { 
          $avg: { 
            $cond: [
              { $gt: ['$usage.totalRequests', 0] },
              { $multiply: [{ $divide: ['$usage.successfulRequests', '$usage.totalRequests'] }, 100] },
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// 索引
CookieSchema.index({ platform: 1, status: 1 });
CookieSchema.index({ 'usage.lastUsed': -1 });
CookieSchema.index({ 'validation.isValid': 1, status: 1 });
CookieSchema.index({ name: 1, platform: 1 }, { unique: true });

// 中间件
CookieSchema.pre('save', function(next) {
  // 自动检查过期状态
  if (this.expiresAt && this.expiresAt < new Date() && this.status === 'active') {
    this.status = 'expired';
    this.validation.isValid = false;
  }
  
  next();
});

module.exports = mongoose.model('Cookie', CookieSchema);