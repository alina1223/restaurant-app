module.exports = {
  host: (process.env.EMAIL_HOST || 'smtp.gmail.com').trim(),
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  
  auth: {
    user: (process.env.EMAIL_USER || '').trim(),
    pass: (process.env.EMAIL_PASSWORD || '').trim()
  },
  
  from: process.env.EMAIL_FROM || '"Restaurant App" <noreply@restaurant-app.com>',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  tls: {
    rejectUnauthorized: false
  }
};