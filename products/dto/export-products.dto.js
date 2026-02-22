const { query } = require('express-validator');

module.exports = [
  query('name')
    .optional()
    .isString()
    .withMessage('Numele trebuie să fie text valid')
    .isLength({ min: 2 })
    .withMessage('Numele trebuie să aibă minim 2 caractere'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice trebuie să fie un număr pozitiv'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice trebuie să fie un număr pozitiv'),

  query('category')
    .optional()
    .isIn(['Pizza', 'Burger', 'Salată', 'Paste', 'Băutură', 'Desert'])
    .withMessage('Categoria trebuie să fie una validă'),

  query('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stocul minim trebuie să fie un număr întreg pozitiv')
];