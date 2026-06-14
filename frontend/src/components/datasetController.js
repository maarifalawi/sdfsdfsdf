const db = require('../models'); // Asumsi menggunakan ORM seperti Sequelize atau database helper
const fs = require('fs').promises;
const path = require('path');

exports.uploadDataset = async (req, res) => {
  try {
    const { label } = req.body;
    const files = req.files; // Asumsi menggunakan middleware seperti multer untuk handle upload

    if (!label || !files || files.length === 0) {
      return res.status(400).json({ message: 'Label dan gambar diperlukan.' });
    }

    const newDatasets = files.map(file => ({
      label: label,
      image_url: `/uploads/${file.filename}`, // Sesuaikan dengan path penyimpanan file Anda
      // Tambahkan field lain jika ada, misalnya confidence_score, created_at
      created_at: new Date(),
    }));

    // Simpan ke database
    const createdDatasets = await db.Dataset.bulkCreate(newDatasets); // Asumsi ada metode bulkCreate

    return res.status(201).json({
      success: true,
      message: `${files.length} gambar berhasil ditambahkan.`,
      datasets: createdDatasets,
    });
  } catch (error) {
    console.error('Error uploading dataset:', error);
    return res.status(500).json({ message: 'Gagal mengunggah dataset.' });
  }
};

exports.getDatasets = async (req, res) => {
  try {
    const datasets = await db.Dataset.findAll(); // Ambil semua dataset
    return res.status(200).json(datasets);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return res.status(500).json({ message: 'Gagal mengambil dataset.' });
  }
};

exports.deleteDatasetById = async (req, res) => {
  try {
    const { id } = req.params;
    const dataset = await db.Dataset.findByPk(id); // Cari dataset berdasarkan ID

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset tidak ditemukan.' });
    }

    // Hapus file fisik terkait jika ada
    const filePath = path.join(__dirname, '../../public/uploads', path.basename(dataset.image_url));
    try {
      await fs.unlink(filePath);
      console.log(`File ${filePath} berhasil dihapus.`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Gagal menghapus file terkait: ${filePath}`, err);
      } else {
        console.warn(`File ${filePath} tidak ditemukan saat menghapus dataset, melanjutkan.`);
      }
    }

    await dataset.destroy(); // Hapus dari database

    return res.status(200).json({ message: 'Dataset berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    return res.status(500).json({ message: 'Gagal menghapus dataset.' });
  }
};