const { body } = require('express-validator');

module.exports = [
  body('currentPassword')
    .if((value, { req }) => req.user && req.user.role !== 'admin')
    .notEmpty().withMessage('Parola curentă este obligatorie'),
  
  body('newPassword')
    .isString().withMessage('Parola trebuie să fie text')
    .isLength({ min: 6 }).withMessage('Parola trebuie să aibă minim 6 caractere')
    .custom((value, { req }) => {
      if (req.body.currentPassword && value === req.body.currentPassword) {
        throw new Error('Noua parolă trebuie să fie diferită de cea curentă');
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Parolele nu coincid');
      }
      return true;
    })
];