const express = require('express');
const { validationResult, param, query } = require('express-validator');
const router = express.Router();

const { productsUppercase } = require('../middlewares/uppercase');
const Product = require('../models/Product');

// ✅ LIST PRODUCTS - CURAT
router.get('/list', async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'price', 'description', 'stock', 'category'],
      raw: true
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: 'Eroare la obținerea produselor',
      error: error.message
    });
  }
});

// ✅ PRODUCT DETAILS - CURAT
router.get(
  '/details/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Eroare de validare', errors: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      const product = await Product.findByPk(id, {
        attributes: ['id', 'name', 'price', 'description', 'stock', 'category'],
        raw: true
      });
      
      if (!product) return res.status(404).json({ message: 'Produsul nu a fost găsit' });
      
      res.json(product);
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la obținerea produsului',
        error: error.message
      });
    }
  }
);

// ✅ SEARCH PRODUCTS - CURAT
router.get(
  '/search',
  [
    query('name').optional().isString().withMessage('Numele trebuie să fie text valid'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice trebuie să fie un număr pozitiv'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice trebuie să fie un număr pozitiv'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Eroare de validare', errors: errors.array() });
    }

    try {
      const { name, minPrice, maxPrice } = req.query;
      let filtered = await Product.findAll({
        attributes: ['id', 'name', 'price', 'description', 'stock', 'category'],
        raw: true
      });

      if (name) filtered = filtered.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
      if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
      if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));

      res.locals.products = filtered;
      next();
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la căutarea produselor',
        error: error.message
      });
    }
  },
  productsUppercase,
  (req, res) => res.json(res.locals.products)
);

module.exports = { router };