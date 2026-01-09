import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="product-image-placeholder">No Image</div>
        )}
        {!product.inStock && <div className="product-out-of-stock">Out of Stock</div>}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-price">${product.price}</p>
        {product.inStock && (
          <div className="product-sizes">
            {product.sizes?.map((size) => (
              <span key={size} className="product-size-badge">
                {size}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;

