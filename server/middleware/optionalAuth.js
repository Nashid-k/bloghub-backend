const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  const authorization = req.get('Authorization');
  if (!authorization) return next();

  const [scheme, token, extra] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token || extra) {
    return res.status(401).json({ error: 'Authorization must use a valid Bearer token.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Authentication is not configured.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'The account for this token no longer exists.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token is invalid or expired.' });
  }
};

module.exports = optionalAuth;
