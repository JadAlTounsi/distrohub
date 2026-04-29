import db from "../config/db.js";

export const getInventory = async (req, res) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        const [products] = await db.query("SELECT * FROM inventory WHERE is_active = TRUE LIMIT ?", [limit]);
        return res.status(200).json(products);
    }

    const [products] = await db.query("SELECT * FROM inventory WHERE is_active = TRUE");
    res.status(200).json(products);
}

export const getProduct = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [product] = await db.query("SELECT * FROM inventory WHERE product_id = ?", [id]);

    if (product.length === 0) {
        const error = new Error(`Could not find product with the id ${id}`);
        error.status = 404;
        return next(error);
    }
    res.status(200).json(product);
}

export const createProduct = async (req, res, next) => {
    const newProduct = {
        name: req.body.name,
        quantity: parseFloat(req.body.quantity),
        unit: req.body.unit,
        price: parseFloat(req.body.price)
    }

    if (!newProduct.name || newProduct.quantity === undefined || !newProduct.unit || newProduct.price === undefined) {
        const error = new Error("Name, quantity, unit, or price is blank");
        error.status = 400;
        return next(error);
    }

    const [result] = await db.query(
        "INSERT INTO inventory (name, quantity, unit, price) VALUES (?, ?, ?, ?)",
        [newProduct.name, newProduct.quantity, newProduct.unit, newProduct.price]
    );
    newProduct.product_id = result.insertId;
    
    const [updatedInventory] = await db.query("SELECT * FROM inventory");
    res.status(201).json(updatedInventory);
}

export const updateProduct = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [product] = await db.query("SELECT * FROM inventory WHERE product_id = ?", [id]);

    if (product.length === 0) {
        const error = new Error(`Could not find product with the id ${id}`);
        error.status = 404;
        return next(error);
    }

    await db.query(
        "UPDATE inventory SET name = ?, quantity = ?, unit = ?, price = ? WHERE product_id = ?",
        [req.body.name, parseFloat(req.body.quantity), req.body.unit, parseFloat(req.body.price), id]
    );
    const [updatedInventory] = await db.query("SELECT * FROM inventory");
    res.status(200).json(updatedInventory);
}

export const deleteProduct = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [product] = await db.query("SELECT * FROM inventory WHERE product_id = ?", [id]);

    if (product.length === 0) {
        const error = new Error(`Could not find product with the id ${id}`);
        error.status = 404;
        return next (error);
    }

    const[orderItems] = await db.query("SELECT * FROM order_items WHERE product_id = ?", [id]);
    if (orderItems.length > 0) {
        await db.query("UPDATE inventory SET is_active = FALSE WHERE product_id = ?", [id]);
    } else {
        await db.query("DELETE FROM inventory WHERE product_id = ?", [id]);
    }
    
    const [updatedInventory] = await db.query("SELECT * FROM inventory");
    res.status(200).json(updatedInventory);
}