function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses admin diperlukan.' });
  }
  next();
}

module.exports = { authorizeAdmin };