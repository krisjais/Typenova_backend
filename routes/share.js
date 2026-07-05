const router = require('express').Router();
const { getSharedResult } = require('../controllers/shareController');

router.get('/result/:id', getSharedResult);

module.exports = router;
