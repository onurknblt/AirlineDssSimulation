const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');

router.get('/:flight_id/forecast', revenueController.getRevenueForecastByFlightId);

module.exports = router;
