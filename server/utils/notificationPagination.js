const mongoose = require('mongoose');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const normalizeNotificationLimit = (value) => {
  if (value === undefined) return DEFAULT_LIMIT;
  if (typeof value !== 'string' || !/^\\d+$/.test(value)) return null;
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1) return null;
  return Math.min(limit, MAX_LIMIT);
};

const encodeNotificationCursor = (notification) => Buffer.from(JSON.stringify({
  createdAt: new Date(notification.createdAt).toISOString(),
  id: notification._id.toString(),
})).toString('base64url');

const decodeNotificationCursor = (value) => {
  if (typeof value !== 'string' || value.length > 512) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded.createdAt !== 'string' || !mongoose.isValidObjectId(decoded.id)) return null;
    const createdAt = new Date(decoded.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt.toISOString() !== decoded.createdAt) return null;
    return { createdAt, id: new mongoose.Types.ObjectId(decoded.id) };
  } catch {
    return null;
  }
};

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  normalizeNotificationLimit,
  encodeNotificationCursor,
  decodeNotificationCursor,
};
