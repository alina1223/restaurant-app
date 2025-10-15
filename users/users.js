const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

const createUserValidator = require('./dto/create-user.dto');
const updateUserValidator = require('./dto/update-user.dto');
const validateRoleBody = require('../middlewares/validateRoleBody');

let users = [
  { id: 1, name: 'Alina', email: 'alina@email.com', phone: '0711111111', age: 25, role: 'user' },
  { id: 2, name: 'Octavian', email: 'octavian@email.com', phone: '0722222222', age: 30, role: 'manager', department: 'Sales' }
];


router.post('/create', createUserValidator, validateRoleBody, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: 'Validare eșuată', errors: errors.array() });

  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.json({ message: 'Cont creat cu succes', user: newUser });
});


router.put('/edit/:id', updateUserValidator, validateRoleBody, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: 'Validare eșuată', errors: errors.array() });

  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ message: 'Userul nu există' });

  Object.assign(user, req.body);
  res.json({ message: 'User actualizat', user });
});


router.patch('/update/:id', updateUserValidator, validateRoleBody, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: 'Validare eșuată', errors: errors.array() });

  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ message: 'Userul nu există' });

  Object.assign(user, req.body);
  res.json({ message: 'User actualizat parțial', user });
});


router.delete('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const headerRole = req.headers['role'];
  const currentUserId = parseInt(req.headers['currentuserid']); // id-ul persoanei care cere ștergerea

  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ message: 'Userul nu există' });

  if (headerRole === 'user' && id !== currentUserId) {
    return res.status(403).json({ message: 'Nu aveți dreptul să ștergeți acest cont' });
  }

  users = users.filter(u => u.id !== id);
  res.json({ message: `Userul cu ID ${id} a fost șters` });
});


module.exports = { router, users };