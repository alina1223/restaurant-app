const { body } = require('express-validator');

module.exports = [
  body('name')
    .isString().withMessage('Numele trebuie să fie text')
    .isLength({ min: 3 }).withMessage('Numele trebuie să aibă minim 3 caractere'),

  body('email')
    .isEmail().withMessage('Email invalid'),

  body('phone')
  .matches(/^(\+373|0)\d{7,8}$/).withMessage('Număr de telefon invalid (MD)'),


  body('age')
    .isInt({ min: 18 }).withMessage('Trebuie să aveți cel puțin 18 ani'),

  body('role')
    .isIn(['user', 'admin', 'manager']).withMessage('Rol invalid'),

  
  body('department').if(body('role').equals('manager'))
    .notEmpty().withMessage('Departamentul este obligatoriu pentru manageri')
];
