import db from "../config/db.js";

export const getInventory = async (req, res) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        const [products] = await db.query("SELECT * FROM inventory WHERE is_active = TRUE AND session_id = ? LIMIT ?", [req.sessionId, limit]);
        return res.status(200).json(products);
    }

    const [products] = await db.query("SELECT * FROM inventory WHERE is_active = TRUE AND session_id = ?", [req.sessionId]);
    res.status(200).json(products);
}

export const getProduct = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [product] = await db.query("SELECT * FROM inventory WHERE product_id = ? AND session_id = ?", [id, req.sessionId]);

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
        quantity: parseInt(req.body.quantity),
        unit: req.body.unit,
        price: parseFloat(req.body.price)
    }

    if (!newProduct.name || !newProduct.unit || Number.isNaN(newProduct.quantity) || Number.isNaN(newProduct.price)) {
        const error = new Error("Name, quantity, unit, or price is blank");
        error.status = 400;
        return next(error);
    }

    const [result] = await db.query(
        "INSERT INTO inventory (session_id, name, quantity, unit, price) VALUES (?, ?, ?, ?, ?)",
        [req.sessionId, newProduct.name, newProduct.quantity, newProduct.unit, newProduct.price]
    );
    newProduct.product_id = result.insertId;

    const [updatedInventory] = await db.query("SELECT * FROM inventory WHERE session_id = ?", [req.sessionId]);
    res.status(201).json(updatedInventory);
}

export const updateProduct = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [product] = await db.query("SELECT * FROM inventory WHERE product_id = ? AND session_id = ?", [id, req.sessionId]);

    if (product.length === 0) {
        const error = new Error(`Could not find product with the id ${id}`);
        error.status = 404;
        return next(error);
    }

    const updatedProduct = {
        name: req.body.name,
        quantity: parseInt(req.body.quantity),
        unit: req.body.unit,
        price: parseFloat(req.body.price)
    }

    if (!updatedProduct.name || !updatedProduct.unit || Number.isNaN(updatedProduct.quantity) || Number.isNaN(updatedProduct.price)) {
        const error = new Error("Name, quantity, unit, or price is blank");
        error.status = 400;
        return next(error);
    }

    await db.query(
        "UPDATE inventory SET name = ?, quantity = ?, unit = ?, price = ? WHERE product_id = ? AND session_id = ?",
        [updatedProduct.name, updatedProduct.quantity, updatedProduct.unit, updatedProduct.price, id, req.sessionId]
    );
    const [updatedInventory] = await db.query("SELECT * FROM inventory WHERE session_id = ?", [req.sessionId]);
    res.status(200).json(updatedInventory);
}

export const deleteProduct = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [product] = await db.query("SELECT * FROM inventory WHERE product_id = ? AND session_id = ?", [id, req.sessionId]);

    if (product.length === 0) {
        const error = new Error(`Could not find product with the id ${id}`);
        error.status = 404;
        return next (error);
    }

    const[orderItems] = await db.query("SELECT * FROM order_items WHERE product_id = ? AND session_id = ?", [id, req.sessionId]);
    if (orderItems.length > 0) {
        await db.query("UPDATE inventory SET is_active = FALSE WHERE product_id = ? AND session_id = ?", [id, req.sessionId]);
    } else {
        await db.query("DELETE FROM inventory WHERE product_id = ? AND session_id = ?", [id, req.sessionId]);
    }

    const [updatedInventory] = await db.query("SELECT * FROM inventory WHERE session_id = ?", [req.sessionId]);
    res.status(200).json(updatedInventory);
}
