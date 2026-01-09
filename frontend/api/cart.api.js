import api from './axios';

export const cartAPI = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data.data; // Extract inner data object
  },

  // Add item to cart
  addToCart: async (productId, size, quantity) => {
    const response = await api.post('/cart', {
      productId,
      size,
      quantity,
    });
    return response.data.data; // Extract inner data object
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(`/cart/${itemId}`, { quantity });
    return response.data.data; // Extract inner data object
  },

  // Remove item from cart
  removeCartItem: async (itemId) => {
    const response = await api.delete(`/cart/${itemId}`);
    return response.data.data; // Extract inner data object
  },

  // Clear entire cart
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data.data; // Extract inner data object
  },

  // Merge guest cart with user cart
  mergeCart: async (guestCartItems) => {
    const response = await api.post('/cart/merge', {
      items: guestCartItems,
    });
    // Return full response object for success check, but also extract data
    return {
      success: response.data.success,
      data: response.data.data,
    };
  },

  // Validate guest cart (no auth required)
  validateGuestCart: async (items) => {
    const response = await api.post('/cart/guest/validate', { items });
    return response.data; // Keep full response for success check
  },
};

