const router = require('express').Router();
const { saveStats, getStats } = require('../controllers/statsController');
const auth = require('../middleware/auth');

router.post('/save', auth, saveStats);
router.get('/', auth, getStats);

module.exports = router;
