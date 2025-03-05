const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');

router.get('/demand/:flight_id/forecast', demandController.getForecastByFlightId);

module.exports = router;
