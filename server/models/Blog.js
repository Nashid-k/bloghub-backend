const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true, minlength: [3, 'Title must be at least 3 characters'], maxlength: [120, 'Title cannot exceed 120 characters'] },
  slug: { type: String, trim: true, lowercase: true, index: true },
  excerpt: { type: String, trim: true, maxlength: [240, 'Excerpt cannot exceed 240 characters'], default: '' },
  content: { type: String, required: [true, 'Content is required'], trim: true, minlength: [1, 'Content cannot be empty'], maxlength: [50000, 'Content cannot exceed 50,000 characters'] },
  tags: { type: [String], default: [], validate: { validator: (tags) => tags.length <= 8 && tags.every((tag) => typeof tag === 'string' && tag.length <= 24), message: 'Use up to 8 tags, each no longer than 24 characters.' } },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  publishedAt: { type: Date, default: Date.now },
  readingTime: { type: Number, default: 1, min: 1 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });
blogSchema.index({ status: 1, publishedAt: -1, _id: -1 });
blogSchema.index({ author: 1, updatedAt: -1 });
module.exports = mongoose.model('Blog', blogSchema);
