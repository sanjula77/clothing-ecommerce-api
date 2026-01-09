import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { closeEmailService } from '../src/services/email.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
// Note: If .env.test doesn't exist, dotenv.config will silently fail
// and we'll use fallback values below
dotenv.config({ path: join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Ensure JWT_SECRET is set for tests (critical for token verification)
// IMPORTANT: This must match the secret used in test helpers (cart.test.js, order.test.js)
// Best practice: Use a different secret for tests than production
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-jest-tests-only';
}

// Connect to test database
// Handle connection for parallel test execution
beforeAll(async () => {
  // Check if already connected (for parallel test execution)
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Test database already connected (reusing connection)');
    return;
  }
  
  // Use MONGO_URI from .env.test
  // IMPORTANT: This should point to a SEPARATE test database, not your dev/prod database
  // Fail fast if MONGO_URI is not set to prevent accidental local/dev DB usage
  if (!process.env.MONGO_URI || process.env.MONGO_URI.trim() === '') {
    throw new Error(
      'MONGO_URI must be set in .env.test for tests. This prevents accidental connection to dev/prod databases.\n' +
      'Please create .env.test with: MONGO_URI=mongodb+srv://.../clothing_test'
    );
  }
  
  const mongoUri = process.env.MONGO_URI;
  
  // Retry connection logic for DNS resolution issues
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Close any existing connection first (in case of previous failed connection)
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 20000, // Increased timeout for Atlas
        socketTimeoutMS: 45000, // Socket timeout
        // MongoDB Atlas connection options
        retryWrites: true,
        w: 'majority',
        // Connection pool options - keep minimal for tests
        maxPoolSize: 5, // Reduced from 10 for cleaner test exit
        minPoolSize: 0, // Allow pool to shrink to zero when idle
        // DNS resolution retry
        connectTimeoutMS: 20000,
      });
      console.log('✅ Test database connected');
      console.log(`📊 Connected to database: ${mongoose.connection.db.databaseName}`);
      return; // Success, exit retry loop
    } catch (error) {
      lastError = error;
      const isDnsError = error.message.includes('ENOTFOUND') || error.message.includes('querySrv');
      
      if (isDnsError && attempt < maxRetries) {
        const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.warn(`⚠️  DNS resolution failed (attempt ${attempt}/${maxRetries}). Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Retry
      }
      
      // If not DNS error or last attempt, throw
      if (!isDnsError || attempt === maxRetries) {
        console.error('❌ Test database connection failed:', error.message);
        console.error('💡 Troubleshooting tips:');
        console.error('   1. Check MongoDB Atlas Network Access - allow your IP or 0.0.0.0/0');
        console.error('   2. Verify database user has read/write permissions');
        console.error('   3. Check if password has special characters (may need URL encoding)');
        console.error('   4. MongoDB Atlas will auto-create the database on first write');
        console.error('   5. DNS resolution issues may be network-related - check internet connection');
        throw error;
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
});

// Clear database before each test
beforeEach(async () => {
  // Ensure database connection is ready
  if (mongoose.connection.readyState !== 1) {
    console.warn('[SETUP] Database not connected, skipping clear');
    return;
  }
  
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch (error) {
      // Ignore errors if collection doesn't exist
      console.warn(`[SETUP] Error clearing collection ${key}:`, error.message);
    }
  }
  
  // Wait a moment to ensure deletions are committed
  await new Promise(resolve => setTimeout(resolve, 10));
});

// Close database connection after all tests
afterAll(async () => {
  // Optionally keep the database for inspection
  // Set KEEP_TEST_DB=true in .env.test to preserve the database after tests
  const keepTestDb = process.env.KEEP_TEST_DB === 'true';
  
  try {
    // Only proceed if connection is still open
    if (mongoose.connection.readyState === 1) {
      if (!keepTestDb) {
        // Default: Drop database for clean test environment
        try {
          await mongoose.connection.dropDatabase();
          console.log('✅ Test database dropped (cleanup)');
        } catch (error) {
          console.warn('⚠️  Could not drop test database:', error.message);
        }
      } else {
        console.log('ℹ️  Test database preserved (KEEP_TEST_DB=true)');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Error during database cleanup:', error.message);
  } finally {
    // Always close connections, even if cleanup failed
    // This ensures Jest can exit cleanly
    try {
      // Close email service transporter first (closes SMTP connections)
      await closeEmailService();
      
      // Get current connection state
      const readyState = mongoose.connection.readyState;
      
      // Close the main connection if it's open
      if (readyState === 1) {
        // Close gracefully - this closes all connections in the pool
        await mongoose.connection.close(false); // false = don't force close
      }
      
      // Disconnect completely - closes all connections and clears connection pools
      // This is the proper way to ensure all handles are closed
      await mongoose.disconnect();
      
      // Verify connection is closed
      if (mongoose.connection.readyState !== 0) {
        // If still not closed, force close
        await mongoose.connection.close(true); // true = force close
      }
      
      console.log('✅ Test database disconnected');
    } catch (error) {
      // Ignore errors if already disconnected or connection-related
      const errorMsg = error.message || '';
      if (!errorMsg.includes('connection') && 
          !errorMsg.includes('disconnected') && 
          !errorMsg.includes('not connected')) {
        console.warn('⚠️  Error disconnecting:', errorMsg);
      }
      // Force disconnect even if there was an error
      try {
        await closeEmailService();
        await mongoose.disconnect();
      } catch (e) {
        // Ignore second disconnect error
      }
    }
  }
});

