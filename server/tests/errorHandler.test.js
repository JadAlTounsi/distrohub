import { test } from "node:test";
import assert from "node:assert/strict";
import errorHandler from "../middleware/error.js";
import { mockRes } from "./helpers.js";

test("errorHandler uses the status attached to the error", () => {
    const err = new Error("Not found");
    err.status = 404;
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { msg: "Not found" });
});

test("errorHandler falls back to 500 for unexpected errors", () => {
    const res = mockRes();
    errorHandler(new Error("Boom"), {}, res, () => {});
    assert.equal(res.statusCode, 500);
});
