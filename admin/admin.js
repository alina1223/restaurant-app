const express = require('express');
const router = express.Router();
const checkRole = require('../middlewares/auth');
const { usersUppercase } = require('../middlewares/uppercase');


let { products } = require('../products/products');
let { users } = require('../users/users');

router.post('/create/product', checkRole('admin'), (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'Numele și prețul sunt obligatorii' });
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price,
    description: description || ''
  };

  products.push(newProduct);
  res.json({ message: 'Produs adăugat cu succes', product: newProduct });
});

router.put('/edit/:id', checkRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;

    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Produsul nu există' });

    if (name) product.name = name;
    if (price) product.price = price;

    res.json({ message: 'Produs actualizat', product });
});


router.patch('/update/:id', checkRole('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, description } = req.body;

  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ message: 'Produsul nu există' });

  if (name) product.name = name;
  if (price) product.price = price;
  if (description) product.description = description;

  res.json({ message: 'Produs actualizat parțial', product });
});



router.delete('/delete/product/:id', checkRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    products = products.filter(p => p.id !== id);
    res.json({ message: `Produsul cu ID ${id} a fost șters` });
});


router.delete('/delete/user/:id', checkRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    users = users.filter(u => u.id !== id);
    res.json({ message: `Userul cu ID ${id} a fost șters` });
});


router.get('/report/products', checkRole('admin'), (req, res) => {
    res.json({ totalProducts: products.length, products });
});

router.get('/report/users', checkRole('admin'), (req, res) => {
    res.json(users);
});



router.get('/search/users', checkRole('admin'), (req, res, next) => {
  const { name } = req.query;
  let filteredUsers = users;

  if (name) {
    filteredUsers = filteredUsers.filter(u =>
      u.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  res.locals.users = filteredUsers;
  next();
}, usersUppercase, (req, res) => {
  res.json(res.locals.users);
});

module.exports = router;

