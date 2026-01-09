import { useCart } from '../context/CartContext';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateItem, removeItem, loading } = useCart();

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0) {
      updateItem(item._id, newQuantity);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Remove this item from cart?')) {
      removeItem(item._id);
    }
  };

  const subtotal = (item.product?.price || item.price || 0) * item.quantity;

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {item.product?.imageUrl || item.imageUrl ? (
          <img src={item.product?.imageUrl || item.imageUrl} alt={item.product?.name || item.name} />
        ) : (
          <div className="cart-item-placeholder">No Image</div>
        )}
      </div>

      <div className="cart-item-details">
        <h3 className="cart-item-name">{item.product?.name || item.name}</h3>
        <p className="cart-item-size">Size: {item.size}</p>
        <p className="cart-item-price">${item.product?.price || item.price}</p>
      </div>

      <div className="cart-item-quantity">
        <label>
          Qty:
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleQuantityChange}
            disabled={loading}
            className="cart-item-input"
          />
        </label>
      </div>

      <div className="cart-item-subtotal">
        <strong>${subtotal.toFixed(2)}</strong>
      </div>

      <button onClick={handleRemove} disabled={loading} className="cart-item-remove">
        Remove
      </button>
    </div>
  );
};

export default CartItem;

