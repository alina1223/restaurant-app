const express = require('express');
const app = express();
const PORT = 3000;

const { router: productRoutes } = require('./products/products');
const { router: userRoutes } = require('./users/users');
const adminRoutes = require('./admin/admin');

app.use(express.json());
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Serverul rulează la http://localhost:${PORT}`);
});
