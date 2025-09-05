const express = require('express');
const router = express.Router();

let { products } = require('../products/products');
let { users } = require('../users/users');


router.delete('/delete/product/:id', (req, res) => {
    const id = parseInt(req.params.id);
    products = products.filter(p => p.id !== id);
    res.json({ message: `Produsul cu ID ${id} a fost șters` });
});


router.put('/edit/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, price } = req.body;

    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Produsul nu există' });

    if (name) product.name = name;
    if (price) product.price = price;

    res.json({ message: 'Produs actualizat', product });
});


router.delete('/delete/user/:id', (req, res) => {
    const id = parseInt(req.params.id);
    users = users.filter(u => u.id !== id);
    res.json({ message: `Userul cu ID ${id} a fost șters` });
});

module.exports = router;
