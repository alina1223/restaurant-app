const express = require('express');
const { validationResult, param, query } = require('express-validator');
const router = express.Router();

const checkRole = require('../middlewares/auth');
const { usersUppercase } = require('../middlewares/uppercase');

const createProductDto = require('../products/dto/create-product.dto');
const updateProductDto = require('../products/dto/update-product.dto');
const createUserDto = require('../users/dto/create-user.dto');
const updateUserDto = require('../users/dto/update-user.dto');

let { products } = require('../products/products');
let { users } = require('../users/users');



router.post(
  '/create/product',
  checkRole('admin'),
  createProductDto,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    const { name, price, description, stock, category } = req.body;

    const newProduct = {
      id: products.length + 1,
      name,
      price,
      description,
      stock,
      category,
    };

    products.push(newProduct);
    res.json({ message: 'Produs adăugat cu succes', product: newProduct });
  }
);


router.put(
  '/edit/:id',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateProductDto,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Produsul nu există' });

    Object.assign(product, req.body);
    res.json({ message: 'Produs actualizat', product });
  }
);



router.patch(
  '/update/:id',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateProductDto,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Produsul nu există' });

    Object.assign(product, req.body);
    res.json({ message: 'Produs actualizat parțial', product });
  }
);


router.delete(
  '/delete/product/:id',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const existing = products.find(p => p.id === id);
    if (!existing) return res.status(404).json({ message: 'Produsul nu există' });

    products = products.filter(p => p.id !== id);
    res.json({ message: `Produsul cu ID ${id} a fost șters` });
  }
);


router.delete(
  '/delete/user/:id',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const existing = users.find(u => u.id === id);
    if (!existing) return res.status(404).json({ message: 'Userul nu există' });

    users = users.filter(u => u.id !== id);
    res.json({ message: `Userul cu ID ${id} a fost șters` });
  }
);


router.get('/report/products', checkRole('admin'), (req, res) => {
  res.json({ totalProducts: products.length, products });
});



router.get('/report/users', checkRole('admin'), (req, res) => {
  res.json(users);
});



router.get(
  '/search/users',
  checkRole('admin'),
  [
    query('name')
      .optional()
      .isString()
      .withMessage('Numele trebuie să fie un text valid'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    const { name } = req.query;
    let filteredUsers = users;

    if (name) {
      filteredUsers = filteredUsers.filter(u =>
        u.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    res.locals.users = filteredUsers;
    next();
  },
  usersUppercase,
  (req, res) => {
    res.json(res.locals.users);
  }
);

module.exports = router;
