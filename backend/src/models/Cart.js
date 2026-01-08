import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    size: {
      type: String,
      enum: {
        values: ["S", "M", "L", "XL"],
        message: "Size must be S, M, L, or XL",
      },
      required: [true, "Size is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      // unique: true automatically creates an index, no need for index: true
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Note: user field already has an index from unique: true, no need for additional index

// Virtual for total items count
cartItemSchema.virtual("subtotal").get(function () {
  // This will be calculated in controller after populating product
  return null;
});

export default mongoose.model("Cart", cartSchema);
