const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token JWT lipsește' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token JWT invalid' });

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token JWT expirat sau invalid' });
  }
};
