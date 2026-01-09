import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// In test mode, .env.test is already loaded by setup.js, so don't override it
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
} else {
  // In test mode, only load .env.test if it hasn't been loaded yet
  // (setup.js should have already loaded it, but this is a safety check)
  if (!process.env.JWT_SECRET) {
    dotenv.config({ path: join(__dirname, "../../.env.test") });
  }
}

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true",
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,
};
