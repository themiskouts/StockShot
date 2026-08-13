const axios = require('axios');
require('dotenv').config();

const historyCache = new Map();
const HISTORY_TTL = 15 * 60 * 1000;

async function getHistoricalPrices(symbol) {
  const cached = historyCache.get(symbol);
  if (cached && Date.now() - cached.time < HISTORY_TTL) {
    return cached.value;
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const values = response.data.values;

    if (!values) return null;

    const points = values
      .map(v => ({ date: v.datetime, close: parseFloat(v.close) }))
      .reverse();

    historyCache.set(symbol, { value: points, time: Date.now() });
    return points;
  } catch (error) {
    console.log('Error fetching history:', error.message);
    return null;
  }
}

module.exports = getHistoricalPrices;