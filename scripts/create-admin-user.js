require('dotenv').config();

const sequelize = require('../config/database');
const User = require('../models/User');

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@local.test';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123456';
  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const phone = process.env.SEED_ADMIN_PHONE || '069123456';
  const age = parseInt(process.env.SEED_ADMIN_AGE || '25', 10);

  console.log('Seeding admin user...');
  console.log('email:', email);

  await sequelize.authenticate();

  const existing = await User.scope('withSensitiveData').findOne({ where: { email } });
  if (existing) {
    console.log('Admin already exists. Ensuring role/status flags...');
    await existing.update({
      role: 'admin',
      status: 'active',
      isActive: true,
      isEmailVerified: true,
      name: existing.name || name,
      phone: existing.phone || phone,
      age: existing.age || age
    });

    console.log('OK. Admin ensured:', { id: existing.id, email: existing.email, role: existing.role });
    return;
  }

  const created = await User.scope('withSensitiveData').create({
    name,
    email,
    password,
    phone,
    age,
    role: 'admin',
    department: 'admin',
    status: 'active',
    isActive: true,
    isEmailVerified: true
  });

  await created.update({ status: 'active', isActive: true, isEmailVerified: true, role: 'admin' });

  console.log('Created admin:', { id: created.id, email: created.email, role: created.role });
  console.log('Login via frontend with the credentials above.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed admin failed:', err);
    process.exit(1);
  });
