import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../api/order.api';
import CartItem from '../components/CartItem';
import ProtectedRoute from '../components/ProtectedRoute';
import './Checkout.css';

const Checkout = () => {
  const { cart, loading: cartLoading, clear } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    paymentMethod: 'CASH_ON_DELIVERY',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAddressChange = (field, value) => {
    setFormData({
      ...formData,
      shippingAddress: {
        ...formData.shippingAddress,
        [field]: value,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const orderData = {
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
      };

      const response = await orderAPI.createOrder(orderData);

      if (response.success) {
        // Clear cart after successful order
        await clear();
        // Redirect to orders page
        navigate(`/orders?orderId=${response.data._id}`);
      } else {
        setError(response.error || 'Failed to create order');
      }
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = errorData?.error || 'Failed to create order. Please try again.';
      
      // Include error details if available (e.g., stock issues)
      if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
        errorMessage = [errorMessage, ...errorData.details];
      } else {
        errorMessage = [errorMessage];
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const total = cart.total ?? cart.items.reduce((sum, item) => {
    const price = item.product?.price || item.price || 0;
    return sum + price * item.quantity;
  }, 0);

  if (cart.items.length === 0) {
    return (
      <ProtectedRoute>
        <div className="checkout-page">
          <div className="checkout-container">
            <div className="checkout-empty">
              <p>Your cart is empty</p>
              <button onClick={() => navigate('/products')} className="checkout-button">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="checkout-page">
        <div className="checkout-container">
          <h1>Checkout</h1>

          {error && (
            <div className="checkout-error">
              {Array.isArray(error) ? (
                error.map((line, index) => (
                  <div key={index}>{line}</div>
                ))
              ) : (
                <div>{error}</div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-content">
              {/* Order Summary */}
              <div className="checkout-summary">
                <h2>Order Summary</h2>
                <div className="checkout-items">
                  {cart.items.map((item) => (
                    <CartItem key={item._id} item={item} />
                  ))}
                </div>
                <div className="checkout-total">
                  <div className="checkout-total-row">
                    <span>Total Items:</span>
                    <span>{cart.totalItems ?? cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="checkout-total-row final">
                    <span>Total Amount:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping & Payment */}
              <div className="checkout-details">
                <h2>Shipping Address</h2>
                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={formData.shippingAddress.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={formData.shippingAddress.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <h2>Payment Method</h2>
                <div className="form-group">
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="payment-select"
                  >
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting || cartLoading}
                  className="checkout-submit-button"
                >
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Checkout;

