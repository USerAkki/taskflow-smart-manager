const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDemoData = require('./utils/seedDemoData');

dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// ── Health check (Railway uses this to verify the service is up) ──────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'TaskFlow API running',
    db: require('mongoose').connection.readyState === 1 ? 'connected' : 'connecting'
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ── 404 handler — catches any unmatched route ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler — catches any thrown errors from route handlers ───────
// Must have 4 params so Express recognises it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.message || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// ── Start server immediately — do NOT wait for DB ─────────────────────────────
// This ensures Railway's health check can succeed even if MongoDB is slow.
// DB reconnect happens in the background via connectDB retry logic.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});

// Kick off DB connection in background (non-blocking)
connectDB().then(async () => {
  if (process.env.SEED_DB === 'true') {
    try {
      await seedDemoData();
      console.log('[Seed] Demo data seeded successfully');
    } catch (err) {
      console.error('[Seed] Failed to seed demo data:', err.message);
    }
  }
}).catch(() => {
  // connectDB already logs and retries — nothing else to do here
});