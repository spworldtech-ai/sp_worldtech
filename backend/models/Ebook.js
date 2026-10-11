const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'Technology & Problem Solving', trim: true },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'USD' },
  pageCount: { type: Number, default: 0, min: 0 },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  fileData: { type: Buffer, required: true, select: false },
  whatsappNumber: { type: String, default: '' },
  coverUrl: { type: String, default: '' },
  coverMimeType: { type: String, default: '', select: false },
  coverData: { type: Buffer, default: undefined, select: false },
  published: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ebookSchema.index({ published: 1, createdAt: -1 });
module.exports = mongoose.model('Ebook', ebookSchema);
