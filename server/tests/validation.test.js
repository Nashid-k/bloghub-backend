const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeEmail,
  validateRegistration,
  validateLogin,
  validatePost,
} = require('../utils/validation');

test('normalizes email addresses', () => {
  assert.equal(normalizeEmail('  Writer@Example.COM '), 'writer@example.com');
});

test('accepts valid registration data', () => {
  assert.equal(validateRegistration({ name: 'Nashid', email: 'writer@example.com', password: 'strong-pass-123' }), null);
});

test('rejects short names and weak passwords', () => {
  assert.match(validateRegistration({ name: 'A', email: 'writer@example.com', password: 'strong-pass-123' }), /Name/);
  assert.match(validateRegistration({ name: 'Writer', email: 'writer@example.com', password: 'short' }), /Password/);
});

test('rejects malformed login payloads', () => {
  assert.match(validateLogin({ email: 'not-an-email', password: 'secret' }), /email/i);
  assert.match(validateLogin({ email: 'writer@example.com', password: '' }), /password/i);
});

test('validates post title and content boundaries', () => {
  assert.equal(validatePost({ title: 'A good story', content: 'A story body' }), null);
  assert.match(validatePost({ title: 'No', content: 'A story body' }), /Title/);
  assert.match(validatePost({ title: 'A good story', content: '  ' }), /Content/);
  assert.match(validatePost({ title: 'A good story', content: 'x'.repeat(50001) }), /Content/);
});

test('accepts a valid draft with optional editorial metadata', () => {
  assert.equal(validatePost({
    title: 'A thoughtful draft',
    content: 'A body with ideas',
    excerpt: 'A short introduction',
    tags: ['design', 'writing'],
    status: 'draft',
  }), null);
});

test('rejects invalid publishing states and oversized metadata', () => {
  assert.match(validatePost({ title: 'A valid title', content: 'Body', status: 'scheduled' }), /Status/);
  assert.match(validatePost({ title: 'A valid title', content: 'Body', excerpt: 'x'.repeat(241) }), /Excerpt/);
  assert.match(validatePost({ title: 'A valid title', content: 'Body', tags: Array(9).fill('topic') }), /tags/i);
  assert.match(validatePost({ title: 'A valid title', content: 'Body', tags: ['x'.repeat(25)] }), /tags/i);
});
