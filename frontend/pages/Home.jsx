import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Welcome to Clothing E-Commerce</h1>
        <p>Browse our collection of stylish clothing</p>
        <Link to="/products" className="home-button">
          Shop Now
        </Link>
      </div>
    </div>
  );
};

export default Home;

