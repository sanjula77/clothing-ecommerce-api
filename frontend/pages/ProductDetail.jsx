import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../api/product.api';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const product = await productAPI.getProductById(id);

      if (product) {
        setProduct(product);
        if (product.sizes && product.sizes.length > 0) {
          setSelectedSize(product.sizes[0]);
        }
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      setMessage('Please select a size');
      return;
    }

    if (!product.inStock) {
      setMessage('Product is out of stock');
      return;
    }

    setAddingToCart(true);
    setMessage('');

    const result = await addItem(product._id, selectedSize, quantity, product);

    setAddingToCart(false);

    if (result.success) {
      setMessage('Added to cart!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(result.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-detail-loading">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container">
          <div className="product-detail-error">{error || 'Product not found'}</div>
          <button onClick={() => navigate('/products')} className="back-button">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        <button onClick={() => navigate('/products')} className="back-button">
          ← Back to Products
        </button>

        <div className="product-detail-content">
          <div className="product-detail-image">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="product-detail-placeholder">No Image</div>
            )}
            {!product.inStock && (
              <div className="product-detail-out-of-stock">Out of Stock</div>
            )}
          </div>

          <div className="product-detail-info">
            <h1>{product.name}</h1>
            <p className="product-detail-category">{product.category}</p>
            <p className="product-detail-price">${product.price}</p>
            <p className="product-detail-description">{product.description}</p>

            {product.inStock && (
              <>
                <div className="product-detail-size">
                  <label>Size:</label>
                  <div className="size-options">
                    {product.sizes?.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`size-button ${selectedSize === size ? 'active' : ''}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="product-detail-quantity">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="quantity-input"
                  />
                  <span className="stock-info">({product.stock} available)</span>
                </div>

                {message && (
                  <div className={`product-detail-message ${message.includes('Added') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !selectedSize || !product.inStock}
                  className="add-to-cart-button"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

