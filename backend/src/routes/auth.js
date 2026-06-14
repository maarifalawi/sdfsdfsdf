require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const supabase = require('../services/supabaseClient');

const router = express.Router();

// =====================================
// LOGIN ADMIN
// =====================================
router.post('/login', async (req, res) => {
  try {

    // =====================================
    // AMBIL DATA DARI BODY
    // =====================================
    const email = (req.body?.email || '').toString().trim().toLowerCase();
    const password = (req.body?.password || '').toString();

    console.log('================================');
    console.log('LOGIN BODY:', req.body);
    console.log('EMAIL:', email);
    console.log('PASSWORD PROVIDED:', Boolean(password));
    console.log('================================');

    // =====================================
    // VALIDASI INPUT
    // =====================================
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('AUTH ERROR: JWT_SECRET is missing');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // =====================================
    // CARI USER DI DATABASE
    // =====================================
    const { data: userData, error } = await supabase
      .from('users')
      .select('id,email,password,role')
      .eq('email', email)
      .maybeSingle();

    console.log('================================');
    console.log('EMAIL LOGIN:', email);
    console.log('USER RESULT:', userData);
    console.log('QUERY ERROR:', error);
    console.log('================================');

    // =====================================
    // JIKA USER TIDAK ADA
    // =====================================
    if (error) {
      console.error('AUTH ERROR:', error);
      return res.status(500).json({
        success: false,
        message: 'Server database error',
        error: error.message
      });
    }

    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // =====================================
    // VALIDASI ROLE ADMIN
    // =====================================
    if (userData.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bukan akun admin'
      });
    }

    // =====================================
    // CEK PASSWORD
    // =====================================
    if (!userData.password) {
      console.error('AUTH ERROR: stored password hash is missing');
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    console.log('================================');
    console.log('PASSWORD INPUT:', password);
    console.log('PASSWORD HASH DB:', userData.password);
    console.log('PASSWORD MATCH:', passwordMatch);
    console.log('================================');

    // =====================================
    // PASSWORD SALAH
    // =====================================
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // =====================================
    // GENERATE JWT TOKEN
    // =====================================
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    console.log('JWT TOKEN:', token);

    // =====================================
    // LOGIN BERHASIL
    // =====================================
    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role
      }
    });

  } catch (error) {

    console.error('================================');
    console.error('AUTH LOGIN ERROR');
    console.error(error);
    console.error('================================');

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// =====================================
// VERIFY TOKEN
// =====================================
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalid'
    });
  }
});

module.exports = router;