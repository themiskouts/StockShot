const { generatePrediction } = require('./predictModel');

// Tests the model at ONE point in the past
function backtestSinglePoint(days, pretendTodayIndex, horizonDays) {
  // Step 1: Slice the data so we ONLY see days up to "pretend today"
  // This is the critical line that prevents lookahead bias
  const dataAvailableThen = days.slice(0, pretendTodayIndex + 1);

  // Step 2: We need enough history before this point to calculate features
  // (remember, distanceFromMovingAverage needs at least 20 days)
  if (dataAvailableThen.length < 25) {
    return null; // not enough history yet, skip this point
  }

  // Step 3: We need enough FUTURE data to check the actual result
  const futureIndex = pretendTodayIndex + horizonDays;
  if (futureIndex >= days.length) {
    return null; // not enough future data yet, skip this point
  }

  // Step 4: Generate the prediction using ONLY past data
  const prediction = generatePrediction(dataAvailableThen);

  // Step 5: Look up what ACTUALLY happened (we're allowed to peek now)
  const priceAtPredictionTime = days[pretendTodayIndex].close;
  const priceAtFutureTime = days[futureIndex].close;
  const actualChangePercent = ((priceAtFutureTime - priceAtPredictionTime) / priceAtPredictionTime) * 100;

  // Step 6: Compare prediction vs reality
  const error = Math.abs(prediction.predictedChangePercent - actualChangePercent);

  const predictedDirection = prediction.predictedChangePercent >= 0 ? 'UP' : 'DOWN';
  const actualDirection = actualChangePercent >= 0 ? 'UP' : 'DOWN';
  const directionCorrect = predictedDirection === actualDirection;

  return {
    date: days[pretendTodayIndex].date,
    predicted: prediction.predictedChangePercent,
    actual: parseFloat(actualChangePercent.toFixed(2)),
    error: parseFloat(error.toFixed(2)),
    directionCorrect: directionCorrect,
    confidence: prediction.confidence
  };
}

// Runs the backtest across MANY points in the same stock's history
function runBacktest(days, horizonDays = 5) {
  const results = [];

  // Start at day 25 (minimum needed for features) and go until
  // we run out of future data to check against
  for (let i = 25; i < days.length - horizonDays; i++) {
    const result = backtestSinglePoint(days, i, horizonDays);
    if (result) {
      results.push(result);
    }
  }

  // Calculate summary statistics
  const avgError = results.reduce((sum, r) => sum + r.error, 0) / results.length;
  const correctDirections = results.filter(r => r.directionCorrect).length;
  const directionAccuracy = (correctDirections / results.length) * 100;

  return {
    totalPredictions: results.length,
    averageError: parseFloat(avgError.toFixed(2)),
    directionAccuracy: parseFloat(directionAccuracy.toFixed(1)),
    details: results
  };
}

module.exports = { runBacktest };