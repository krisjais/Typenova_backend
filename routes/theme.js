const router = require('express').Router();
const { saveTheme, getTheme } = require('../controllers/themeController');
const auth = require('../middleware/auth');

router.post('/', auth, saveTheme);
router.get('/', auth, getTheme);

module.exports = router;
