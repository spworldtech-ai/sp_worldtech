const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, default: 'SP WorldTech User' },
  senderRole: { type: String, enum: ['user', 'staff'], required: true },
  conversationId: { type: String, index: true },
  message: { type: String, default: '', maxlength: 2000 },
  attachment: { name: { type: String, maxlength: 180 }, type: { type: String, maxlength: 120 }, data: { type: String, maxlength: 3000000 } }
}, { timestamps: true });

messageSchema.pre('save', function(next) {
  if (!this.conversationId && this.sender) this.conversationId = String(this.sender);
  next();
});

module.exports = mongoose.model('Message', messageSchema);
