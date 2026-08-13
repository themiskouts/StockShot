const axios = require('axios');
require('dotenv').config();

async function getStockPrice(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY;
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!data || data.c === 0) return null;

    return {
      symbol: symbol,
      price: data.c.toFixed(2),
      change: data.d ? data.d.toFixed(2) : '0.00',
      changePercent: data.dp ? data.dp.toFixed(2) + '%' : '0.00%'
    };
  } catch (error) {
    console.log('Error fetching stock:', error);
    return null;
  }
}

module.exports = getStockPrice; 