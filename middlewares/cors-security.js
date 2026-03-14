const cors = require('cors');
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const devOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/;

const requiredLocalOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

for (const origin of requiredLocalOrigins) {
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
}

console.log('✅ CORS permitido para:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);
    if (isDev) return callback(null, true);

    const normalizedOrigin = typeof origin === 'string' ? origin.replace(/\/+$/, '') : origin;
    if (isDev && typeof normalizedOrigin === 'string' && devOriginRegex.test(normalizedOrigin)) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(normalizedOrigin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
