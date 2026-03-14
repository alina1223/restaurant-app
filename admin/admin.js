const express = require('express');
const { validationResult, param, query } = require('express-validator');
const { Op } = require('sequelize');
const router = express.Router();
const multer = require('multer');
const sequelize = require('../config/database');
const checkRole = require('../middlewares/auth');
const { usersUppercase } = require('../middlewares/uppercase');
const FileValidationPipe = require('../middlewares/file-validation.pipe');
const CSVProcessorService = require('../services/csv-processor.service');
const PDFDocument = require('pdfkit');

const createProductDto = require('../products/dto/create-product.dto');
const updateProductDto = require('../products/dto/update-product.dto');
const createUserDto = require('../users/dto/create-user.dto');
const updateUserDto = require('../users/dto/update-user.dto');
const exportProductsDto = require('../products/dto/export-products.dto');

const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/review');
const ImportExportLog = require('../models/ImportExportLog');
const { Cart, CartItem, Order } = require('../models/Cart');

function formatDate(value) {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  } catch {
    return String(value);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

const handleMulterErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Validare fișier eșuată',
        error: 'Fișierul nu poate depăși 2MB'
      });
    }
  }
  next(error);
};

router.post(
  '/products/import',
  checkRole('admin'),
  upload.single('file'),
  handleMulterErrors,
  async (req, res) => {
    try {
      FileValidationPipe.validateCSV(req.file);
      const result = await processImport(req.file.buffer, req.file.originalname);
      
      res.json({
        message: 'Import finalizat',
        summary: {
          totalRows: result.totalRows,
          successfullyImported: result.successfullyImported,
          failed: result.failed
        },
        details: {
          importedProducts: result.importedProducts,
          errors: result.errors
        }
      });

    } catch (error) {
      res.status(400).json({
        message: 'Validare fișier eșuată',
        error: error.message
      });
    }
  }
);

async function processImport(buffer, filename) {
  const productData = await CSVProcessorService.parseCSV(buffer);
  const { validatedProducts, errors } = await CSVProcessorService.validateProductData(productData);

  const importedProducts = [];
  
  for (const productData of validatedProducts) {
    try {
      const newProduct = await Product.create({
        name: productData.name,
        price: productData.price,
        description: productData.description,
        stock: productData.stock,
        category: productData.category
      });

      const cleanProduct = {
        id: newProduct.id,
        name: newProduct.name,
        price: newProduct.price,
        description: newProduct.description,
        stock: newProduct.stock,
        category: newProduct.category
      };
      
      importedProducts.push(cleanProduct);
    } catch (error) {
      errors.push({
        row: 'DB Error',
        error: `Eroare la salvarea în baza de date: ${error.message}`,
        data: productData
      });
    }
  }

  await ImportExportLog.create({
    type: 'import',
    filename: filename || 'import.csv',
    recordsProcessed: productData.length,
    recordsSuccessful: importedProducts.length,
    recordsFailed: errors.length,
    details: JSON.stringify({ errors })
  });

  return {
    totalRows: productData.length,
    successfullyImported: importedProducts.length,
    failed: errors.length,
    importedProducts,
    errors
  };
}

router.get(
  '/products/export',
  checkRole('admin'),
  exportProductsDto,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Eroare de validare a filtrelor',
        errors: errors.array()
      });
    }

    const { name, minPrice, maxPrice, category, minStock } = req.query;
    
    const whereConditions = {};
    
    if (name) {
      whereConditions.name = { [Op.iLike]: `%${name}%` };
    }
    
    if (category) {
      whereConditions.category = category;
    }
    
    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereConditions.price[Op.lte] = parseFloat(maxPrice);
    }
    
    if (minStock) {
      whereConditions.stock = { [Op.gte]: parseInt(minStock) };
    }

    const filteredProducts = await Product.findAll({
      where: whereConditions,
      attributes: ['id', 'name', 'price', 'description', 'stock', 'category'],
      raw: true
    });

    await ImportExportLog.create({
      type: 'export',
      filename: `export-${Date.now()}.csv`,
      recordsProcessed: filteredProducts.length,
      recordsSuccessful: filteredProducts.length,
      recordsFailed: 0,
      filters: req.query,
      details: `Export realizat cu ${filteredProducts.length} produse`
    });

    const csvContent = generateExportCSV(filteredProducts);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=produse-export-${Date.now()}.csv`);
    
    res.send(csvContent);
  }
);

function generateExportCSV(products) {
  const headers = ['id', 'name', 'price', 'description', 'stock', 'category'];
  let csvContent = headers.join(',') + '\n';
  
  products.forEach(product => {
    const row = headers.map(header => {
      let value = product[header];
      
      if (typeof value === 'string') {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value !== undefined ? value : '';
    });
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

router.post(
  '/create/product',
  checkRole('admin'),
  createProductDto,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    try {
      const { name, price, description, stock, category } = req.body;

      const newProduct = await Product.create({
        name,
        price,
        description,
        stock,
        category,
      });

      const cleanProduct = {
        id: newProduct.id,
        name: newProduct.name,
        price: newProduct.price,
        description: newProduct.description,
        stock: newProduct.stock,
        category: newProduct.category
      };

      res.json({ message: 'Produs adăugat cu succes', product: cleanProduct });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la crearea produsului',
        error: error.message
      });
    }
  }
);

router.put(
  '/edit/:id',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateProductDto,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    try {
      const id = parseInt(req.params.id);
      const product = await Product.findByPk(id);
      
      if (!product) return res.status(404).json({ message: 'Produsul nu există' });

      await product.update(req.body);

      const updatedProduct = await Product.findByPk(id, {
        attributes: ['id', 'name', 'price', 'description', 'stock', 'category'],
        raw: true
      });
      
      res.json({ message: 'Produs actualizat', product: updatedProduct });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la actualizarea produsului',
        error: error.message
      });
    }
  }
);

router.patch(
  '/update/:id',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  updateProductDto,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    try {
      const id = parseInt(req.params.id);
      const product = await Product.findByPk(id);
      
      if (!product) return res.status(404).json({ message: 'Produsul nu există' });

      await product.update(req.body);

      const updatedProduct = await Product.findByPk(id, {
        attributes: ['id', 'name', 'price', 'description', 'stock', 'category'],
        raw: true
      });
      
      res.json({ message: 'Produs actualizat parțial', product: updatedProduct });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la actualizarea produsului',
        error: error.message
      });
    }
  }
);

router.delete(
  '/delete/product/:id',
  checkRole('admin'),
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
      const product = await Product.findByPk(id);
      
      if (!product) return res.status(404).json({ message: 'Produsul nu există' });

      await sequelize.transaction(async (t) => {
        await CartItem.destroy({
          where: { productId: id },
          transaction: t,
          individualHooks: true
        });

        await Review.destroy({
          where: { productId: id },
          transaction: t
        });

        await product.destroy({ transaction: t });
      });

      res.json({ message: `Produsul cu ID ${id} a fost șters` });
    } catch (error) {
      const isFkError = error?.name === 'SequelizeForeignKeyConstraintError';
      res.status(isFkError ? 409 : 500).json({
        message: isFkError
          ? 'Produsul nu poate fi șters deoarece este referențiat de alte date (ex: coș/recenzii)'
          : 'Eroare la ștergerea produsului',
        error: error.message
      });
    }
  }
);

router.get('/report/products', checkRole('admin'), async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'price', 'description', 'stock', 'category'],
      raw: true
    });
    const totalProducts = await Product.count();
    
    res.json({ totalProducts, products });
  } catch (error) {
    res.status(500).json({
      message: 'Eroare la obținerea raportului',
      error: error.message
    });
  }
});

router.get('/report/reviews', checkRole('admin'), async (req, res) => {
  try {
    const products = await Product.findAll({ attributes: ['id', 'name'], raw: true });

    const results = [];
    for (const p of products) {
      const stats = await Review.getProductStats(p.id);
      results.push({ product: p, stats });
    }

    res.json({ totalProducts: products.length, reviews: results });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea statisticilor recenziilor', error: error.message });
  }
});

router.delete(
  '/delete/user/:id',
  checkRole('admin'),
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
      const user = await User.unscoped().findByPk(id);
      
      if (!user) return res.status(404).json({ message: 'Userul nu există' });

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

      res.json({ message: `Userul cu ID ${id} a fost șters` });
    } catch (error) {
      const isFkError = error?.name === 'SequelizeForeignKeyConstraintError';
      res.status(isFkError ? 409 : 500).json({
        message: isFkError
          ? 'Userul nu poate fi șters deoarece este referențiat de alte date (ex: comenzi/coș/recenzii)'
          : 'Eroare la ștergerea userului',
        error: error.message
      });
    }
  }
);

router.get('/report/users', checkRole('admin'), async (req, res) => {
  try {
    const users = await User.unscoped().findAll({
      attributes: ['id', 'name', 'email', 'phone', 'age', 'role', 'department', 'status', 'isActive', 'isEmailVerified'],
      raw: true
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Eroare la obținerea raportului',
      error: error.message
    });
  }
});

router.get(
  '/report/user/:id/pdf',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validare eșuată', errors: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);

      const user = await User.unscoped().findByPk(id, { raw: true });
      if (!user) return res.status(404).json({ message: 'Userul nu există' });

      const orders = await Order.findAll({
        where: { userId: id },
        order: [['createdAt', 'DESC']],
        raw: true
      });

      const reviews = await Review.findAll({
        where: { userId: id },
        include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']]
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="user-${id}-report.pdf"`);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.pipe(res);

      doc.fontSize(18).text('Raport utilizator', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Generat: ${formatDate(new Date())}`);
      doc.fillColor('#000');

      doc.moveDown();
      doc.fontSize(14).text('Date profil');
      doc.moveDown(0.3);
      doc.fontSize(11);
      doc.text(`ID: ${user.id}`);
      doc.text(`Nume: ${user.name || '-'}`);
      doc.text(`Email: ${user.email || '-'}`);
      doc.text(`Telefon: ${user.phone || '-'}`);
      doc.text(`Vârstă: ${user.age ?? '-'}`);
      doc.text(`Rol: ${user.role || '-'}`);
      doc.text(`Departament: ${user.department || '-'}`);
      doc.text(`Status: ${user.status || '-'}`);
      doc.text(`Email verificat: ${String(user.isEmailVerified)}`);
      doc.text(`Înregistrat la: ${formatDate(user.createdAt)}`);
      doc.text(`Ultimul login: ${formatDate(user.lastLogin)}`);

      doc.moveDown();
      doc.fontSize(14).text('Comenzi');
      doc.moveDown(0.3);
      doc.fontSize(11);

      if (!orders.length) {
        doc.fillColor('#666').text('(nu există comenzi)');
        doc.fillColor('#000');
      } else {
        let grandTotal = 0;

        for (const order of orders) {
          const total = Number(order.totalAmount || 0);
          grandTotal += total;

          doc.fontSize(12).text(`Comandă: ${order.orderNumber || `#${order.id}`}`);
          doc.fontSize(10).fillColor('#666');
          doc.text(`Data: ${formatDate(order.createdAt)} | Status: ${order.status} | Plată: ${order.paymentStatus} (${order.paymentMethod || '-'})`);
          doc.text(`Adresă livrare: ${order.shippingAddress || '-'}`);
          doc.fillColor('#000');

          const cart = await Cart.findByPk(order.cartId, {
            include: [{ model: CartItem, as: 'items', include: [{ model: Product }] }]
          });

          const items = cart?.items || [];
          if (!items.length) {
            doc.fillColor('#666').text('(fără produse)');
            doc.fillColor('#000');
          } else {
            for (const it of items) {
              const p = it.Product;
              const line = `- ${p?.name || `Produs #${it.productId}`} | qty: ${it.quantity} | price: ${Number(it.price).toFixed(2)} | subtotal: ${(Number(it.price) * Number(it.quantity)).toFixed(2)}`;
              doc.fontSize(10).text(line, { indent: 12 });
            }
          }

          doc.fontSize(11).text(`Total comandă: ${total.toFixed(2)} MDL`);
          doc.moveDown(0.6);

          if (doc.y > 740) doc.addPage();
        }

        doc.moveDown(0.2);
        doc.fontSize(12).text(`Total cheltuit (toate comenzile): ${grandTotal.toFixed(2)} MDL`);
      }

      doc.moveDown();
      doc.fontSize(14).text('Recenzii');
      doc.moveDown(0.3);
      doc.fontSize(11);

      if (!reviews.length) {
        doc.fillColor('#666').text('(nu există recenzii)');
        doc.fillColor('#000');
      } else {
        for (const r of reviews) {
          const productName = r.product?.name || `Produs #${r.productId}`;
          doc.fontSize(12).text(`${productName} | rating: ${r.rating} | status: ${r.status}`);
          doc.fontSize(10).fillColor('#666').text(`Data: ${formatDate(r.createdAt)}`);
          doc.fillColor('#000');
          if (r.comment) doc.fontSize(11).text(`Comentariu: ${r.comment}`);
          doc.moveDown(0.6);

          if (doc.y > 740) doc.addPage();
        }
      }

      doc.end();
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la generarea raportului PDF',
        error: error.message
      });
    }
  }
);

router.get(
  '/search/users',
  checkRole('admin'),
  [
    query('name')
      .optional()
      .isString()
      .withMessage('Numele trebuie să fie un text valid'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    try {
      const { name } = req.query;
      let whereConditions = {};

      if (name) {
        whereConditions.name = { [Op.iLike]: `%${name}%` };
      }

      const filteredUsers = await User.findAll({ 
        where: whereConditions,
        attributes: ['id', 'name', 'email', 'phone', 'age', 'role', 'department'],
        raw: true
      });
      
      res.locals.users = filteredUsers;
      next();
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la căutarea userilor',
        error: error.message
      });
    }
  },
  usersUppercase,
  (req, res) => {
    res.json(res.locals.users);
  }
);


router.get('/report/users', checkRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const pendingUsers = await User.count({ where: { status: 'pending' } });
    const verifiedEmails = await User.count({ where: { isemailverified: true } });
    
    const usersByRole = await sequelize.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE status != 'deleted'
      GROUP BY role
    `);

    const recentUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'isemailverified', 'status'],
      limit: 10,
      order: [['createdAt', 'DESC']],
      raw: true
    });

    const lastActiveUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'lastLogin'],
      where: { lastLogin: { [Op.ne]: null } },
      limit: 10,
      order: [['lastLogin', 'DESC']],
      raw: true
    });

    res.json({
      totalUsers,
      activeUsers,
      pendingUsers,
      verifiedEmails,
      usersByRole: usersByRole[0],
      recentUsers,
      lastActiveUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

router.get('/report/products-detailed', checkRole('admin'), async (req, res) => {
  try {
    const totalProducts = await Product.count();
    
    const productsWithStats = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p."createdAt",
        COUNT(DISTINCT ci.id) as times_in_carts,
        COUNT(DISTINCT r.id) as total_reviews,
        ROUND(AVG(r.rating)::numeric, 2) as avg_rating,
        COUNT(DISTINCT CASE WHEN r.rating = 5 THEN r.id END) as five_stars,
        COUNT(DISTINCT CASE WHEN r.rating = 4 THEN r.id END) as four_stars,
        COUNT(DISTINCT CASE WHEN r.rating = 3 THEN r.id END) as three_stars,
        COUNT(DISTINCT CASE WHEN r.rating = 2 THEN r.id END) as two_stars,
        COUNT(DISTINCT CASE WHEN r.rating = 1 THEN r.id END) as one_stars
      FROM products p
      LEFT JOIN cart_items ci ON p.id = ci."productId"
      LEFT JOIN reviews r ON p.id = r."productId" AND r.status = 'approved'
      GROUP BY p.id, p.name, p.price, p."createdAt"
      ORDER BY total_reviews DESC
    `);

    res.json({
      totalProducts,
      products: productsWithStats[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product statistics', error: error.message });
  }
});

router.get('/report/reviews-detailed', checkRole('admin'), async (req, res) => {
  try {
    const totalReviews = await Review.count();
    const approvedReviews = await Review.count({ where: { status: 'approved' } });
    const pendingReviews = await Review.count({ where: { status: 'pending' } });
    const rejectedReviews = await Review.count({ where: { status: 'rejected' } });

    const ratingDistribution = await sequelize.query(`
      SELECT rating, COUNT(*) as count
      FROM reviews
      WHERE status = 'approved'
      GROUP BY rating
      ORDER BY rating DESC
    `);

    const topRatedProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        ROUND(AVG(r.rating)::numeric, 2) as avg_rating,
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r."productId" AND r.status = 'approved'
      GROUP BY p.id, p.name
      HAVING COUNT(r.id) > 0
      ORDER BY avg_rating DESC
      LIMIT 10
    `);

    const mostReviewedProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(r.id) as review_count,
        ROUND(AVG(r.rating)::numeric, 2) as avg_rating
      FROM products p
      LEFT JOIN reviews r ON p.id = r."productId" AND r.status = 'approved'
      GROUP BY p.id, p.name
      HAVING COUNT(r.id) > 0
      ORDER BY review_count DESC
      LIMIT 10
    `);

    const recentReviews = await Review.findAll({
      attributes: ['id', 'rating', 'comment', 'status', 'createdAt'],
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        { model: Product, as: 'product', attributes: ['name'] }
      ],
      limit: 20,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      summary: {
        totalReviews,
        approvedReviews,
        pendingReviews,
        rejectedReviews
      },
      ratingDistribution: ratingDistribution[0],
      topRatedProducts: topRatedProducts[0],
      mostReviewedProducts: mostReviewedProducts[0],
      recentReviews
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching review statistics', error: error.message });
  }
});

router.get('/report/carts', checkRole('admin'), async (req, res) => {
  try {
    const { Cart } = require('../models/Cart');
    
    const totalCarts = await Cart.count();
    const activeCarts = await Cart.count({ where: { status: 'active' } });
    const completedOrders = await Cart.count({ where: { status: 'completed' } });
    const abandonedCarts = await Cart.count({ where: { status: 'abandoned' } });

    const cartsWithStats = await sequelize.query(`
      SELECT 
        c.id,
        c."userId",
        u.name,
        u.email,
        c.status,
        COUNT(ci.id) as item_count,
        SUM(ci.quantity) as total_quantity,
        ROUND(SUM(ci.quantity * ci.price)::numeric, 2) as total_amount,
        c."createdAt",
        c."updatedAt"
      FROM carts c
      LEFT JOIN users u ON c."userId" = u.id
      LEFT JOIN cart_items ci ON c.id = ci."cartId"
      GROUP BY c.id, u.name, u.email, c.status, c."createdAt", c."updatedAt", c."userId"
      ORDER BY c."updatedAt" DESC
      LIMIT 50
    `);

    res.json({
      summary: {
        totalCarts,
        activeCarts,
        completedOrders,
        abandonedCarts
      },
      carts: cartsWithStats[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart statistics', error: error.message });
  }
});

router.get('/report/activity', checkRole('admin'), async (req, res) => {
  try {
    const usersRegisteredToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: sequelize.literal("CURRENT_DATE")
        }
      }
    });

    const usersRegisteredThisWeek = await User.count({
      where: {
        createdAt: {
          [Op.gte]: sequelize.literal("CURRENT_DATE - INTERVAL '7 days'")
        }
      }
    });

    const usersRegisteredThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: sequelize.literal("CURRENT_DATE - INTERVAL '30 days'")
        }
      }
    });

    const activeUsersToday = await User.count({
      where: {
        lastLogin: {
          [Op.gte]: sequelize.literal("CURRENT_DATE")
        }
      }
    });

    const activeUsersThisWeek = await User.count({
      where: {
        lastLogin: {
          [Op.gte]: sequelize.literal("CURRENT_DATE - INTERVAL '7 days'")
        }
      }
    });

    const reviewsCreatedToday = await Review.count({
      where: {
        createdAt: {
          [Op.gte]: sequelize.literal("CURRENT_DATE")
        }
      }
    });

    res.json({
      registrations: {
        today: usersRegisteredToday,
        thisWeek: usersRegisteredThisWeek,
        thisMonth: usersRegisteredThisMonth
      },
      activity: {
        activeUsersToday,
        activeUsersThisWeek,
        reviewsCreatedToday
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity report', error: error.message });
  }
});

router.get('/report/email-verification', checkRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const verifiedEmails = await User.count({ where: { isemailverified: true } });
    const unverifiedEmails = await User.count({ where: { isemailverified: false } });
    
    const verificationRate = totalUsers > 0 ? ((verifiedEmails / totalUsers) * 100).toFixed(2) : 0;

    const unverifiedUsersList = await User.findAll({
      attributes: ['id', 'name', 'email', 'createdAt', 'status'],
      where: { isemailverified: false },
      limit: 50,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      summary: {
        totalUsers,
        verifiedEmails,
        unverifiedEmails,
        verificationRate: `${verificationRate}%`
      },
      unverifiedUsers: unverifiedUsersList
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching email verification report', error: error.message });
  }
});

module.exports = router;