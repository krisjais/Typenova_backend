const router = require('express').Router();
const { saveLanguage, getLanguage } = require('../controllers/languageController');
const auth = require('../middleware/auth');

router.post('/', auth, saveLanguage);
router.get('/', auth, getLanguage);

module.exports = router;
