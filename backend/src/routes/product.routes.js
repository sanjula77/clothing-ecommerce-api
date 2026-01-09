import express from "express";
import { getProducts, getProductById } from "../controllers/product.controller.js";
import { validateQuery, validateParams } from "../middleware/validate.js";
import { getProductsQuerySchema, productIdSchema } from "../validators/product.validator.js";

const router = express.Router();

router.get("/", validateQuery(getProductsQuerySchema), getProducts);
router.get("/:id", validateParams(productIdSchema), getProductById);

export default router;
