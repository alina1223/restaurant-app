# Quick Start Guide

## Prerequisites
- Node.js installed
- npm/yarn installed
- Database configured and running
- .env file configured in backend

## Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## Step 2: Seed Database with Hardware Products

```bash
cd backend
node scripts/seed-hardware-products.js
```

**Expected Output:**
```
✓ Conectat la baza de date
✓ Modelele au fost sincronizate
✓ Produsele existente au fost șterse
✓ 20 produse au fost create cu succes!

Rezumat categorii:
  - Firewall: 5 produse
  - Router: 5 produse
  - Camera: 5 produse
  - NAS: 5 produse
```

If you see errors about database connection, check:
1. DATABASE_URL is correct in .env
2. Database server is running
3. Credentials are valid

## Step 3: Start Backend

```bash
cd backend
npm start
```

**Expected:** Server running on http://localhost:3000

## Step 4: Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

**Expected:** Dev server running on http://localhost:5173

## Step 5: Visit the Application

1. **Home Page**: http://localhost:5173
   - Click "Vezi catalogul" button

2. **Catalog**: http://localhost:5173/catalog
   - 4 category buttons at top
   - Should show 5 Firewall products by default
   - Category-specific filters appear

3. **Admin Panel** (requires login as admin):
   - http://localhost:5173/admin
   - Login with admin credentials
   - Create/Edit/Delete products
   - Export/Import CSV

## Quick Test Scenarios

### Scenario 1: Browse Catalog
1. Go to /catalog
2. Click different category buttons
3. Observe filters change
4. Filters correctly show only category-specific options

### Scenario 2: Create Product (as admin)
1. Login as admin
2. Go to /admin
3. Find "Creare produs" section
4. Select a category (e.g., "Router")
5. Fill in fields (Name, Price, Stock)
6. Fill in category-specific fields
7. Click "Creează produs"
8. Go to /catalog and verify product appears

### Scenario 3: Export Products
1. Go to /admin
2. Find "Export produse (CSV)" section
3. Select a category filter
4. Click "Export"
5. CSV file should download with all products and attributes

### Scenario 4: Search & Filter
1. Go to /catalog
2. Select "Camera" category
3. Type "Hikvision" in search
4. Only Hikvision cameras should show

### Scenario 5: Add to Cart
1. Login as regular user
2. Go to /catalog
3. Click "Coș" button on a product
4. Message "Produs adăugat în coș" should appear
5. Cart count should increase

## Troubleshooting

### Port Already in Use
```bash
# Change port in backend (backend/.env or index.js)
# Change frontend port in vite.config.js
```

### Database Connection Error
```bash
# Check .env file has correct DATABASE_URL
# Make sure database server is running
# Test connection: npm run test:db
```

### Seed Script Fails
```bash
# Check you're in backend directory
# Check .env is configured
# Check database has correct permissions
# Try running with debugging:
NODE_DEBUG=* node scripts/seed-hardware-products.js
```

### Frontend Doesn't Load
```bash
# Clear browser cache (Ctrl+Shift+Delete)
# Check console for errors (F12)
# Try: npm run dev -- --host
```

### Products Don't Show
1. Verify seed script ran successfully
2. Check database directly for products
3. Try refreshing page
4. Check browser console for API errors

## Verify Installation

### Backend Check
```bash
curl http://localhost:3000/products/list
# Should return JSON array of 20 products
```

### Database Check
```bash
# Connect to database and run:
SELECT COUNT(*) FROM products WHERE category IN ('Firewall', 'Router', 'Camera', 'NAS');
# Should return 20
```

### Frontend Check
```bash
# Visit http://localhost:5173/catalog
# Should see:
# - 4 category buttons
# - Filter section
# - 5 products in grid
```

## Default Admin Credentials
Check database or create new admin user:
```bash
cd backend
npm run create:admin
# or
node scripts/create-admin-user.js
```

## Environment Variables (.env)

Required in `backend/.env`:
```
PORT=3000
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=development
```

## Next Steps

1. **Explore Features**
   - Browse different categories
   - Try all filters
   - Test search functionality

2. **Admin Features**
   - Create new products
   - Edit existing products
   - Delete products
   - Import/Export CSV

3. **User Features**
   - Add products to cart
   - Checkout process
   - View product details

4. **Production Deployment**
   - See ARCHITECTURE.md for deployment notes
   - Configure environment variables
   - Set up database backup
   - Enable HTTPS

## Common Commands

```bash
# Seed database
node backend/scripts/seed-hardware-products.js

# Create admin user
node backend/scripts/create-admin-user.js

# List all users
node backend/scripts/list-users.js

# Run frontend dev
npm --prefix frontend run dev

# Run backend
npm --prefix backend start

# Both in one command (requires GNU Make or similar)
make start

# Or with npm-run-all
npx concurrently "npm --prefix backend start" "npm --prefix frontend run dev"
```

## Need Help?

1. **Check Documentation**
   - CHANGES.md - What changed
   - ARCHITECTURE.md - How it works
   - TESTING.md - How to test

2. **Check Logs**
   - Browser console (F12)
   - Backend terminal output
   - Database logs

3. **Check Configuration**
   - .env file
   - database.js
   - vite.config.js

4. **Reset Everything**
   ```bash
   # Clear and reseed database
   node backend/scripts/seed-hardware-products.js
   
   # Clear node_modules
   rm -rf backend/node_modules frontend/node_modules
   npm install --prefix backend
   npm install --prefix frontend
   ```

## Success Indicators

✅ Seed script runs without errors
✅ Backend starts on port 3000
✅ Frontend starts on port 5173
✅ Homepage loads with "Hardware Store" title
✅ Catalog shows 20 products in 4 categories
✅ Filters change based on category
✅ Can create product as admin
✅ CSV export/import works
✅ Can add products to cart
✅ Can complete checkout

Enjoy using Hardware Store! 🎉
