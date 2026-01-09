# Clothing E-Commerce API

A robust RESTful API for a clothing e-commerce platform built with Node.js, Express, and MongoDB. This API provides complete functionality for user authentication, product catalog management, shopping cart operations, and order processing with transactional safety.

## Project Overview

This backend API serves as the foundation for a full-stack e-commerce application. It implements industry best practices including JWT authentication, input validation, error handling, and comprehensive test coverage. The API supports both guest and authenticated users, with seamless cart merging capabilities.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs for password hashing
- **Validation**: Joi for request validation
- **Email Service**: Nodemailer for order confirmations
- **Testing**: Jest with Supertest for integration tests
- **Development**: Nodemon for hot reloading

## Key Features

### Authentication & Authorization
- User registration with password hashing
- JWT-based authentication
- Protected routes with middleware
- Secure password storage using bcryptjs

### Product Catalog
- Product listing with pagination
- Advanced search and filtering (category, size, price range, stock availability)
- Sorting capabilities (price, name, date)
- Product detail retrieval

### Shopping Cart
- Guest cart support (localStorage compatible)
- Authenticated user cart management
- Automatic cart merging on login/registration
- Stock validation before adding items
- Quantity updates with stock checks
- Duplicate item prevention (same product + size)

### Order Management
- Atomic order creation using MongoDB transactions
- Immutable order records with product snapshots
- Stock decrement within transaction
- Automatic cart clearing after successful checkout
- Order history with pagination and status filtering
- Order status updates

### Email Notifications
- Order confirmation emails
- HTML email templates
- Graceful degradation (order succeeds even if email fails)
- Non-blocking email delivery

### Code Quality
- Input validation using Joi schemas
- Centralized error handling with custom error classes
- Async/await error handling wrapper
- Clean architecture (controllers, services, models, routes)
- Comprehensive integration tests

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend root directory (see Environment Variables section below)

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### Database Setup

The application will automatically connect to MongoDB using the connection string from your `.env` file. If the database doesn't exist, MongoDB will create it on first write.

### Seed Data

To populate the database with sample products:

```bash
npm run seed
```

The seed script is located in `src/scripts/seed.js`. This will create sample clothing products with various categories, sizes, and prices for testing purposes.

## Environment Variables

Create a `.env` file in the backend root directory with the following variables:

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
```

### Environment Variables Explained

- `NODE_ENV`: Environment mode (development, production, test)
- `PORT`: Server port number
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing (use a strong random string in production)
- `EMAIL_*`: Email service configuration (optional - required only for order confirmation emails)

**Note**: For Gmail, you'll need to generate an App Password instead of your regular password. Email service is optional - orders will be created successfully even if email configuration is missing.

## Running Tests

The project includes comprehensive integration tests using Jest and Supertest.

### Test Setup

1. Create a `.env.test` file in the backend root directory:
```env
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/clothing_test
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/clothing_test
JWT_SECRET=test-secret-key-for-jest-tests-only
```

**Important**: Use a separate test database to avoid affecting development data.

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage

The test suite covers:
- User authentication (registration, login, protected routes)
- Cart operations (add, update, remove, merge)
- Order creation and management
- Stock validation
- Error handling scenarios

Tests use a dedicated test database and automatically clean up after execution. Note: Tests ensure all database connections and async operations are properly closed to prevent hanging processes.

## API Documentation

### Postman Collections

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

### API Endpoints Overview

The API provides endpoints for the following categories:

- **Authentication**: User registration, login, and protected route access
- **Products**: Product listing with advanced filtering, search, pagination, and sorting
- **Cart**: Guest cart validation, authenticated cart management, and cart merging
- **Orders**: Order creation with transactional safety, order history, and status management

Full endpoint details, request/response examples, and error cases are documented in the Postman collections. Each collection includes comprehensive examples and test scenarios.

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Obtain the token by registering or logging in through the authentication endpoints.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, environment)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware (auth, validation, error handling)
│   ├── models/          # Mongoose schemas and models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic services (email)
│   ├── templates/       # Email templates
│   ├── utils/           # Utility functions (AppError)
│   ├── validators/      # Joi validation schemas
│   └── scripts/         # Utility scripts (seed data)
├── tests/               # Integration tests
│   ├── helpers/         # Test helper functions
│   ├── auth.test.js     # Authentication tests
│   ├── cart.test.js     # Cart operation tests
│   └── order.test.js    # Order management tests
├── server.js            # Application entry point
├── package.json         # Dependencies and scripts
└── jest.config.js       # Jest configuration
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run seed` - Populate database with sample products
- `npm run lint` - Run ESLint

## License

ISC

