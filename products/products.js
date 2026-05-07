const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validationResult, param, query, body } = require('express-validator');
const router = express.Router();

const { Op } = require('sequelize');

const Product = require('../models/Product');
const authJwt = require('../middlewares/authJwt');
const checkRole = require('../middlewares/auth');
const Review = require('../models/review');

// Configurare multer pentru upload de imagini
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Doar imagini sunt permise (JPG, PNG, GIF, WebP)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== GET ROUTES (in proper order) ==========

// GET /list - ALL PRODUCTS
router.get('/list', async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'price', 'description', 'stock', 'category', 'imagePath'],
      raw: true
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea produselor', error: error.message });
  }
});

// GET /search - SEARCH PRODUCTS (must be BEFORE /:id)
router.get(
  '/search',
  [
    query('name').optional().isString().isLength({ min: 1, max: 100 }).withMessage('name invalid'),
    query('category').optional().isString().isLength({ min: 1, max: 30 }).withMessage('category invalid'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice invalid'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice invalid'),
    query('minStock').optional().isInt({ min: 0 }).withMessage('minStock invalid'),
    query('inStock').optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Eroare validare', errors: errors.array() });

    try {
      const { name, category, minPrice, maxPrice, minStock, inStock } = req.query;

      const where = {};

      if (name) {
        where.name = { [Op.iLike]: `%${String(name).trim()}%` };
      }

      if (category) {
        where.category = String(category).trim();
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price[Op.gte] = Number(minPrice);
        if (maxPrice !== undefined) where.price[Op.lte] = Number(maxPrice);
      }

      if (minStock !== undefined) {
        where.stock = { [Op.gte]: parseInt(minStock) };
      }

      if (inStock !== undefined) {
        const flag = String(inStock).toLowerCase() === 'true';
        if (flag) {
          where.stock = where.stock || {};
          where.stock[Op.gt] = 0;
        }
      }

      const products = await Product.findAll({
        where,
        attributes: ['id', 'name', 'price', 'description', 'stock', 'category', 'imagePath'],
        order: [['name', 'ASC']],
        raw: true
      });

      return res.json(products);
    } catch (error) {
      return res.status(500).json({ message: 'Eroare la căutarea produselor', error: error.message });
    }
  }
);

// GET /details/:id - SINGLE PRODUCT DETAILS
router.get('/details/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Eroare validare', errors: errors.array() });

  try {
    const id = parseInt(req.params.id);
    const product = await Product.findByPk(id, {
      attributes: ['id', 'name', 'price', 'description', 'stock', 'category', 'imagePath'],
      raw: true
    });
    if (!product) return res.status(404).json({ message: 'Produsul nu a fost găsit' });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea produsului', error: error.message });
  }
});

// ========== POST/PUT/DELETE ROUTES ==========

// POST /create - CREATE PRODUCT WITH IMAGE
router.post('/create', authJwt, checkRole('admin'), async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Eroare upload imagine', error: err.message });
    }

    const { name, price, description, stock, category } = req.body;
    try {
      const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
      const newProduct = await Product.create({ name, price, description, stock, category, imagePath });
      res.json({ message: 'Produs adăugat cu succes', product: newProduct });
    } catch (error) {
      console.error('❌ Error creating product:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path); // sync to ensure cleanup
      }
      res.status(500).json({ message: 'Eroare la crearea produsului', error: error.message });
    }
  });
});

// PUT /edit/:id - UPDATE PRODUCT WITH IMAGE
router.put('/edit/:id', authJwt, checkRole('admin'), [param('id').isInt({ min: 1 })], async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Eroare upload imagine', error: err.message });
    }

    const id = parseInt(req.params.id);
    try {
      const product = await Product.findByPk(id);
      if (!product) return res.status(404).json({ message: 'Produsul nu există' });

      if (req.file && product.imagePath) {
        const oldImagePath = path.join(__dirname, '../' + product.imagePath);
        try {
          fs.unlinkSync(oldImagePath); // sync
        } catch (err) {
          console.error('Eroare la ștergerea imaginii vechi:', err);
        }
      }

      const updateData = req.body;
      if (req.file) {
        updateData.imagePath = `/uploads/products/${req.file.filename}`;
      }

      await product.update(updateData);
      res.json({ message: 'Produs actualizat', product });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Eroare la ștergerea fișierului:', err);
        }
      }
      res.status(500).json({ message: 'Eroare la actualizarea produsului', error: error.message });
    }
  });
});

// DELETE /delete/:id
router.delete('/delete/:id', authJwt, checkRole('admin'), [param('id').isInt({ min: 1 })], async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Produsul nu există' });

    await product.destroy();
    res.json({ message: `Produsul cu ID ${id} a fost șters` });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la ștergerea produsului', error: error.message });
  }
});

// ========== REVIEWS ROUTE (must be AFTER other :id routes) ==========

router.post('/:id/reviews',
  checkRole.authenticateJWT,
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalid'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating trebuie între 1 și 5'),
    body('comment').optional().isString().isLength({ max: 1000 }).withMessage('Comentariul este prea lung')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Eroare validare', errors: errors.array() });

    try {
      const productId = parseInt(req.params.id);
      const { rating, comment } = req.body;

      const product = await Product.findByPk(productId);
      if (!product) return res.status(404).json({ message: 'Produsul nu a fost găsit' });

      if (!req.user || !req.user.isEmailVerified) {
        return res.status(403).json({ message: 'Trebuie să aveți adresa de email verificată pentru a lăsa o recenzie' });
      }

      const newReview = await Review.create({
        productId,
        userId: req.user.id,
        rating,
        comment: comment || null,
        status: 'approved'
      });

      res.status(201).json({ message: 'Recenzie adăugată', review: newReview });
    } catch (error) {
      res.status(500).json({ message: 'Eroare la adăugarea recenziei', error: error.message });
    }
  }
);

module.exports = { router };