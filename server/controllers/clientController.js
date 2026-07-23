import db from "../config/db.js";

export const getClients = async (req, res) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        const [clients] = await db.query("SELECT * FROM clients WHERE is_active = TRUE AND session_id = ? LIMIT ?",[req.sessionId, limit]);
        return res.status(200).json(clients);
    }

    const [clients] = await db.query("SELECT * FROM clients WHERE is_active = TRUE AND session_id = ?", [req.sessionId])
    res.status(200).json(clients);
}

export const getClient = async(req, res, next) => {
    const id = parseInt(req.params.id);
    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ? AND session_id = ?",[id, req.sessionId]);

    if (client.length === 0) {
        const error = new Error(`Client with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }

    res.status(200).json(client);
}

export const createClient = async(req, res, next) => {
    const newClient = {
        client_name: req.body.client_name,
        phone: req.body.phone,
        join_date: new Date()
    };

    if (!newClient.client_name || newClient.phone === undefined) {
        const error = new Error("Client name and phone are required");
        error.status = 400;
        return next(error);
    }

    const [result] = await db.query(
        "INSERT INTO clients (session_id, client_name, phone, join_date) VALUES (?, ?, ?, ?)",
        [req.sessionId, newClient.client_name, newClient.phone, newClient.join_date]
    );
    newClient.client_id = result.insertId;

    const [updatedClients] = await db.query("SELECT * FROM clients WHERE session_id = ?", [req.sessionId]);
    res.status(201).json(updatedClients);
}

export const updateClient = async(req, res, next) => {
    const id = parseInt(req.params.id);

    const clientName = req.body.client_name;
    const clientPhone = req.body.phone;

    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ? AND session_id = ?", [id, req.sessionId]);

    if (client.length === 0) {
        const error = new Error(`Client with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }

    await db.query("UPDATE clients SET client_name = ?, phone = ? WHERE client_id = ? AND session_id = ?",
        [clientName, clientPhone, id, req.sessionId]
    );
    const [updatedClients] = await db.query("SELECT * FROM clients WHERE session_id = ?", [req.sessionId]);
    res.status(200).json(updatedClients);
}

export const deleteClient = async(req, res, next) => {
    const id = parseInt(req.params.id);
    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ? AND session_id = ?", [id, req.sessionId]);

    if (client.length === 0) {
        const error = new Error(`Client with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }

    const[orders] = await db.query("SELECT * FROM orders WHERE client_id = ? AND is_active = TRUE AND status = 'Pending' AND session_id = ?", [id, req.sessionId]);
    if (orders.length === 0) {
        await db.query("UPDATE clients SET is_active = FALSE WHERE client_id = ? AND session_id = ?", [id, req.sessionId]);
    } else {
        const error = new Error("Client has an outgoing order");
        error.status = 409;
        return next(error);
    }
    const [updatedClients] = await db.query("SELECT * FROM clients WHERE session_id = ?", [req.sessionId]);
    res.status(200).json(updatedClients);
}
