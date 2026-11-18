const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateRegistration = ({ name, email, password } = {}) => {
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    return 'Name must be between 2 and 60 characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    return 'Enter a valid email address.';
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'Password must be between 8 and 128 characters.';
  }
  return null;
};

const validateLogin = ({ email, password } = {}) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    return 'Enter a valid email address.';
  }
  if (typeof password !== 'string' || password.length === 0 || password.length > 128) {
    return 'Enter a valid password.';
  }
  return null;
};

const validatePost = ({ title, content } = {}) => {
  if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 120) {
    return 'Title must be between 3 and 120 characters.';
  }
  if (typeof content !== 'string' || content.trim().length < 1 || content.length > 50000) {
    return 'Content must be between 1 and 50,000 characters.';
  }
  return null;
};

module.exports = { normalizeEmail, validateRegistration, validateLogin, validatePost };
