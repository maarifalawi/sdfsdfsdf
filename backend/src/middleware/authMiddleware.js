const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('TOKEN:', token);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    console.log('DECODED:', decoded);

    if (err) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau expired.' });
    }

    req.user = decoded;
    next();
  });
}

module.exports = { authenticateToken };