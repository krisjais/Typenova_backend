const router = require('express').Router();
const { getLeaderboard } = require('../controllers/leaderboardController');

router.get('/', getLeaderboard);

module.exports = router;
