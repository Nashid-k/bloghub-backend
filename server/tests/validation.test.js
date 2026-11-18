const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { encodeCommentCursor, decodeCommentCursor, normalizeCommentLimit } = require('../utils/commentPagination');
const { parsePage, parseLimit } = require('../utils/authorPagination');
const Follow = require('../models/Follow');
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

test('encodes and decodes stable comment cursors', () => {
  const comment = { _id: new mongoose.Types.ObjectId(), createdAt: new Date('2026-11-18T10:30:00.000Z') };
  const cursor = encodeCommentCursor(comment);
  const decoded = decodeCommentCursor(cursor);
  assert.equal(decoded.id.toString(), comment._id.toString());
  assert.equal(decoded.createdAt.toISOString(), comment.createdAt.toISOString());
});

test('rejects malformed comment cursors and bounds page sizes', () => {
  assert.equal(decodeCommentCursor('not-a-cursor'), null);
  assert.equal(decodeCommentCursor(Buffer.from(JSON.stringify({ createdAt: 'bad', id: 'invalid' })).toString('base64url')), null);
  assert.equal(normalizeCommentLimit(undefined), 50);
  assert.equal(normalizeCommentLimit('12'), 12);
  assert.equal(normalizeCommentLimit('500'), 50);
  assert.equal(normalizeCommentLimit('0'), null);
  assert.equal(normalizeCommentLimit('2abc'), null);
});

test('validates public author story pagination boundaries', () => {
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage('3'), 3);
  assert.equal(parsePage('0'), null);
  assert.equal(parsePage('1abc'), null);
  assert.equal(parseLimit(undefined), 12);
  assert.equal(parseLimit('20'), 20);
  assert.equal(parseLimit('200'), 20);
  assert.equal(parseLimit('0'), null);
  assert.equal(parseLimit('4items'), null);
});

test('follow relationships enforce one record per follower-author pair', () => {
  const indexes = Follow.schema.indexes();
  assert.ok(indexes.some(([keys, options]) => (
    keys.follower === 1 && keys.following === 1 && options.unique === true
  )));
});


test('follow directory indexes support stable newest-first pagination', () => {
  const indexes = Follow.schema.indexes();
  assert.ok(indexes.some(([keys]) => (
    keys.following === 1 && keys.createdAt === -1 && keys._id === -1
  )));
  assert.ok(indexes.some(([keys]) => (
    keys.follower === 1 && keys.createdAt === -1 && keys._id === -1
  )));
});

test('bounds public author directory pagination inputs', () => {
  assert.equal(parsePage('100000'), 100000);
  assert.equal(parsePage('100001'), 100001);
  assert.equal(parseLimit('20'), 20);
  assert.equal(parseLimit('21'), 20);
});
