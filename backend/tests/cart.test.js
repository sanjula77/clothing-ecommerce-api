import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Cart from '../src/models/Cart.js';
import { createTestUser, createTestProduct } from './helpers/testHelpers.js';

describe('Cart Operations', () => {
  let authToken;
  let testUser;
  let testProduct;

  beforeEach(async () => {
    // Create test user and product for each test
    // Note: setup.js beforeEach clears DB first, then this runs
    
    // Create user and verify it exists
    const userData = await createTestUser('carttest');
    testUser = userData.user;
    authToken = userData.token;
    
    // Double-check user exists before proceeding (critical for debugging)
    const verifyBeforeTest = await User.findById(testUser._id);
    if (!verifyBeforeTest) {
      throw new Error(`[BEFORE TEST] User ${testUser._id} not found in database. This should not happen!`);
    }
    
    testProduct = await createTestProduct();
    
    // Final verification that user still exists after product creation
    const verifyAfterProduct = await User.findById(testUser._id);
    if (!verifyAfterProduct) {
      throw new Error(`[AFTER PRODUCT] User ${testUser._id} disappeared after product creation!`);
    }
  });

  describe('POST /api/cart', () => {
    it('should add product to cart successfully', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          size: 'M',
          quantity: 2,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].product._id.toString()).toBe(
        testProduct._id.toString()
      );
      expect(response.body.data.items[0].size).toBe('M');
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('totalItems', 2);
    });

    it('should increase quantity when adding same product with same size', async () => {
      // Add product first time
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          size: 'M',
          quantity: 2,
        })
        .expect(200);

      // Add same product with same size again
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          size: 'M',
          quantity: 3,
        })
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(5); // 2 + 3
    });

    it('should create separate cart items for same product with different sizes', async () => {
      // Add product with size M
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          size: 'M',
          quantity: 2,
        })
        .expect(200);

      // Add same product with size L
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          size: 'L',
          quantity: 1,
        })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items[0].size).toBe('M');
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.items[1].size).toBe('L');
      expect(response.body.data.items[1].quantity).toBe(1);
    });

    it('should fail when product is out of stock', async () => {
      const outOfStockProduct = await createTestProduct({
        stock: 0,
        inStock: false,
      });

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: outOfStockProduct._id.toString(),
          size: 'M',
          quantity: 1,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('out of stock');
    });

    it('should fail when quantity exceeds available stock', async () => {
      const lowStockProduct = await createTestProduct({
        stock: 5,
        inStock: true,
      });

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: lowStockProduct._id.toString(),
          size: 'M',
          quantity: 10, // More than available stock
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('available in stock');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({
          productId: testProduct._id.toString(),
          size: 'M',
          quantity: 1,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/cart', () => {
    it('should return empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should return cart with items after adding products', async () => {
      // Add product to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          size: 'M',
          quantity: 2,
        });

      // Get cart
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.totalItems).toBe(2);
    });
  });
});

