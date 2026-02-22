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

const createProductDto = require('../products/dto/create-product.dto');
const updateProductDto = require('../products/dto/update-product.dto');
const createUserDto = require('../users/dto/create-user.dto');
const updateUserDto = require('../users/dto/update-user.dto');
const exportProductsDto = require('../products/dto/export-products.dto');

const Product = require('../models/Product');
const User = require('../models/User');
const ImportExportLog = require('../models/ImportExportLog');

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
      const result = await processImport(req.file.buffer);
      
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

async function processImport(buffer) {
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
    filename: 'import.csv',
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

      await product.destroy();
      await sequelize.query(
        "SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) FROM products))"
      );
      res.json({ message: `Produsul cu ID ${id} a fost șters` });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la ștergerea produsului',
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
      const user = await User.findByPk(id);
      
      if (!user) return res.status(404).json({ message: 'Userul nu există' });

      await user.destroy();
       await sequelize.query(
        "SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 0) FROM products))"
      );
      res.json({ message: `Userul cu ID ${id} a fost șters` });
    } catch (error) {
      res.status(500).json({
        message: 'Eroare la ștergerea userului',
        error: error.message
      });
    }
  }
);


router.get('/report/users', checkRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'age', 'role', 'department'],
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

module.exports = router;