const axios = require('axios');
require('dotenv').config();

async function getHistoricalData(symbol) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
  
  try {
    const response = await axios.get(url);
    const timeSeries = response.data['Time Series (Daily)'];
    
    if (!timeSeries) return null;
    
    const dates = Object.keys(timeSeries).slice(0, 5);
    const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));
    
    return prices;
  } catch (error) {
    console.log('Error fetching historical data:', error);
    return null;
  }
}

function predictDirection(prices) {
  if (!prices || prices.length < 2) return { direction: 'NEUTRAL', confidence: 50, change: '0.00' };
  
  const latestPrice = prices[0];
  const previousPrice = prices[1];
  
  const change = ((latestPrice - previousPrice) / previousPrice) * 100;
  
  if (change > 0.5) {
    return { direction: 'UP', confidence: Math.min(change * 10, 95), change: change.toFixed(2) };
  } else if (change < -0.5) {
    return { direction: 'DOWN', confidence: Math.min(Math.abs(change) * 10, 95), change: change.toFixed(2) };
  } else {
    return { direction: 'NEUTRAL', confidence: 50, change: change.toFixed(2) };
  }
}

async function predictStock(symbol) {
  try {
    const prices = await getHistoricalData(symbol);
    if (!prices) return { direction: 'ERROR', confidence: 0, change: '0.00' };
    
    const prediction = predictDirection(prices);
    return prediction;
  } catch (error) {
    console.log('Prediction error:', error);
    return { direction: 'ERROR', confidence: 0, change: '0.00' };
  }
}

module.exports = predictStock;