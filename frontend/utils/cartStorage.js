const GUEST_CART_KEY = 'guest_cart';

export const getGuestCart = () => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : { items: [] };
  } catch (error) {
    console.error('Error reading guest cart:', error);
    return { items: [] };
  }
};

export const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const addToGuestCart = (productId, size, quantity) => {
  const cart = getGuestCart();
  const existingItem = cart.items.find(
    (item) => item.product === productId && item.size === size
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, size, quantity });
  }

  saveGuestCart(cart);
  return cart;
};

export const updateGuestCartItem = (itemId, quantity) => {
  const cart = getGuestCart();
  const item = cart.items.find((item) => item._id === itemId);
  if (item) {
    item.quantity = quantity;
    saveGuestCart(cart);
  }
  return cart;
};

export const removeFromGuestCart = (itemId) => {
  const cart = getGuestCart();
  cart.items = cart.items.filter((item) => item._id !== itemId);
  saveGuestCart(cart);
  return cart;
};

