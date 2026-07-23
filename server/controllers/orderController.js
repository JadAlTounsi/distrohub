import db from "../config/db.js";

async function reverseOrderCommitment(conn, orderId, clientId, sessionId) {
    const [items] = await conn.query("SELECT * FROM order_items WHERE order_id = ? AND session_id = ?", [orderId, sessionId]);

    for (const item of items) {
        await conn.query(
            "UPDATE inventory SET quantity = quantity + ? WHERE product_id = ? AND session_id = ?",
            [item.order_quantity, item.product_id, sessionId]
        );
    }

    const [totalRows] = await conn.query(
        "SELECT COALESCE(SUM(order_quantity * order_price), 0) AS total FROM order_items WHERE order_id = ? AND session_id = ?",
        [orderId, sessionId]
    );

    await conn.query("UPDATE clients SET balance = balance - ? WHERE client_id = ? AND session_id = ?", [totalRows[0].total, clientId, sessionId]);
}

export const getOrders = async (req, res) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        const [orders] = await db.query("SELECT orders.order_id, clients.client_id, clients.client_name, orders.order_date, orders.arrival_date, SUM(order_items.order_quantity) as total_quantity, SUM(order_items.order_quantity * order_items.order_price) as total_amount, orders.status FROM orders JOIN clients ON orders.client_id = clients.client_id JOIN order_items ON orders.order_id = order_items.order_id WHERE orders.is_active = TRUE AND orders.session_id = ? GROUP BY orders.order_id, clients.client_name, orders.order_date, orders.arrival_date ORDER BY orders.order_date DESC LIMIT ?", [req.sessionId, limit]);
        return res.status(200).json(orders);
    }

    const [orders] = await db.query("SELECT orders.order_id, clients.client_id, clients.client_name, orders.order_date, orders.arrival_date, SUM(order_items.order_quantity) as total_quantity, SUM(order_items.order_quantity * order_items.order_price) as total_amount, orders.status FROM orders JOIN clients ON orders.client_id = clients.client_id JOIN order_items ON orders.order_id = order_items.order_id WHERE orders.is_active = TRUE AND orders.session_id = ? GROUP BY orders.order_id, clients.client_name, orders.order_date, orders.arrival_date ORDER BY orders.order_date DESC", [req.sessionId]);
    res.status(200).json(orders);
}

export const getOrder = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [order] = await db.query("SELECT * FROM orders WHERE order_id = ? AND session_id = ?",[id, req.sessionId]);

    if (order.length === 0) {
        const error = new Error(`Order ${id} could not be found`);
        error.status = 404;
        return next(error);
    }

    res.status(200).json(order);
}

export const createOrder = async (req, res, next) => {
    const client_id = parseInt(req.body.client_id);
    const items = req.body.items;

    if (!client_id || !req.body.arrival_date || items.length === 0) {
        const error = new Error("Client, arrival date, and items are required");
        error.status = 400;
        return next(error);
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const isValidDate = dateRegex.test(req.body.arrival_date);
    const arrivalDate = new Date(req.body.arrival_date);

    if (!isValidDate || Number.isNaN(arrivalDate.getTime())) {
        const error = new Error("Dates should be in YYYY-MM-DD format")
        error.status = 400;
        return next(error);
    }

    const orderDate = new Date();
    const orderDateFormatted = orderDate.toISOString().split("T")[0];
    const arrivalDateFormatted = arrivalDate.toISOString().split("T")[0];

    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ? AND session_id = ?",[client_id, req.sessionId]);

    if (client.length === 0) {
        const error = new Error(`Client ${client_id} could not be found`);
        error.status = 404;
        return next(error);
    }

    const newOrder = {
        client_id: client_id,
        order_date: orderDateFormatted,
        arrival_date: arrivalDateFormatted
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            "INSERT INTO orders (session_id, client_id, order_date, arrival_date) VALUES (?, ?, ?, ?)",
            [req.sessionId, newOrder.client_id, newOrder.order_date, newOrder.arrival_date]
        );
        newOrder.order_id = result.insertId;

        let orderTotal = 0;
        for (const item of items) {
            const quantity = parseInt(item.order_quantity);
            if (!quantity || quantity <= 0) {
                const error = new Error("Item quantity must be a positive number");
                error.status = 400;
                throw error;
            }

            const [productRows] = await conn.query(
                "SELECT name, quantity FROM inventory WHERE product_id = ? AND session_id = ? FOR UPDATE",
                [item.product_id, req.sessionId]
            );

            if (productRows.length === 0) {
                const error = new Error(`Product ${item.product_id} could not be found`);
                error.status = 404;
                throw error;
            }

            if (productRows[0].quantity < quantity) {
                const error = new Error(
                    `Not enough stock for ${productRows[0].name} (requested ${quantity}, only ${productRows[0].quantity} available)`
                );
                error.status = 409;
                throw error;
            }

            await conn.query(
                "INSERT INTO order_items (session_id, order_id, product_id, order_quantity, order_price) VALUES (?, ?, ?, ?, ?)",
                [req.sessionId, newOrder.order_id, item.product_id, quantity, item.unit_price]
            );
            await conn.query(
                "UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND session_id = ?",
                [quantity, item.product_id, req.sessionId]
            );
            orderTotal += quantity * item.unit_price;
        }

        await conn.query("UPDATE clients SET balance = balance + ? WHERE client_id = ? AND session_id = ?", [orderTotal, client_id, req.sessionId]);

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        return next(error);
    } finally {
        conn.release();
    }

    const [updatedOrders] = await db.query("SELECT * FROM orders WHERE session_id = ?", [req.sessionId]);
    res.status(201).json(updatedOrders);
}


export const updateOrder = async (req, res, next) => {
    const id = parseInt(req.params.id);

    const arrivalDate = req.body.arrival_date;
    const status = req.body.status;

    const [order] = await db.query("SELECT * FROM orders WHERE order_id = ? AND session_id = ?", [id, req.sessionId]);

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

    const validStatuses = ["Pending", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
        const error = new Error("Status must be one of Pending, Delivered, or Cancelled");
        error.status = 400;
        return next(error);
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        if (status === "Cancelled" && order[0].status !== "Cancelled") {
            await reverseOrderCommitment(conn, id, order[0].client_id, req.sessionId);
        }

        await conn.query("UPDATE orders SET arrival_date = ?, status = ? WHERE order_id = ? AND session_id = ?",
            [arrivalDate, status, id, req.sessionId]
        );

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        return next(error);
    } finally {
        conn.release();
    }

    const [orders] = await db.query("SELECT * FROM orders WHERE session_id = ?", [req.sessionId]);
    res.status(200).json(orders);
}

export const deleteOrder = async (req, res, next) => {
    const id = parseInt(req.params.id);
    const [order] = await db.query("SELECT * FROM orders WHERE order_id = ? AND session_id = ?",[id, req.sessionId]);

    if (order.length === 0) {
        const error = new Error(`Order ${id} could not be found`);
        error.status = 404;
        return next(error);
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        if (order[0].status === "Pending") {
            await reverseOrderCommitment(conn, id, order[0].client_id, req.sessionId);
        }

        await conn.query("UPDATE orders SET is_active = FALSE WHERE order_id = ? AND session_id = ?", [id, req.sessionId]);

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        return next(error);
    } finally {
        conn.release();
    }

    const [orders] = await db.query("SELECT * FROM orders WHERE session_id = ?", [req.sessionId]);
    res.status(200).json(orders);
}
