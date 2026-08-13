const express = require('express');
const path = require('path');
require('dotenv').config();

const getStockPrice = require('./fetchStock');
const getHistoricalPrices = require('./fetchHistory');
const { getSuggestions, getProfile } = require('./fetchFinnhub');
const getHistoricalCandles = require('./fetchHistoryData');
const { generatePrediction } = require('./predictModel');
const { getEarningsHistory, getNextEarningsDate } = require('./fetchEarnings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// HTML Page Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Stock API Endpoint
app.get('/api/stock/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const stockData = await getStockPrice(symbol);
    
    if (stockData) {
        res.json(stockData);
    } else {
        res.status(404).json({ error: 'Stock not found' });
    }
});

// Symbol Search / Autocomplete Endpoint (Finnhub)
app.get('/api/search/:query', async (req, res) => {
    const query = req.params.query;

    if (!query || query.trim().length === 0) {
        return res.json([]);
    }

    try {
        const suggestions = await getSuggestions(query.trim());
        res.json(suggestions);
    } catch (error) {
        console.log('Error searching stocks:', error);
        res.status(500).json({ error: 'Unable to search stocks' });
    }
});

// Historical Prices Endpoint (for charting)
app.get('/api/history/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const history = await getHistoricalPrices(symbol);

    if (history) {
        res.json(history);
    } else {
        res.status(404).json({ error: 'History not found' });
    }
});

// Price Prediction Endpoint
// Company Profile Endpoint (includes logo)
app.get('/api/company/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    
    try {
        const profile = await getProfile(symbol);
        
        if (profile) {
            res.json(profile);
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (error) {
        console.log('Error fetching company profile:', error);
        res.status(500).json({ error: 'Unable to fetch company profile' });
    }
});
const { runBacktest } = require('./backtest');

app.get('/api/test-backtest/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const days = await getHistoricalCandles(symbol);

    if (!days) {
        return res.status(404).json({ error: 'No history found' });
    }

    const results = runBacktest(days, 5);
    res.json(results);
});

app.get('/api/test-features/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const days = await getHistoricalCandles(symbol);

    if (!days) {
        return res.status(404).json({ error: 'No history found' });
    }

    const prediction = generatePrediction(days);
    res.json(prediction);
});
// Price Prediction Endpoint
app.get('/api/predict/:symbol', async (req, res) => {
    const symbol = req.params.symbol;

    const days = await getHistoricalCandles(symbol);
    if (!days) {
        return res.status(400).json({ error: 'Unable to fetch prediction data' });
    }

    const earningsHistory = await getEarningsHistory(symbol);
    const nextEarningsDate = await getNextEarningsDate(symbol);

    const prediction = generatePrediction(days, earningsHistory, nextEarningsDate);

    res.json({
        symbol: symbol,
        ...prediction
    });
});

app.get('/api/test-earnings/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const apiKey = process.env.FINNHUB_API_KEY;
    const axios = require('axios');
    
    try {
        const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&token=${apiKey}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.log('Earnings fetch error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch earnings data' });
    }
});
const { earningsSurpriseAvg, daysUntilEarnings } = require('./predictModel');

app.get('/api/test-earnings-features/:symbol', async (req, res) => {
    const symbol = req.params.symbol;

    const history = await getEarningsHistory(symbol);
    const nextDate = await getNextEarningsDate(symbol);

    res.json({
        earningsSurpriseAvg: earningsSurpriseAvg(history),
        nextEarningsDate: nextDate,
        daysUntilEarnings: daysUntilEarnings(nextDate)
    });
});

app.get('/api/test-earnings-history/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const apiKey = process.env.FINNHUB_API_KEY;
    const axios = require('axios');
    
    try {
        const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${apiKey}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.log('Earnings history fetch error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch earnings history data' });
    }
});
// Start Server
app.listen(PORT, () => {
    console.log(`🚀 StockShot running at http://localhost:${PORT}`);
});

module.exports = app;