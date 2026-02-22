const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,      
  process.env.DB_USER,        
  process.env.DB_PASSWORD,  
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: false,
  }
);


async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexiune PostgreSQL reușită!');
  } catch (error) {
    console.error('Eroare conexiune PostgreSQL:', error);
  }
}

testConnection();

module.exports = sequelize;