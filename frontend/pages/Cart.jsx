import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import './Cart.css';

const Cart = () => {
  const { isAuthenticated } = useAuth();
  const { cart, loading, clear, notification, clearNotification } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Cart is loaded automatically by CartContext
  }, []);

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!isAuthenticated) {
      if (window.confirm('Please login to checkout. Redirect to login?')) {
        navigate('/login');
      }
      return;
    }

    navigate('/checkout');
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clear();
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-loading">Loading cart...</div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <h1>Your Cart</h1>
          <div className="cart-empty">
            <p>Your cart is empty</p>
            <Link to="/products" className="cart-empty-button">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>Your Cart</h1>
          <button onClick={handleClearCart} className="clear-cart-button">
            Clear Cart
          </button>
        </div>

        {notification && (
          <div className={`cart-notification cart-notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={clearNotification} className="cart-notification-close">×</button>
          </div>
        )}

        <div className="cart-items">
          {cart.items.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}
        </div>

        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Total Items:</span>
            <span>{cart.totalItems ?? cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="cart-summary-row total">
            <span>Total:</span>
            <span>${(() => {
              // Always recalculate from items to ensure accuracy
              const calculatedTotal = cart.items.reduce((sum, item) => {
                const price = item.product?.price || item.price || 0;
                // Debug: log if price is missing
                if (!price && item.quantity > 0) {
                  console.warn('Missing price for cart item:', item);
                }
                return sum + (price * (item.quantity || 0));
              }, 0);
              return calculatedTotal.toFixed(2);
            })()}</span>
          </div>

          <button onClick={handleCheckout} className="checkout-button">
            {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
          </button>

          <Link to="/products" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;

