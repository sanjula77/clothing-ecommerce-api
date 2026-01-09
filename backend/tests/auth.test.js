import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { retryOperation } from './helpers/testHelpers.js';

describe('User Registration', () => {
  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name', 'Test User');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('Test User');
      expect(user.password).not.toBe('password123'); // Should be hashed
    });

    it('should fail to register with duplicate email', async () => {
      // Create first user
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password456',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Email already in use');
    });

    it('should return validation error for invalid input', async () => {
      // Test missing required fields
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          // Missing email and password
        })
        .expect(400);

      expect(response1.body).toHaveProperty('success', false);
      expect(response1.body.error).toBeTruthy();
      // Verify specific validation error message
      expect(typeof response1.body.error).toBe('string');
      expect(response1.body.error.length).toBeGreaterThan(0);

      // Test invalid email format
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response2.body).toHaveProperty('success', false);

      // Test password too short
      const response3 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '12345', // Less than 6 characters
        })
        .expect(400);

      expect(response3.body).toHaveProperty('success', false);

      // Test name too short (1 character, less than min 2)
      const response4 = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'T', // 1 character, less than min 2
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response4.body).toHaveProperty('success', false);
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'hashtest@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Use retry mechanism to ensure user is persisted (Mongoose async operations)
      const user = await retryOperation(
        async () => {
          const found = await User.findOne({ email: 'hashtest@example.com' });
          if (!found) {
            throw new Error('User not found yet');
          }
          return found;
        },
        { maxRetries: 5, delay: 50, backoff: 1.5 }
      );
      
      expect(user).toBeTruthy();
      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20); // Bcrypt hash is long
    });
  });
});

