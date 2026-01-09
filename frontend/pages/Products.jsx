import { useState, useEffect } from 'react';
import { productAPI } from '../api/product.api';
import ProductCard from '../components/ProductCard';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    sort: '-createdAt',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.size, filters.minPrice, filters.maxPrice, filters.sort, pagination.page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productAPI.getProducts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      // Handle both success response format and direct data
      if (response.success) {
        setProducts(response.data || []);
        setPagination(response.pagination || pagination);
      } else if (Array.isArray(response)) {
        // Fallback if API returns array directly
        setProducts(response);
      } else if (response.data) {
        setProducts(response.data || []);
        setPagination(response.pagination || pagination);
      } else {
        setError('Failed to load products');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load products. Make sure backend is running.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="products-page">
      <div className="products-container">
        <h1>Products</h1>

        {/* Filters */}
        <div className="products-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.size}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              className="filter-select"
            >
              <option value="">All Sizes</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>

          <div className="filter-group">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="filter-select"
            >
              <option value="-createdAt">Newest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && <div className="products-error">{error}</div>}

        {/* Loading State */}
        {loading ? (
          <div className="products-loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="products-empty">No products found</div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="products-pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
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
  );
};

export default Products;

