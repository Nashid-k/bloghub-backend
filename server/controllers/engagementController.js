const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { encodeCommentCursor, decodeCommentCursor, normalizeCommentLimit } = require('../utils/commentPagination');

const validId = (id) => mongoose.isValidObjectId(id);
const publishedFilter = { $or: [{ status: 'published' }, { status: { $exists: false } }] };

exports.getEngagement = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const [blog, user] = await Promise.all([
      Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('likes').lean(),
      User.findById(req.user._id).select('bookmarks').lean(),
    ]);
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const userId = req.user._id.toString();
    return res.json({
      liked: (blog.likes || []).some((id) => id.toString() === userId),
      bookmarked: (user?.bookmarks || []).some((id) => id.toString() === req.params.id),
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load your story preferences.' });
  }
};

exports.toggleLike = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('author');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });

    const removed = await Blog.updateOne(
      { _id: blog._id, likes: req.user._id },
      { $pull: { likes: req.user._id } },
    );
    let liked = false;
    if (removed.modifiedCount === 0) {
      const added = await Blog.updateOne(
        { _id: blog._id, likes: { $ne: req.user._id } },
        { $addToSet: { likes: req.user._id } },
      );
      liked = added.modifiedCount === 1;
      if (liked && blog.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: blog.author,
          actor: req.user._id,
          type: 'like',
          story: blog._id,
        });
      }
    }
    const updated = await Blog.findById(blog._id).select('likes').lean();
    return res.json({ liked, likesCount: updated?.likes?.length || 0 });
  } catch {
    return res.status(500).json({ error: 'Unable to update your reaction right now.' });
  }
};

exports.getComments = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('_id');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const limit = normalizeCommentLimit(req.query.limit);
    if (limit === null) return res.status(400).json({ error: 'Comment limit must be a positive integer.' });

    const cursor = req.query.cursor === undefined ? null : decodeCommentCursor(req.query.cursor);
    if (req.query.cursor !== undefined && !cursor) {
      return res.status(400).json({ error: 'Invalid comment pagination cursor.' });
    }

    const filter = { blog: blog._id };
    if (cursor) {
      filter.$or = [
        { createdAt: { $gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $gt: cursor.id } },
      ];
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    if (req.query.limit === undefined && req.query.cursor === undefined) return res.json(items);

    return res.json({
      items,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore && items.length ? encodeCommentCursor(items[items.length - 1]) : null,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load discussion.' });
  }
};

exports.createComment = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content || content.length > 2000) return res.status(400).json({ error: 'Comments must be between 1 and 2,000 characters.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('author');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const comment = await Comment.create({ blog: blog._id, author: req.user._id, content });
    if (blog.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: blog.author,
        actor: req.user._id,
        type: 'comment',
        story: blog._id,
        comment: comment._id,
      });
    }
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
    const blog = await Blog.findOne({ _id: req.params.id, ...publishedFilter }).select('author');
    if (!blog) return res.status(404).json({ error: 'Story not found.' });

    const removed = await User.updateOne(
      { _id: req.user._id, bookmarks: blog._id },
      { $pull: { bookmarks: blog._id } },
    );
    let bookmarked = false;
    if (removed.modifiedCount === 0) {
      const added = await User.updateOne(
        { _id: req.user._id, bookmarks: { $ne: blog._id } },
        { $addToSet: { bookmarks: blog._id } },
      );
      bookmarked = added.modifiedCount === 1;
      if (bookmarked && blog.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: blog.author,
          actor: req.user._id,
          type: 'bookmark',
          story: blog._id,
        });
      }
    }
    const updated = await User.findById(req.user._id).select('bookmarks').lean();
    return res.json({ bookmarked, bookmarksCount: updated?.bookmarks?.length || 0 });
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
