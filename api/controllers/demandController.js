const db = require('../config/db');
const axios = require('axios');

const getDemandForecastByFlightId = async (req, res) => {
  const flightId = req.params.flight_id;

  try {

    const results = await new Promise((resolve, reject) => {
      db.query('SELECT sale_date, number_of_tickets FROM Sales WHERE flight_id = ?', [flightId], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Bu uçuş için satış verisi bulunamadı' });
    }

    
    const salesData = results.map(row => ({
      sale_date: row.sale_date.toISOString(), 
      number_of_tickets: row.number_of_tickets
    }));

    
    const response = await axios.post('http://localhost:5000/predict', {
      flight_id: flightId,
      sales_data: salesData
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    
    if (response.data.error) {
      return res.status(400).json({
        flight_id: flightId,
        error: response.data.error
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Tahmin servisi hatası:', error.response ? error.response.data : error.message);
    res.status(500).json({
      message: 'Tahmin verileri alınamadı',
      error: error.response ? error.response.data : error.message
    });
  }
};

module.exports = { getDemandForecastByFlightId };
