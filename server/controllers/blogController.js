const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { validatePost } = require('../utils/validation');

const escapeRegex = (value) => [...value].map((character) => {
  if ('\\\\^$.*+?()[]{}|'.includes(character)) return '\\\\' + character;
  return character;
}).join('');

exports.getAllBlogs = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 50;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const escapedSearch = escapeRegex(search);
    const filter = escapedSearch
      ? { $or: [{ title: { $regex: escapedSearch, $options: 'i' } }, { content: { $regex: escapedSearch, $options: 'i' } }] }
      : {};
    const blogs = await Blog.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();
    return res.json(blogs);
  } catch {
    return res.status(500).json({ error: 'Unable to load stories right now.' });
  }
};

exports.getBlogsById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name').lean();
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    return res.json(blog);
  } catch {
    return res.status(500).json({ error: 'Unable to load this story right now.' });
  }
};

exports.createBlog = async (req, res) => {
  const validationError = validatePost(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  try {
    const blog = await Blog.create({
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      author: req.user._id,
    });
    await blog.populate('author', 'name');
    return res.status(201).json(blog);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: 'Unable to publish this story right now.' });
  }
};

exports.updateBlog = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own stories.' });
    }

    const payload = req.body || {};
    const nextTitle = payload.title === undefined ? blog.title : payload.title;
    const nextContent = payload.content === undefined ? blog.content : payload.content;
    const validationError = validatePost({ title: nextTitle, content: nextContent });
    if (validationError) return res.status(400).json({ error: validationError });

    blog.title = nextTitle.trim();
    blog.content = nextContent.trim();
    await blog.save();
    await blog.populate('author', 'name');
    return res.json(blog);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: 'Unable to update this story right now.' });
  }
};

exports.deleteBlog = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own stories.' });
    }
    await blog.deleteOne();
    return res.json({ message: 'Story deleted successfully.' });
  } catch {
    return res.status(500).json({ error: 'Unable to delete this story right now.' });
  }
};
