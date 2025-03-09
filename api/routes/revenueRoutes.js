const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');

router.get('/:flight_id/forecast', revenueController.getRevenueForecastByFlightId); //Belirli bir uçuşun gelir tahminlerini getirir.

module.exports = router;
