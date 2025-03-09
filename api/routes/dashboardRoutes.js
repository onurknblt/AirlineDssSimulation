const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/fuel-exchange-trends/:days?', dashboardController.getFuelExchangeTrends); //Brent Petrol ve USD/TRY kurlarının günlük değişimlerini getirir.
router.get('/flights-by-occupancy/:type?', dashboardController.getFlightsByOccupancy); //Uçuşların doluluk oranlarına göre sayılarını getirir.
router.get('/average-occupancy-rates', dashboardController.getAverageOccupancyRates); //Uçuşların ortalama doluluk oranlarını getirir.
router.get('/satisfaction-score', dashboardController.getCustomerSatisfactionScores); //Müşteri memnuniyet skorlarını getirir.
router.get('/competitor-prices/:flight_id', dashboardController.getCompetitorPrices); //Belirli bir uçuşun rakip fiyatlarını getirir.

module.exports = router;