const satisfactionService = require('../services/satisfactionService');

exports.getSatisfactionForecast = (req, res) => {
  const months = parseInt(req.params.months, 10);

  if (isNaN(months) || months < 1 || months > 12) {
    return res.status(400).json({ error: 'Geçersiz ay değeri. Lütfen 1 ile 12 arasında bir değer girin.' });
  }

  satisfactionService.calculateSatisfactionForecast(months, (err, forecastData) => {
    if (err) {
      console.error('Tahmin hesaplanırken hata oluştu:', err);
      return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' });
    }

    res.status(200).json({
      success: true,
      data: forecastData,
    });
  });
};