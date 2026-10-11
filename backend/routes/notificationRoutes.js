const router = require('express').Router();
const mongoose = require('mongoose');
const JobNotification = require('../models/JobNotification');
const { protect } = require('../middleware/auth');

function roleForUser(role) {
  const value = String(role || 'user').toLowerCase();
  if (value === 'owner') return ['owner', 'admin'];
  if (value === 'admin') return ['admin', 'owner'];
  if (value === 'social_worker') return ['staff'];
  return [value];
}
function asPayload(item, userId) {
  const readBy = Array.isArray(item.readBy) ? item.readBy : [];
  const isRead = readBy.some((id) => String(id) === String(userId)) || (String(item.user || '') === String(userId) && item.read === true);
  return {
    id: String(item._id), title: item.title, message: item.message || '',
    read: isRead, createdAt: item.createdAt,
    type: item.application ? 'application' : item.job ? 'job' : 'general'
  };
}
router.use(protect);
router.get('/', async (req, res) => {
  try {
    const roleValues = roleForUser(req.user.role);
    const records = await JobNotification.find({
      $or: [
        { user: req.user._id },
        { user: null, role: { $in: roleValues } }
      ]
    }).sort({ createdAt: -1 }).limit(50).lean();
    const notifications = records.map((item) => asPayload(item, req.user._id));
    res.json({ notifications, unreadCount: notifications.filter((item) => !item.read).length });
  } catch (error) {
    console.error('Notification list failed:', error.message);
    res.status(500).json({ message: 'Notifications are temporarily unavailable.' });
  }
});
router.patch('/:id/read', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid notification ID.' });
    const item = await JobNotification.findOne({ _id: req.params.id, $or: [ { user: req.user._id }, { user: null, role: { $in: roleForUser(req.user.role) } } ] });
    if (!item) return res.status(404).json({ message: 'Notification not found.' });
    if (!Array.isArray(item.readBy)) item.readBy = [];
    if (!item.readBy.some((id) => String(id) === String(req.user._id))) item.readBy.push(req.user._id);
    if (String(item.user || '') === String(req.user._id)) item.read = true;
    await item.save();
    res.json({ ok: true, notification: asPayload(item.toObject(), req.user._id) });
  } catch (error) {
    console.error('Notification update failed:', error.message);
    res.status(500).json({ message: 'Could not update this notification.' });
  }
});
router.post('/read-all', async (req, res) => {
  try {
    const items = await JobNotification.find({ $or: [ { user: req.user._id }, { user: null, role: { $in: roleForUser(req.user.role) } } ] }).select('_id user read readBy');
    for (const item of items) {
      if (!Array.isArray(item.readBy)) item.readBy = [];
      if (!item.readBy.some((id) => String(id) === String(req.user._id))) item.readBy.push(req.user._id);
      if (String(item.user || '') === String(req.user._id)) item.read = true;
    }
    if (items.length) await JobNotification.bulkSave(items);
    res.json({ ok: true, updated: items.length });
  } catch (error) {
    console.error('Mark-all-read failed:', error.message);
    res.status(500).json({ message: 'Could not mark notifications as read.' });
  }
});
module.exports = router;
