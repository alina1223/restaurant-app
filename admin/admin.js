const express = require('express');
const router = express.Router();


router.get('/reports', (req, res) => {
    res.json({ message: 'Raport de activitate (doar pentru admin)' });
});

module.exports = router;
