const Blog = require('../models/Blog');
exports.getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    const blogs = await Blog.find({ author: user._id }).sort({ updatedAt: -1 }).lean();
    res.json({ user: { id: user._id, name: user.name, email: user.email }, blogs, stats: { total: blogs.length, published: blogs.filter((blog) => (blog.status || 'published') === 'published').length, drafts: blogs.filter((blog) => blog.status === 'draft').length } });
  } catch { res.status(500).json({ error: 'Unable to load your profile right now.' }); }
};
