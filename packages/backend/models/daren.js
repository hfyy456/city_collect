const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DarenSchema = new Schema({
  nickname: { type: String, required: true },
  platform: { type: String },
  accountType: { type: String },
  followers: { type: String },
  homePage: { type: String },
  contactPerson: { type: String },
  hasConnection: { type: Boolean, default: false },
  contactInfo: { type: String },
  inGroup: { type: Boolean, default: false },
  storeArrivalTime: { type: Date },
  arrivedAtStore: { type: Boolean, default: false },
  reviewed: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  mainPublishLink: { type: String },
  syncPublishLink: { type: String },
  remarks: { type: String },
  douyinLink: { type: String },
  dianping: { type: String },
  exposure: { type: Number },
  reads: { type: Number },
  likes: { type: Number },
  comments: { type: Number },
  collections: { type: Number },
  forwards: { type: Number },
  cooperationMethod: { type: String },
  period: { type: String },
  fee: { type: Number },
  // New fields for cookie-based parsing
  xiaohongshuId: { type: String },
  ipLocation: { type: String },
  likesAndCollections: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Daren', DarenSchema); 