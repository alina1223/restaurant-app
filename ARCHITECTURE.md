# Architecture Overview - Hardware Store

## Structure

### Database Schema (Sequelize Models)

#### Product Table
```
id (INTEGER, PK)
name (STRING)
price (DECIMAL)
description (TEXT)
stock (INTEGER)
category (ENUM: 'Firewall', 'Router', 'Camera', 'NAS')
imagePath (STRING)
createdAt (TIMESTAMP)
updatedAt (TIMESTAMP)

// Firewall specific
brand (STRING)
ram (STRING)
ports (STRING)
throughput (STRING)
vpn (STRING)
rackmount (BOOLEAN)

// Router specific
wifiStandard (STRING)
vpnSupport (STRING)

// Camera specific
resolution (STRING)
connectivity (STRING)
weatherproof (BOOLEAN)

// NAS specific
bays (INTEGER)
raid (STRING)
```

### API Endpoints

#### Products Routes (`/products/`)
- `GET /list` - All products (with all attributes)
- `GET /search?name=...&category=...&minPrice=...&maxPrice=...` - Search with filters
- `GET /details/:id` - Product details
- `POST /create` - Create product (admin)
- `PUT /edit/:id` - Update product (admin)
- `DELETE /delete/:id` - Delete product (admin)

#### Admin Routes (`/admin/`)
- `POST /products/import` - Import products from CSV
- `GET /products/export?category=...&...` - Export products to CSV
- `POST /create/product` - Create product
- `PUT /edit/:id` - Update product (full)
- `PATCH /update/:id` - Update product (partial)
- `DELETE /delete/product/:id` - Delete product

### Frontend Structure

#### Pages
```
HomePage.jsx                    - Homepage with intro
CatalogPage.jsx               - Main catalog with carousel and dynamic filters
ProductPage.jsx               - Single product details
CartPage.jsx                  - Shopping cart
CheckoutPage.jsx              - Checkout & payment
AccountPage.jsx               - User account
AdminPage.jsx                 - Admin panel
```

#### Components
```
ProductFormHelper.jsx         - Helper for dynamic product forms
ResultBox.jsx                 - Result display component
useCall.js                    - Hook for API calls
```

#### Context
```
auth/AuthContext.jsx          - Auth state
cart/CartContext.jsx          - Cart state
```

### Category-Specific Attributes

#### Firewall Attributes
- brand: String (Brand name)
- ram: String (e.g., "8GB", "16GB")
- ports: String (e.g., "10x Gigabit Ethernet + 2x SFP")
- throughput: String (e.g., "2.5 Gbps")
- vpn: String (e.g., "IPSec, SSL/TLS")
- rackmount: Boolean (Rackmount capability)

#### Router Attributes
- brand: String
- wifiStandard: String (e.g., "WiFi 6E (802.11ax)")
- ram: String (e.g., "1GB")
- ports: String (e.g., "4x Gigabit LAN + 1x WAN")
- vpnSupport: String (e.g., "Yes", "Basic")

#### Camera Attributes
- brand: String
- resolution: String (e.g., "4MP (2560x1920)")
- connectivity: String (e.g., "PoE, WiFi")
- weatherproof: Boolean (Weatherproof capability)

#### NAS Attributes
- brand: String
- bays: Integer (Number of hard drive bays)
- ram: String (e.g., "4GB", "2GB")
- raid: String (e.g., "RAID 0,1,5,6,10")

## Data Flow

### Create Product Flow
```
Frontend (CatalogPage/AdminPage)
    ↓
User selects category
    ↓
Dynamic form updates to show category-specific fields
    ↓
User fills form and submits
    ↓
Backend validates (createProductDto)
    ↓
Backend creates product with all fields
    ↓
Database stores product
    ↓
Frontend updates catalog
```

### Search & Filter Flow
```
Frontend (CatalogPage)
    ↓
User selects category and adjusts filters
    ↓
Frontend builds query: /products/search?category=Firewall&brand=Fortinet...
    ↓
Backend searches with WHERE conditions
    ↓
Backend returns matching products (with all attributes)
    ↓
Frontend filters category-specific attributes client-side
    ↓
Frontend renders filtered products with category attributes
```

### CSV Export/Import Flow
```
Export:
  Admin selects filters
    ↓
  Backend queries products matching filters
    ↓
  Backend generates CSV with all attributes
    ↓
  Frontend downloads CSV file

Import:
  Admin uploads CSV file
    ↓
  Backend parses CSV
    ↓
  Backend validates each row based on category
    ↓
  Backend creates/updates products
    ↓
  Admin sees import report
```

## Key Features

### 1. Dynamic Category Selection
- Carousel of 4 categories
- Clicking category switches all content
- Filters update based on category
- Products filtered by selected category

### 2. Dynamic Filters
- All categories have general filters: Name, Price range, Stock
- Each category has specific filters
- Filters populate from product data
- Boolean filters are checkboxes

### 3. Product Grid
- Responsive grid (auto-fill, minmax)
- Shows all category-specific attributes
- Edit/Delete buttons for admin
- Add to Cart button
- Stock indicator

### 4. Admin Panel
- Create product with category-specific fields
- Edit product (PUT - full update)
- Patch product (PATCH - partial update)
- Delete product
- Import/Export CSV
- Dynamic forms based on category

### 5. Validation
- Frontend: Express-validator DTOs
- Backend: Type checking and constraints
- CSV: Row-level validation during import
- Category: Fields validated per category

## Extensibility

### Adding a New Category

1. **Update Model**: Add new columns to Product.js
2. **Update Enum**: Add to ENUM in category field
3. **Update DTOs**: Add validation rules
4. **Update Frontend Constants**:
   - PRODUCT_CATEGORIES
   - CATEGORY_FILTERS
   - FILTER_LABELS
5. **Update Components**: Forms will automatically update
6. **Update Seed Script**: Add sample products
7. **Update Tests**: Add test cases for new category

### Adding a New Attribute

1. **Update Model**: Add column
2. **Update Enum/Constants**: Add to appropriate category
3. **Update DTOs**: Add validation
4. **Update Forms**: Will auto-render
5. **Test**: Export/Import to verify

## Performance Considerations

- **Pagination**: Not implemented yet, consider for large catalogs
- **Caching**: API responses not cached
- **Search**: All filtering done client-side after API call
- **Images**: Small files (< 5MB)
- **CSV**: Works with large files (tested up to 2MB)

## Security Considerations

- **Authentication**: JWT token required for admin operations
- **Authorization**: Role-based access control
- **File Upload**: Validation of file type and size
- **Input Sanitization**: Express-validator on all inputs
- **SQL Injection**: Protected by Sequelize ORM
- **CORS**: Configured for localhost development

## Testing

See [TESTING.md](TESTING.md) for complete testing guide.

## Deployment Notes

Before deploying to production:
1. Update database connection string
2. Set strong JWT secret
3. Configure email service
4. Update CORS settings
5. Run migrations
6. Seed initial products
7. Set environment to production
8. Enable HTTPS
9. Configure backup strategy
10. Set up monitoring
