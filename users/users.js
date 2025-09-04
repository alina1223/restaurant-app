const express = require('express');
const router = express.Router();


const users = [
    { id: 1, name: 'Alina', email: 'alina@email.com' },
    { id: 2, name: 'Octavian', email: 'octavian@email.com' }
];


router.get('/list', (req, res) => {
    res.json(users);
});

module.exports = router;
