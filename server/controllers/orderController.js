import db from "../config/db.js";

export const getOrders = async (req, res) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        const [orders] = await db.query("SELECT orders.order_id, clients.client_name, orders.order_date, orders.arrival_date, SUM(order_items.order_quantity) as total_quantity, SUM(order_items.order_quantity * order_items.order_price) as total_amount, orders.status FROM orders JOIN clients ON orders.client_id = clients.client_id JOIN order_items ON orders.order_id = order_items.order_id WHERE is_active = TRUE GROUP BY orders.order_id, clients.client_name, orders.order_date, orders.arrival_date ORDER BY orders.order_date DESC LIMIT ?", [limit]);
        return res.status(200).json(orders);
    }
    
    const [orders] = await db.query("SELECT orders.order_id, clients.client_name, orders.order_date, orders.arrival_date, SUM(order_items.order_quantity) as total_quantity, SUM(order_items.order_quantity * order_items.order_price) as total_amount, orders.status FROM orders JOIN clients ON orders.client_id = clients.client_id JOIN order_items ON orders.order_id = order_items.order_id WHERE is_active = TRUE GROUP BY orders.order_id, clients.client_name, orders.order_date, orders.arrival_date ORDER BY orders.order_date DESC");
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
    const orderDate = new Date(req.body.order_date);
    const arrivalDate = new Date(req.body.arrival_date);

    const orderDateFormatted = orderDate.toISOString().split("T")[0];
    const arrivalDateFormatted = arrivalDate.toISOString().split("T")[0];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const isValidDate = dateRegex.test(req.body.order_date) && dateRegex.test(req.body.arrival_date);

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

    await db.query("UPDATE orders SET is_active = FALSE WHERE order_id = ?", [id]);

    const [orders] = await db.query("SELECT * FROM orders");
    res.status(200).json(orders);
}
