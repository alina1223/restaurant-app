const express = require('express');
const { validationResult, param, query } = require('express-validator');
const router = express.Router();
const multer = require('multer');

const checkRole = require('../middlewares/auth');
const { usersUppercase } = require('../middlewares/uppercase');
const FileValidationPipe = require('../middlewares/file-validation.pipe');
const CSVProcessorService = require('../services/csv-processor.service');

const createProductDto = require('../products/dto/create-product.dto');
const updateProductDto = require('../products/dto/update-product.dto');
const createUserDto = require('../users/dto/create-user.dto');
const updateUserDto = require('../users/dto/update-user.dto');
const exportProductsDto = require('../products/dto/export-products.dto'); // ✅ DTO NOU

let { products } = require('../products/products');
let { users } = require('../users/users');

// Configurare multer pentru upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// ✅ MIDDLEWARE PENTRU GESTIONARE ERORI MULTER
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

// Endpoint Import CSV
router.post(
  '/products/import',
  checkRole('admin'),
  upload.single('file'),
  handleMulterErrors,
  (req, res) => {
    try {
      FileValidationPipe.validateCSV(req.file);
      processImport(req.file.buffer)
        .then(result => {
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
        })
        .catch(error => {
          res.status(400).json({
            message: 'Eroare la procesarea fișierului',
            error: error.message
          });
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

  const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
  
  const importedProducts = [];
  validatedProducts.forEach((productData, index) => {
    const newProduct = {
      id: maxId + index + 1,
      name: productData.name,
      price: productData.price,
      description: productData.description,
      stock: productData.stock,
      category: productData.category
    };
    products.push(newProduct);
    importedProducts.push(newProduct);
  });

  return {
    totalRows: productData.length,
    successfullyImported: importedProducts.length,
    failed: errors.length,
    importedProducts,
    errors
  };
}

// ✅ ENDPOINT EXPORT CSV CU DTO NOU
router.get(
  '/products/export',
  checkRole('admin'),
  exportProductsDto, // ✅ FOLOSEȘTE DOAR DTO-UL, FĂRĂ VALIDĂRI DUPLICATE
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Eroare de validare a filtrelor',
        errors: errors.array()
      });
    }

    const { name, minPrice, maxPrice, category, minStock } = req.query;
    
    console.log('🔍 Filtre aplicate:', { name, minPrice, maxPrice, category, minStock });
    let filteredProducts = [...products];

    // ✅ APLICĂ FILTRELE
    if (name) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(name.toLowerCase())
      );
      console.log(`📝 Filtru nume: ${filteredProducts.length} produse rămase`);
    }

    if (minPrice) {
      filteredProducts = filteredProducts.filter(p => 
        p.price >= parseFloat(minPrice)
      );
      console.log(`💰 Filtru preț minim ${minPrice}: ${filteredProducts.length} produse`);
    }

    if (maxPrice) {
      filteredProducts = filteredProducts.filter(p => 
        p.price <= parseFloat(maxPrice)
      );
      console.log(`💰 Filtru preț maxim ${maxPrice}: ${filteredProducts.length} produse`);
    }

    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
      console.log(`🏷️  Filtru categorie ${category}: ${filteredProducts.length} produse`);
    }

    if (minStock) {
      filteredProducts = filteredProducts.filter(p => 
        p.stock >= parseInt(minStock)
      );
      console.log(`📦 Filtru stoc minim ${minStock}: ${filteredProducts.length} produse`);
    }

    // ✅ GENEREAZĂ CSV CU TOATE CÂMPURILE
    const csvContent = generateExportCSV(filteredProducts);

    // ✅ SETEAZĂ HEADERS PENTRU DOWNLOAD
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=produse-export-${Date.now()}.csv`);
    res.setHeader('X-Export-Info', `Produse: ${filteredProducts.length}, Filtre: ${Object.keys(req.query).length}`);
    
    console.log(`📤 Export final: ${filteredProducts.length} produse`);
    res.send(csvContent);
  }
);

// ✅ FUNCȚIE PENTRU GENERARE CSV CU TOATE CÂMPURILE
function generateExportCSV(products) {
  const headers = ['id', 'name', 'price', 'description', 'stock', 'category'];
  let csvContent = headers.join(',') + '\n';
  
  products.forEach(product => {
    const row = headers.map(header => {
      let value = product[header];
      
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    const { name, price, description, stock, category } = req.body;

    const newProduct = {
      id: products.length + 1,
      name,
      price,
      description,
      stock,
      category,
    };

    products.push(newProduct);
    res.json({ message: 'Produs adăugat cu succes', product: newProduct });
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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Produsul nu există' });

    Object.assign(product, req.body);
    res.json({ message: 'Produs actualizat', product });
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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validare eșuată',
        errors: errors.array(),
      });
    }

    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Produsul nu există' });

    Object.assign(product, req.body);
    res.json({ message: 'Produs actualizat parțial', product });
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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const existing = products.find(p => p.id === id);
    if (!existing) return res.status(404).json({ message: 'Produsul nu există' });

    products = products.filter(p => p.id !== id);
    res.json({ message: `Produsul cu ID ${id} a fost șters` });
  }
);


router.delete(
  '/delete/user/:id',
  checkRole('admin'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID-ul trebuie să fie un număr valid mai mare decât 0'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const existing = users.find(u => u.id === id);
    if (!existing) return res.status(404).json({ message: 'Userul nu există' });

    users = users.filter(u => u.id !== id);
    res.json({ message: `Userul cu ID ${id} a fost șters` });
  }
);


router.get('/report/products', checkRole('admin'), (req, res) => {
  res.json({ totalProducts: products.length, products });
});



router.get('/report/users', checkRole('admin'), (req, res) => {
  res.json(users);
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
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }

    const { name } = req.query;
    let filteredUsers = users;

    if (name) {
      filteredUsers = filteredUsers.filter(u =>
        u.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    res.locals.users = filteredUsers;
    next();
  },
  usersUppercase,
  (req, res) => {
    res.json(res.locals.users);
  }
);

module.exports = router;
