const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');

router.get('/:flight_id/forecast', demandController.getDemandForecastByFlightId);

module.exports = router;
