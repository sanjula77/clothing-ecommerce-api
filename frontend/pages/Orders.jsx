import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderAPI } from '../api/order.api';
import ProtectedRoute from '../components/ProtectedRoute';
import './Orders.css';

const Orders = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [pagination.page]);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails(orderId);
    }
  }, [orderId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await orderAPI.getMyOrders({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setOrders(response.data || []);
        setPagination(response.pagination || pagination);

        // If orderId in URL, find and show that order
        if (orderId) {
          const order = response.data.find((o) => o._id === orderId);
          if (order) {
            setSelectedOrder(order);
          } else {
            loadOrderDetails(orderId);
          }
        }
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (id) => {
    try {
      const response = await orderAPI.getOrderById(id);
      if (response.success) {
        setSelectedOrder(response.data);
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#ffa500',
      PAID: '#4caf50',
      PROCESSING: '#2196f3',
      SHIPPED: '#9c27b0',
      DELIVERED: '#4caf50',
      CANCELLED: '#f44336',
    };
    return colors[status] || '#666';
  };

  if (loading && orders.length === 0) {
    return (
      <ProtectedRoute>
        <div className="orders-page">
          <div className="orders-container">
            <div className="orders-loading">Loading orders...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="orders-page">
        <div className="orders-container">
          <h1>My Orders</h1>

          {error && <div className="orders-error">{error}</div>}

          {selectedOrder ? (
            <div className="order-detail-view">
              <button onClick={() => setSelectedOrder(null)} className="back-to-orders">
                ← Back to Orders
              </button>

              <div className="order-detail-card">
                <div className="order-detail-header">
                  <div>
                    <h2>Order #{selectedOrder.orderNumber || selectedOrder._id}</h2>
                    <p className="order-date">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <span
                    className="order-status-badge"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="order-detail-items">
                  <h3>Items</h3>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="order-detail-item">
                      <div className="order-item-info">
                        <h4>{item.name}</h4>
                        <p>Size: {item.size} | Quantity: {item.quantity}</p>
                      </div>
                      <div className="order-item-price">
                        ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-detail-total">
                  <strong>Total: ${selectedOrder.totalAmount.toFixed(2)}</strong>
                </div>

                {selectedOrder.shippingAddress && (
                  <div className="order-detail-shipping">
                    <h3>Shipping Address</h3>
                    <p>
                      {selectedOrder.shippingAddress.street}
                      <br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                      {selectedOrder.shippingAddress.zipCode}
                      <br />
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </div>
                )}

                {selectedOrder.paymentMethod && (
                  <div className="order-detail-payment">
                    <h3>Payment Method</h3>
                    <p>{selectedOrder.paymentMethod.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="orders-empty">
              <p>You have no orders yet</p>
              <Link to="/products" className="orders-empty-button">
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="orders-list">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="order-card"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="order-card-header">
                      <div>
                        <h3>Order #{order.orderNumber || order._id.slice(-8)}</h3>
                        <p className="order-card-date">{formatDate(order.createdAt)}</p>
                      </div>
                      <span
                        className="order-status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="order-card-items">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                    <div className="order-card-total">Total: ${order.totalAmount.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="orders-pagination">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={!pagination.hasPrevPage}
                    className="pagination-button"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={!pagination.hasNextPage}
                    className="pagination-button"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Orders;

