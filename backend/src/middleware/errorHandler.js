function errorHandler(err, req, res, next) {
  console.error(err.message || err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Terjadi kesalahan server.' });
}

module.exports = { errorHandler };