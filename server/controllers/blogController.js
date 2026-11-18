const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const { validatePost } = require('../utils/validation');

const regexSpecialCodes = new Set([46, 42, 43, 63, 94, 36, 123, 125, 40, 41, 124, 91, 93, 92]);
const escapeRegex = (value) => [...value].map((character) => (
  regexSpecialCodes.has(character.charCodeAt(0)) ? String.fromCharCode(92) + character : character
)).join('');
const readingTimeFor = (content) => Math.max(1, Math.ceil(String(content || '').trim().split(/\s+/).filter(Boolean).length / 220));
const makeSlug = (title) => (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'story') + '-' + new mongoose.Types.ObjectId().toString().slice(-6);

exports.getAllBlogs = async (req, res) => {
  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
    const rawPage = Number.parseInt(req.query.page, 10);
    const page = Number.isInteger(rawPage) ? Math.max(rawPage, 1) : 1;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const filter = { $and: [{ $or: [{ status: 'published' }, { status: { $exists: false } }] }] };
    if (search) {
      const term = escapeRegex(search);
      filter.$and.push({ $or: [
        { title: { $regex: term, $options: 'i' } },
        { excerpt: { $regex: term, $options: 'i' } },
        { content: { $regex: term, $options: 'i' } },
        { tags: { $regex: term, $options: 'i' } },
      ] });
    }
    const [items, total] = await Promise.all([
      Blog.find(filter).select('-likes').populate('author', 'name').sort({ publishedAt: -1, createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Blog.countDocuments(filter),
    ]);
    return res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ error: 'Unable to load stories right now.' });
  }
};

exports.getMyBlogs = async (req, res) => {
  try {
    return res.json(await Blog.find({ author: req.user._id }).sort({ updatedAt: -1 }).lean());
  } catch {
    return res.status(500).json({ error: 'Unable to load your writing.' });
  }
};

exports.getMyBlogById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, author: req.user._id }).populate('author', 'name').lean();
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    return res.json(blog);
  } catch {
    return res.status(500).json({ error: 'Unable to load this story right now.' });
  }
};

exports.getBlogsById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findOne({ _id: req.params.id, $or: [{ status: 'published' }, { status: { $exists: false } }] }).populate('author', 'name').lean();
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    const likesCount = blog.likes?.length || 0;
    delete blog.likes;
    return res.json({ ...blog, likesCount });
  } catch {
    return res.status(500).json({ error: 'Unable to load this story right now.' });
  }
};

exports.createBlog = async (req, res) => {
  const payload = {
    ...req.body,
    status: req.body.status || 'published',
    tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag) => String(tag).trim().toLowerCase()) : [],
  };
  const validationError = validatePost(payload);
  if (validationError) return res.status(400).json({ error: validationError });
  try {
    const blog = await Blog.create({
      title: payload.title.trim(),
      slug: makeSlug(payload.title),
      excerpt: (payload.excerpt || '').trim(),
      content: payload.content.trim(),
      tags: payload.tags,
      status: payload.status,
      publishedAt: payload.status === 'published' ? new Date() : null,
      readingTime: readingTimeFor(payload.content),
      author: req.user._id,
    });
    await blog.populate('author', 'name');
    return res.status(201).json(blog);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: 'Unable to save this story right now.' });
  }
};

exports.updateBlog = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid story ID.' });
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Story not found.' });
    if (blog.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'You can only edit your own stories.' });
    const payload = {
      title: req.body.title === undefined ? blog.title : req.body.title,
      content: req.body.content === undefined ? blog.content : req.body.content,
      excerpt: req.body.excerpt === undefined ? (blog.excerpt || '') : req.body.excerpt,
      tags: req.body.tags === undefined ? (blog.tags || []) : (Array.isArray(req.body.tags) ? req.body.tags.map((tag) => String(tag).trim().toLowerCase()) : req.body.tags),
      status: req.body.status === undefined ? (blog.status || 'published') : req.body.status,
    };
    const validationError = validatePost(payload);
    if (validationError) return res.status(400).json({ error: validationError });
    const wasPublished = (blog.status || 'published') === 'published';
    if (blog.title !== payload.title.trim()) blog.slug = makeSlug(payload.title);
    blog.title = payload.title.trim();
    blog.content = payload.content.trim();
    blog.excerpt = payload.excerpt.trim();
    blog.tags = payload.tags;
    blog.status = payload.status;
    blog.readingTime = readingTimeFor(payload.content);
    if (payload.status === 'published' && (!wasPublished || !blog.publishedAt)) blog.publishedAt = new Date();
    if (payload.status === 'draft') blog.publishedAt = null;
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
    if (blog.author.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'You can only delete your own stories.' });
    await Comment.deleteMany({ blog: blog._id });
    await blog.deleteOne();
    return res.json({ message: 'Story deleted successfully.' });
  } catch {
    return res.status(500).json({ error: 'Unable to delete this story right now.' });
  }
};
