const sequelize = require('../config/database');
const Product = require('../models/Product');
const User = require('../models/User');
const ImportExportLog = require('../models/ImportExportLog');

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexiune la baza de date reușită');
    
    await sequelize.sync({ force: true });
    console.log('Tabele create');

    
    await User.bulkCreate([
      { name: 'Alina', email: 'alina@email.com', phone: '0711111111', age: 25, role: 'user' },
      { name: 'Octavian', email: 'octavian@email.com', phone: '0722222222', age: 30, role: 'manager', department: 'Sales' },
      { name: 'Admin', email: 'admin@email.com', phone: '0733333333', age: 35, role: 'admin' }
    ]);

    
    await Product.bulkCreate([
      { name: 'Pizza Margherita', price: 250, description: 'Pizza clasică cu mozzarella și roșii', stock: 10, category: 'Pizza' },
      { name: 'Burger Clasic', price: 200, description: 'Burger cu carne, brânză și legume', stock: 15, category: 'Burger' },
      { name: 'Salată Caesar', price: 180, description: 'Salată cu pui, crutoane și sos Caesar', stock: 20, category: 'Salată' },
      { name: 'Paste Carbonara', price: 220, description: 'Paste cu sos cremos, bacon și parmezan', stock: 12, category: 'Paste' },
      { name: 'Cola', price: 12, description: 'Băutură carbogazoasă', stock: 50, category: 'Băutură' },
      { name: 'Tiramisu', price: 120, description: 'Desert italian cu mascarpone', stock: 30, category: 'Desert' }
    ]);

    console.log('Date demo inserate');
    console.log('Baza de date pregătită!');
    
  } catch (error) {
    console.error('Eroare la inițializarea bazei de date:', error);
  }
}

initializeDatabase();