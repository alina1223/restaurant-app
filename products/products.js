const express = require('express');
const router = express.Router();

let products = [
    { id: 1, name: 'Pizza Margherita', price: 250, description: 'Pizza clasică cu mozzarella și roșii' },
    { id: 2, name: 'Burger Clasic', price: 200, description: 'Burger cu carne, brânză și legume' },
    { id: 3, name: 'Salată Caesar', price: 180, description: 'Salată cu pui, crutoane și sos Caesar' },
    { id: 4, name: 'Paste Carbonara', price: 220, description: 'Paste cu sos cremos, bacon și parmezan' },
    { id: 5, name: 'Supă de legume', price: 150, description: 'Supă sănătoasă de legume proaspete' },
    { id: 6, name: 'Friptură de vită', price: 350, description: 'Friptură suculentă de vită cu garnitură' },
    { id: 7, name: 'Sandviș Club', price: 90, description: 'Sandviș cu pui, bacon, ou și legume' },
    { id: 8, name: 'Salată Greek', price: 140, description: 'Salată cu feta, măsline și legume proaspete' },
    { id: 9, name: 'Pizza Quattro Formaggi', price: 200, description: 'Pizza cu patru tipuri de brânză' },
    { id: 10, name: 'Burger Vegetarian', price: 100, description: 'Burger cu legume, hummus și salată' }
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




router.get('/search', (req, res) => {
    const { name, minPrice, maxPrice } = req.query;
    let filteredProducts = products;

    if (name) filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
    if (minPrice) filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
    if (maxPrice) filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));

    res.json(filteredProducts);
});

module.exports = { router, products };

