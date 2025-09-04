const express = require('express');
const app = express();
const PORT = 3000;


const productRoutes = require('./products/products');
const userRoutes = require('./users/users');
const adminRoutes = require('./admin/admin');


app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Serverul rulează la http://localhost:${PORT}`);
});
