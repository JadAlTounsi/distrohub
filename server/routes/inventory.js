import express from "express";
import {
    getInventory,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", getInventory);

router.get("/:id", getProduct);

router.post("/", createProduct);

router.put("/:id", updateProduct);

router.delete("/:id", deleteProduct);

export default router;