const express = require('express');
const path = require('path');
require('dotenv').config();

const getStockPrice = require('./fetchStock');
const { register, login } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// HTML Page Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Added: Explicit login route so http://localhost:3000/login works!
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

// Price Prediction Endpoint
app.get('/api/predict/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const stockData = await getStockPrice(symbol);

    if (!stockData || !stockData.changePercent) {
        return res.status(400).json({ error: 'Unable to fetch prediction data' });
    }

    const changeVal = parseFloat(stockData.changePercent.replace('%', ''));
    let direction = 'NEUTRAL';
    let confidence = 50;

    if (changeVal > 0) {
        direction = 'UP';
        confidence = Math.min(50 + Math.abs(changeVal) * 5, 95);
    } else if (changeVal < 0) {
        direction = 'DOWN';
        confidence = Math.min(50 + Math.abs(changeVal) * 5, 95);
    }

    res.json({
        symbol: symbol,
        direction: direction,
        confidence: confidence,
        change: changeVal
    });
});

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    const result = await register(email, password);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await login(email, password);

    if (result.success) {
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 StockShot running at http://localhost:${PORT}`);
});