const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeEmail, validateRegistration, validateLogin } = require('../utils/validation');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be configured.');
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

exports.register = async (req, res) => {
  const validationError = validateRegistration(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    const existingUser = await User.findOne({ email }).select('_id');
    if (existingUser) return res.status(409).json({ error: 'An account with this email already exists.' });

    const user = await User.create({ name: name.trim(), email, password });
    return res.status(201).json({ token: generateToken(user._id), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' });
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: 'Unable to create your account right now.' });
  }
};

exports.login = async (req, res) => {
  const validationError = validateLogin(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    return res.json({ token: generateToken(user._id), user: publicUser(user) });
  } catch {
    return res.status(500).json({ error: 'Unable to sign in right now.' });
  }
};

exports.logout = (_req, res) => res.json({ message: 'Signed out successfully.' });
