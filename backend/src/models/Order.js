import mongoose from "mongoose";

// Order item schema - immutable snapshot of product at time of order
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      immutable: true, // Cannot be changed after creation
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      immutable: true,
    },
    size: {
      type: String,
      required: [true, "Size is required"],
      enum: {
        values: ["S", "M", "L", "XL"],
        message: "Size must be S, M, L, or XL",
      },
      immutable: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      immutable: true, // Preserve historical price
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
      immutable: true,
    },
    imageUrl: {
      type: String,
      default: "",
      immutable: true, // Preserve product image at time of order
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      immutable: true,
      // Indexed via compound index: { user: 1, createdAt: -1 }
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
      immutable: true, // Preserve historical total
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
        message: "Invalid order status",
      },
      default: "PENDING",
      // Indexed via compound index: { status: 1, createdAt: -1 }
    },
    shippingAddress: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["CASH_ON_DELIVERY", "CREDIT_CARD", "DEBIT_CARD", "PAYPAL"],
      default: "CASH_ON_DELIVERY",
    },
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      // unique: true automatically creates an index, no need for index: true
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Generate unique order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Virtual for order summary
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Prevent modification of critical fields after creation
orderSchema.pre("save", function (next) {
  if (!this.isNew) {
    // Prevent changing immutable fields
    if (this.isModified("user") || this.isModified("items") || this.isModified("totalAmount")) {
      return next(new Error("Cannot modify immutable order fields"));
    }
  }
  next();
});

export default mongoose.model("Order", orderSchema);
