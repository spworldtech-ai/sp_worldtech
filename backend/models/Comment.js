const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  page: { type: String, required: true, trim: true, maxlength: 120, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  message: { type: String, required: true, trim: true, maxlength: 700 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  location: { type: String, default: '', trim: true, maxlength: 100 },
  role: { type: String, default: '', trim: true, maxlength: 120 },
  kind: { type: String, enum: ['user', 'illustrative'], default: 'user', index: true },
  dayKey: { type: String, default: '', index: true },
  slot: { type: Number, default: -1 },
  scheduledAt: { type: Date, default: Date.now, index: true },
  approved: { type: Boolean, default: true, index: true },
  ipHash: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, { timestamps: true });

commentSchema.index({ dayKey: 1, slot: 1 }, { unique: true, sparse: true });
commentSchema.index({ page: 1, approved: 1, scheduledAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
