const db = require('../config/db');
const axios = require('axios');

function fetchData(callback) {
  
  db.query('SELECT * FROM feedback', (err, feedback) => {
    if (err) {
      return callback(err, null);
    }

    const feedbackWithSentiment = feedback.map(fb => ({
      ...fb,
      sentimentScore: fb.sentiment_score, 
    }));

    db.query('SELECT * FROM loyalty_programs', (err, loyaltyPrograms) => {
      if (err) {
        return callback(err, null);
      }
      
      db.query('SELECT * FROM customers', (err, customers) => {
        if (err) {
          return callback(err, null);
        }

        callback(null, {
          feedback: feedbackWithSentiment, 
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