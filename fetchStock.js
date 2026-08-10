const axios = require('axios');
require('dotenv').config();

async function getStockPrice(symbol) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  
  try {
    const response = await axios.get(url);
    const data = response.data['Global Quote'];
    return {
      symbol: data['01. symbol'],
      price: data['05. price'],
      change: data['09. change'],
      changePercent: data['10. change percent']
    };
  } catch (error) {
    console.log('Error fetching stock:', error);
    return null;
  }
}

module.exports = getStockPrice;