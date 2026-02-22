# Restaurant App - Prezentare PPT (15 Sliduri)

## Slide 1: Cover Page
**Titlu:** Restaurant Management Web Application  
**Subtitlu:** Full-Stack Application cu React, Node.js, PostgreSQL  
**Date:** februarie 2026  
**Autor:** [Numele tău]

---

## Slide 2: Prezentare Generală - What is the Project?
**Titlu:** Ce este Restaurant App?

### Conținut:
- Aplicație web completă pentru gestionarea unui restaurant
- Funcționalități: Meniu online, coș de cumpărături, gestionare producte, autentificare
- Stack: Frontend (React/Vite) + Backend (Node.js/Express) + Database (PostgreSQL)
- Imagine: Logo/Screenshot de pe pagina principală

**Key Features:**
- ✅ Catalog de produse cu imagini
- ✅ Sistem de coș de cumpărături
- ✅ Autentificare și rol-uri (Admin, User)
- ✅ Management producte (CRUD)
- ✅ Recenzii și ratinguri

---

## Slide 3: Architecture Overview
**Titlu:** Arhitectura Aplicației

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                  │
│  - Pages: Menu, Admin, Cart, Auth, Products        │
│  - State Management: Context API (Auth, Cart)       │
│  - HTTP Client: Axios custom wrapper                │
└────────────────┬──────────────────────────────────┘
                 │ HTTP/REST API (localhost:3000)
┌────────────────▼──────────────────────────────────┐
│               BACKEND (Express.js)                 │
│  - Routes: /auth, /products, /users, /admin        │
│  - Middleware: CORS, JWT, Rate Limiting            │
│  - File Upload: Multer (Product Images)            │
└────────────────┬──────────────────────────────────┘
                 │ Sequelize ORM
┌────────────────▼──────────────────────────────────┐
│         DATABASE (PostgreSQL)                      │
│  - Tables: Users, Products, Cart, Reviews, Logs    │
└─────────────────────────────────────────────────────┘
```

---

## Slide 4: Frontend Technology Stack
**Titlu:** Frontend - React + Vite

### Estructura:
```
frontend/
├── src/
│   ├── ui/
│   │   ├── pages/         ← Main pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── MenuPage.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   └── AuthPage.jsx
│   │   └── components/
│   ├── state/
│   │   ├── auth/         ← Auth Context
│   │   └── cart/         ← Cart Context
│   └── utils/
│       └── apiClient.js  ← Axios wrapper
```

### Key Libraries:
- **React 19.0** - UI Framework
- **React Router** - Navigation
- **Vite 7.3** - Build tool
- **Axios** - HTTP Client

---

## Slide 5: Frontend - Authentication System
**Titlu:** Sistem de Autentificare (Frontend)

### AuthContext.jsx
```javascript
export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = unwrapApiData(res)
    setToken(token)
    setUser(user)
    localStorage.setItem('token', token)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Characteristics:**
- JWT token stored în localStorage
- Context API pentru state management
- Role-based access control (isAdmin)

---

## Slide 6: Frontend - Shopping Cart
**Titlu:** Sistema de Coș (Frontend)

### CartContext.jsx
```javascript
export const CartContext = createContext()

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const add = (product, qty) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i => 
          i.productId === product.id 
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      }
      return [...prev, { productId: product.id, quantity: qty, product }]
    })
  }

  const remove = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  return (
    <CartContext.Provider value={{ items, add, remove, total: items.length }}>
      {children}
    </CartContext.Provider>
  )
}
```

**Features:**
- Add/Remove products
- Update quantities
- Synchronized cu backend

---

## Slide 7: Frontend - Product Management (Admin)
**Titlu:** Gestionarea Produselor (Admin)

### Upload Imagini cu Multer
```javascript
// AdminPage.jsx - Image Handler
function handleCreateProductImageChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    alert('Doar imagini sunt permise (JPG, PNG, GIF, WebP)')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Imaginea trebuie să fie mai mică de 5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    setCreateProduct((s) => ({
      ...s,
      image: file,
      imagePreview: event.target.result
    }))
  }
  reader.readAsDataURL(file)
}

// POST /products/create
const fd = new FormData()
fd.append('name', createProduct.name)
fd.append('price', createProduct.price)
fd.append('image', createProduct.image)  // ← File upload
await api.post('/products/create', fd)
```

**Features:**
- File validation (type, size)
- Image preview
- FormData for multipart upload

---

## Slide 8: Backend Technology Stack
**Titlu:** Backend - Node.js + Express

### Structura:
```
backend/
├── index.js              ← Server entry point
├── config/
│   ├── database.js
│   ├── jwt.config.js
│   └── email.config.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   └── review.js
├── products/
│   ├── products.js       ← Routes & Controllers
│   └── dto/              ← Data Transfer Objects
├── users/
├── services/             ← Business Logic
├── middlewares/
└── uploads/              ← Product images storage
    └── products/
```

### Key Libraries:
- **Express 5.1** - Web framework
- **Sequelize 6.37** - ORM
- **PostgreSQL** - Database
- **Multer 2.0** - File upload
- **jsonwebtoken** - JWT auth
- **bcrypt** - Password hashing

---

## Slide 9: Backend - Database Model
**Titlu:** Product Model + Image Storage

### Product.js (Sequelize Model)
```javascript
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: DataTypes.TEXT,
  stock: DataTypes.INTEGER,
  category: DataTypes.STRING,
  imagePath: {
    type: DataTypes.STRING,  // ← NEW: Image path column
    allowNull: true
  }
}, { timestamps: true })
```

**Database Migration:**
```sql
ALTER TABLE "Products" ADD COLUMN "imagePath" VARCHAR(255) NULL;
```

---

## Slide 10: Backend - File Upload with Multer
**Titlu:** Product Creation cu Upload Imagine

### products.js - POST /create
```javascript
const multer = require('multer')
const path = require('path')

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `product-${Date.now()}${ext}`
    cb(null, name)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    return cb(new Error('Invalid file type'))
  }
  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error('File too large (max 5MB)'))
  }
  cb(null, true)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

// POST /create - CREATE PRODUCT WITH IMAGE
router.post('/create', authJwt, checkRole('admin'), async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Upload error', error: err.message })
    }

    const { name, price, description, stock, category } = req.body
    try {
      const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null
      const newProduct = await Product.create({
        name, price, description, stock, category, imagePath
      })
      res.json({ message: 'Product created', product: newProduct })
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path)  // Cleanup on error
      res.status(500).json({ message: 'Error creating product', error: error.message })
    }
  })
})
```

---

## Slide 11: Backend - Product Update with Image Replacement
**Titlu:** Editarea Produselor (Delete Old Image)

### products.js - PUT /edit/:id
```javascript
// PUT /edit/:id - UPDATE PRODUCT WITH IMAGE
router.put('/edit/:id', authJwt, checkRole('admin'), async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    const id = parseInt(req.params.id)
    try {
      const product = await Product.findByPk(id)
      if (!product) return res.status(404).json({ message: 'Product not found' })

      // DELETE OLD IMAGE if new one is uploaded
      if (req.file && product.imagePath) {
        const oldImagePath = path.join(__dirname, '../' + product.imagePath)
        try {
          fs.unlinkSync(oldImagePath)  // Synchronous deletion
        } catch (err) {
          console.error('Error deleting old image:', err)
        }
      }

      const updateData = req.body
      if (req.file) {
        updateData.imagePath = `/uploads/products/${req.file.filename}`
      }

      await product.update(updateData)
      res.json({ message: 'Product updated', product })
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path)
      res.status(500).json({ message: 'Error updating product', error: error.message })
    }
  })
})
```

**Key Features:**
- Old image automatic deletion
- Atomic update transaction
- Error handling with cleanup

---

## Slide 12: Backend - API Endpoints & Validation
**Titlu:** REST API Endpoints

### Authentication Routes (/auth)
```javascript
POST   /auth/register          // Register new user
POST   /auth/login             // Login & get JWT token
POST   /auth/verify-email      // Verify email with code
POST   /auth/forgot-password    // Request password reset
```

### Products Routes (/products)
```javascript
GET    /products/list          // All products
GET    /products/search        // Filter by name, category, price
GET    /products/details/:id   // Single product details
POST   /products/create        // Create with image (Admin)
PUT    /products/edit/:id      // Update with image (Admin)
DELETE /products/delete/:id    // Delete product (Admin)
POST   /products/:id/reviews   // Add review
```

### Users Routes (/users)
```javascript
GET    /users/profile          // Logged user profile
PUT    /users/edit-profile     // Update profile
POST   /users/change-password  // Change password
GET    /users/cart             // Get user's cart
```

### Admin Routes (/admin)
```javascript
GET    /admin/report/products  // Products report
GET    /admin/report/users     // Users report
```

---

## Slide 13: Security Features
**Titlu:** Securitate & Validare

### Middleware Stack
```javascript
// server initialization (index.js)
app.use(cors({ origin: [...] }))                    // CORS
app.use(rateLimit({ windowMs: 15*60*1000, ... }))  // Rate limiting
app.use(requestId)                                  // Request tracking
app.use(express.json())                             // JSON parsing
app.use(responseFormatter)                          // Response formatting
app.use('/uploads', express.static(...))            // Static files
```

### JWT Authentication
```javascript
const authJwt = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

const checkRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  next()
}
```

### Input Validation
```javascript
const { body, param, validationResult } = require('express-validator')

router.post('/create',
  body('name').isString().notEmpty().withMessage('Name required'),
  body('price').isDecimal().withMessage('Valid price required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock required'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // ... create logic
  }
)
```

---

## Slide 14: Key Technologies & Lessons Learned
**Titlu:** Tehnologii & Lectii Invatate

### Key Technologies Used:
| Frontend | Backend | Database | DevOps |
|----------|---------|----------|--------|
| React 19 | Node.js 20 | PostgreSQL 15 | Git |
| Vite 7.3 | Express 5.1 | Sequelize 6 | npm/yarn |
| React Router | Multer 2.0 | JWT Auth | Nodemon |
| Axios | bcrypt | Transactions | Postman |

### Lessons Learned:
1. **Express Route Ordering** - Specific routes BEFORE parameterized ones
   ```javascript
   // ✅ CORRECT
   router.get('/list', ...)
   router.get('/search', ...)
   router.get('/:id', ...)
   
   // ❌ WRONG - /:id catches /list and /search
   router.get('/:id', ...)
   router.get('/list', ...)
   ```

2. **Multer Middleware** - Use callback pattern, not middleware
   ```javascript
   // ✅ CORRECT - callback in handler
   upload.single('image')(req, res, async (err) => { ... })
   
   // ❌ WRONG - blocks entire route
   router.post('/create', upload.single('image'), ...)
   ```

3. **Database Sync** - Manual migrations for enums
   ```javascript
   // ✅ Use alter: false + manual SQL for complex types
   sequelize.sync({ alter: false })
   // Then run: ALTER TABLE "Products" ADD COLUMN "imagePath" ...
   ```

4. **Image URL Mapping** - Frontend ≠ Backend port
   ```javascript
   // ✅ Map from /uploads/... to http://localhost:3000/uploads/...
   function getImageUrl(path) {
     if (!path) return null
     if (path.startsWith('http')) return path
     return `http://localhost:3000${path}`
   }
   ```

---

## Slide 15: Demo & Conclusion
**Titlu:** Live Demo & Next Steps

### Live Demo Checklist:
1. **Home Page** → Show featured products
2. **Menu Page** → Browse all products with images
   - Filter by category, name, price
   - Add products to cart
3. **Product Details** → Click on product, see full details + reviews
4. **Admin Panel** → Create new product with image upload
5. **Edit Product** → Upload new image, old one is deleted
6. **Shopping Cart** → Manage items, quantities
7. **Authentication** → Login/Register/Logout flow

### Demo URLs:
- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:3000
- **Admin Panel:** http://localhost:5174 (login as admin)

### Next Steps / Future Features:
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Order tracking
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated testing (Jest, Cypress)
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Image optimization & CDN

### Project Links:
- **Repository:** (GitHub link)
- **Live Demo:** http://localhost:5174
- **API Docs:** Postman collection available

---

## Additional Resources for Demo

### Sample Test Data:
```
Admin User:
  Email: admin@restaurant.local
  Password: Admin123!

Test User:
  Email: test@example.com
  Password: Test123!

Test Products:
  - Pizza Margherita (Category: Pizza, Price: 45.99, Stock: 20)
  - Burger Deluxe (Category: Burger, Price: 32.50, Stock: 15)
  - Caesar Salad (Category: Salată, Price: 28.00, Stock: 25)
  - Tiramisu (Category: Desert, Price: 18.50, Stock: 30)
  - Coca Cola (Category: Băutură, Price: 5.00, Stock: 50)
```

### Common Questions & Answers:

**Q: How are images stored?**
A: Multer saves files to `/backend/uploads/products/` and stores path in database

**Q: How does authentication work?**
A: JWT tokens issued on login, stored in localStorage, sent via Authorization header

**Q: Can users edit their own products?**
A: Only admins can create/edit/delete. Regular users can only browse and review

**Q: What happens to old images when updated?**
A: Automatically deleted from disk via `fs.unlinkSync()` when new image uploaded

---

## Presentation Tips:
1. **Timing:** ~30-40 minutes total (2-3 min per slide + 10 min demo)
2. **Visuals:** Include screenshots of UI for slides 2-7
3. **Demo Flow:** Go slow, explain what you're doing
4. **Code:** Use syntax highlighting, highlight key lines with color
5. **Enthusiasm:** Talk about challenges overcome and solutions found
