const db = require('../config/db');
const axios = require('axios');

const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F';
const EXCHANGE_RATE_URL = 'https://open.er-api.com/v6/latest/USD';


const EXCHANGE_RATE_API_KEY = '4ed38331d9d5e1e6a9154034';

const getFuelExchangeTrends = async (req, res) => {
    try {
        const days = req.params.days ? parseInt(req.params.days) : 30;

        const currentDate = new Date();
        const pastDate = new Date(currentDate);
        pastDate.setDate(currentDate.getDate() - days);

        const currentTimestamp = Math.floor(currentDate.getTime() / 1000);
        const pastTimestamp = Math.floor(pastDate.getTime() / 1000);

        const fuelResponse = await axios.get(`${YAHOO_FINANCE_URL}?period1=${pastTimestamp}&period2=${currentTimestamp}&interval=1d`);
        const fuelData = fuelResponse.data.chart?.result?.[0];

        if (!fuelData || !fuelData.indicators?.quote?.[0]?.close) {
            throw new Error('Petrol fiyatları çekilemedi.');
        }

        const fuelPrices = fuelData.timestamp.map((timestamp, index) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            price: fuelData.indicators.quote[0].close[index]
        }));

        const exchangeResponse = await axios.get(`${EXCHANGE_RATE_URL}?apikey=${EXCHANGE_RATE_API_KEY}`);
        const exchangeData = exchangeResponse.data;

        if (!exchangeData || exchangeData.result !== 'success' || !exchangeData.rates?.TRY) {
            throw new Error('Döviz kuru çekilemedi.');
        }

        const exchangeRates = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(currentDate);
            date.setDate(currentDate.getDate() - i);

            exchangeRates.push({
                date: date.toISOString().split('T')[0],
                rate: exchangeData.rates.TRY
            });
        }

        res.json({
            fuel_prices: fuelPrices,
            exchange_rate: exchangeRates
        });

    } catch (error) {
        console.error('Hata:', error.message);
        res.status(500).json({ error: 'Veri alınamadı', details: error.message });
    }
};

const getCompetitorPrices = async (req, res) => {
    try {
        const flightId = req.params.flight_id;

        const query = `
            SELECT 
                cp.competitor_name,
                cp.price,
                CONCAT(f.departure_city, '-', f.arrival_city) AS route
            FROM 
                competitor_prices cp
            INNER JOIN 
                flights f ON cp.flight_id = f.flight_id
            WHERE 
                cp.flight_id = ?
        `;

        db.query(query, [flightId], (err, results) => {
            if (err) {
                console.error('SQL sorgusu hatası:', err);
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Bu uçuş için rakip fiyatı bulunamadı.' });
            }
            
            res.json(results);
        });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

const getAverageOccupancyRates = async (req, res) => {
    try {
        const query = `
            SELECT 
                f.flight_id,
                f.flight_number,
                f.departure_city,
                f.arrival_city,
                f.capacity,
                COALESCE(SUM(s.number_of_tickets), 0) AS sold_tickets,
                ROUND((COALESCE(SUM(s.number_of_tickets), 0) / f.capacity) * 100, 2) AS occupancy_rate
            FROM 
                flights f
            LEFT JOIN 
                sales s ON f.flight_id = s.flight_id
            GROUP BY 
                f.flight_id, f.flight_number, f.departure_city, f.arrival_city, f.capacity
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Doluluk oranları alınamadı:', err);
                return res.status(500).json({ error: 'Veri alınamadı' });
            }

            res.json({ occupancyRates: results });
        });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

const getFlightsByOccupancy = async (req, res) => {
    try {
        const { type = 'highest' } = req.params; 
        if (type !== 'highest' && type !== 'lowest') {
            return res.status(400).json({ error: 'Geçersiz parametre. "highest" veya "lowest" kullanın.' });
        }

        const order = type === 'highest' ? 'DESC' : 'ASC';

        const query = `
            SELECT 
                f.flight_id,
                f.flight_number,
                f.departure_city,
                f.arrival_city,
                f.capacity,
                COALESCE(SUM(s.number_of_tickets), 0) AS sold_tickets,
                ROUND((COALESCE(SUM(s.number_of_tickets), 0) / f.capacity) * 100, 2) AS occupancy_rate
            FROM 
                flights f
            LEFT JOIN 
                sales s ON f.flight_id = s.flight_id
            GROUP BY 
                f.flight_id, f.flight_number, f.departure_city, f.arrival_city, f.capacity
            ORDER BY 
                occupancy_rate ${order}
            LIMIT 5
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Uçuşlar alınamadı:', err);
                return res.status(500).json({ error: 'Veri alınamadı' });
            }

            res.json({ flights: results });
        });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

const getCustomerSatisfactionScores = async (req, res) => {
    try {
        const query = `
            SELECT 
                membership_type,
                COUNT(customer_id) AS total_customers,
                AVG(loyalty_score) AS avg_loyalty_score
            FROM 
                customers
            GROUP BY 
                membership_type
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Müşteri verileri alınamadı:', err);
                return res.status(500).json({ error: 'Veri alınamadı' });
            }
            const satisfactionScores = results.map(row => ({
                membership_type: row.membership_type,
                total_customers: row.total_customers,
                avg_loyalty_score: parseFloat(row.avg_loyalty_score).toFixed(2)
            }));

            res.json({ satisfactionScores });
        });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

module.exports = {getFuelExchangeTrends,getAverageOccupancyRates,getFlightsByOccupancy,getCustomerSatisfactionScores,getCompetitorPrices};
