import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";
import {
  createTestUser,
  createTestProduct,
  addToCart,
} from "./helpers/testHelpers.js";

describe("Checkout & Orders", () => {
  let authToken;
  let testUser;
  let testProduct1;
  let testProduct2;

  beforeEach(async () => {
    // Create test user and products for each test
    const userData = await createTestUser("ordertest");
    testUser = userData.user;
    authToken = userData.token;

    // Double-check user exists before proceeding (critical for debugging)
    const verifyBeforeTest = await User.findById(testUser._id);
    if (!verifyBeforeTest) {
      throw new Error(
        `[BEFORE TEST] User ${testUser._id} not found in database. This should not happen!`
      );
    }

    testProduct1 = await createTestProduct({
      name: "Product 1",
      price: 29.99,
      stock: 10,
    });

    testProduct2 = await createTestProduct({
      name: "Product 2",
      price: 49.99,
      stock: 5,
    });

    // Final verification that user still exists after product creation
    const verifyAfterProduct = await User.findById(testUser._id);
    if (!verifyAfterProduct) {
      throw new Error(
        `[AFTER PRODUCT] User ${testUser._id} disappeared after product creation!`
      );
    }
  });

  describe("POST /api/orders", () => {
    it("should create an order successfully", async () => {
      // Add items to cart
      await addToCart(authToken, testProduct1._id.toString(), "M", 2);
      await addToCart(authToken, testProduct2._id.toString(), "L", 1);

      const orderData = {
        shippingAddress: {
          street: "123 Test St",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          country: "Test Country",
        },
        paymentMethod: "CREDIT_CARD",
      };

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data).toHaveProperty("orderNumber");
      expect(response.body.data).toHaveProperty("items");
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data).toHaveProperty("totalAmount");
      expect(response.body.data).toHaveProperty("status", "PENDING");
      // Verify status is a valid enum value
      expect([
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ]).toContain(response.body.data.status);
      expect(response.body.data.shippingAddress).toMatchObject(
        orderData.shippingAddress
      );
      expect(response.body.data.paymentMethod).toBe("CREDIT_CARD");
    });

    it("should clear cart after successful checkout", async () => {
      // Add items to cart
      await addToCart(authToken, testProduct1._id.toString(), "M", 2);

      // Verify cart has items
      const cartBefore = await Cart.findOne({ user: testUser._id });
      expect(cartBefore.items.length).toBe(1);

      // Create order
      await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          paymentMethod: "CASH_ON_DELIVERY",
        })
        .expect(201);

      // Verify cart is cleared
      const cartAfter = await Cart.findOne({ user: testUser._id });
      expect(cartAfter.items.length).toBe(0);
    });

    it("should calculate order total price correctly", async () => {
      // Add items to cart
      await addToCart(authToken, testProduct1._id.toString(), "M", 2); // 29.99 * 2 = 59.98
      await addToCart(authToken, testProduct2._id.toString(), "L", 1); // 49.99 * 1 = 49.99
      // Expected total: 59.98 + 49.99 = 109.97

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          paymentMethod: "CASH_ON_DELIVERY",
        })
        .expect(201);

      const expectedTotal = 29.99 * 2 + 49.99 * 1;
      expect(response.body.data.totalAmount).toBeCloseTo(expectedTotal, 2);
    });

    it("should fail when cart is empty", async () => {
      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          paymentMethod: "CASH_ON_DELIVERY",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("Cart is empty");
    });

    it("should fail when product is out of stock at checkout", async () => {
      // Add product to cart
      await addToCart(authToken, testProduct1._id.toString(), "M", 2);

      // Make product out of stock (re-fetch to ensure we have latest version)
      const productToUpdate = await Product.findById(testProduct1._id);
      productToUpdate.stock = 0;
      productToUpdate.inStock = false;
      await productToUpdate.save();

      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          paymentMethod: "CASH_ON_DELIVERY",
        })
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body.error).toContain("no longer available");
    });

    it("should decrement product stock after successful order", async () => {
      const initialStock = testProduct1.stock;

      // Add product to cart
      await addToCart(authToken, testProduct1._id.toString(), "M", 2);

      // Create order
      await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          paymentMethod: "CASH_ON_DELIVERY",
        })
        .expect(201);

      // Verify stock was decremented
      const updatedProduct = await Product.findById(testProduct1._id);
      expect(updatedProduct.stock).toBe(initialStock - 2);
    });

    it("should create immutable order items with product snapshot", async () => {
      // Add product to cart
      await addToCart(authToken, testProduct1._id.toString(), "M", 2);

      // Create order
      const response = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          paymentMethod: "CASH_ON_DELIVERY",
        })
        .expect(201);

      const order = response.body.data;
      expect(order.items[0]).toHaveProperty("name", testProduct1.name);
      // Verify price snapshot is preserved (immutable order)
      expect(order.items[0]).toHaveProperty("price", testProduct1.price);
      expect(order.items[0].price).toBe(29.99); // Explicit price check
      expect(order.items[0]).toHaveProperty("quantity", 2);
      expect(order.items[0]).toHaveProperty("size", "M");

      // Change product price after order creation
      testProduct1.price = 99.99;
      await testProduct1.save();

      // Verify order price didn't change
      const savedOrder = await Order.findById(order._id);
      expect(savedOrder.items[0].price).toBe(29.99); // Original price
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/orders")
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            state: "Test State",
            zipCode: "12345",
            country: "Test Country",
          },
          paymentMethod: "CASH_ON_DELIVERY",
        })
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
    });
  });
});
