import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app.js';

/**
 * Retry helper for database operations that may need time to persist
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 5)
 * @param {number} options.delay - Initial delay in ms (default: 50)
 * @param {number} options.backoff - Backoff multiplier (default: 1.5)
 * @returns {Promise<any>} Result of the operation
 */
export const retryOperation = async (operation, options = {}) => {
  const { maxRetries = 5, delay = 50, backoff = 1.5 } = options;
  let lastError;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoff; // Exponential backoff
      }
    }
  }

  throw lastError;
};

/**
 * Creates a test user and returns the user object and JWT token
 * Uses unique email to avoid conflicts between tests
 * @param {string} prefix - Optional prefix for email (default: 'test')
 * @returns {Promise<{user: Object, token: string}>}
 */
export const createTestUser = async (prefix = 'test') => {
  // Use unique email for each test to avoid conflicts
  const uniqueEmail = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  
  try {
    // Create user
    const user = await User.create({
      name: 'Test User',
      email: uniqueEmail,
      password: 'password123',
    });

    // Ensure user is saved and has an ID
    if (!user || !user._id) {
      throw new Error('User was not created properly - no user or ID returned');
    }

    // Force a fresh query to ensure user is persisted (bypasses any caching)
    // Use findOne with the exact email to ensure we get the persisted version
    // Note: User model has lowercase: true on email, so we need to match lowercase
    let persistedUser = await User.findOne({ email: uniqueEmail.toLowerCase() });
    
    // If still not found, retry with findById using retry mechanism
    if (!persistedUser) {
      persistedUser = await retryOperation(
        async () => {
          const found = await User.findById(user._id);
          if (!found) {
            throw new Error('User not found yet');
          }
          return found;
        },
        { maxRetries: 5, delay: 50, backoff: 1.5 }
      );
    }
    
    // If still not found, try findOne again with lowercase
    if (!persistedUser) {
      persistedUser = await retryOperation(
        async () => {
          const found = await User.findOne({ email: uniqueEmail.toLowerCase() });
          if (!found) {
            throw new Error('User not found yet');
          }
          return found;
        },
        { maxRetries: 3, delay: 50, backoff: 1.5 }
      );
    }
    
    if (!persistedUser) {
      // Last attempt: check if ANY users exist
      const allUsers = await User.find({});
      throw new Error(
        `User ${user._id} was not found in database after creation. Email: ${uniqueEmail}. ` +
        `Total users in DB: ${allUsers.length}. This suggests a database persistence issue.`
      );
    }

    // Use the persisted user's ID (in case it's different, though it shouldn't be)
    const userId = persistedUser._id.toString();

    // Use process.env.JWT_SECRET directly (set by setup.js) instead of env.JWT_SECRET
    // This ensures we use the test secret, not a cached value from before setup
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Shorter expiration for tests
    });

    return { user: persistedUser, token };
  } catch (error) {
    // If creation fails, provide more context
    if (error.code === 11000) {
      throw new Error(`User creation failed: Duplicate email (${uniqueEmail}). Database may not have been cleared properly.`);
    }
    throw error;
  }
};

/**
 * Creates a test product with default values that can be overridden
 * @param {Object} overrides - Properties to override default product values
 * @returns {Promise<Object>} Created product document
 */
export const createTestProduct = async (overrides = {}) => {
  return await Product.create({
    name: 'Test Product',
    description: 'Test Description',
    price: 29.99,
    imageUrl: 'https://example.com/image.jpg',
    category: 'Men',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 10,
    inStock: true,
    ...overrides,
  });
};

/**
 * Adds an item to cart via API
 * @param {string} token - JWT authentication token
 * @param {string} productId - Product ID to add
 * @param {string} size - Product size
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Supertest response object
 */
export const addToCart = async (token, productId, size, quantity) => {
  return await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId, size, quantity });
};

