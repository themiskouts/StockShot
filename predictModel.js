// Helper: % change from oldValue to newValue
// Example: percentChange(100, 110) = +10 (meaning +10%)
function percentChange(oldValue, newValue) {
  return ((newValue - oldValue) / oldValue) * 100;
}

// Feature 1: Momentum over the last N trading days
// "How much has the price moved in the last N days?"
function momentum(days, period) {
  const recent = days[days.length - 1].close;           // most recent close
  const past = days[days.length - 1 - period].close;    // close N days ago
  return percentChange(past, recent);
}

// Feature 2: Simple Moving Average (SMA) over the last N days
// "What's the average closing price over the last N days?"
function simpleMovingAverage(days, period) {
  const recentDays = days.slice(days.length - period);
  const sum = recentDays.reduce((total, day) => total + day.close, 0);
  return sum / period;
}

// Feature 3: Distance from moving average
// "Is the current price stretched far above/below its normal recent range?"
function distanceFromMovingAverage(days, period) {
  const currentPrice = days[days.length - 1].close;
  const average = simpleMovingAverage(days, period);
  return percentChange(average, currentPrice);
}

// Feature 4: Volatility (standard deviation of daily returns)
// "How wildly does this stock swing day to day?"
function volatility(days, period) {
  const recentDays = days.slice(days.length - period);

  // Step A: calculate each day's % change from the day before
  const dailyReturns = [];
  for (let i = 1; i < recentDays.length; i++) {
    const change = percentChange(recentDays[i - 1].close, recentDays[i].close);
    dailyReturns.push(change);
  }

  // Step B: calculate the average daily return
  const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

  // Step C: calculate how far each day's return was from that average, squared
  const squaredDiffs = dailyReturns.map(r => Math.pow(r - avgReturn, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / squaredDiffs.length;

  // Step D: square root brings it back to a normal, readable scale
  return Math.sqrt(avgSquaredDiff);
}

// Feature 5: Volume trend
// "Is recent trading volume higher or lower than the stock's normal volume?"
function volumeTrend(days, recentPeriod, comparisonPeriod) {
  const recentDays = days.slice(days.length - recentPeriod);
  const comparisonDays = days.slice(days.length - comparisonPeriod);

  const recentAvgVolume = recentDays.reduce((sum, d) => sum + d.volume, 0) / recentDays.length;
  const comparisonAvgVolume = comparisonDays.reduce((sum, d) => sum + d.volume, 0) / comparisonDays.length;

  return percentChange(comparisonAvgVolume, recentAvgVolume);
}
// Feature 6: Average earnings surprise over recent quarters
// "Has this company been beating or missing expectations lately?"
function earningsSurpriseAvg(earningsHistory) {
  if (!earningsHistory || earningsHistory.length === 0) {
    return 0; // no data = neutral, don't guess
  }

  const surprises = earningsHistory.map(q => q.surprisePercent).filter(s => s !== null && s !== undefined);
  if (surprises.length === 0) return 0;

  const sum = surprises.reduce((total, s) => total + s, 0);
  return sum / surprises.length;
}

// Feature 7: Days until next earnings report
// "Is a potentially volatile earnings event coming up soon?"
function daysUntilEarnings(nextEarningsDateStr) {
  if (!nextEarningsDateStr) {
    return null; // unknown, we'll handle this case separately
  }

  const today = new Date();
  const earningsDate = new Date(nextEarningsDateStr);
  const diffTime = earningsDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
// Combines all features into one final prediction
function generatePrediction(days, earningsHistory = null, nextEarningsDateStr = null) {
  // Step 1: calculate each raw feature
  const mom5 = momentum(days, 5);
  const mom20 = momentum(days, 20);
  const distMA = distanceFromMovingAverage(days, 20);
  const vol = volatility(days, 20);
  const volTrend = volumeTrend(days, 5, 20);
  const earningsSurprise = earningsSurpriseAvg(earningsHistory);
  const daysToEarnings = daysUntilEarnings(nextEarningsDateStr);

  // Step 2: define our weights (how much each feature counts)
  const weights = {
    momentum5: 0.15,
    momentum20: 0.25,
    distanceFromMA: -0.20,   // negative = mean reversion effect
    volumeBoost: 0.05,       // small multiplier effect, explained below
    earningsSurprise: 0.03   // light weight, this is a slow-moving company-health signal
  };

  // Step 3: combine into a raw predicted % change
  let predictedChange =
    (mom5 * weights.momentum5) +
    (mom20 * weights.momentum20) +
    (distMA * weights.distanceFromMA) +
    (earningsSurprise * weights.earningsSurprise);

  // Step 4: if volume is unusually high AND momentum agrees with it,
  // slightly amplify the prediction (more attention = more conviction)
  if (Math.abs(volTrend) > 20) {
    const volumeBoost = (volTrend / 100) * weights.volumeBoost * mom5;
    predictedChange += volumeBoost;
  }

  // Step 5: calculate confidence
  // Higher volatility = less predictable = lower confidence
  let confidence = 100 - (vol * 12);

  // Step 6: if earnings are coming up SOON (within our 5-day horizon or close to it),
  // reduce confidence further - an earnings surprise can override everything else
  let earningsRisk = false;
  if (daysToEarnings !== null && daysToEarnings >= 0 && daysToEarnings <= 7) {
    confidence -= 15;
    earningsRisk = true;
  }

  confidence = Math.max(20, Math.min(85, confidence)); // clamp between 20% and 85%

  return {
    predictedChangePercent: parseFloat(predictedChange.toFixed(2)),
    horizonDays: 5,
    confidence: Math.round(confidence),
    earningsRisk: earningsRisk,
    features: {
      momentum5: parseFloat(mom5.toFixed(2)),
      momentum20: parseFloat(mom20.toFixed(2)),
      distanceFromMA20: parseFloat(distMA.toFixed(2)),
      volatility20: parseFloat(vol.toFixed(2)),
      volumeTrend: parseFloat(volTrend.toFixed(2)),
      earningsSurpriseAvg: parseFloat(earningsSurprise.toFixed(2)),
      daysUntilEarnings: daysToEarnings
    }
  };
}
module.exports = {
  momentum,
  simpleMovingAverage,
  distanceFromMovingAverage,
  volatility,
  volumeTrend,
  generatePrediction,
  earningsSurpriseAvg,
  daysUntilEarnings
};