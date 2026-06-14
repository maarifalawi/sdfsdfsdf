const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Konfigurasi Multer untuk penyimpanan sementara
const upload = multer({ dest: 'temp_uploads/' });

// Path ke folder training ML Service
const ML_SERVICE_TRAIN_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'ml_service',
  'data',
  'train'
);

/**
 * Helper: Mengekstrak path file dari URL publik Supabase
 */
function getStoragePathFromUrl(publicUrl) {
  try {
    const url = new URL(publicUrl);
    const parts = url.pathname.split('/');
    const bucketIndex = parts.indexOf('dataset');

    if (bucketIndex !== -1 && bucketIndex + 1 < parts.length) {
      return parts.slice(bucketIndex + 1).join('/');
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Helper: Memastikan direktori training berlabel tersedia
 */
async function ensureTrainPath(label) {
  const labelDir = path.join(ML_SERVICE_TRAIN_DIR, label);
  await fs.mkdir(labelDir, { recursive: true });
  return labelDir;
}

/**
 * POST /upload
 * Upload dataset
 */
router.post(
  '/upload',
  authenticateToken,
  authorizeAdmin,
  upload.array('images', 50),
  async (req, res, next) => {
    try {
      const { label } = req.body;

      if (!req.files || req.files.length === 0 || !label) {
        return res.status(400).json({
          message: 'Label dan minimal satu gambar wajib diunggah.',
        });
      }

      const supabaseInserts = [];
      const labelDir = await ensureTrainPath(label);

      for (const file of req.files) {
        const uniqueFileName = `${Date.now()}-${uuidv4()}${path.extname(
          file.originalname
        )}`;

        const storagePath = `batik/${uniqueFileName}`;

        // Read file
        const fileBuffer = await fs.readFile(file.path);

        // Upload ke Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('dataset')
          .upload(storagePath, fileBuffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Storage Error: ${uploadError.message}`);
        }

        // Ambil public URL
        const { data: urlData } = supabase.storage
          .from('dataset')
          .getPublicUrl(storagePath);

        const imageUrl = urlData.publicUrl;

        // Insert database
        supabaseInserts.push({
          image_url: imageUrl,
          label: label,
          created_at: new Date().toISOString(),
        });

        // Copy ke folder ML lokal
        const destPath = path.join(labelDir, uniqueFileName);
        await fs.copyFile(file.path, destPath);

        // Hapus temp file
        await fs.unlink(file.path);
      }

      // Simpan ke database
      const { data: dbData, error: dbError } = await supabase
        .from('datasets')
        .insert(supabaseInserts)
        .select();

      if (dbError) {
        throw new Error(`Database Error: ${dbError.message}`);
      }

      res.status(201).json({
        message: `${req.files.length} gambar berhasil ditambahkan.`,
        data: dbData,
      });
    } catch (error) {
      console.error('UPLOAD ERROR:', error);

      if (req.files) {
        for (const file of req.files) {
          if (existsSync(file.path)) {
            await fs.unlink(file.path).catch(() => {});
          }
        }
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /
 * Ambil semua dataset
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/datasets called');

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SUPABASE ERROR:', error);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.status(200).json(data || []);
  } catch (error) {
    console.error('DATASET ROUTE ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /all
 * Hapus semua dataset
 */
router.delete(
  '/all',
  authenticateToken,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const { data: datasets, error: fetchError } = await supabase
        .from('datasets')
        .select('image_url');

      if (fetchError) throw fetchError;

      if (datasets && datasets.length > 0) {
        // Hapus storage
        const storagePaths = datasets
          .map((d) => getStoragePathFromUrl(d.image_url))
          .filter((p) => p !== null);

        if (storagePaths.length > 0) {
          await supabase.storage.from('dataset').remove(storagePaths);
        }

        // Hapus database
        const { error: dbError } = await supabase
          .from('datasets')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (dbError) throw dbError;
      }

      // Bersihkan folder ML lokal
      if (existsSync(ML_SERVICE_TRAIN_DIR)) {
        await fs.rm(ML_SERVICE_TRAIN_DIR, {
          recursive: true,
          force: true,
        });

        await fs.mkdir(ML_SERVICE_TRAIN_DIR, {
          recursive: true,
        });
      }

      res.json({
        message: 'Seluruh dataset berhasil dibersihkan.',
      });
    } catch (error) {
      console.error('DELETE ALL ERROR:', error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /:id
 * Hapus satu dataset
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Ambil data
      const { data: item, error: fetchError } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({
          message: 'Dataset tidak ditemukan.',
        });
      }

      // Hapus storage
      const storagePath = getStoragePathFromUrl(item.image_url);

      if (storagePath) {
        await supabase.storage.from('dataset').remove([storagePath]);
      }

      // Hapus lokal
      const fileName = path.basename(storagePath);

      const localPath = path.join(
        ML_SERVICE_TRAIN_DIR,
        item.label,
        fileName
      );

      if (existsSync(localPath)) {
        await fs.unlink(localPath);
      }

      // Hapus database
      const { error: dbError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      res.json({
        message: 'Dataset berhasil dihapus.',
      });
    } catch (error) {
      console.error('DELETE DATASET ERROR:', error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;