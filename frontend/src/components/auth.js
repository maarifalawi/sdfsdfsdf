// middleware/auth.js
const jwt = require('jsonwebtoken');

exports.authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    // Ganti 'YOUR_SECRET_KEY' dengan kunci rahasia yang sama yang digunakan untuk menandatangani token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    // Asumsi token berisi informasi user dan role, misalnya { id: '...', role: 'admin' }
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }
    req.user = decoded; // Tambahkan payload token ke objek request
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ message: 'Token tidak valid.' });
  }
};