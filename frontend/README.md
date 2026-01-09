# Clothing E-Commerce Frontend

React frontend application for the Clothing E-Commerce platform. This frontend provides a functional interface for interacting with the backend API, demonstrating user authentication, product browsing, shopping cart management, and order processing.

## Who This Is For

This frontend is designed to demonstrate integration with a robust backend API. UI/UX polish was intentionally deprioritized in favor of backend correctness and API integration patterns.

## Frontend Overview

This React application serves as the client interface for the e-commerce backend API. The frontend is intentionally kept simple and functional, focusing on demonstrating backend API integration rather than production-ready UI design. The implementation emphasizes clean architecture, proper state management, and seamless API communication.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5.x
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Styling**: CSS (no UI framework)

## Main Pages and Features

### Public Pages

- **Home** (`/`): Landing page with navigation to products
- **Products** (`/products`): Product listing with filtering and search
- **Product Detail** (`/products/:id`): Individual product details with size selection
- **Cart** (`/cart`): Shopping cart view (works for both guests and authenticated users)

### Authentication Pages

- **Login** (`/login`): User login form
- **Register** (`/register`): User registration form

### Protected Pages

- **Checkout** (`/checkout`): Order creation and checkout process (requires authentication)
- **Orders** (`/orders`): User order history (requires authentication)

### Features

- User authentication (login/register)
- Product browsing with category filtering
- Product search functionality
- Shopping cart management
- Guest cart persistence in localStorage
- Automatic cart merging on login
- Protected routes with authentication checks
- Order creation and history
- Responsive layout (basic)

## Frontend-Backend Communication

### API Integration

All API communication is handled through the `api/` directory:

- `api/axios.js`: Axios instance with base configuration and interceptors
- `api/auth.api.js`: Authentication endpoints (register, login, get current user)
- `api/product.api.js`: Product catalog endpoints
- `api/cart.api.js`: Shopping cart endpoints
- `api/order.api.js`: Order management endpoints

### API Configuration

The frontend uses Vite's proxy configuration to forward API requests to the backend:

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

This allows the frontend to make requests to `/api/*` which are automatically proxied to `http://localhost:5000/api/*`.

### Authentication Flow

1. User submits login/register form
2. Frontend sends request to backend API
3. Backend returns JWT token on success
4. Token is stored in localStorage
5. Token is included in Authorization header for subsequent requests
6. Protected routes check authentication status before rendering

### Cart Management

#### Guest Cart
- Cart items stored in localStorage
- Cart persists across page refreshes
- Cart can be validated via backend API before merge

#### Authenticated Cart
- Cart stored in backend database
- Cart automatically loads on login
- Guest cart merges with user cart on login

#### Cart Merge Flow

When a user logs in:

1. Frontend detects authentication state change
2. Guest cart items are retrieved from localStorage
3. Guest cart is sent to backend merge endpoint
4. Backend merges guest cart with user cart
5. Merged cart is returned and displayed
6. Guest cart is cleared from localStorage

This merge happens automatically in `CartContext` when authentication state changes.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Backend server running on `http://localhost:5000`
- npm or yarn package manager

### Installation

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

The application will be available at `http://localhost:3000` (or the port shown in the terminal).

### Environment Variables

Create a `.env` file in the `frontend/` directory (optional):

```env
VITE_API_URL=http://localhost:5000/api
```

The default configuration uses Vite's proxy, so this is typically not needed for local development. In production, `VITE_API_URL` should be set explicitly.

## Project Structure

```
frontend/
├── api/
│   ├── axios.js              # Axios instance configuration
│   ├── auth.api.js           # Authentication API calls
│   ├── cart.api.js           # Cart API calls
│   ├── order.api.js          # Order API calls
│   └── product.api.js        # Product API calls
├── components/
│   ├── CartItem.jsx          # Cart item component
│   ├── CartItem.css          # Cart item styles
│   ├── ErrorBoundary.jsx     # Error boundary component
│   ├── Navbar.jsx            # Navigation bar
│   ├── Navbar.css            # Navigation styles
│   ├── ProductCard.jsx       # Product card component
│   ├── ProductCard.css       # Product card styles
│   └── ProtectedRoute.jsx    # Route protection component
├── context/
│   ├── AuthContext.jsx       # Authentication context
│   └── CartContext.jsx       # Shopping cart context
├── pages/
│   ├── Home.jsx              # Home page
│   ├── Home.css              # Home page styles
│   ├── Login.jsx             # Login page
│   ├── Register.jsx          # Registration page
│   ├── Products.jsx          # Products listing page
│   ├── Products.css          # Products page styles
│   ├── ProductDetail.jsx     # Product detail page
│   ├── ProductDetail.css     # Product detail styles
│   ├── Cart.jsx              # Shopping cart page
│   ├── Cart.css              # Cart page styles
│   ├── Checkout.jsx          # Checkout page
│   ├── Checkout.css          # Checkout page styles
│   ├── Orders.jsx            # Orders history page
│   ├── Orders.css            # Orders page styles
│   └── Auth.css              # Shared auth page styles
├── utils/
│   ├── cartStorage.js        # localStorage cart utilities
│   └── token.js              # Token management utilities
├── App.jsx                   # Main app component with routing
├── App.css                   # Global app styles
├── main.jsx                  # Application entry point
├── index.html                # HTML template
└── vite.config.js            # Vite configuration
```

## State Management

### Context API

The application uses React Context API for state management:

#### AuthContext
- Manages user authentication state
- Handles login, register, and logout
- Provides authentication status to components
- Manages JWT token storage

#### CartContext
- Manages shopping cart state
- Handles guest cart (localStorage) and authenticated cart (backend)
- Automatically merges guest cart on login
- Provides cart operations (add, update, remove, clear)

### Context Usage

Components access context using React hooks:

```javascript
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';

function MyComponent() {
  const { user, isAuthenticated, login } = useAuth();
  const { cart, addToCart } = useCart();
  // ...
}
```

## UI Design Notes

### Design Philosophy

The frontend UI is intentionally simple and functional. The focus of this project is on backend development, so the frontend serves as a demonstration interface rather than a production-ready UI.

### Current State

- Basic styling with CSS (no UI framework)
- Functional components with minimal styling
- Responsive layout (basic breakpoints)
- Clean, readable interface
- No advanced animations or transitions

### Limitations

- UI is not production-ready
- Limited styling and visual polish
- No advanced UX features (loading skeletons, optimistic updates, etc.)
- Basic error handling and user feedback
- No image optimization or lazy loading

### Future Enhancements

For a production-ready frontend, consider:
- UI framework integration (Material-UI, Tailwind CSS, etc.)
- Advanced loading states and error handling
- Image optimization and lazy loading
- Enhanced responsive design
- Accessibility improvements
- Performance optimizations

## Testing

Note: This frontend does not include automated tests, as the primary focus of the project is backend testing and reliability.

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Backend Dependency

The frontend requires the backend API to be running. Ensure the backend server is started on `http://localhost:5000` before using the frontend application.

## License

ISC
