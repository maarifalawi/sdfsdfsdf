// app.js (contoh)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const datasetRoutes = require('./routes/dataset');
const authRoutes = require('./routes/auth'); // Asumsi ada route untuk auth
const predictionRoutes = require('./routes/prediction'); // Import prediction routes
const db = require('./models'); // Import database connection

dotenv.config(); // Load environment variables

const app = express();

app.use(cors());
app.use(express.json()); // Untuk parsing application/json
app.use(express.urlencoded({ extended: true })); // Untuk parsing application/x-www-form-urlencoded
app.use('/public/uploads', express.static('public/uploads')); // Serve static files

// Routes
app.use('/api/datasets', datasetRoutes);
app.use('/api/auth', authRoutes); // Contoh route untuk autentikasi
app.use('/api/predictions', predictionRoutes); // Mount prediction routes

// Sinkronisasi database (hanya untuk development, jangan di production tanpa migrasi)
db.sequelize.sync()
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Failed to sync db:', err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});