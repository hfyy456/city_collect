const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 独立的期数模型
 * 管理活动期数的基本信息和元数据
 */
const PeriodSchema = new Schema({
  // 期数标识
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    index: true
  },
  
  // 期数显示名称
  displayName: { 
    type: String, 
    required: true,
    trim: true
  },
  
  // 期数描述
  description: { 
    type: String,
    trim: true
  },
  
  // 时间范围
  startDate: { 
    type: Date,
    required: true
  },
  
  endDate: { 
    type: Date,
    required: true
  },
  
  // 期数状态
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning',
    index: true
  },
  
  // 预算信息
  budget: {
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    currency: { type: String, default: 'CNY' }
  },
  
  // 目标指标
  targets: {
    influencerCount: { type: Number },
    totalReach: { type: Number },
    totalEngagement: { type: Number },
    roi: { type: Number }
  },
  
  // 期数配置
  settings: {
    // 是否允许添加新达人
    allowNewInfluencers: { type: Boolean, default: true },
    // 是否自动计算统计数据
    autoCalculateStats: { type: Boolean, default: true },
    // 数据收集截止时间
    dataCollectionDeadline: { type: Date }
  },
  
  // 标签
  tags: [{ type: String, trim: true }],
  
  // 创建者和负责人
  createdBy: { type: String },
  assignedTo: [{ type: String }],
  
  // 统计数据缓存（定期更新）
  stats: {
    influencerCount: { type: Number, default: 0 },
    totalInvestment: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalCollections: { type: Number, default: 0 },
    averageEngagement: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    lastCalculated: { type: Date }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
PeriodSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now;
});

PeriodSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

PeriodSchema.virtual('budgetUtilization').get(function() {
  return this.budget.total > 0 ? (this.budget.used / this.budget.total * 100) : 0;
});

// 实例方法
PeriodSchema.methods.updateStats = async function() {
  const InfluencerPeriod = mongoose.model('InfluencerPeriod');
  
  const stats = await InfluencerPeriod.aggregate([
    { $match: { period: this.name } },
    {
      $group: {
        _id: null,
        influencerCount: { $sum: 1 },
        totalInvestment: { $sum: '$fee' },
        totalLikes: { $sum: '$likes' },
        totalComments: { $sum: '$comments' },
        totalCollections: { $sum: '$collections' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    this.stats = {
      ...stat,
      averageEngagement: stat.influencerCount > 0 ? 
        (stat.totalLikes + stat.totalComments + stat.totalCollections) / stat.influencerCount : 0,
      roi: stat.totalInvestment > 0 ? 
        (stat.totalLikes + stat.totalComments + stat.totalCollections) / stat.totalInvestment * 100 : 0,
      lastCalculated: new Date()
    };
  }
  
  return this.save();
};

// 静态方法
PeriodSchema.statics.getActivePeriods = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ startDate: -1 });
};

PeriodSchema.statics.getPeriodsByStatus = function(status) {
  return this.find({ status }).sort({ startDate: -1 });
};

// 索引
PeriodSchema.index({ startDate: -1, endDate: -1 });
PeriodSchema.index({ status: 1, startDate: -1 });

module.exports = mongoose.model('Period', PeriodSchema);