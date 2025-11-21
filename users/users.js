const express = require('express');
const router = express.Router();
const { validationResult, param } = require('express-validator');
const { Op } = require('sequelize');

const createUserValidator = require('./dto/create-user.dto');
const updateUserValidator = require('./dto/update-user.dto');
const validateRoleBody = require('../middlewares/validateRoleBody');

const User = require('../models/User');


router.post('/create', createUserValidator, validateRoleBody, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: 'Validare eșuată', errors: errors.array() });

  try {
    const newUser = await User.create(req.body);
    const cleanUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      age: newUser.age,
      role: newUser.role,
      department: newUser.department
    };

    res.json({ message: 'Cont creat cu succes', user: cleanUser });
  } catch (error) {
    res.status(500).json({
      message: 'Eroare la crearea userului',
      error: error.message
    });
  }
});


router.put(
  '/edit/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateUserValidator,
  validateRoleBody,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: 'Validare eșuată', errors: errors.array() });

    try {
      const id = parseInt(req.params.id);
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'Userul nu există' });

      await user.update(req.body);

    
      const updatedUser = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'phone', 'age', 'role', 'department'],
        raw: true
      });

      res.json({ message: 'User actualizat', user: updatedUser });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la actualizarea userului',
        error: error.message
      });
    }
  }
);

router.patch(
  '/update/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateUserValidator,
  validateRoleBody,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: 'Validare eșuată', errors: errors.array() });

    try {
      const id = parseInt(req.params.id);
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'Userul nu există' });

      await user.update(req.body);
      const updatedUser = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'phone', 'age', 'role', 'department'],
        raw: true
      });

      res.json({ message: 'User actualizat parțial', user: updatedUser });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la actualizarea userului',
        error: error.message
      });
    }
  }
);


router.delete(
  '/delete/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      const headerRole = req.headers['role'];
      const currentUserId = parseInt(req.headers['currentuserid']); 

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: 'Userul nu există' });

      if (headerRole === 'user' && id !== currentUserId) {
        return res.status(403).json({ message: 'Nu aveți dreptul să ștergeți acest cont' });
      }

      await user.destroy();
      res.json({ message: `Userul cu ID ${id} a fost șters` });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la ștergerea userului',
        error: error.message
      });
    }
  }
);

module.exports = { router };