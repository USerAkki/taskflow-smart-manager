const mongoose = require('mongoose');

// Maximum delay between retries (ms)
const MAX_RETRY_DELAY_MS = 30000;

/**
 * Connects to MongoDB with exponential-backoff retry.
 * The server starts independently — this runs in the background.
 * @param {number} attempt - current attempt number (used for backoff)
 */
async function connectDB(attempt = 1) {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[DB] MONGO_URI is not defined in environment variables. Skipping connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // Exponential backoff: 2s, 4s, 8s, 16s … capped at 30s
    const delay = Math.min(2000 * Math.pow(2, attempt - 1), MAX_RETRY_DELAY_MS);
    console.error(`[DB] Connection failed (attempt ${attempt}): ${err.message}`);
    console.log(`[DB] Retrying in ${delay / 1000}s...`);

    await new Promise(resolve => setTimeout(resolve, delay));
    return connectDB(attempt + 1);
  }
}

module.exports = connectDB;