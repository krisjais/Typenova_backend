const router = require('express').Router();
const { getFeed } = require('../controllers/activityController');
const auth = require('../middleware/auth');

router.get('/feed', auth, getFeed);

module.exports = router;
