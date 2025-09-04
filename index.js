const express = require('express');
const app = express();
const PORT = 3000;


const products = [
  { id: 1, name: "Pizza Margherita", price: 20 },
  { id: 2, name: "Spaghetti Carbonara", price: 25 },
  { id: 3, name: "Salată Caesar", price: 18 },
  { id: 4, name: "Burger Clasic", price: 22 },
  { id: 5, name: "Friptură de pui", price: 30 },
  { id: 6, name: "Lasagna", price: 28 },
  { id: 7, name: "Supă de legume", price: 12 },
  { id: 8, name: "Cartofi prăjiți", price: 10 },
  { id: 9, name: "Sandwich Club", price: 15 },
  { id: 10, name: "Pui la grătar", price: 27 }
];


app.get('/list', (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`Serverul ascultă pe http://localhost:${PORT}`);
});
