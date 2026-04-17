const router = require('express').Router();
const { setLevel, getLevel } = require('../controllers/levelController');
const auth = require('../middleware/auth');

router.post('/', auth, setLevel);
router.get('/', auth, getLevel);

module.exports = router;
