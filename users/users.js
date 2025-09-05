const express = require('express');
const router = express.Router();

let users = [
    { id: 1, name: 'Alina', email: 'alina@email.com', phone: '123456' },
    { id: 2, name: 'Octavian', email: 'octavian@email.com', phone: '987654' }
];


router.post('/create', (req, res) => {
    const { name, email, phone } = req.body;
    const newUser = {
        id: users.length + 1,
        name,
        email,
        phone
    };
    users.push(newUser);
    res.json({ message: 'Cont creat cu succes', user: newUser });
});


router.put('/update/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email, phone } = req.body;

    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ message: 'Userul nu există' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    res.json({ message: 'Datele au fost actualizate', user });
});


router.get('/list', (req, res) => {
    res.json(users);
});

module.exports = { router, users };
