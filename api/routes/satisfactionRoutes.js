const express = require('express');
const router = express.Router();
const satisfactionController = require('../controllers/satisfactionController');

router.get('/:months/forecast', satisfactionController.getSatisfactionForecast);

module.exports = router;