import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import db from "../config/db.js";
import { createOrder, getOrder } from "../controllers/orderController.js";
import { mockReq, mockRes, mockNext, mockConnection } from "./helpers.js";

const realQuery = db.query;
const realGetConnection = db.getConnection;

beforeEach(() => {
    db.query = realQuery;
    db.getConnection = realGetConnection;
});

const validBody = {
    client_id: 1,
    arrival_date: "2026-10-15",
    items: [{ product_id: 7, order_quantity: 5, unit_price: 2.5 }]
};

test("createOrder rejects a request with no items (400)", async () => {
    const next = mockNext();
    await createOrder(mockReq({ body: { ...validBody, items: [] } }), mockRes(), next);
    assert.equal(next.error.status, 400);
});

test("createOrder rejects a badly formatted arrival date (400)", async () => {
    const next = mockNext();
    await createOrder(mockReq({ body: { ...validBody, arrival_date: "15/10/2026" } }), mockRes(), next);
    assert.equal(next.error.status, 400);
});

test("createOrder returns 404 when the client does not exist", async () => {
    db.query = async () => [[]];
    const next = mockNext();
    await createOrder(mockReq({ body: validBody }), mockRes(), next);
    assert.equal(next.error.status, 404);
});

test("createOrder blocks overselling: 409 and the transaction is rolled back", async () => {
    db.query = async () => [[{ client_id: 1 }]];
    const conn = mockConnection((sql) => {
        if (sql.startsWith("INSERT INTO orders")) return [{ insertId: 42 }];
        if (sql.startsWith("SELECT name, quantity")) return [[{ name: "Rice", quantity: 2 }]]; // only 2 in stock
        return [{}];
    });
    db.getConnection = async () => conn;

    const next = mockNext();
    await createOrder(mockReq({ body: validBody }), mockRes(), next); // asks for 5

    assert.equal(next.error.status, 409);
    assert.equal(conn.rolledBack, true);
    assert.equal(conn.committed, false);
    assert.equal(conn.released, true);
    assert.ok(!conn.queries.some((q) => q.startsWith("UPDATE inventory")), "stock must not be deducted");
});

test("createOrder rejects a non-positive quantity and rolls back", async () => {
    db.query = async () => [[{ client_id: 1 }]];
    const conn = mockConnection((sql) => (sql.startsWith("INSERT INTO orders") ? [{ insertId: 42 }] : [{}]));
    db.getConnection = async () => conn;

    const body = { ...validBody, items: [{ product_id: 7, order_quantity: -3, unit_price: 2.5 }] };
    const next = mockNext();
    await createOrder(mockReq({ body }), mockRes(), next);

    assert.equal(next.error.status, 400);
    assert.equal(conn.rolledBack, true);
});

test("createOrder commits, deducts stock, and returns 201 for a valid order", async () => {
    db.query = async () => [[{ client_id: 1 }]];
    const conn = mockConnection((sql) => {
        if (sql.startsWith("INSERT INTO orders")) return [{ insertId: 42 }];
        if (sql.startsWith("SELECT name, quantity")) return [[{ name: "Rice", quantity: 100 }]];
        return [{}];
    });
    db.getConnection = async () => conn;

    const res = mockRes();
    await createOrder(mockReq({ body: validBody }), res, mockNext());

    assert.equal(res.statusCode, 201);
    assert.equal(conn.committed, true);
    assert.equal(conn.rolledBack, false);
    assert.ok(conn.queries.some((q) => q.startsWith("UPDATE inventory")), "stock should be deducted");
});

test("getOrder returns 404 for an order that does not exist", async () => {
    db.query = async () => [[]];
    const next = mockNext();
    await getOrder(mockReq({ params: { id: "999" } }), mockRes(), next);
    assert.equal(next.error.status, 404);
});
