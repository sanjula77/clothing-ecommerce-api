# Clothing E-Commerce Backend API

A robust RESTful API for a clothing e-commerce platform built with Node.js, Express, and MongoDB. This backend implements industry best practices including JWT authentication, input validation, transactional safety, and comprehensive test coverage.

## Who This Is For

This backend is designed primarily to demonstrate backend engineering practices, including RESTful API design, database transactions, authentication, and comprehensive testing. The frontend UI is intentionally minimal and documented separately in `frontend/README.md`.

## Backend Overview

This API serves as the foundation for a full-stack e-commerce application. It provides complete functionality for user authentication, product catalog management, shopping cart operations, and order processing. The implementation emphasizes data integrity, error handling, and scalability.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs for password hashing
- **Validation**: Joi for request validation
- **Email Service**: Nodemailer for order confirmations
- **Testing**: Jest with Supertest for integration tests
- **Development**: Nodemon for hot reloading

## Authentication & Authorization

### User Registration
- Email validation and uniqueness checking
- Password hashing using bcryptjs (salt rounds: 10)
- Automatic password hashing on user creation
- JWT token generation upon successful registration

### User Login
- Email and password verification
- JWT token generation with user ID payload
- Token expiration handling
- Secure password comparison using bcryptjs

### Protected Routes
- JWT token verification middleware
- Automatic user context injection into requests
- Token validation on protected endpoints
- Unauthorized access handling

### Security Features
- Passwords are never stored in plain text
- JWT tokens contain minimal user information
- Protected routes require valid authentication
- Password hashing occurs automatically via Mongoose pre-save hooks

## Product Management

### Product Schema
- Name, description, price, image URL
- Category (Men, Women, Kids)
- Available sizes (S, M, L, XL)
- Stock quantity and availability status
- Automatic `inStock` flag based on stock quantity

### Product Endpoints
- **GET /api/products**: List products with filtering, search, pagination, and sorting
- **GET /api/products/:id**: Get product details by ID

### Filtering & Search
- Filter by category, size, price range, stock availability
- Text search across product name and description
- Pagination support with configurable page size
- Sorting by price, name, or creation date

## Shopping Cart

### Cart Model
- One cart per user (unique user constraint)
- Array of cart items with product reference, size, and quantity
- Automatic subtotal calculation
- Product population for detailed cart responses

### Cart Operations

#### Guest Cart Support
- **POST /api/cart/guest/validate**: Validate guest cart items without authentication
- Validates product existence, stock availability, and size compatibility
- Returns cleaned and validated cart items
- Used by frontend to validate localStorage cart before merge

#### Authenticated Cart Operations
- **GET /api/cart**: Retrieve user's cart with populated product details
- **POST /api/cart**: Add item to cart with stock validation
- **PUT /api/cart/:itemId**: Update cart item quantity
- **DELETE /api/cart/:itemId**: Remove item from cart
- **DELETE /api/cart**: Clear entire cart
- **POST /api/cart/merge**: Merge guest cart with user cart

### Cart Merge Behavior

When a user logs in, the frontend sends guest cart items to the merge endpoint. The backend:

1. Validates each guest cart item (product exists, in stock, valid size)
2. Checks for existing items in user cart (same product + size)
3. Merges quantities for duplicate items (respects stock limits)
4. Adds new items that don't exist in user cart
5. Returns the merged cart with all product details populated

**Key Features:**
- Duplicate prevention (same product + size combinations are merged)
- Stock validation during merge
- Invalid items are silently filtered out
- Merge is idempotent (safe to call multiple times)

### Stock Validation

All cart operations validate stock availability:
- Adding items checks available stock
- Updating quantity respects current stock levels
- Merge operation validates stock for each item
- Clear error messages when stock is insufficient

## Order Management

### Order Creation

The order creation process uses MongoDB transactions to ensure atomicity:

1. **Transaction Start**: Begin MongoDB session with transaction
2. **Cart Validation**: Verify cart exists and has items
3. **Stock Validation**: Check all items are available in requested quantities
4. **Order Item Creation**: Create immutable snapshots of product data
5. **Stock Decrement**: Reduce product stock within transaction
6. **Order Creation**: Create order record atomically
7. **Cart Clearing**: Clear user cart within same transaction
8. **Transaction Commit**: All operations succeed or all rollback
9. **Email Notification**: Send order confirmation (non-blocking, after commit)

### Order Model

Orders contain immutable snapshots of product data:
- Product reference (for future lookups)
- Product name, price, image URL (snapshot at time of order)
- Size and quantity
- Total order amount
- Shipping address and payment method
- Order status (PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- Unique order number (auto-generated)

### Order Endpoints

- **POST /api/orders**: Create order from cart (requires authentication)
- **GET /api/orders/my**: Get user's orders with pagination and status filtering
- **GET /api/orders/:id**: Get order details by ID
- **PUT /api/orders/:id/status**: Update order status

### Transaction Handling

Order creation uses MongoDB transactions to ensure:
- Stock decrement and order creation are atomic
- Cart clearing happens only if order succeeds
- Rollback occurs if any step fails
- Data consistency is maintained

**Transaction Flow:**
```
Start Transaction
  → Validate Cart
  → Validate Stock
  → Create Order Items
  → Decrement Stock
  → Create Order
  → Clear Cart
Commit Transaction
  → Send Email (non-blocking)
```

## Email Service

### Email Configuration

Email service is optional and gracefully degrades if not configured:
- Order creation succeeds even if email fails
- Email errors are logged but don't affect order processing
- Non-blocking email delivery (fire and forget)

### Email Features

- HTML email templates for order confirmations
- Order details included in email body
- Automatic email sending after successful order creation
- Connection pooling for efficient email delivery
- Transporter verification on initialization

### Email Service Behavior

1. Email is sent **after** transaction commit (order is already created)
2. Email failures are caught and logged
3. Order creation response is sent immediately (doesn't wait for email)
4. Email service initializes lazily (only when first email is sent)

## Environment Variables

### Development Environment (.env)

Create a `.env` file in the backend root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/clothing_ecommerce
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/clothing_ecommerce

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Service (Optional - order creation works without email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Test Environment (.env.test)

Create a `.env.test` file for running tests:

```env
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/clothing_test
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/clothing_test
JWT_SECRET=test-secret-key-for-jest-tests-only
```

**Important**: Use a separate test database to avoid affecting development data. The test setup will automatically drop the test database after tests complete (unless `KEEP_TEST_DB=true` is set).

## Seed Data

### Running Seed Script

To populate the database with sample products:

```bash
npm run seed
```

The seed script:
- Connects to MongoDB using `MONGO_URI` from `.env`
- Creates sample clothing products across different categories
- Includes various sizes, prices, and stock levels
- Can be run multiple times (handles duplicates)

### Seed Script Location

The seed script is located at `src/scripts/seed.js` and uses product data from `src/seed/products.seed.js`.

## Testing

### Test Setup

1. Create `.env.test` file (see Environment Variables section)
2. Ensure test database is accessible
3. Run tests with:

```bash
npm test
```

### Test Coverage

The test suite includes comprehensive integration tests:

- **Authentication Tests** (`tests/auth.test.js`):
  - User registration
  - User login
  - Protected route access
  - Invalid credentials handling

- **Cart Tests** (`tests/cart.test.js`):
  - Add items to cart
  - Update cart items
  - Remove cart items
  - Clear cart
  - Cart merging
  - Stock validation
  - Guest cart validation

- **Order Tests** (`tests/order.test.js`):
  - Order creation from cart
  - Stock decrement on order
  - Cart clearing after order
  - Order retrieval
  - Order status updates
  - Transaction rollback on errors

### Test Features

- Automatic database cleanup before each test
- Test database isolation
- Proper connection handling (prevents hanging processes)
- Email service cleanup after tests
- Helper functions for common test operations

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Postman Collections

Complete Postman collections are available in the `/postman` directory:

- `01-auth.postman_collection.json` - Authentication endpoints
- `02-products.postman_collection.json` - Product catalog endpoints
- `03-cart.postman_collection.json` - Shopping cart endpoints
- `04-orders.postman_collection.json` - Order management endpoints
- `05-email-service.postman_collection.json` - Email service testing

### Importing Postman Collections

1. Open Postman
2. Click "Import" button
3. Select all collection files from the `/postman` directory
4. Import the environment template: `environment.template.postman_environment.json`
5. Set the `baseUrl` variable in your environment (default: `http://localhost:5000`)

## API Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "errors": ["Optional array of detailed errors"]
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── env.js             # Environment variable configuration
│   ├── controllers/
│   │   ├── auth.controller.js      # Authentication handlers
│   │   ├── cart.controller.js      # Cart operation handlers
│   │   ├── order.controller.js     # Order management handlers
│   │   └── product.controller.js   # Product catalog handlers
│   ├── middleware/
│   │   ├── asyncHandler.js        # Async error wrapper
│   │   ├── auth.middleware.js      # JWT authentication middleware
│   │   ├── error.middleware.js    # Global error handler
│   │   └── validate.js             # Request validation middleware
│   ├── models/
│   │   ├── Cart.js                 # Cart schema
│   │   ├── Order.js                # Order schema
│   │   ├── Product.js              # Product schema
│   │   └── User.js                 # User schema
│   ├── routes/
│   │   ├── auth.routes.js          # Authentication routes
│   │   ├── cart.routes.js          # Cart routes
│   │   ├── order.routes.js         # Order routes
│   │   └── product.routes.js       # Product routes
│   ├── services/
│   │   └── email.service.js         # Email service
│   ├── templates/
│   │   └── orderConfirmation.template.js  # Email template
│   ├── utils/
│   │   └── AppError.js             # Custom error class
│   ├── validators/
│   │   ├── auth.validator.js        # Auth validation schemas
│   │   ├── cart.validator.js        # Cart validation schemas
│   │   ├── order.validator.js      # Order validation schemas
│   │   └── product.validator.js     # Product validation schemas
│   ├── scripts/
│   │   └── seed.js                  # Database seeding script
│   ├── seed/
│   │   └── products.seed.js        # Product seed data
│   ├── app.js                       # Express app configuration
│   └── server.js                    # Server entry point
├── tests/
│   ├── helpers/
│   │   └── testHelpers.js           # Test utility functions
│   ├── auth.test.js                 # Authentication tests
│   ├── cart.test.js                 # Cart operation tests
│   ├── order.test.js                # Order management tests
│   └── setup.js                     # Test setup and teardown
├── server.js                        # Application entry point
├── package.json                     # Dependencies and scripts
└── jest.config.js                   # Jest configuration
```

## Scripts

- `npm run dev` - Start development server with hot reload (nodemon)
- `npm start` - Start production server
- `npm test` - Run integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run seed` - Populate database with sample products
- `npm run lint` - Run ESLint

## License

ISC
