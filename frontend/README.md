# Clothing E-Commerce Frontend

React frontend for the Clothing E-Commerce application.

## Tech Stack

- React 18
- React Router v6
- Axios
- Context API
- Vite

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

3. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Features

- ✅ User Authentication (Login/Register)
- ✅ Product Browsing with Search & Filters
- ✅ Product Details
- ✅ Shopping Cart (Guest & Authenticated)
- ✅ Cart Merge on Login
- ✅ Checkout & Order Creation
- ✅ Order History
- ✅ Protected Routes
- ✅ Responsive Design

## Project Structure

```
frontend/
├── api/              # API layer (axios, API functions)
├── context/          # React Context (Auth, Cart)
├── pages/            # Page components
├── components/       # Reusable components
├── utils/            # Utility functions
├── App.jsx           # Main app component with routing
└── main.jsx          # Entry point
```

## API Integration

All API calls are in the `api/` directory. The backend should be running on `http://localhost:5000`.

## Cart Behavior

- **Guest Users**: Cart stored in localStorage
- **Logged-in Users**: Cart stored in backend
- **On Login**: Guest cart automatically merges with user cart

