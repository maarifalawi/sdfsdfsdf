const express = require('express');
const axios = require('axios');
const supabase = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authenticateToken, authorizeAdmin);

const DEFAULT_MODEL_VERSION = 'v2.1';

// Global variable fallback untuk ML Service
const normalizeMlServiceUrl = (rawUrl) => {
  const url = rawUrl?.trim() || 'http://127.0.0.1:8000';
  return url.replace(/^http:\/\/localhost(?::(\d+))?/, 'http://127.0.0.1$1');
};

const DEFAULT_ML_URL = normalizeMlServiceUrl(process.env.ML_SERVICE_URL);
console.log('ML SERVICE CONFIGURATION:', DEFAULT_ML_URL);

/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log('GET /api/admin/dashboard called');

    const [
      { count: totalPredictions, error: predError },
      { count: totalDatasets, error: dataError }
    ] = await Promise.all([
      supabase
        .from('batik_predictions')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('datasets')
        .select('*', { count: 'exact', head: true })
    ]);

    if (predError) {
      console.error('PREDICTION ERROR:', predError);

      return res.status(500).json({
        success: false,
        error: predError.message
      });
    }

    if (dataError) {
      console.error('DATASET ERROR:', dataError);

      return res.status(500).json({
        success: false,
        error: dataError.message
      });
    }

    const { data: latestPredictions, error: latestError } =
      await supabase
        .from('batik_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (latestError) {
      console.error('LATEST ERROR:', latestError);

      return res.status(500).json({
        success: false,
        error: latestError.message
      });
    }

    // Ambil metric model terbaru (accuracy) untuk successRate
    let successRate = 0;
    try {
      const { data: metricsData, error: metricsError } = await supabase
        .from('model_metrics')
        .select('accuracy')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!metricsError && metricsData && metricsData.length > 0) {
        const acc = metricsData[0].accuracy || 0;
        // jika disimpan sebagai 0-1, konversi ke persen
        successRate = acc > 1 ? Math.round(acc) : Math.round(acc * 100);
      }
    } catch (err) {
      console.error('METRICS FETCH ERROR:', err);
    }

    res.status(200).json({
      totalPredictions: totalPredictions || 0,
      totalDatasets: totalDatasets || 0,
      latestPredictions: latestPredictions || [],
      modelStatus: 'Ready',
      modelVersion: latestPredictions?.[0]?.model_version || DEFAULT_MODEL_VERSION,
      successRate
    });

  } catch (error) {
    console.error('DASHBOARD ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/train
 */
router.post('/train', async (req, res) => {
  try {
    console.log('==============================');
    console.log('TRAINING DIMULAI');
    console.log('==============================');

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

    const { data: datasets, error: dbError } = await supabase
      .from('datasets')
      .select('label');

    if (dbError) {
      console.error('DATABASE ERROR:', dbError);

      return res.status(500).json({
        success: false,
        error: dbError.message
      });
    }

    const uniqueLabels = [
      ...new Set((datasets || []).map((d) => d.label))
    ];

    console.log('LABEL:', uniqueLabels);

    const trainUrl = `${mlServiceUrl.replace(/\/$/, '')}/train`;
    
    console.log('TRAIN URL:', trainUrl);
    console.log('ML SERVICE URL:', mlServiceUrl);

    const response = await axios.post(
      trainUrl,
      {},
      {
        timeout: 600000, // 10 Menit untuk training TensorFlow
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('ML RESPONSE:', response.data);

    const metrics = response.data.metrics;

    // Simpan metrics
    if (metrics) {
      const { error: metricError } = await supabase
        .from('model_metrics')
        .insert([
          {
            accuracy: metrics.accuracy || 0,
            loss: metrics.loss || 0,
            created_at: new Date().toISOString()
          }
        ]);

      if (metricError) {
        console.error('METRIC ERROR:', metricError);
      }
    }

    res.status(200).json({
      message: response.data?.message || 'Training selesai',
      metrics: metrics || null
    });

  } catch (error) {
    console.error('================================');
    console.error('TRAINING ERROR');
    console.error(error);
    console.error('================================');

    if (error.response) {
      console.error('ML Service Response Status:', error.response.status);
      console.error('ML Service Response Data:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'ML Service Error',
        detail: error.response.data
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(500).json({
        success: false,
        message: 'ML Service tidak berjalan. Pastikan service FastAPI di folder ml_service dijalankan sebelum training.',
        detail: {
          serviceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
          command: 'cd ml_service && python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000'
        },
        code: 'ECONNREFUSED'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Training timeout - ML Service tidak merespons dalam waktu 10 menit',
        detail: {
          serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000'
        },
        code: error.code
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

/**
 * GET /api/admin/predictions/history
 */
router.get('/predictions/history', async (req, res) => {
  try {
    console.log('GET HISTORY');

    const { data, error } = await supabase
      .from('batik_predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('HISTORY ERROR:', error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json(data || []);

  } catch (error) {
    console.error('HISTORY SERVER ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/predictions/history
 */
router.delete('/predictions/history', async (req, res) => {
  try {
    const { error } = await supabase
      .from('batik_predictions')
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.error('DELETE HISTORY ERROR:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Riwayat klasifikasi berhasil dihapus.'
    });
  } catch (error) {
    console.error('DELETE HISTORY SERVER ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/performance
 */
router.get('/performance', async (req, res) => {
  try {
    console.log('GET PERFORMANCE');

    const { data, error } = await supabase
      .from('model_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('PERFORMANCE ERROR:', error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json(
      data?.[0] || {
        accuracy: 0,
        loss: 0,
        updated_at: null
      }
    );

  } catch (error) {
    console.error('PERFORMANCE SERVER ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;