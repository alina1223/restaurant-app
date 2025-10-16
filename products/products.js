const express = require('express');
const { validationResult, param, query } = require('express-validator');
const router = express.Router();

const createProductDto = require('./dto/create-product.dto');
const updateProductDto = require('./dto/update-product.dto');
const { productsUppercase } = require('../middlewares/uppercase');

let products = [
  { id: 1, name: 'Pizza Margherita', price: 250, description: 'Pizza clasică cu mozzarella și roșii', category: 'Pizza', stock: 10 },
  { id: 2, name: 'Burger Clasic', price: 200, description: 'Burger cu carne, brânză și legume', category: 'Burger', stock: 15 },
  { id: 3, name: 'Salată Caesar', price: 180, description: 'Salată cu pui, crutoane și sos Caesar', category: 'Salată', stock: 20 },
  { id: 4, name: 'Paste Carbonara', price: 220, description: 'Paste cu sos cremos, bacon și parmezan', category: 'Paste', stock: 12 },
  { id: 5, name: 'Supă de legume', price: 150, description: 'Supă sănătoasă de legume proaspete', category: 'Supă', stock: 25 }
];


router.get('/list', (req, res) => res.json(products));


router.get(
  '/details/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Eroare de validare', errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Produsul nu a fost găsit' });
    res.json(product);
  }
);


router.get(
  '/search',
  [
    query('name').optional().isString().withMessage('Numele trebuie să fie text valid'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice trebuie să fie un număr pozitiv'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice trebuie să fie un număr pozitiv'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Eroare de validare', errors: errors.array() });
    }

    const { name, minPrice, maxPrice } = req.query;
    let filtered = products;

    if (name) filtered = filtered.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));

    res.locals.products = filtered;
    next();
  },
  productsUppercase,
  (req, res) => res.json(res.locals.products)
);

module.exports = { router, products };
