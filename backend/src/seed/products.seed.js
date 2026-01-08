import Product from "../models/Product.js";

const products = [
  // Men's Clothing
  {
    name: "Classic Cotton T-Shirt",
    description: "Comfortable and breathable cotton T-shirt, perfect for everyday wear. Available in multiple colors.",
    price: 2000,
    imageUrl: "https://source.unsplash.com/400x400/?tshirt,men",
    category: "Men",
    sizes: ["S", "M", "L", "XL"],
    stock: 50,
  },
  {
    name: "Slim Fit Denim Jeans",
    description: "Premium denim jeans with a modern slim fit. Durable and stylish for any occasion.",
    price: 4500,
    imageUrl: "https://source.unsplash.com/400x400/?jeans,men",
    category: "Men",
    sizes: ["M", "L", "XL"],
    stock: 30,
  },
  {
    name: "Casual Polo Shirt",
    description: "Classic polo shirt made from high-quality cotton blend. Perfect for smart casual occasions.",
    price: 2500,
    imageUrl: "https://source.unsplash.com/400x400/?polo,shirt",
    category: "Men",
    sizes: ["S", "M", "L", "XL"],
    stock: 40,
  },
  {
    name: "Hooded Sweatshirt",
    description: "Warm and cozy hooded sweatshirt with front pocket. Ideal for cooler weather.",
    price: 3500,
    imageUrl: "https://source.unsplash.com/400x400/?hoodie,men",
    category: "Men",
    sizes: ["S", "M", "L", "XL"],
    stock: 25,
  },
  {
    name: "Cargo Shorts",
    description: "Functional cargo shorts with multiple pockets. Great for outdoor activities.",
    price: 2800,
    imageUrl: "https://source.unsplash.com/400x400/?shorts,men",
    category: "Men",
    sizes: ["M", "L", "XL"],
    stock: 35,
  },
  {
    name: "Formal Dress Shirt",
    description: "Crisp white dress shirt perfect for business and formal events. Wrinkle-resistant fabric.",
    price: 3200,
    imageUrl: "https://source.unsplash.com/400x400/?dress,shirt,men",
    category: "Men",
    sizes: ["S", "M", "L", "XL"],
    stock: 20,
  },
  {
    name: "Athletic Joggers",
    description: "Comfortable joggers with elastic waistband. Perfect for workouts or casual wear.",
    price: 3000,
    imageUrl: "https://source.unsplash.com/400x400/?joggers,men",
    category: "Men",
    sizes: ["S", "M", "L", "XL"],
    stock: 45,
  },
  {
    name: "Leather Jacket",
    description: "Genuine leather jacket with classic design. Timeless style for any wardrobe.",
    price: 8500,
    imageUrl: "https://source.unsplash.com/400x400/?leather,jacket,men",
    category: "Men",
    sizes: ["M", "L", "XL"],
    stock: 15,
  },

  // Women's Clothing
  {
    name: "Summer Floral Dress",
    description: "Beautiful floral print dress perfect for summer. Lightweight and comfortable fabric.",
    price: 3500,
    imageUrl: "https://source.unsplash.com/400x400/?dress,women",
    category: "Women",
    sizes: ["S", "M", "L"],
    stock: 40,
  },
  {
    name: "Warm Winter Hoodie",
    description: "Cozy hoodie with soft fleece lining. Perfect for staying warm during winter months.",
    price: 3000,
    imageUrl: "https://source.unsplash.com/400x400/?hoodie,women",
    category: "Women",
    sizes: ["S", "M", "L", "XL"],
    stock: 30,
  },
  {
    name: "Skinny Fit Jeans",
    description: "Stylish skinny fit jeans with stretch fabric for comfort. Flattering fit for all body types.",
    price: 4200,
    imageUrl: "https://source.unsplash.com/400x400/?jeans,women",
    category: "Women",
    sizes: ["S", "M", "L"],
    stock: 35,
  },
  {
    name: "Elegant Blouse",
    description: "Sophisticated blouse with delicate details. Perfect for office or evening wear.",
    price: 2800,
    imageUrl: "https://source.unsplash.com/400x400/?blouse,women",
    category: "Women",
    sizes: ["S", "M", "L"],
    stock: 25,
  },
  {
    name: "Casual T-Shirt",
    description: "Comfortable women's T-shirt in various colors. Soft cotton blend fabric.",
    price: 1800,
    imageUrl: "https://source.unsplash.com/400x400/?tshirt,women",
    category: "Women",
    sizes: ["S", "M", "L", "XL"],
    stock: 50,
  },
  {
    name: "Maxi Skirt",
    description: "Flowing maxi skirt with elegant design. Perfect for casual or semi-formal occasions.",
    price: 3200,
    imageUrl: "https://source.unsplash.com/400x400/?skirt,women",
    category: "Women",
    sizes: ["S", "M", "L"],
    stock: 28,
  },
  {
    name: "Yoga Leggings",
    description: "High-waisted leggings with moisture-wicking fabric. Perfect for workouts or athleisure.",
    price: 2500,
    imageUrl: "https://source.unsplash.com/400x400/?leggings,women",
    category: "Women",
    sizes: ["S", "M", "L", "XL"],
    stock: 42,
  },
  {
    name: "Denim Jacket",
    description: "Classic denim jacket with modern fit. Versatile piece for layering.",
    price: 4000,
    imageUrl: "https://source.unsplash.com/400x400/?denim,jacket,women",
    category: "Women",
    sizes: ["S", "M", "L"],
    stock: 22,
  },
  {
    name: "Cardigan Sweater",
    description: "Soft cardigan sweater perfect for layering. Comfortable and stylish.",
    price: 3800,
    imageUrl: "https://source.unsplash.com/400x400/?cardigan,women",
    category: "Women",
    sizes: ["S", "M", "L", "XL"],
    stock: 30,
  },
  {
    name: "High-Waisted Shorts",
    description: "Trendy high-waisted shorts with comfortable fit. Perfect for summer.",
    price: 2200,
    imageUrl: "https://source.unsplash.com/400x400/?shorts,women",
    category: "Women",
    sizes: ["S", "M", "L"],
    stock: 38,
  },

  // Kids' Clothing
  {
    name: "Kids Cotton T-Shirt",
    description: "Comfortable kids T-shirt with fun designs. Made from soft, child-friendly fabric.",
    price: 1500,
    imageUrl: "https://source.unsplash.com/400x400/?tshirt,kids",
    category: "Kids",
    sizes: ["S", "M"],
    stock: 60,
  },
  {
    name: "Children's Jeans",
    description: "Durable jeans designed for active kids. Reinforced knees for extra durability.",
    price: 2800,
    imageUrl: "https://source.unsplash.com/400x400/?jeans,kids",
    category: "Kids",
    sizes: ["S", "M"],
    stock: 45,
  },
  {
    name: "Kids Hoodie",
    description: "Warm and cozy hoodie for children. Fun colors and comfortable fit.",
    price: 2500,
    imageUrl: "https://source.unsplash.com/400x400/?hoodie,kids",
    category: "Kids",
    sizes: ["S", "M"],
    stock: 40,
  },
  {
    name: "Children's Dress",
    description: "Adorable dress for little girls. Comfortable fabric perfect for play or special occasions.",
    price: 3000,
    imageUrl: "https://source.unsplash.com/400x400/?dress,kids",
    category: "Kids",
    sizes: ["S", "M"],
    stock: 35,
  },
  {
    name: "Kids Shorts",
    description: "Comfortable shorts for active children. Elastic waistband for easy wear.",
    price: 1800,
    imageUrl: "https://source.unsplash.com/400x400/?shorts,kids",
    category: "Kids",
    sizes: ["S", "M"],
    stock: 50,
  },
  {
    name: "Children's Sweater",
    description: "Warm sweater for kids. Soft fabric that's gentle on sensitive skin.",
    price: 2200,
    imageUrl: "https://source.unsplash.com/400x400/?sweater,kids",
    category: "Kids",
    sizes: ["S", "M"],
    stock: 38,
  },
];

export const seedProducts = async () => {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log("✅ Cleared existing products");

    // Insert new products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${createdProducts.length} products!`);

    return createdProducts;
  } catch (error) {
    console.error("❌ Error seeding products:", error.message);
    throw error;
  }
};

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("../config/env.js").then(({ env }) => {
    import("mongoose").then((mongoose) => {
      import("dotenv").then((dotenv) => {
        dotenv.default.config();
        mongoose.default
          .connect(env.MONGO_URI)
          .then(() => {
            console.log("Connected to MongoDB");
            return seedProducts();
          })
          .then(() => {
            console.log("Seeding completed!");
            process.exit(0);
          })
          .catch((error) => {
            console.error("Seeding failed:", error);
            process.exit(1);
          });
      });
    });
  });
}
