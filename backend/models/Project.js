const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, default: '' },
  clientEmail: { type: String, default: '' },
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  paymentOption: { type: String, enum: ['full', 'half'], default: 'half' },
  paidAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending_payment', 'in_progress', 'ready_for_delivery', 'delivered', 'completed'], default: 'pending_payment' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deliveryNotes: { type: String, default: '' },
  deliveryUrl: { type: String, default: '' },
  deliveryFileName: { type: String, default: '' },
  deliveryMimeType: { type: String, default: '', select: false },
  deliveryFileData: { type: Buffer, default: undefined, select: false },
  deliveredAt: { type: Date, default: null }
}, { timestamps: true });

projectSchema.virtual('remainingAmount').get(function () {
  return Math.max(0, Number(this.totalAmount || 0) - Number(this.paidAmount || 0));
});
projectSchema.set('toJSON', { virtuals: true });

projectSchema.index({ client: 1, createdAt: -1 });
projectSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
