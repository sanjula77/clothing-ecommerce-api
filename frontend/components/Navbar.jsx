import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = cart?.totalItems || 0;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Clothing Store
        </Link>

        <div className="navbar-menu">
          <Link to="/products" className="navbar-link">
            Products
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" className="navbar-link">
                Orders
              </Link>
              <span className="navbar-user">Hello, {user?.name}</span>
              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link">
                Register
              </Link>
            </>
          )}

          <Link to="/cart" className="navbar-cart">
            Cart ({cartItemCount})
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

