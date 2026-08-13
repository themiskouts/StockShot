const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://finnhub.io/api/v1';

const searchCache = new Map();
const quoteCache = new Map();
const profileCache = new Map();

const SEARCH_TTL = 30 * 1000;
const QUOTE_TTL = 15 * 1000;
const PROFILE_TTL = 24 * 60 * 60 * 1000;

function getCached(cache, key, ttl) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < ttl) {
    return entry.value;
  }
  return null;
}

function setCached(cache, key, value) {
  cache.set(key, { value, time: Date.now() });
}

async function searchSymbols(query) {
  const cached = getCached(searchCache, query, SEARCH_TTL);
  if (cached) return cached;

  const apiKey = process.env.FINNHUB_API_KEY;
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${apiKey}`;

  const response = await axios.get(url);
  const results = (response.data.result || [])
    .filter(item => item.symbol && !item.symbol.includes('.'))
    .slice(0, 5);

  setCached(searchCache, query, results);
  return results;
}

async function getQuote(symbol) {
  const cached = getCached(quoteCache, symbol, QUOTE_TTL);
  if (cached) return cached;

  const apiKey = process.env.FINNHUB_API_KEY;
  const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

  const response = await axios.get(url);
  const data = response.data;

  const quote = {
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    isUp: typeof data.d === 'number' ? data.d >= 0 : null
  };

  setCached(quoteCache, symbol, quote);
  return quote;
}

async function getProfile(symbol) {
  const cached = getCached(profileCache, symbol, PROFILE_TTL);
  if (cached) return cached;

  const apiKey = process.env.FINNHUB_API_KEY;
  const url = `${BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

  const response = await axios.get(url);
  const data = response.data || {};

  const profile = {
    name: data.name || null,
    logo: data.logo || null
  };

  setCached(profileCache, symbol, profile);
  return profile;
}

async function getSuggestions(query) {
  const matches = await searchSymbols(query);

  const suggestions = await Promise.all(matches.map(async (match) => {
    try {
      const [quote, profile] = await Promise.all([
        getQuote(match.symbol).catch(() => null),
        getProfile(match.symbol).catch(() => null)
      ]);

      return {
        symbol: match.symbol,
        name: (profile && profile.name) || match.description || match.symbol,
        logo: (profile && profile.logo) || null,
        price: quote ? quote.price : null,
        change: quote ? quote.change : null,
        changePercent: quote ? quote.changePercent : null,
        isUp: quote ? quote.isUp : null
      };
    } catch (error) {
      return {
        symbol: match.symbol,
        name: match.description || match.symbol,
        logo: null,
        price: null,
        change: null,
        changePercent: null,
        isUp: null
      };
    }
  }));

  return suggestions;
}

module.exports = { getSuggestions, getProfile };
