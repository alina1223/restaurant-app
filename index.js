const express = require('express');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

const sequelize = require('./config/database');
const { router: productRoutes } = require('./products/products');
const { router: userRoutes } = require('./users/users');
const adminRoutes = require('./admin/admin');

app.use(express.json());
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexiune la baza de date reușită');
  } catch (error) {
    console.error('Eroare conexiune baza de date:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Serverul rulează la http://localhost:${PORT}`);
  await testDatabaseConnection();
});