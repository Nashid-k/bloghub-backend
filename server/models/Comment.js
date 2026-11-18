const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
}, { timestamps: true });

commentSchema.index({ blog: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
