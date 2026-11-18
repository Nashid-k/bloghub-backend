const mongoose = require('mongoose');

const encodeCommentCursor = (comment) => Buffer.from(JSON.stringify({
  createdAt: comment.createdAt.toISOString(),
  id: comment._id.toString(),
})).toString('base64url');

const decodeCommentCursor = (cursor) => {
  if (typeof cursor !== 'string' || cursor.length > 256) return null;
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(value.createdAt);
    if (!Number.isFinite(createdAt.getTime()) || !mongoose.isValidObjectId(value.id)) return null;
    return { createdAt, id: new mongoose.Types.ObjectId(value.id) };
  } catch {
    return null;
  }
};

const normalizeCommentLimit = (rawLimit) => {
  if (rawLimit === undefined) return 50;
  const parsed = Number.parseInt(rawLimit, 10);
  return Number.isInteger(parsed) ? Math.min(Math.max(parsed, 1), 50) : null;
};

module.exports = { encodeCommentCursor, decodeCommentCursor, normalizeCommentLimit };
