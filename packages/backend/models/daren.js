const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 期数数据子模式
const PeriodDataSchema = new Schema({
  period: { type: String, required: true },
  fee: { type: Number },
  
  // 作品链接
  mainPublishLink: { type: String },
  syncPublishLink: { type: String },
  
  // 联系和状态信息
  contactPerson: { type: String },
  storeArrivalTime: { type: Date },
  
  // 数据表现
  likes: { type: Number },
  comments: { type: Number },
  collections: { type: Number },
  
  // 期数备注
  periodRemarks: { type: String },
  
  // 期数时间戳
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const DarenSchema = new Schema({
  // 达人基本信息（不随期数变化）
  nickname: { type: String, required: true },
  platform: { type: String },
  followers: { type: Number },
  homePage: { type: String },
  xiaohongshuId: { type: String },
  ipLocation: { type: String },
  
  // 联系方式（通用）
  contactInfo: { type: String },
  
  // 其他平台链接
  douyinLink: { type: String },
  dianping: { type: String },
  
  // 期数数据数组
  periodData: [PeriodDataSchema],
  
  // 通用备注
  remarks: { type: String },
  
  // 兼容字段（用于向后兼容，逐步迁移）
  period: { type: String },
  fee: { type: Number },
  mainPublishLink: { type: String },
  syncPublishLink: { type: String },
  storeArrivalTime: { type: Date },
  likes: { type: Number },
  comments: { type: Number },
  collections: { type: Number },
  likesAndCollections: { type: Number },
}, { timestamps: true });

// 实例方法
DarenSchema.methods.addPeriodData = function(periodInfo) {
  // 检查是否已存在该期数的数据
  const existingIndex = this.periodData.findIndex(p => p.period === periodInfo.period);
  
  if (existingIndex >= 0) {
    // 更新现有期数数据 - 只更新传入的字段，保留其他字段
    const existingData = this.periodData[existingIndex].toObject();
    // 过滤掉undefined的字段，只更新有值的字段
    const filteredPeriodInfo = Object.fromEntries(
      Object.entries(periodInfo).filter(([key, value]) => value !== undefined)
    );
    this.periodData[existingIndex] = { 
      ...existingData, 
      ...filteredPeriodInfo, 
      updatedAt: new Date() 
    };
  } else {
    // 添加新期数数据
    this.periodData.push(periodInfo);
  }
  
  return this.save();
};

DarenSchema.methods.getPeriodData = function(period) {
  return this.periodData.find(p => p.period === period);
};

DarenSchema.methods.removePeriodData = function(period) {
  this.periodData = this.periodData.filter(p => p.period !== period);
  return this.save();
};

// 获取最新期数数据
DarenSchema.methods.getLatestPeriodData = function() {
  if (this.periodData.length === 0) return null;
  return this.periodData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
};

// 获取所有参与的期数
DarenSchema.methods.getAllPeriods = function() {
  return this.periodData.map(p => p.period).sort();
};

// 静态方法
DarenSchema.statics.findByPeriod = function(period) {
  return this.find({ 'periodData.period': period });
};

DarenSchema.statics.getAllPeriods = function() {
  return this.aggregate([
    { $unwind: '$periodData' },
    { $group: { _id: '$periodData.period' } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, period: '$_id' } }
  ]);
};

module.exports = mongoose.model('Daren', DarenSchema);