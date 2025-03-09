const express = require('express');
const router = express.Router();
const demandController = require('../controllers/demandController');

router.get('/:flight_id/forecast', demandController.getDemandForecastByFlightId); //Belirli bir uçuşun talep tahminlerini getirir.

module.exports = router;
