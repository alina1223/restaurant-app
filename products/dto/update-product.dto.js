const { body } = require('express-validator');

module.exports = [
  body('name')
    .optional()
    .isString().withMessage('Numele trebuie să fie un text')
    .isLength({ min: 3 }).withMessage('Numele trebuie să aibă minim 3 caractere'),

  body('price')
    .optional()
    .isNumeric().withMessage('Prețul trebuie să fie un număr pozitiv'),

  body('description')
    .optional()
    .isString().withMessage('Descrierea trebuie să fie text'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stocul trebuie să fie un număr întreg pozitiv'),

  body('category')
    .optional()
    .isIn(['Pizza', 'Burger', 'Salată', 'Desert', 'Băutură'])
    .withMessage('Categoria trebuie să fie una validă'),

  body('description').if(body('category').equals('Pizza'))
    .notEmpty().withMessage('Descrierea este obligatorie pentru produsele din categoria Pizza')
];
