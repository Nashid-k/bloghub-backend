const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {getUserProfile} = require('../controllers/userController');
const { getBookmarks } = require('../controllers/engagementController');

router.get('/me', auth, getUserProfile);
router.get('/bookmarks', auth, getBookmarks);


module.exports = router;