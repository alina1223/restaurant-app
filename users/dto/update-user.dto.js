const { body } = require('express-validator');

module.exports = [
  body('name')
    .optional()
    .isString().withMessage('Numele trebuie să fie text'),

  body('email')
    .optional()
    .isEmail().withMessage('Email invalid'),

  body('phone')
    .optional()
  .matches(/^(\+373|0)\d{7,8}$/).withMessage('Număr de telefon invalid (MD)')
,

  body('age')
    .optional()
    .isInt({ min: 18 }).withMessage('Trebuie să aveți cel puțin 18 ani'),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'manager']).withMessage('Rol invalid'),

  body('department').if(body('role').equals('manager'))
    .notEmpty().withMessage('Departamentul este obligatoriu pentru manageri')
];
