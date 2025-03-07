const db = require('../config/db');
const axios = require('axios');

function fetchData(callback) {
  // Feedback sorgusu
  db.query('SELECT * FROM feedback', (err, feedback) => {
    if (err) {
      return callback(err, null);
    }

    // sentiment_score kolonunu sentimentScore olarak yeniden adlandır
    const feedbackWithSentiment = feedback.map(fb => ({
      ...fb,
      sentimentScore: fb.sentiment_score, // sentiment_score kolonunu sentimentScore olarak ekle
    }));

    // Loyalty programs sorgusu
    db.query('SELECT * FROM loyalty_programs', (err, loyaltyPrograms) => {
      if (err) {
        return callback(err, null);
      }

      // Customers sorgusu
      db.query('SELECT * FROM customers', (err, customers) => {
        if (err) {
          return callback(err, null);
        }

        // Tüm verileri döndür
        callback(null, {
          feedback: feedbackWithSentiment, // sentimentScore eklenmiş feedback
          loyaltyPrograms,
          customers,
        });
      });
    });
  });
}

function calculateSatisfactionForecast(months, callback) {
  fetchData((err, data) => {
    if (err) {
      return callback(err, null);
    }

    // Flask API'ye HTTP isteği gönder
    axios.post('http://127.0.0.1:5002/forecast', {
      feedback: data.feedback,
      loyaltyPrograms: data.loyaltyPrograms,
      customers: data.customers,
      months: months,
    })
      .then((response) => {
        callback(null, response.data);
      })
      .catch((error) => {
        callback(error, null);
      });
  });
}

module.exports = { calculateSatisfactionForecast };