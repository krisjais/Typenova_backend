const router = require('express').Router();
const { createCustomText, getCustomTexts, deleteCustomText } = require('../controllers/customTextController');
const auth = require('../middleware/auth');

router.post('/', auth, createCustomText);
router.get('/', auth, getCustomTexts);
router.delete('/:id', auth, deleteCustomText);

module.exports = router;
