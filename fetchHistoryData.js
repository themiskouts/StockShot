const axios = require('axios');
require('dotenv').config();

async function getHistoricalCandles(symbol) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  // outputsize = how many daily candles to fetch (we want 60+ trading days)
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=90&apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    // Twelve Data returns { status: "error", message: "..." } when something's wrong
    if (data.status === 'error' || !data.values) {
      console.log(`Twelve Data error for ${symbol}:`, data.message || data);
      return null;
    }

    if (data.values.length < 25) {
      console.log(`Not enough historical data for ${symbol}`);
      return null;
    }

    // Twelve Data returns newest-first, so we reverse it to oldest-first
    // (makes it easier to calculate things like "5 days ago" later)
    const days = data.values
      .map(day => ({
        date: day.datetime,
        close: parseFloat(day.close),
        volume: parseInt(day.volume)
      }))
      .reverse();

    return days;
  } catch (error) {
    console.log('Error fetching historical candles:', error);
    return null;
  }
}

module.exports = getHistoricalCandles;