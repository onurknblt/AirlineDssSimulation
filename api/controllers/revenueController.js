const db = require('../config/db');
const axios = require('axios');
const moment = require('moment');

const getRevenueForecastByFlightId = async (req, res) => {
  const flightId = req.params.flight_id;

  try {
    
    const results = await new Promise((resolve, reject) => {
      db.query(
        `SELECT r.date AS r_date, cargo_revenue, ticket_sales, other_revenue, 
                fuel_cost, staff_cost, maintenance_cost, other_costs 
         FROM Revenue r 
         JOIN Flight_Costs fc ON r.flight_id = fc.flight_id AND r.date = fc.date
         WHERE r.flight_id = ? 
         ORDER BY r.date`, 
        [flightId], 
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Bu uçuş için gelir/maliyet verisi bulunamadı' });
    }

    
    const financialData = results.map(row => ({
      date: moment(row.r_date).startOf('month').format('YYYY-MM-DD'),
      cargo_revenue: parseFloat(row.cargo_revenue), 
      ticket_sales: parseFloat(row.ticket_sales),
      other_revenue: parseFloat(row.other_revenue),
      fuel_cost: parseFloat(row.fuel_cost),
      staff_cost: parseFloat(row.staff_cost),
      maintenance_cost: parseFloat(row.maintenance_cost),
      other_costs: parseFloat(row.other_costs)
    }));

    
    const response = await axios.post('http://localhost:5001/forecast', {
      flight_id: flightId,
      financial_data: financialData
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.data || Object.keys(response.data).length === 0) {
      return res.status(500).json({ message: 'Flask API’den geçerli bir yanıt alınamadı' });
    }

    if (response.data.error) {
      return res.status(400).json({
        flight_id: flightId,
        error: response.data.error
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Gelir Tahmin Servisi Hatası:', error.response ? error.response.data : error.message);
    res.status(500).json({
      message: 'Gelir tahmin verileri alınamadı',
      error: error.response ? error.response.data : error.message
    });
  }
};

module.exports = { getRevenueForecastByFlightId };
