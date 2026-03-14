const express = require('express');
const router = express.Router();
const { validationResult, param, body } = require('express-validator');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const createUserValidator = require('./dto/create-user.dto');
const updateUserValidator = require('./dto/update-user.dto');
const validateRoleBody = require('../middlewares/validateRoleBody');
const { authenticateJWT } = require('../middlewares/auth');
const sequelize = require('../config/database');

const User = require('../models/User');
const Product = require('../models/Product');
const { Cart, CartItem, Order } = require('../models/Cart');

router.post('/cart/add', authenticateJWT, [
  body('productId').isInt({ min: 1 }).withMessage('productId invalid'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('quantity invalid')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Eroare validare', errors: errors.array() });

  try {
    if (!req.user || !req.user.isEmailVerified) {
      return res.status(403).json({ message: 'Trebuie să aveți adresa de email verificată pentru a adăuga în coș' });
    }

    const productId = parseInt(req.body.productId);
    const quantity = parseInt(req.body.quantity || '1');

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Produsul nu a fost găsit' });

    let cart = await Cart.findOne({ where: { userId: req.user.id, status: 'active' } });
    if (!cart) cart = await Cart.create({ userId: req.user.id });

    let item = await CartItem.findOne({ where: { cartId: cart.id, productId } });
    if (item) {
      item.quantity = item.quantity + quantity;
      item.price = product.price;
      await item.save();
    } else {
      item = await CartItem.create({ cartId: cart.id, productId, quantity, price: product.price });
    }

    const updatedCart = await Cart.findByPk(cart.id, {
      include: [{ model: CartItem, as: 'items', include: [{ model: Product }] }]
    });

    res.json({ message: 'Produs adăugat în coș', cart: updatedCart });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la adăugarea în coș', error: error.message });
  }
});

router.post(
  '/checkout',
  authenticateJWT,
  [
    body('items').isArray({ min: 1 }).withMessage('items invalid'),
    body('items.*.productId').isInt({ min: 1 }).withMessage('productId invalid'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity invalid'),
    body('shippingAddress').isString().trim().isLength({ min: 5 }).withMessage('shippingAddress invalid'),
    body('paymentMethod').isIn(['cash', 'card']).withMessage('paymentMethod invalid')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Eroare validare', errors: errors.array() });

    try {
      if (!req.user || !req.user.isEmailVerified) {
        return res.status(403).json({ message: 'Trebuie să aveți adresa de email verificată pentru a plasa o comandă' });
      }

      const shippingAddress = String(req.body.shippingAddress || '').trim();
      const paymentMethod = String(req.body.paymentMethod || '').trim();

      const consolidated = new Map();
      for (const rawItem of req.body.items || []) {
        const productId = parseInt(rawItem.productId);
        const quantity = parseInt(rawItem.quantity);
        consolidated.set(productId, (consolidated.get(productId) || 0) + quantity);
      }
      const productIds = Array.from(consolidated.keys()).filter((id) => Number.isFinite(id)).sort((a, b) => a - b);
      if (productIds.length === 0) {
        return res.status(400).json({ message: 'Coșul este gol' });
      }

      const result = await sequelize.transaction(async (t) => {
        const products = await Product.findAll({
          where: { id: productIds },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (products.length !== productIds.length) {
          const found = new Set(products.map((p) => p.id));
          const missing = productIds.filter((id) => !found.has(id));
          const err = new Error('Unele produse nu au fost găsite');
          err.status = 404;
          err.details = { missingProductIds: missing };
          throw err;
        }

        const byId = new Map(products.map((p) => [p.id, p]));

        for (const productId of productIds) {
          const product = byId.get(productId);
          const requestedQty = consolidated.get(productId) || 0;
          if ((product?.stock ?? 0) < requestedQty) {
            const err = new Error(`Stoc insuficient pentru produsul "${product.name}"`);
            err.status = 409;
            err.details = {
              productId,
              name: product.name,
              available: product.stock,
              requested: requestedQty
            };
            throw err;
          }
        }

        const cart = await Cart.create(
          { userId: req.user.id, status: 'active', totalAmount: 0 },
          { transaction: t }
        );

        let totalAmount = 0;

        for (const productId of productIds) {
          const product = byId.get(productId);
          const requestedQty = consolidated.get(productId) || 0;

          await CartItem.create(
            {
              cartId: cart.id,
              productId,
              quantity: requestedQty,
              price: product.price
            },
            { transaction: t }
          );

          totalAmount += requestedQty * Number(product.price);

          product.stock = product.stock - requestedQty;
          await product.save({ transaction: t });
        }

        await cart.update(
          { status: 'completed', totalAmount },
          { transaction: t }
        );

        let order = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            order = await Order.create(
              {
                userId: req.user.id,
                cartId: cart.id,
                orderNumber: Order.generateOrderNumber(),
                totalAmount,
                shippingAddress,
                paymentMethod,
                paymentStatus: 'pending'
              },
              { transaction: t }
            );
            break;
          } catch (e) {
            if (e?.name === 'SequelizeUniqueConstraintError' && attempt < 2) continue;
            throw e;
          }
        }

        return { cart, order };
      });

      try {
        const EmailService = require('../services/email.service');

        const cartWithItems = await Cart.findByPk(result.cart.id, {
          include: [{ model: CartItem, as: 'items', include: [{ model: Product }] }]
        });

        const items = (cartWithItems?.items || []).map((it) => {
          const product = it.Product;
          const unitPrice = Number(it.price);
          const quantity = Number(it.quantity);
          return {
            name: product?.name || `Product #${it.productId}`,
            quantity,
            unitPrice,
            subtotal: unitPrice * quantity
          };
        });

        await EmailService.sendInvoiceEmail(req.user.email, req.user.name, {
          orderNumber: result.order?.orderNumber,
          date: new Date(result.order?.createdAt || Date.now()).toISOString(),
          shippingAddress,
          paymentMethod,
          totalAmount: Number(result.order?.totalAmount || 0),
          currency: 'MDL',
          items
        });
      } catch (emailError) {
        console.warn('⚠️ Factura pe email nu a putut fi trimisă:', emailError.message);
      }

      return res.status(201).json({
        message: 'Comanda a fost plasată cu succes',
        order: result.order,
        cartId: result.cart.id
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        message: error.message || 'Eroare la plasarea comenzii',
        details: error.details,
        error: error.status ? undefined : error.message
      });
    }
  }
);

router.post('/create', createUserValidator, validateRoleBody, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validare eșuată', 
      errors: errors.array() 
    });
  }

  try {
    const existingUser = await User.findOne({ where: { email: req.body.email } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email deja înregistrat' 
      });
    }

    const userData = { ...req.body };
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const newUser = await User.create(userData);
    
    const verificationToken = newUser.generateEmailVerificationToken();
    await newUser.save();
    
    const EmailService = require('../services/email.service');
    try {
      await EmailService.sendVerificationEmail(
        newUser.email,
        newUser.name,
        verificationToken
      );
    } catch (emailError) {
      console.error('⚠️ Email failed but user created:', emailError.message);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationLinkDirect = `${frontendUrl}/verify-email/${verificationToken}`;
      console.log(`🔗 Verification link: ${verificationLinkDirect}`);
    }
    
    const cleanUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      age: newUser.age,
      role: newUser.role,
      department: newUser.department
    };

    res.status(201).json({ 

    });
  } catch (error) {
    res.status(500).json({
      message: 'Eroare la crearea userului',
      error: error.message
    });
  }
});

router.put(
  '/edit/:id',
  authenticateJWT,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateUserValidator,
  validateRoleBody,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validare eșuată', 
        errors: errors.array() 
      });
    }

    try {
      const id = parseInt(req.params.id);

      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Nu aveți permisiunea să modificați acest profil'
        });
      }

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ 
          message: 'Userul nu există' 
        });
      }

      const updateData = { ...req.body };

      if (req.user.role !== 'admin') {
        delete updateData.role;
        delete updateData.department;
        delete updateData.password;
      }

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      await user.update(updateData);

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        raw: true
      });

      res.json({ 
        message: 'User actualizat cu succes', 
        user: updatedUser 
      });
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
  authenticateJWT,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateUserValidator,
  validateRoleBody,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validare eșuată', 
        errors: errors.array() 
      });
    }

    try {
      const id = parseInt(req.params.id);

      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Nu aveți permisiunea să modificați acest profil'
        });
      }

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ 
          message: 'Userul nu există' 
        });
      }

      const updateData = { ...req.body };

      if (req.user.role !== 'admin') {
        delete updateData.role;
        delete updateData.department;
        delete updateData.password;
      }

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      await user.update(updateData);

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        raw: true
      });

      res.json({ 
        message: 'User actualizat parțial cu succes', 
        user: updatedUser 
      });
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
  authenticateJWT,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Bad Request', 
        errors: errors.array() 
      });
    }

    try {
      const id = parseInt(req.params.id);

      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Nu aveți dreptul să ștergeți acest cont'
        });
      }

      const user = await User.unscoped().findByPk(id);
      
      if (!user) {
        return res.status(404).json({ 
          message: 'Userul nu există' 
        });
      }

      const email = user.email;
      const name = user.name;

      const Review = require('../models/review');

      await sequelize.transaction(async (t) => {
        const carts = await Cart.findAll({
          where: { userId: id },
          attributes: ['id'],
          raw: true,
          transaction: t
        });
        const cartIds = carts.map((c) => c.id);

        if (cartIds.length > 0) {
          await CartItem.destroy({
            where: { cartId: cartIds },
            transaction: t,
            individualHooks: true
          });
        }

        await Order.destroy({ where: { userId: id }, transaction: t });
        await Cart.destroy({ where: { userId: id }, transaction: t });
        await Review.destroy({ where: { userId: id }, transaction: t });

        await user.destroy({ transaction: t });
      });

      try {
        const EmailService = require('../services/email.service');
        await EmailService.sendAccountDeletedEmail(email, name);
      } catch (emailError) {
        console.warn('⚠️ Email notificare ștergere cont eșuat:', emailError.message);
      }
      
      res.json({ 
        message: `Userul cu ID ${id} a fost șters cu succes` 
      });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la ștergerea userului',
        error: error.message
      });
    }
  }
);

router.get(
  '/profile/:id',
  authenticateJWT,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Eroare de validare', 
        errors: errors.array() 
      });
    }

    try {
      const id = parseInt(req.params.id);
      
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Nu aveți acces la acest profil' 
        });
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        raw: true
      });
      
      if (!user) {
        return res.status(404).json({ 
          message: 'Userul nu a fost găsit' 
        });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la obținerea profilului',
        error: error.message
      });
    }
  }
);

router.get(
  '/list',
  authenticateJWT,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Acces interzis' 
        });
      }

      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        raw: true
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la obținerea userilor',
        error: error.message
      });
    }
  }
);

router.get(
  '/search',
  authenticateJWT,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Acces interzis' 
        });
      }

      const { name, email, role } = req.query;
      const whereConditions = {};

      if (name) {
        whereConditions.name = { [Op.iLike]: `%${name}%` };
      }
      
      if (email) {
        whereConditions.email = { [Op.iLike]: `%${email}%` };
      }
      
      if (role) {
        whereConditions.role = role;
      }

      const users = await User.findAll({
        where: whereConditions,
        attributes: { exclude: ['password'] },
        raw: true
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la căutarea userilor',
        error: error.message
      });
    }
  }
);

router.put(
  '/change-password/:id',
  authenticateJWT,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
    require('./dto/change-password.dto')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validare eșuată', 
        errors: errors.array() 
      });
    }

    try {
      const id = parseInt(req.params.id);
      
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Nu aveți permisiunea să schimbați această parolă' 
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({ 
          message: 'Userul nu există' 
        });
      }

      if (req.user.role !== 'admin') {
        const isValidPassword = await user.verifyPassword(currentPassword);
        if (!isValidPassword) {
          return res.status(400).json({ 
            message: 'Parola curentă este incorectă' 
          });
        }
      }

      user.password = newPassword;
      await user.save();
      
      res.json({ 
        message: 'Parola a fost schimbată cu succes' 
      });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la schimbarea parolei',
        error: error.message
      });
    }
  }
);

module.exports = { router };