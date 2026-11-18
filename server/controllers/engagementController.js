const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const User = require('../models/User');

const validId = (id) => mongoose.isValidObjectId(id);
const publishedFilter = { $or: [{ status: 'published' }, { status: { $exists: false } }] };

exports.toggleLike = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('likes');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const alreadyLiked = (blog.likes || []).some((id) => id.toString() === req.user._id.toString());
    const update = alreadyLiked ? { $pull: { likes: req.user._id } } : { $addToSet: { likes: req.user._id } };
    const updated = await Blog.findByIdAndUpdate(blog._id, update, { new: true }).select('likes').lean();
    return res.json({ liked: !alreadyLiked, likesCount: updated.likes.length });
  } catch {
    return res.status(500).json({ error: 'Unable to update your reaction right now.' });
  }
};

exports.getComments = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('_id');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const comments = await Comment.find({ blog: blog._id }).populate('author', 'name').sort({ createdAt: 1 }).lean();
    return res.json(comments);
  } catch {
    return res.status(500).json({ error: 'Unable to load discussion.' });
  }
};

exports.createComment = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content || content.length > 2000) return res.status(400).json({ error: 'Comments must be between 1 and 2,000 characters.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('_id');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const comment = await Comment.create({ blog: blog._id, author: req.user._id, content });
    await comment.populate('author', 'name');
    return res.status(201).json(comment);
  } catch {
    return res.status(500).json({ error: 'Unable to publish your comment.' });
  }
};

exports.deleteComment = async (req, res) => {
  if (!validId(req.params.commentId)) return res.status(400).json({ error: 'Invalid comment ID.' });
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const blog = isAuthor ? null : await Blog.findById(comment.blog).select('author');
    if (!isAuthor && (!blog || blog.author.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Only the comment author or story author can remove this comment.' });
    }
    await comment.deleteOne();
    return res.json({ message: 'Comment removed.' });
  } catch {
    return res.status(500).json({ error: 'Unable to remove this comment.' });
  }
};

exports.toggleBookmark = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('_id');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const user = await User.findById(req.user._id).select('bookmarks');
    const isBookmarked = (user.bookmarks || []).some((id) => id.toString() === blog._id.toString());
    const update = isBookmarked ? { $pull: { bookmarks: blog._id } } : { $addToSet: { bookmarks: blog._id } };
    const updated = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('bookmarks').lean();
    return res.json({ bookmarked: !isBookmarked, bookmarksCount: updated.bookmarks.length });
  } catch {
    return res.status(500).json({ error: 'Unable to update your reading list.' });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('bookmarks').populate({
      path: 'bookmarks',
      match: publishedFilter,
      populate: { path: 'author', select: 'name' },
    }).lean();
    return res.json((user?.bookmarks || []).filter(Boolean));
  } catch {
    return res.status(500).json({ error: 'Unable to load your reading list.' });
  }
};
