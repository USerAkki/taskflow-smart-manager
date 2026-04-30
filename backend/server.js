const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDemoData = require('./utils/seedDemoData');

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/project', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'TaskFlow API running' }));

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedDemoData();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
