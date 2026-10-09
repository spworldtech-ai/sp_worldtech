const mongoose = require('mongoose');

const ebookPurchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ebook: { type: mongoose.Schema.Types.ObjectId, ref: 'Ebook', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  paystackReference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paidAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

ebookPurchaseSchema.index({ user: 1, ebook: 1 }, { unique: true, partialFilterExpression: { status: 'paid' } });
module.exports = mongoose.model('EbookPurchase', ebookPurchaseSchema);
