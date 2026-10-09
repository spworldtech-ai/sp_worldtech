const Message = require('../models/Message');
const mongoose = require('mongoose');

function cleanText(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

function conversationFor(user) { return String(user._id); }
function cleanAttachment(input) {
  if (!input) return undefined;
  const name = String(input.name || 'attachment').replace(/[\\/\r\n\0]/g, '_').slice(0, 180);
  const type = String(input.type || 'application/octet-stream').slice(0, 120);
  const data = String(input.data || '');
  if (data.length > 2_800_000) throw new Error('Attachment must be 2 MB or smaller.');
  if (!/^data:(image\/(png|jpeg|gif|webp)|application\/pdf|text\/plain|application\/zip|application\/vnd\.openxmlformats-officedocument\.[^;]+|application\/msword|application\/vnd\.ms-excel|text\/csv);base64,[A-Za-z0-9+/=]+$/i.test(data)) throw new Error('Unsupported attachment type.');
  return { name, type, data };
}

exports.getMyMessages = async (req, res) => {
  try {
    const role = String(req.user.role || '').toLowerCase();
    const isSupport = ['admin', 'owner', 'staff'].includes(role);
    const query = isSupport ? {} : { conversationId: conversationFor(req.user) };
    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(isSupport ? 500 : 100).lean();
    res.json({ messages });
  } catch (error) {
    console.error('Chat history error:', error.message);
    res.status(500).json({ message: 'Unable to load chat messages.' });
  }
};

exports.sendUserMessage = async (req, res) => {
  try {
    const messageText = cleanText(req.body?.message);
    let attachment; try { attachment = cleanAttachment(req.body?.attachment); } catch (e) { return res.status(400).json({ message: e.message }); }
    if (!messageText && !attachment) return res.status(400).json({ message: 'Enter a message or attach a file.' });

    const message = await Message.create({
      sender: req.user._id,
      senderName: req.user.fullName || 'SP WorldTech User',
      senderRole: 'user',
      conversationId: conversationFor(req.user),
      message: messageText, attachment
    });

    if (req.io) req.io.emit('chat:new', message.toObject());
    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('User chat send error:', error.message);
    res.status(500).json({ message: 'Unable to send your message.' });
  }
};

exports.sendStaffReply = async (req, res) => {
  try {
    const messageText = cleanText(req.body?.message);
    let attachment; try { attachment = cleanAttachment(req.body?.attachment); } catch (e) { return res.status(400).json({ message: e.message }); }
    const conversationId = String(req.body?.conversationId || '').trim();
    if (!messageText && !attachment) return res.status(400).json({ message: 'Enter a reply or attach a file.' });
    if (!conversationId || !mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'A valid conversation is required.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      senderName: req.user.fullName || 'SP WorldTech Support',
      senderRole: 'staff',
      conversationId,
      message: messageText, attachment
    });

    if (req.io) req.io.emit('chat:new', message.toObject());
    res.status(201).json({ message: 'Reply sent', data: message });
  } catch (error) {
    console.error('Staff chat reply error:', error.message);
    res.status(500).json({ message: 'Unable to send the reply.' });
  }
};
