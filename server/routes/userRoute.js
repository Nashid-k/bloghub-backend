const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const {getUserProfile} = require('../controllers/userController');
const { getBookmarks } = require('../controllers/engagementController');
const { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } = require('../controllers/notificationController');
const { getPublicAuthorProfile, followAuthor, unfollowAuthor, getAuthorFollowers, getAuthorFollowing } = require('../controllers/authorController');

router.get('/me', auth, getUserProfile);
router.get('/bookmarks', auth, getBookmarks);
router.get('/notifications/unread-count', auth, getUnreadNotificationCount);
router.get('/notifications', auth, getNotifications);
router.patch('/notifications/read-all', auth, markAllNotificationsRead);
router.patch('/notifications/:notificationId/read', auth, markNotificationRead);
router.get('/:userId/followers', getAuthorFollowers);
router.get('/:userId/following', getAuthorFollowing);
router.get('/:userId', optionalAuth, getPublicAuthorProfile);
router.post('/:userId/follow', auth, followAuthor);
router.delete('/:userId/follow', auth, unfollowAuthor);


module.exports = router;