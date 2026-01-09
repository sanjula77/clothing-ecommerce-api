# Clothing Brand E-Commerce Web Application

A full-stack MERN (MongoDB, Express, React, Node.js) e-commerce application for a clothing brand. This project demonstrates a production-ready backend API with a functional frontend interface for browsing products, managing shopping carts, and processing orders.

## Project Overview

This application provides a complete e-commerce solution with user authentication, product catalog management, shopping cart functionality, and order processing. The backend is the primary focus of this project, implementing robust business logic, transactional safety, and comprehensive error handling. The frontend provides a clean, functional interface for interacting with the backend API.

## Features

### Core Functionality

- **User Authentication**: Registration and login with JWT-based authentication
- **Product Catalog**: Browse products with filtering, search, and pagination
- **Shopping Cart**: Guest cart support with automatic merging on login
- **Order Management**: Transactional order creation with stock management
- **Email Notifications**: Order confirmation emails (non-blocking)

### Technical Highlights

- RESTful API architecture with proper error handling
- MongoDB transactions for atomic operations
- Input validation using Joi schemas
- Comprehensive test coverage with Jest
- Guest cart persistence and merge functionality
- Stock validation and inventory management

## Quick Start (TL;DR)

```bash
git clone <repo-url>
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

**Note**: Create a `.env` file in `backend/` with MongoDB URI and JWT_SECRET before running seed. See [Backend Setup](#backend-setup) for details.

## Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x (verified in `backend/package.json`)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi
- **Email**: Nodemailer
- **Testing**: Jest with Supertest

### Database
- **Primary Database**: MongoDB
- **ODM**: Mongoose

## Project Structure

```
clothing-ecommerce/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config/         # Database and environment configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic services
│   │   ├── validators/      # Joi validation schemas
│   │   └── scripts/         # Utility scripts (seed data)
│   ├── tests/               # Integration tests
│   └── server.js            # Application entry point
├── frontend/                # React frontend application
│   ├── api/                 # API client functions
│   ├── components/          # Reusable React components
│   ├── context/             # React Context providers
│   ├── pages/               # Page components
│   └── utils/               # Utility functions
├── postman/                 # Postman API collections
└── README.md                # This file
```

### Documentation

- Backend documentation: [`backend/README.md`](backend/README.md)
- Frontend documentation: [`frontend/README.md`](frontend/README.md)

## Local Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend/` directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/clothing_ecommerce
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Optional: Email configuration for order confirmations
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

4. Seed the database with sample products:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend application will be available at `http://localhost:3000` (or the port shown in the terminal)

### Running the Full Application

1. Start the backend server first (from `backend/` directory):
```bash
npm run dev
```

2. In a separate terminal, start the frontend server (from `frontend/` directory):
```bash
npm run dev
```

3. Open your browser and navigate to the frontend URL (typically `http://localhost:3000`)

## Project Notes

### Backend Focus

This project emphasizes backend development with a production-ready API implementation. The backend includes:

- Comprehensive input validation
- Transactional safety for critical operations
- Proper error handling and response formatting
- Guest cart support with merge functionality
- Stock validation and inventory management
- Non-blocking email service integration
- Full test coverage with integration tests

### Frontend Scope

The frontend is intentionally kept simple and functional. It serves as a demonstration interface for the backend API rather than a production-ready UI. The frontend includes:

- Basic React components and routing
- Context-based state management
- API integration with the backend
- Guest cart persistence in localStorage
- Automatic cart merging on authentication

### Limitations

- Frontend UI is basic and not production-ready
- No payment gateway integration (orders use placeholder payment methods)
- Email service is optional and may require additional configuration
- Admin functionality is not implemented (order status updates are limited)
- No image upload functionality (products use image URLs)

### Assumptions

- MongoDB is accessible (local or cloud instance)
- Email service configuration is optional for development
- Frontend and backend run on separate ports (frontend proxies API requests)
- JWT tokens are stored in localStorage (acceptable for development, consider httpOnly cookies for production)

## Testing

### Backend Tests

Navigate to the `backend/` directory and run:
```bash
npm test
```

Tests require a separate test database configured in `.env.test`. See `backend/README.md` for detailed testing instructions.

## API Documentation

Postman collections are available in the `/postman` directory for testing all API endpoints. Import the collections and environment template into Postman for comprehensive API testing.

## License

ISC

