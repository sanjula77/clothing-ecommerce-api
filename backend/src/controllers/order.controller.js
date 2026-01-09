import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { sendEmail } from "../services/email.service.js";
import { orderConfirmationTemplate } from "../templates/orderConfirmation.template.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// @desc   Create new order from cart
// @route  POST /api/orders
// @access Private
export const createOrder = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user's cart with populated products
    const cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: "items.product",
        select: "name price imageUrl stock inStock",
      })
      .session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError("Cart is empty. Add items to cart before checkout.", 400);
    }

    // Validate stock availability and build order items
    const orderItems = [];
    const errors = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      // Check if product still exists and is in stock
      if (!product) {
        errors.push(`Product ${cartItem.product} no longer exists`);
        continue;
      }

      if (!product.inStock) {
        errors.push(`${product.name} (Size: ${cartItem.size}) is out of stock`);
        continue;
      }

      if (product.stock < cartItem.quantity) {
        errors.push(
          `Only ${product.stock} items available for ${product.name} (Size: ${cartItem.size}). You requested ${cartItem.quantity}`
        );
        continue;
      }

      // Create immutable snapshot of product data
      orderItems.push({
        product: product._id,
        name: product.name,
        size: cartItem.size,
        price: product.price,
        quantity: cartItem.quantity,
        imageUrl: product.imageUrl || "",
      });
    }

    // If any items are invalid, abort with detailed error messages
    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError("Some items in your cart are no longer available", 400, errors);
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Decrement stock for each product (within transaction)
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (product && product.stock >= cartItem.quantity) {
        product.stock -= cartItem.quantity;
        // Update inStock flag if stock reaches 0
        if (product.stock === 0) {
          product.inStock = false;
        }
        await product.save({ session });
      }
    }

    // Create order with shipping address if provided
    const orderData = {
      user: req.user.id,
      items: orderItems,
      totalAmount,
      status: "PENDING",
    };

    // Add shipping address if provided
    if (req.body.shippingAddress) {
      orderData.shippingAddress = req.body.shippingAddress;
    }

    // Add payment method if provided
    if (req.body.paymentMethod) {
      orderData.paymentMethod = req.body.paymentMethod;
    }

    // Create order atomically
    const order = await Order.create([orderData], { session });

    // Clear cart atomically (as part of same transaction)
    cart.items = [];
    await cart.save({ session });

    // Commit transaction FIRST (atomic operation complete)
    await session.commitTransaction();
    session.endSession();

    // 🔥 Side effect starts here (safe - transaction already committed)
    // Get user details for email
    const user = await User.findById(req.user.id).select("name email");

    // Populate order for response
    const populatedOrder = await Order.findById(order[0]._id).populate(
      "user",
      "name email"
    );

    // Send order confirmation email (fire and forget)
    // Email failure won't affect the order or rollback data
    sendEmail({
      to: user.email,
      subject: `Order Confirmation - ${order[0].orderNumber || order[0]._id}`,
      html: orderConfirmationTemplate(order[0], user),
    }).catch((emailError) => {
      // Log but don't throw - order is already created
      console.error("Failed to send order confirmation email:", emailError.message);
    });

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: "Order created successfully",
    });
  } catch (error) {
    // Only abort transaction if it hasn't been committed yet
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error; // Let asyncHandler catch it
  }
});

// @desc   Get user's orders
// @route  GET /api/orders/my
// @access Private
export const getMyOrders = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { user: req.user.id };
    if (status) {
      const validStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
      if (validStatuses.includes(status.toUpperCase())) {
        query.status = status.toUpperCase();
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Get orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
});

// @desc   Get order by ID
// @route  GET /api/orders/:id
// @access Private
export const getOrderById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid order ID format", 400);
    }

    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user.id) {
      throw new AppError("Not authorized to view this order", 403);
    }

    res.json({
      success: true,
      data: order,
    });
});

// @desc   Update order status (for admin - future implementation)
// @route  PUT /api/orders/:id/status
// @access Private (Admin only - to be implemented)
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // Joi validation already handled id and status format
  const order = await Order.findById(id);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Check authorization: Only order owner or admin can update status
  // Note: Admin role check can be added when user model includes role field
  if (order.user.toString() !== req.user.id) {
    // For now, only order owner can update their own order status
    // In future, add: && req.user.role !== 'admin'
    throw new AppError("Not authorized to update this order", 403);
  }

  // Prevent status changes for cancelled orders
  if (order.status === "CANCELLED") {
    throw new AppError("Cannot update status of cancelled order", 400);
  }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: "Order status updated successfully",
    });
});
  