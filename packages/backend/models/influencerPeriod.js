const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 达人-期数关联模型
 * 管理达人在特定期数中的参与数据
 */
const InfluencerPeriodSchema = new Schema({
  // 关联的达人ID
  influencer: {
    type: Schema.Types.ObjectId,
    ref: 'Influencer',
    required: true,
    index: true
  },
  
  // 关联的期数名称
  period: {
    type: String,
    required: true,
    index: true
  },
  
  // 合作费用
  fee: { 
    type: Number,
    default: 0,
    min: 0
  },
  
  // 作品链接
  mainPublishLink: { 
    type: String,
    trim: true
  },
  
  syncPublishLink: { 
    type: String,
    trim: true
  },
  
  // 联系和进度信息
  contactPerson: { 
    type: String,
    trim: true
  },
  
  storeArrivalTime: { 
    type: Date
  },
  
  // 合作状态
  status: {
    type: String,
    enum: ['contacted', 'confirmed', 'content_created', 'published', 'completed', 'cancelled'],
    default: 'contacted',
    index: true
  },
  
  // 数据表现
  performance: {
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    collections: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    
    // 数据更新时间
    lastUpdated: { type: Date }
  },
  
  // 内容信息
  content: {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    contentType: { 
      type: String, 
      enum: ['image', 'video', 'carousel', 'live'],
      default: 'image'
    },
    publishedAt: { type: Date }
  },
  
  // 期数特定备注
  remarks: { 
    type: String,
    trim: true
  },
  
  // 质量评分
  qualityScore: {
    content: { type: Number, min: 1, max: 5 },
    engagement: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 }
  },
  
  // 标签
  tags: [{ type: String, trim: true }],
  
  // 数据来源
  dataSource: {
    type: String,
    enum: ['manual', 'api', 'scraping', 'migration'],
    default: 'manual'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
InfluencerPeriodSchema.index({ influencer: 1, period: 1 }, { unique: true });
InfluencerPeriodSchema.index({ period: 1, status: 1 });
InfluencerPeriodSchema.index({ period: 1, 'performance.likes': -1 });

// 虚拟字段
InfluencerPeriodSchema.virtual('totalEngagement').get(function() {
  const p = this.performance;
  return (p.likes || 0) + (p.comments || 0) + (p.collections || 0) + (p.shares || 0);
});

InfluencerPeriodSchema.virtual('engagementRate').get(function() {
  return this.performance.views > 0 ? 
    (this.totalEngagement / this.performance.views * 100) : 0;
});

InfluencerPeriodSchema.virtual('roi').get(function() {
  return this.fee > 0 ? (this.totalEngagement / this.fee * 100) : 0;
});

InfluencerPeriodSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// 实例方法
InfluencerPeriodSchema.methods.updatePerformance = function(performanceData) {
  this.performance = {
    ...this.performance,
    ...performanceData,
    lastUpdated: new Date()
  };
  return this.save();
};

InfluencerPeriodSchema.methods.calculateQualityScore = function() {
  const { content, engagement, timeliness } = this.qualityScore;
  if (content && engagement && timeliness) {
    this.qualityScore.overall = Math.round((content + engagement + timeliness) / 3 * 10) / 10;
  }
  return this.save();
};

// 静态方法
InfluencerPeriodSchema.statics.findByPeriod = function(period, options = {}) {
  const query = this.find({ period });
  
  if (options.populate) {
    query.populate('influencer');
  }
  
  if (options.status) {
    query.where('status', options.status);
  }
  
  return query.sort({ createdAt: -1 });
};

InfluencerPeriodSchema.statics.findByInfluencer = function(influencerId) {
  return this.find({ influencer: influencerId }).sort({ createdAt: -1 });
};

InfluencerPeriodSchema.statics.getPeriodStats = function(period) {
  return this.aggregate([
    { $match: { period } },
    {
      $group: {
        _id: null,
        totalInfluencers: { $sum: 1 },
        totalInvestment: { $sum: '$fee' },
        totalLikes: { $sum: '$performance.likes' },
        totalComments: { $sum: '$performance.comments' },
        totalCollections: { $sum: '$performance.collections' },
        totalShares: { $sum: '$performance.shares' },
        totalViews: { $sum: '$performance.views' },
        avgQualityScore: { $avg: '$qualityScore.overall' },
        statusBreakdown: {
          $push: '$status'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalInfluencers: 1,
        totalInvestment: 1,
        totalEngagement: { 
          $add: ['$totalLikes', '$totalComments', '$totalCollections', '$totalShares'] 
        },
        totalLikes: 1,
        totalComments: 1,
        totalCollections: 1,
        totalShares: 1,
        totalViews: 1,
        avgEngagementRate: {
          $cond: [
            { $gt: ['$totalViews', 0] },
            { 
              $multiply: [
                { 
                  $divide: [
                    { $add: ['$totalLikes', '$totalComments', '$totalCollections', '$totalShares'] },
                    '$totalViews'
                  ]
                },
                100
              ]
            },
            0
          ]
        },
        roi: {
          $cond: [
            { $gt: ['$totalInvestment', 0] },
            {
              $multiply: [
                {
                  $divide: [
                    { $add: ['$totalLikes', '$totalComments', '$totalCollections', '$totalShares'] },
                    '$totalInvestment'
                  ]
                },
                100
              ]
            },
            0
          ]
        },
        avgQualityScore: 1,
        statusBreakdown: 1
      }
    }
  ]);
};

// 中间件
InfluencerPeriodSchema.pre('save', function(next) {
  // 自动计算总体质量评分
  if (this.qualityScore.content && this.qualityScore.engagement && this.qualityScore.timeliness) {
    this.qualityScore.overall = Math.round(
      (this.qualityScore.content + this.qualityScore.engagement + this.qualityScore.timeliness) / 3 * 10
    ) / 10;
  }
  next();
});

module.exports = mongoose.model('InfluencerPeriod', InfluencerPeriodSchema);