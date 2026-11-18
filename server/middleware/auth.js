const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Authentication is not configured.' });
  }

  const authorization = req.get('Authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'A valid Bearer token is required.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'The account for this token no longer exists.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token is invalid or expired.' });
  }
};

module.exports = auth;
