import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import db from "../config/db.js";
import { createProduct, getProduct } from "../controllers/inventoryController.js";
import { mockReq, mockRes, mockNext } from "./helpers.js";

const realQuery = db.query;
afterEach(() => {
    db.query = realQuery;
});

test("createProduct rejects a product with a missing price (400)", async () => {
    const next = mockNext();
    await createProduct(mockReq({ body: { name: "Rice", quantity: "10", unit: "kg" } }), mockRes(), next);
    assert.equal(next.error.status, 400);
});

test("getProduct returns 404 for a product that does not exist", async () => {
    db.query = async () => [[]];
    const next = mockNext();
    await getProduct(mockReq({ params: { id: "999" } }), mockRes(), next);
    assert.equal(next.error.status, 404);
});
