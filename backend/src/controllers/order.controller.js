import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc   Create new order from cart
// @route  POST /api/orders
// @access Private
export const createOrder = async (req, res, next) => {
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
      return res.status(400).json({
        success: false,
        error: "Cart is empty. Add items to cart before checkout.",
      });
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

    // If any items are invalid, abort
    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "Some items in your cart are no longer available",
        details: errors,
      });
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

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

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate order for response
    const populatedOrder = await Order.findById(order[0]._id).populate(
      "user",
      "name email"
    );

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: "Order created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// @desc   Get user's orders
// @route  GET /api/orders/my
// @access Private
export const getMyOrders = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// @desc   Get order by ID
// @route  GET /api/orders/:id
// @access Private
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update order status (for admin - future implementation)
// @route  PUT /api/orders/:id/status
// @access Private (Admin only - to be implemented)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID format",
      });
    }

    const validStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Prevent status changes for cancelled orders
    if (order.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        error: "Cannot update status of cancelled order",
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: order,
      message: "Order status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
  