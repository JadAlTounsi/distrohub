import db from "../config/db.js";

export const getClients = async (req, res) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0) {
        const [clients] = await db.query("SELECT * FROM clients LIMIT ?",[limit]);
        return res.status(200).json(clients);
    }

    const [clients] = await db.query("SELECT * FROM clients")
    res.status(200).json(clients);
}

export const getClient = async(req, res, next) => {
    const id = parseInt(req.params.id);
    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ?",[id]);

    if (client.length === 0) {
        const error = new Error(`Client with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }

    res.status(200).json(client);
}

export const createClient = async(req, res, next) => {
    const newClient = {
        client_name: req.body.name,
        phone: req.body.phone,
        balance: parseFloat(req.body.balance)
    };

    if (!newClient.client_name || newClient.phone === undefined || newClient.balance === undefined) {
        const error = new Error("Name, phone, or balance is blank");
        error.status = 400;
        return next(Error);
    }

    const [result] = await db.query(
        "INSERT INTO clients (client_name, phone, balance) VALUES (?, ?, ?)",
        [newClient.client_name, newClient.phone, newClient.balance]
    );
    newClient.client_id = result.insertId;

    const [updatedClients] = await db.query("SELECT * FROM clients");
    res.status(201).json(updatedClients);
}

export const updateClient = async(req, res, next) => {
    const id = parseInt(req.params.id);
    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ?", [id]);

    if (client.length === 0) {
        const error = new Error(`Client with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }

    await db.query("UPDATE clients SET client_name = ?, phone = ?, balance = ? WHERE client_id = ?",
        [req.body.name, req.body.phone, parseFloat(req.body.balance), id]
    );
    const [updatedClients] = await db.query("SELECT * FROM clients");
    res.status(200).json(updatedClients);
}

export const deleteClient = async(req, res, next) => {
    const id = parseInt(req.params.id);
    const [client] = await db.query("SELECT * FROM clients WHERE client_id = ?", [id]);

    if (client.length === 0) {
        const error = new Error(`Client with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }

    await db.query("DELETE FROM clients WHERE client_id = ?", [id]);
    const [updatedClients] = await db.query("SELECT * FROM clients");
    res.status(200).json(updatedClients);
}