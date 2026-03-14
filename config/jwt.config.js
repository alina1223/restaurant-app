module.exports = {
  secret: process.env.JWT_SECRET || 'secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256'
};