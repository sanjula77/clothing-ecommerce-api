import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../api/cart.api';
import {
  getGuestCart,
  saveGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
} from '../utils/cartStorage';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); // For user notifications
  const hasMergedCart = useRef(false); // Use ref to persist across re-renders without causing them

  // Helper to show notification and auto-hide after 5 seconds
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Load cart based on auth status
  useEffect(() => {
    // Wait for auth to finish loading before loading cart
    if (!authLoading) {
      if (isAuthenticated) {
        // Check if we need to merge guest cart
        const guestCart = getGuestCart();
        const hasGuestItems = guestCart.items && guestCart.items.length > 0;
        
        // If user just logged in and we haven't merged yet, merge guest cart first
        if (!hasMergedCart.current && hasGuestItems) {
          mergeGuestCartAndLoad();
        } else {
          // Just load the cart normally
          loadCart();
          // Mark as merged if we're authenticated (even if no guest items)
          hasMergedCart.current = true;
        }
      } else {
        // User logged out - reset merge flag and load guest cart
        hasMergedCart.current = false;
        // Call async function inside useEffect
        (async () => {
          await loadGuestCart();
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Merge guest cart with user cart (called once after login)
  const mergeGuestCartAndLoad = async () => {
    const MERGE_LOCK_KEY = 'cart_merge_lock';
    const MERGE_LOCK_TIMEOUT = 5000; // 5 seconds
    
    try {
      setLoading(true);
      
      // Check if another tab is currently merging
      const mergeLock = localStorage.getItem(MERGE_LOCK_KEY);
      if (mergeLock) {
        const lockTime = parseInt(mergeLock, 10);
        const lockAge = Date.now() - lockTime;
        
        if (lockAge < MERGE_LOCK_TIMEOUT) {
          // Another tab is merging, wait and reload cart
          console.log('Another tab is merging cart, waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadCart();
          hasMergedCart.current = true;
          return;
        } else {
          // Lock expired, remove it
          localStorage.removeItem(MERGE_LOCK_KEY);
        }
      }
      
      // Set merge lock
      localStorage.setItem(MERGE_LOCK_KEY, Date.now().toString());
      
      try {
        const guestCart = getGuestCart();
        
        // Only merge if guest cart has items
        if (guestCart.items && guestCart.items.length > 0) {
          // Transform guest cart items to backend format
          const itemsToMerge = guestCart.items
            .filter(item => {
              // Only include items with valid product ID
              const productId = item.product?._id || item.product;
              return productId && item.size && item.quantity > 0;
            })
            .map(item => ({
              product: item.product?._id || item.product,
              size: item.size,
              quantity: item.quantity,
            }));

          if (itemsToMerge.length > 0) {
            try {
              // Attempt to merge cart
              const mergeResponse = await cartAPI.mergeCart(itemsToMerge);
              
              if (mergeResponse.success) {
                // Merge successful - clear guest cart and set merged cart
                clearGuestCart();
                setCart(mergeResponse.data || { items: [], total: 0, totalItems: 0 });
                hasMergedCart.current = true;
                // Clear merge lock
                localStorage.removeItem(MERGE_LOCK_KEY);
                return;
              }
            } catch (mergeError) {
              // Merge failed - log but don't break the app
              console.warn('Cart merge failed, loading existing cart:', mergeError);
              // Continue to load existing cart
            }
          }
        }

        // If no guest cart or merge failed, just load existing cart
        await loadCart();
        hasMergedCart.current = true;
      } finally {
        // Always clear merge lock when done
        localStorage.removeItem(MERGE_LOCK_KEY);
      }
    } catch (error) {
      console.error('Failed to merge and load cart:', error);
      // Clear merge lock on error
      localStorage.removeItem(MERGE_LOCK_KEY);
      // Fallback: try to load cart anyway
      try {
        await loadCart();
      } catch (loadError) {
        console.error('Failed to load cart after merge error:', loadError);
        setCart({ items: [], total: 0, totalItems: 0 });
      }
      hasMergedCart.current = true;
    } finally {
      setLoading(false);
    }
  };

  // Load authenticated user's cart
  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartAPI.getCart();
      setCart(cartData || { items: [], total: 0, totalItems: 0 });
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart({ items: [], total: 0, totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Load guest cart from localStorage
  const loadGuestCart = async () => {
    const guestCart = getGuestCart();
    
    // Validate guest cart items against current product availability
    if (guestCart.items && guestCart.items.length > 0) {
      try {
        const { cartAPI } = await import('../api/cart.api');
        const itemsToValidate = guestCart.items
          .filter(item => {
            const productId = item.product?._id || item.product;
            return productId && item.size && item.quantity > 0;
          })
          .map(item => ({
            product: item.product?._id || item.product,
            size: item.size,
            quantity: item.quantity,
          }));

        if (itemsToValidate.length > 0) {
          const validationResponse = await cartAPI.validateGuestCart(itemsToValidate);
          if (validationResponse.success) {
            // Update guest cart with validated items, preserving product details
            const validatedItems = validationResponse.data || [];
            const validatedCartItems = await Promise.all(
              validatedItems.map(async (validatedItem) => {
                const originalItem = guestCart.items.find(
                  item => {
                    const itemProductId = item.product?._id || item.product;
                    return itemProductId === validatedItem.product && item.size === validatedItem.size;
                  }
                );
                
                // Preserve product details from original item if available
                if (originalItem && originalItem.product && typeof originalItem.product === 'object') {
                  return {
                    ...originalItem,
                    quantity: validatedItem.quantity,
                  };
                }
                
                 // If no original item found, fetch product data to preserve UI
                 try {
                   const { productAPI } = await import('../api/product.api');
                   const productData = await productAPI.getProductById(validatedItem.product);
                  
                  return {
                    _id: originalItem?._id || `guest_${Date.now()}_${Math.random()}`,
                    product: {
                      _id: productData._id,
                      name: productData.name,
                      price: productData.price,
                      imageUrl: productData.imageUrl || '',
                    },
                    size: validatedItem.size,
                    quantity: validatedItem.quantity,
                    price: productData.price,
                  };
                } catch (error) {
                  // If product fetch fails, skip this item
                  console.warn('Failed to fetch product data for validated item:', error);
                  return null;
                }
              })
            );
            
            // Filter out null items (failed product fetches)
            const validCartItems = validatedCartItems.filter(item => item !== null);
            
            // Check if any items were removed or quantities reduced
            const originalItemCount = guestCart.items.length;
            const validatedItemCount = validCartItems.length;
            const removedCount = originalItemCount - validatedItemCount;
            
            // Check for quantity reductions
            const quantityReducedItems = [];
            guestCart.items.forEach(originalItem => {
              const validatedItem = validCartItems.find(item => {
                const itemProductId = item.product?._id || item.product;
                const originalProductId = originalItem.product?._id || originalItem.product;
                return itemProductId === originalProductId && item.size === originalItem.size;
              });
              
              if (validatedItem && validatedItem.quantity < originalItem.quantity) {
                quantityReducedItems.push({
                  name: originalItem.product?.name || 'Item',
                  original: originalItem.quantity,
                  new: validatedItem.quantity,
                });
              }
            });
            
            // Show notification if items were removed or quantities reduced
            if (removedCount > 0) {
              showNotification(
                `${removedCount} item${removedCount > 1 ? 's' : ''} removed from cart (no longer available)`,
                'warning'
              );
            } else if (quantityReducedItems.length > 0) {
              const itemNames = quantityReducedItems.map(item => item.name).join(', ');
              showNotification(
                `Quantities adjusted for: ${itemNames} (limited stock)`,
                'warning'
              );
            }
            
            const validatedCart = { items: validCartItems };
            saveGuestCart(validatedCart);
            guestCart.items = validCartItems;
          }
        }
      } catch (error) {
        // If validation fails, just use existing cart (don't break the app)
        console.warn('Guest cart validation failed:', error);
      }
    }
    
    // Calculate totals for guest cart
    const total = guestCart.items.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + price * (item.quantity || 0);
    }, 0);
    const totalItems = guestCart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCart({ ...guestCart, total, totalItems });
  };

  // Add item to cart
  const addItem = async (productId, size, quantity, productData = null) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const cartData = await cartAPI.addToCart(productId, size, quantity);
        setCart(cartData || cart);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to add item to cart',
        };
      } finally {
        setLoading(false);
      }
    } else {
      // Guest cart - need product data for display
      try {
        if (!productData) {
          const { productAPI } = await import('../api/product.api');
          productData = await productAPI.getProductById(productId);
        }

        // Validate stock availability
        if (!productData.inStock) {
          return {
            success: false,
            error: 'Product is out of stock',
          };
        }

        const guestCart = getGuestCart();
        const existingItem = guestCart.items.find(
          (item) => (item.product === productId || item.product?._id === productId) && item.size === size
        );

        // Calculate new quantity
        const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

        // Check if new quantity exceeds stock
        if (newQuantity > productData.stock) {
          const available = productData.stock - (existingItem ? existingItem.quantity : 0);
          return {
            success: false,
            error: `Only ${available} more items available in stock (${productData.stock} total)`,
          };
        }

        if (existingItem) {
          existingItem.quantity = newQuantity;
        } else {
          guestCart.items.push({
            _id: `guest_${Date.now()}_${Math.random()}`,
            product: {
              _id: productData._id,
              name: productData.name,
              price: productData.price,
              imageUrl: productData.imageUrl || '',
            },
            size,
            quantity,
            price: productData.price,
          });
        }

        saveGuestCart(guestCart);
        loadGuestCart();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to add item to cart',
        };
      }
    }
  };

  // Update cart item quantity
  const updateItem = async (itemId, quantity) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const cartData = await cartAPI.updateCartItem(itemId, quantity);
        setCart(cartData || cart);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to update item',
        };
      } finally {
        setLoading(false);
      }
    } else {
      // Guest cart - validate stock before updating
      try {
        const guestCart = getGuestCart();
        const item = guestCart.items.find(item => item._id === itemId);
        
        if (!item) {
          return { success: false, error: 'Item not found in cart' };
        }

        // Fetch product to validate stock
        const { productAPI } = await import('../api/product.api');
        const productId = item.product?._id || item.product;
        const productData = await productAPI.getProductById(productId);

        // Validate stock availability
        if (!productData.inStock) {
          return {
            success: false,
            error: 'Product is out of stock',
          };
        }

        // Calculate total quantity of same product+size in cart (excluding current item)
        const totalQuantityInCart = guestCart.items
          .filter(cartItem => {
            const cartItemProductId = cartItem.product?._id || cartItem.product;
            return cartItemProductId === productId && 
                   cartItem.size === item.size && 
                   cartItem._id !== itemId;
          })
          .reduce((sum, cartItem) => sum + (cartItem.quantity || 0), 0);

        // Available stock = total stock - quantity already in cart (excluding current item)
        const availableStock = productData.stock - totalQuantityInCart;

        if (quantity > availableStock) {
          return {
            success: false,
            error: `Only ${availableStock} items available in stock (${productData.stock} total, ${totalQuantityInCart} already in cart)`,
          };
        }

        updateGuestCartItem(itemId, quantity);
        await loadGuestCart();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to update item',
        };
      }
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const cartData = await cartAPI.removeCartItem(itemId);
        setCart(cartData || cart);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to remove item',
        };
      } finally {
        setLoading(false);
      }
    } else {
      // Guest cart
      removeFromGuestCart(itemId);
      loadGuestCart();
      return { success: true };
    }
  };

  // Clear cart
  const clear = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        await cartAPI.clearCart();
        setCart({ items: [], total: 0, totalItems: 0 });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Failed to clear cart',
        };
      } finally {
        setLoading(false);
      }
    } else {
      // Guest cart
      clearGuestCart();
      setCart({ items: [], total: 0, totalItems: 0 });
      return { success: true };
    }
  };

  // Reset cart state (called on logout)
  const resetCart = () => {
    setCart({ items: [], total: 0, totalItems: 0 });
    hasMergedCart.current = false;
  };

  // Helper function to calculate cart totals (centralized)
  const calculateCartTotals = (items) => {
    const total = items.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + price * (item.quantity || 0);
    }, 0);
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return { total, totalItems };
  };

  // Get cart totals (use calculated if available, otherwise calculate)
  const getCartTotals = () => {
    if (cart.total !== undefined && cart.totalItems !== undefined) {
      return { total: cart.total, totalItems: cart.totalItems };
    }
    return calculateCartTotals(cart.items || []);
  };

  const value = {
    cart,
    loading,
    notification,
    addItem,
    updateItem,
    removeItem,
    clear,
    resetCart,
    refreshCart: isAuthenticated ? loadCart : loadGuestCart,
    getCartTotals,
    clearNotification: () => setNotification(null),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

