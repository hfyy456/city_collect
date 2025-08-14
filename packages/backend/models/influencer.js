const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 简化的达人模型
 * 只包含达人的基本信息，不包含期数相关数据
 */
const InfluencerSchema = new Schema({
  // 达人基本信息
  nickname: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  
  // 平台信息
  platform: { 
    type: String,
    enum: ['xiaohongshu', '小红书', 'douyin', 'weibo', 'bilibili', 'other'],
    default: 'xiaohongshu',
    index: true
  },
  
  // 粉丝数
  followers: { 
    type: Number,
    min: 0,
    index: true
  },
  
  // 主页链接
  homePage: { 
    type: String,
    trim: true
  },
  
  // 小红书ID
  xiaohongshuId: { 
    type: String,
    trim: true,
    index: true
  },
  
  // IP属地
  ipLocation: { 
    type: String,
    trim: true,
    index: true
  },
  
  // 联系方式
  contactInfo: { 
    type: String,
    trim: true
  },
  
  // 其他平台链接
  socialLinks: {
    douyin: { type: String, trim: true },
    weibo: { type: String, trim: true },
    bilibili: { type: String, trim: true },
    dianping: { type: String, trim: true }
  },
  
  // 达人分类
  category: {
    type: String,
    enum: ['beauty', 'fashion', 'food', 'travel', 'lifestyle', 'tech', 'fitness', 'other'],
    index: true
  },
  
  // 达人标签
  tags: [{ type: String, trim: true }],
  
  // 达人等级
  tier: {
    type: String,
    enum: ['nano', 'micro', 'mid', 'macro', 'mega'],
    index: true
  },
  
  // 合作历史统计
  cooperationStats: {
    totalCooperations: { type: Number, default: 0 },
    successfulCooperations: { type: Number, default: 0 },
    averageRating: { type: Number, min: 1, max: 5 },
    totalInvestment: { type: Number, default: 0 },
    totalEngagement: { type: Number, default: 0 }
  },
  
  // 达人状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active',
    index: true
  },
  
  // 备注
  remarks: { 
    type: String,
    trim: true
  },
  
  // 数据来源
  dataSource: {
    type: String,
    enum: ['manual', 'api', 'scraping', 'import', 'migration'],
    default: 'manual'
  },
  
  // 最后更新的粉丝数据时间
  lastDataUpdate: { type: Date }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
InfluencerSchema.virtual('successRate').get(function() {
  return this.cooperationStats.totalCooperations > 0 ? 
    (this.cooperationStats.successfulCooperations / this.cooperationStats.totalCooperations * 100) : 0;
});

InfluencerSchema.virtual('averageROI').get(function() {
  return this.cooperationStats.totalInvestment > 0 ? 
    (this.cooperationStats.totalEngagement / this.cooperationStats.totalInvestment * 100) : 0;
});

// 根据粉丝数自动设置等级
InfluencerSchema.virtual('autoTier').get(function() {
  const followers = this.followers || 0;
  if (followers < 1000) return 'nano';
  if (followers < 10000) return 'micro';
  if (followers < 100000) return 'mid';
  if (followers < 1000000) return 'macro';
  return 'mega';
});

// 实例方法
InfluencerSchema.methods.updateCooperationStats = async function() {
  const InfluencerPeriod = mongoose.model('InfluencerPeriod');
  
  const stats = await InfluencerPeriod.aggregate([
    { $match: { influencer: this._id } },
    {
      $group: {
        _id: null,
        totalCooperations: { $sum: 1 },
        successfulCooperations: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalInvestment: { $sum: '$fee' },
        totalEngagement: {
          $sum: {
            $add: [
              '$performance.likes',
              '$performance.comments', 
              '$performance.collections',
              '$performance.shares'
            ]
          }
        },
        averageRating: { $avg: '$qualityScore.overall' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.cooperationStats = stats[0];
  }
  
  return this.save();
};

InfluencerSchema.methods.getPeriods = function() {
  const InfluencerPeriod = mongoose.model('InfluencerPeriod');
  return InfluencerPeriod.find({ influencer: this._id }).distinct('period');
};

InfluencerSchema.methods.getLatestCooperation = function() {
  const InfluencerPeriod = mongoose.model('InfluencerPeriod');
  return InfluencerPeriod.findOne({ influencer: this._id }).sort({ createdAt: -1 });
};

// 静态方法
InfluencerSchema.statics.findByTier = function(tier) {
  return this.find({ tier }).sort({ followers: -1 });
};

InfluencerSchema.statics.findByCategory = function(category) {
  return this.find({ category }).sort({ followers: -1 });
};

InfluencerSchema.statics.findByLocation = function(location) {
  return this.find({ ipLocation: new RegExp(location, 'i') }).sort({ followers: -1 });
};

InfluencerSchema.statics.searchByKeyword = function(keyword) {
  return this.find({
    $or: [
      { nickname: new RegExp(keyword, 'i') },
      { xiaohongshuId: new RegExp(keyword, 'i') },
      { tags: new RegExp(keyword, 'i') },
      { remarks: new RegExp(keyword, 'i') }
    ]
  }).sort({ followers: -1 });
};

// 索引
InfluencerSchema.index({ nickname: 'text', xiaohongshuId: 'text', tags: 'text' });
InfluencerSchema.index({ followers: -1 });
InfluencerSchema.index({ platform: 1, tier: 1 });
InfluencerSchema.index({ category: 1, status: 1 });

// 中间件
InfluencerSchema.pre('save', function(next) {
  // 自动设置等级
  if (!this.tier) {
    this.tier = this.autoTier;
  }
  
  // 更新最后数据更新时间
  if (this.isModified('followers')) {
    this.lastDataUpdate = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Influencer', InfluencerSchema);