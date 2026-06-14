require('dotenv').config();

const fs = require('fs');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/prediction');
const adminRoutes = require('./routes/admin');
const datasetRoutes = require('./routes/dataset');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ======================================
// CREATE UPLOADS FOLDER
// ======================================
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// ======================================
// MIDDLEWARE
// ======================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

// ======================================
// DEBUG REQUEST LOGGER
// ======================================
app.use((req, res, next) => {
  console.log('================================');
  console.log(`${req.method} ${req.url}`);
  console.log('BODY:', req.body);
  console.log('================================');

  next();
});

// ======================================
// ROOT ROUTE
// ======================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API Running'
  });
});

// ======================================
// API ROUTES
// ======================================
app.use('/api/auth', authRoutes);

app.use('/api/predictions', predictionRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/datasets', datasetRoutes);

// ======================================
// ML SERVICE PROXY ROUTES
// ======================================
const normalizeMlServiceUrl = (rawUrl) => {
  const url = rawUrl?.trim() || 'http://127.0.0.1:8000';
  return url.replace(/^http:\/\/localhost(?::(\d+))?/, 'http://127.0.0.1$1');
};

const mlServiceUrl = normalizeMlServiceUrl(process.env.ML_SERVICE_URL);
console.log('ML SERVICE URL:', mlServiceUrl);

app.get('/api/ml/analytics', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/analytics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Analytics proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch ML analytics' });
  }
});

app.get('/api/ml/training-history', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/training-history`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Training history proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch training history' });
  }
});

app.get('/api/ml/training-status', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/training-status`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Training status proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch training status' });
  }
});

app.get('/api/ml/evaluation', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/evaluation`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Evaluation proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation results' });
  }
});

app.get('/api/ml/model-metrics', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/model-metrics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Model metrics proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch model metrics' });
  }
});

// ======================================
// 404 HANDLER
// ======================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan'
  });
});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================
app.use(errorHandler);

// ======================================
// SERVER
// ======================================
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
let activePort = DEFAULT_PORT;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log('================================');
    console.log(`Backend berjalan di:`);
    console.log(`http://localhost:${port}`);
    console.log('================================');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} sudah digunakan, mencoba port ${port + 1}...`);
      activePort = port + 1;
      startServer(activePort);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
};

startServer(activePort);
