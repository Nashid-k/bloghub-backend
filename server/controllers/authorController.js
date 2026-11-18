const mongoose = require('mongoose');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Follow = require('../models/Follow');

const publishedFilter = { $or: [{ status: 'published' }, { status: { $exists: false } }] };
const { parsePage, parseLimit } = require('../utils/authorPagination');

exports.getPublicAuthorProfile = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid author ID.' });
  }
  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit);
  if (page === null || limit === null) {
    return res.status(400).json({ error: 'Page and limit must be positive integers; limit cannot exceed 20.' });
  }
  try {
    const author = await User.findById(req.params.userId).select('name createdAt').lean();
    if (!author) return res.status(404).json({ error: 'Author not found.' });

    const authorFilter = { author: author._id, ...publishedFilter };
    const [stories, publishedCount, followersCount, followingCount, isFollowing] = await Promise.all([
      Blog.find(authorFilter)
        .select('-likes')
        .populate('author', 'name')
        .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(authorFilter),
      Follow.countDocuments({ following: author._id }),
      Follow.countDocuments({ follower: author._id }),
      req.user
        ? Follow.exists({ follower: req.user._id, following: author._id })
        : Promise.resolve(false),
    ]);

    return res.json({
      author: { id: author._id, name: author.name, joinedAt: author.createdAt },
      stats: { publishedStories: publishedCount, followers: followersCount, following: followingCount },
      isFollowing: Boolean(isFollowing),
      stories,
      pagination: { page, limit, total: publishedCount, pages: Math.ceil(publishedCount / limit) },
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load this author profile right now.' });
  }
};

exports.followAuthor = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid author ID.' });
  }
  if (new mongoose.Types.ObjectId(req.params.userId).toString() === req.user._id.toString()) {
    return res.status(400).json({ error: 'You cannot follow your own account.' });
  }
  try {
    const author = await User.findById(req.params.userId).select('_id');
    if (!author) return res.status(404).json({ error: 'Author not found.' });

    await Follow.updateOne(
      { follower: req.user._id, following: author._id },
      { $setOnInsert: { follower: req.user._id, following: author._id } },
      { upsert: true },
    );
    const followersCount = await Follow.countDocuments({ following: author._id });
    return res.json({ following: true, followersCount });
  } catch (error) {
    if (error.code === 11000) {
      const followersCount = await Follow.countDocuments({ following: req.params.userId });
      return res.json({ following: true, followersCount });
    }
    return res.status(500).json({ error: 'Unable to follow this author right now.' });
  }
};

exports.unfollowAuthor = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid author ID.' });
  }
  if (req.params.userId === req.user._id.toString()) {
    return res.status(400).json({ error: 'You cannot unfollow your own account.' });
  }
  try {
    const author = await User.findById(req.params.userId).select('_id');
    if (!author) return res.status(404).json({ error: 'Author not found.' });
    await Follow.deleteOne({ follower: req.user._id, following: author._id });
    const followersCount = await Follow.countDocuments({ following: author._id });
    return res.json({ following: false, followersCount });
  } catch {
    return res.status(500).json({ error: 'Unable to unfollow this author right now.' });
  }
};
