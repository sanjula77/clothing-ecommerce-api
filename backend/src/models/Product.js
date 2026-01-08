import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (value) {
          return value > 0;
        },
        message: "Price must be greater than 0",
      },
    },
    imageUrl: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          if (!value) return true; // Allow empty string
          return /^https?:\/\/.+/.test(value);
        },
        message: "Image URL must be a valid HTTP/HTTPS URL",
      },
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: {
        values: ["Men", "Women", "Kids"],
        message: "Category must be Men, Women, or Kids",
      },
      index: true,
    },
    sizes: {
      type: [String],
      enum: {
        values: ["S", "M", "L", "XL"],
        message: "Size must be S, M, L, or XL",
      },
      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },
        message: "At least one size must be specified",
      },
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for search optimization
productSchema.index({ name: "text", description: "text" });
productSchema.index({ price: 1, category: 1 });

// Virtual to update inStock based on stock
productSchema.pre("save", function () {
  this.inStock = this.stock > 0;
});

export default mongoose.model("Product", productSchema);
