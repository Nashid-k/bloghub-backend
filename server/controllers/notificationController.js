const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const {
  normalizeNotificationLimit,
  encodeNotificationCursor,
  decodeNotificationCursor,
} = require('../utils/notificationPagination');

exports.getNotifications = async (req, res) => {
  const limit = normalizeNotificationLimit(req.query.limit);
  if (limit === null) return res.status(400).json({ error: 'Notification limit must be a positive integer.' });

  const cursor = req.query.cursor === undefined ? null : decodeNotificationCursor(req.query.cursor);
  if (req.query.cursor !== undefined && !cursor) {
    return res.status(400).json({ error: 'Invalid notification pagination cursor.' });
  }
  if (req.query.unreadOnly !== undefined && !['true', 'false'].includes(req.query.unreadOnly)) {
    return res.status(400).json({ error: 'unreadOnly must be true or false.' });
  }

  const filter = { recipient: req.user._id };
  if (req.query.unreadOnly === 'true') filter.readAt = null;
  if (cursor) {
    filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ];
  }

  try {
    const notifications = await Notification.find(filter)
      .populate('actor', 'name')
      .populate('story', 'title slug')
      .populate('comment', 'content')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    return res.json({
      items,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore && items.length
          ? encodeNotificationCursor(items[items.length - 1])
          : null,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load your notifications right now.' });
  }
};

exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, readAt: null });
    return res.json({ unreadCount: count });
  } catch {
    return res.status(500).json({ error: 'Unable to load your unread notification count.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.notificationId)) {
    return res.status(400).json({ error: 'Invalid notification ID.' });
  }
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } },
      { new: true },
    ).lean();

    if (notification) return res.json({ notification, read: true });

    const existing = await Notification.findOne({
      _id: req.params.notificationId,
      recipient: req.user._id,
    }).select('_id readAt').lean();
    if (!existing) return res.status(404).json({ error: 'Notification not found.' });
    return res.json({ notification: existing, read: true });
  } catch {
    return res.status(500).json({ error: 'Unable to update this notification right now.' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return res.json({ markedRead: result.modifiedCount });
  } catch {
    return res.status(500).json({ error: 'Unable to mark notifications as read right now.' });
  }
};
