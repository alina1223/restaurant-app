require('dotenv').config();

const sequelize = require('../config/database');

async function main() {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(
    'SELECT id, name, email, role, status, "isActive" as isactive, isemailverified FROM users ORDER BY id ASC'
  );
  console.table(rows);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
