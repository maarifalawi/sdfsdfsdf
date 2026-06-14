// routes/dataset.js
const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const { authenticateAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Pastikan folder ini ada di root backend Anda
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nama file unik
  }
});
const upload = multer({ storage: storage });

// Endpoint untuk mengunggah dataset
router.post('/upload', authenticateAdmin, upload.array('images', 10), datasetController.uploadDataset); // 'images' adalah nama field di form-data, 10 adalah max file
// Endpoint untuk mendapatkan semua dataset
router.get('/', authenticateAdmin, datasetController.getDatasets);
// Endpoint untuk menghapus dataset berdasarkan ID
router.delete('/:id', authenticateAdmin, datasetController.deleteDatasetById);

module.exports = router;