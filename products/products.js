const express = require('express');
const router = express.Router();
const { productsUppercase } = require('../middlewares/uppercase');

let products = [
  { id: 1, name: 'Pizza Margherita', price: 250, description: 'Pizza clasică cu mozzarella și roșii', category: 'Pizza', stock: 10 },
  { id: 2, name: 'Burger Clasic', price: 200, description: 'Burger cu carne, brânză și legume', category: 'Burger', stock: 15 },
  { id: 3, name: 'Salată Caesar', price: 180, description: 'Salată cu pui, crutoane și sos Caesar', category: 'Salată', stock: 20 },
  { id: 4, name: 'Paste Carbonara', price: 220, description: 'Paste cu sos cremos, bacon și parmezan', category: 'Paste', stock: 12 },
  { id: 5, name: 'Supă de legume', price: 150, description: 'Supă sănătoasă de legume proaspete', category: 'Supă', stock: 25 }
];

router.get('/list', (req, res) => {
  res.json(products);
});

router.get('/details/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ message: 'Produsul nu a fost găsit' });
  res.json(product);
});

router.get('/search', (req, res, next) => {
  const { name, minPrice, maxPrice } = req.query;
  let filteredProducts = products;

  if (name) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
  }
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
  }

  res.locals.products = filteredProducts;
  next();
}, productsUppercase, (req, res) => {
  res.json(res.locals.products);
});

module.exports = { router, products };
