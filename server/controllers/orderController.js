import db from "../config/db.js";

async function reverseOrderCommitment(orderId, clientId) {
    const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    for (const item of items) {
        await db.query(
            "UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?",
            [item.order_quantity, item.product_id]
        );
    }

    const [totalRows] = await db.query(
        "SELECT COALESCE(SUM(order_quantity * order_price), 0) AS total FROM order_items WHERE order_id = ?",
        [orderId]
    );

    await db.query("UPDATE clients SET balance = balance - ? WHERE client_id = ?", [totalRows[0].total, clientId]);
}

export const getOrders = async (req, res) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        const [orders] = await db.query("SELECT orders.order_id, clients.client_id, clients.client_name, orders.order_date, orders.arrival_date, SUM(order_items.order_quantity) as total_quantity, SUM(order_items.order_quantity * order_items.order_price) as total_amount, orders.status FROM orders JOIN clients ON orders.client_id = clients.client_id JOIN order_items ON orders.order_id = order_items.order_id WHERE orders.is_active = TRUE GROUP BY orders.order_id, clients.client_name, orders.order_date, orders.arrival_date ORDER BY orders.order_date DESC LIMIT ?", [limit]);
        return res.status(200).json(orders);
    }
    
    const [orders] = await db.query("SELECT orders.order_id, clients.client_id, clients.client_name, orders.order_date, orders.arrival_date, SUM(order_items.order_quantity) as total_quantity, SUM(order_items.order_quantity * order_items.order_price) as total_amount, orders.status FROM orders JOIN clients ON orders.client_id = clients.client_id JOIN order_items ON orders.order_id = order_items.order_id WHERE orders.is_active = TRUE GROUP BY orders.order_id, clients.client_name, orders.order_date, orders.arrival_date ORDER BY orders.order_date DESC");
    res.status(200).json(orders);
}

export const getOrder = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [order] = await db.query("SELECT * FROM orders WHERE order_id = ?",[id]);

    if (order.length === 0) {
        const error = new Error(`Order ${id} could not be found`);
        error.status = 404;
        return next(error);
    }

    res.status(200).json(order);
}

export const createOrder = async (req, res, next) => {
    const client_id = parseInt(req.body.client_id);
    const orderDate = new Date();
    const arrivalDate = new Date(req.body.arrival_date);
    const items = req.body.items;

    if (!client_id || !req.body.arrival_date || items.length === 0) {
        const error = new Error("Client, arrival date, and items are required");
        error.status = 400;
        return next(error);
    }
    const orderDateFormatted = orderDate.toISOString().split("T")[0];
    const arrivalDateFormatted = arrivalDate.toISOString().split("T")[0];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const isValidDate = dateRegex.test(req.body.arrival_date);

    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ?",[client_id]);

    if (client.length === 0) {
        const error = new Error(`Client ${client_id} could not be found`);
        error.status = 404;
        return next(error);
    }

    if (!isValidDate) {
        const error = new Error("Dates should be in YYYY-MM-DD format")
        error.status = 400;
        return next(error);
    }

    const newOrder = {
        client_id: client_id,
        order_date: orderDateFormatted,
        arrival_date: arrivalDateFormatted
    }

    const [result] = await db.query(
        "INSERT INTO orders (client_id, order_date, arrival_date) VALUES (?, ?, ?)",
        [newOrder.client_id, newOrder.order_date, newOrder.arrival_date]
    );
    newOrder.order_id = result.insertId;

    let orderTotal = 0;
    for (const item of items) {
        await db.query(
            "INSERT INTO order_items (order_id, product_id, order_quantity, order_price) VALUES (?, ?, ?, ?)",
            [newOrder.order_id, item.product_id, item.order_quantity, item.unit_price]
        );
        await db.query(
            "UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?",
            [item.order_quantity, item.product_id]
        );
        orderTotal += item.order_quantity * item.unit_price;
    }

    await db.query("UPDATE clients SET balance = balance + ? WHERE client_id = ?", [orderTotal, client_id]);

    const [updatedOrders] = await db.query("SELECT * FROM orders");
    res.status(201).json(updatedOrders);
}


export const updateOrder = async (req, res, next) => {
    const id = parseInt(req.params.id);

    const arrivalDate = req.body.arrival_date;
    const status = req.body.status;

    const [order] = await db.query("SELECT * FROM orders WHERE order_id = ?", [id]);

    if (order.length === 0) {
        const error = new Error(`Order ${id} could not be found`);
        error.status = 404;
        return next(error);
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const isValidDate = dateRegex.test(req.body.arrival_date);

    if (!isValidDate) {
        const error = new Error("Dates should be in YYYY-MM-DD format")
        error.status = 400;
        return next(error);
    }

    if (status === "Cancelled" && order[0].status !== "Cancelled") {
        await reverseOrderCommitment(id, order[0].client_id);
    }

    await db.query("UPDATE orders SET arrival_date = ?, status = ? WHERE order_id = ?",
        [arrivalDate, status, id]
    );

    const [orders] = await db.query("SELECT * FROM orders");
    res.status(200).json(orders);
}

export const deleteOrder = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [order] = await db.query("SELECT * FROM orders WHERE order_id = ?",[id]);

    if (order.length === 0) {
        const error = new Error(`Order ${id} could not be found`);
        error.status = 404;
        return next(error);
    }

    if (order[0].status === "Pending") {
        await reverseOrderCommitment(id, order[0].client_id);
    }

    await db.query("UPDATE orders SET is_active = FALSE WHERE order_id = ?", [id]);

    const [orders] = await db.query("SELECT * FROM orders");
    res.status(200).json(orders);
}
