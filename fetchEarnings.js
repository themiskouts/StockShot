const axios = require('axios');
require('dotenv').config();

// Gets the last 4 quarters of earnings beat/miss history
async function getEarningsHistory(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY;
  const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // Finnhub already gives us the 4 most recent quarters, newest first
    return data;
  } catch (error) {
    console.log('Error fetching earnings history:', error);
    return null;
  }
}

// Gets the NEXT upcoming earnings date for this symbol
async function getNextEarningsDate(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY;

  // We ask for a window from today to 90 days ahead
  const today = new Date().toISOString().split('T')[0];
  const future = new Date();
  future.setDate(future.getDate() + 90);
  const futureDate = future.toISOString().split('T')[0];

  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${today}&to=${futureDate}&symbol=${symbol}&token=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!data.earningsCalendar || data.earningsCalendar.length === 0) {
      return null;
    }

    // Return the soonest upcoming date
    return data.earningsCalendar[0].date;
  } catch (error) {
    console.log('Error fetching next earnings date:', error);
    return null;
  }
}

module.exports = { getEarningsHistory, getNextEarningsDate };