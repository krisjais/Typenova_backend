const router = require('express').Router();
const {
  getFriends,
  searchUsers,
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  removeFriend,
  blockUser,
  unblockUser
} = require('../controllers/friendsController');
const auth = require('../middleware/auth');

router.get('/', auth, getFriends);
router.get('/search', auth, searchUsers);
router.post('/request', auth, sendRequest);
router.post('/accept', auth, acceptRequest);
router.post('/decline', auth, declineRequest);
router.post('/cancel', auth, cancelRequest);
router.post('/remove', auth, removeFriend);
router.post('/block', auth, blockUser);
router.post('/unblock', auth, unblockUser);

module.exports = router;
