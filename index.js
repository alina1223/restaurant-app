const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

const sequelize = require('./config/database');


const corsSecurityMiddleware = require('./middlewares/cors-security');
const requestIdMiddleware = require('./middlewares/request-id');
const rateLimitMiddleware = require('./middlewares/rate-limit');
const responseFormatterMiddleware = require('./middlewares/response-formatter');


const User = require('./models/User');
const Product = require('./models/Product');
const { Cart, CartItem } = require('./models/Cart');
const Review = require('./models/review');


Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });

Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });


Cart.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

CartItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(CartItem, { foreignKey: 'productId' });


const authEmailRoutes = require('./routes/auth-email.routes');
const { router: productRoutes } = require('./products/products');
const { router: userRoutes } = require('./users/users');
const adminRoutes = require('./admin/admin');
const intermediaryRoutes = require('./intermediary/intermediary.routes');


app.use(requestIdMiddleware);
app.use(corsSecurityMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitMiddleware());
app.use(responseFormatterMiddleware);

// Servire fișiere statice pentru imagini
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    const bodyStr = JSON.stringify(req.body, null, 2);
    console.log('Body:', bodyStr.length > 200 ? bodyStr.substring(0, 200) + '...' : bodyStr);
  }
  next();
});


app.use('/auth', authEmailRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/api/intermediary', intermediaryRoutes);

app.get('/verify-email/:token', async (req, res) => {
  try {
    const token = req.params.token;
    console.log(`🔗 Accesat link de verificare email: ${token}`);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  
    return res.redirect(302, `${frontendUrl}/verify-email/${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Error in verify-email route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Restaurant API',
    version: '2.0.0',
    features: [
      'JWT Authentication',
      'Email Verification Required',
      'Role-Based Access Control',
      'Product Management',
      'User Management',
      'Admin Dashboard'
    ],
    database: 'Connected',
    emailService: process.env.EMAIL_USER ? 'Configured' : 'Simulation Mode'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🏪 Bun venit la Restaurant API!',
    version: '2.0.0',
    description: 'API pentru gestionarea restaurantului cu verificare email obligatorie',
    documentation: {
      authentication: {
        register: 'POST /auth/register - Înregistrare cu verificare email',
        verifyEmail: 'POST /auth/verify-email - Verificare email',
        resendVerification: 'POST /auth/resend-verification - Retrimitere email verificare',
        login: 'POST /auth/login - Autentificare',
        verifyToken: 'GET /auth/verify-token - Verificare token'
      },
      products: {
        list: 'GET /products/list - Listare produse',
        details: 'GET /products/details/:id - Detalii produs',
        search: 'GET /products/search - Căutare produse'
      },
      users: {
        profile: 'GET /users/profile/:id - Profil utilizator',
        update: 'PUT /users/edit/:id - Actualizare profil'
      },
      admin: {
        reportProducts: 'GET /admin/report/products - Raport produse',
        reportUsers: 'GET /admin/report/users - Raport utilizatori',
        importProducts: 'POST /admin/products/import - Import CSV',
        exportProducts: 'GET /admin/products/export - Export CSV'
      }
    },
    healthCheck: 'GET /health',
    testEmailVerification: 'GET /verify-email/:token'
  });
});


app.post('/test-register', async (req, res) => {
  try {
    const { name, email, password, phone, age } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const testData = {
      name: name || 'Test User',
      email: email,
      password: password || 'test123456',
      phone: phone || '069123456',
      age: age || 25,
      role: 'user'
    };
    
  
    const response = await require('./services/auth-email-verification.service').register(testData);
    
    res.json({
      message: 'Test registration initiated',
      data: response,
      note: 'Check server console for verification link'
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      '/',
      '/health',
      '/auth/register',
      '/auth/login',
      '/auth/verify-email',
      '/products/list',
      '/admin/report/products'
    ]
  });
});


async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexiune la baza de date reușită');
    return true;
  } catch (error) {
    console.error('❌ Eroare conexiune baza de date:', error.message);
    return false;
  }
}

async function checkDatabaseStructure() {
  try {
    
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'status'
    `);
    
    if (results.length === 0) {
      console.log('ℹ️  Coloana "status" nu există în tabela users');
      console.log('   Se va adăuga automat la prima înregistrare');
    } else {
      console.log('✅ Coloana "status" există în baza de date');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Eroare la verificarea structurii bazei de date:', error.message);
    return false;
  }
}


async function startServer() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Pornire Restaurant API');
  console.log('='.repeat(60) + '\n');
  
 
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Nu se poate porni serverul fără conexiune la baza de date');
    process.exit(1);
  }
  
 
  try {
    await sequelize.sync({ alter: false });
    console.log('✅ Modele sincronizate cu baza de date');
    
    // Try to add imagePath column if missing
    try {
      await sequelize.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS "imagePath" VARCHAR(255)');
      console.log('✅ Coloana imagePath verificata/adaugata');
    } catch (e) {
      console.log('ℹ️ imagePath deja exista sau eroare minora:', e.message.substring(0, 50));
    }
  } catch (error) {
    console.error('❌ Eroare la sincronizare:', error.message);
  }
  

  await checkDatabaseStructure();
  
  const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Serverul rulează la http://localhost:${PORT}`);
    console.log('='.repeat(60));
    
    console.log('\n📋 ENDPOINTS DISPONIBILE:');
    console.log('   🌐 Frontpage: http://localhost:' + PORT);
    console.log('   🏥 Health: http://localhost:' + PORT + '/health');
    console.log('   👤 Register: POST http://localhost:' + PORT + '/auth/register');
    console.log('   🔐 Login: POST http://localhost:' + PORT + '/auth/login');
    console.log('   📧 Verify Email: POST http://localhost:' + PORT + '/auth/verify-email');
    console.log('   🛒 Products: GET http://localhost:' + PORT + '/products/list');
    console.log('   👑 Admin: GET http://localhost:' + PORT + '/admin/report/products');
    console.log('\n   ⚙️  INTERMEDIARY SERVICE:');
    console.log('   🔗 Health: GET http://localhost:' + PORT + '/api/intermediary/health');
    console.log('   ℹ️  Info: GET http://localhost:' + PORT + '/api/intermediary/info');
    console.log('   📤 Fetch: POST http://localhost:' + PORT + '/api/intermediary/fetch');
    console.log('   🔄 Transform: POST http://localhost:' + PORT + '/api/intermediary/transform');
    
    console.log('\n🔧 MOD DE FUNCȚIONARE:');
    console.log('   • Email Service: ' + (process.env.EMAIL_USER ? '✅ CONFIGURAT' : '⚠️  SIMULATION MODE'));
    console.log('   • Database: ' + (dbConnected ? '✅ CONNECTED' : '❌ DISCONNECTED'));
    console.log('   • Environment: ' + (process.env.NODE_ENV || 'development'));
    
    console.log('\n💡 TESTARE RAPIDĂ:');
    console.log('   1. POST /auth/register cu datele tale');
    console.log('   2. Vezi link-ul de verificare în consolă');
    console.log('   3. Accesează link-ul pentru a verifica email-ul');
    console.log('   4. POST /auth/login pentru autentificare');
    
    console.log('\n🎯 Sistemul este gata pentru utilizare!');
    console.log('='.repeat(60) + '\n');
  });
  
  return server;
}


startServer().then(server => {
  
  process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });
}).catch(error => {
  console.error('❌ Eroare critică la pornirea serverului:', error);
  process.exit(1);
});

module.exports = app;