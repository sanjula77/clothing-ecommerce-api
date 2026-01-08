import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { seedProducts } from "./seed/products.seed.js";


const startServer = async () => {
  await connectDB(env.MONGO_URI);

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();
seedProducts();
