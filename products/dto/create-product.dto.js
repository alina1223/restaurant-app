const { body } = require('express-validator');

module.exports = [
  body('name')
    .isString().withMessage('Numele trebuie să fie un text')
    .isLength({ min: 3 }).withMessage('Numele trebuie să aibă minim 3 caractere'),

  body('price')
    .isNumeric().withMessage('Prețul trebuie să fie un număr')
    .custom(value => value > 0).withMessage('Prețul trebuie să fie pozitiv'),

  body('description')
    .optional()
    .isString().withMessage('Descrierea trebuie să fie text')
    .isLength({ max: 200 }).withMessage('Descrierea nu poate depăși 200 caractere'),

  body('stock')
    .isInt({ min: 0 }).withMessage('Stocul trebuie să fie un număr întreg pozitiv'),

  body('category')
    .isIn(['Pizza', 'Burger', 'Salată', 'Desert', 'Băutură'])
    .withMessage('Categoria trebuie să fie una dintre: Pizza, Burger, Salată, Desert, Băutură'),

  body('description').if(body('category').equals('Pizza'))
    .notEmpty().withMessage('Descrierea este obligatorie pentru produsele din categoria Pizza')
];
