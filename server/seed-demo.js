import { fileURLToPath } from "url";
import db from "./config/db.js";
import { DEFAULT_SESSION_ID } from "./config/session.js";

const DEMO_CLIENTS = [
    { client_name: "Maple Street Diner", phone: "902-555-1042" },
    { client_name: "Golden Fork Bistro", phone: "902-555-2087" },
    { client_name: "Riverside Pizza Co.", phone: "902-555-3311" },
    { client_name: "Sunrise Bakery", phone: "902-555-4456" },
    { client_name: "The Corner Grocer", phone: "902-555-5502" },
    { client_name: "Blue Harbor Seafood", phone: "902-555-6678" },
    { client_name: "Copper Kettle Cafe", phone: "902-555-7734" },
    { client_name: "Green Valley Market", phone: "902-555-8890" },
    { client_name: "Northside Deli", phone: "902-555-9945" },
    { client_name: "Pine & Poppy Catering", phone: "902-555-1120" }
];

const DEMO_INVENTORY = [
    { name: "All-Purpose Flour 25kg", quantity: 300, unit: "bags", price: 28.99 },
    { name: "Vegetable Oil 20L", quantity: 150, unit: "jugs", price: 54.99 },
    { name: "Granulated Sugar 25kg", quantity: 200, unit: "bags", price: 22.49 },
    { name: "Canned Diced Tomatoes 800g", quantity: 400, unit: "cases", price: 34.99 },
    { name: "Ground Coffee 1kg", quantity: 250, unit: "bags", price: 14.99 },
    { name: "Whole Milk 4L", quantity: 220, unit: "jugs", price: 6.49 },
    { name: "Cheddar Cheese Block 2kg", quantity: 180, unit: "blocks", price: 18.99 },
    { name: "Chicken Breast 5kg", quantity: 200, unit: "cases", price: 42.99 },
    { name: "Frozen French Fries 2.5kg", quantity: 260, unit: "bags", price: 9.99 },
    { name: "Ketchup 3L", quantity: 190, unit: "jugs", price: 11.99 },
    { name: "Paper Napkins (pack of 500)", quantity: 300, unit: "packs", price: 7.99 },
    { name: "Disposable Cups 16oz (sleeve of 50)", quantity: 260, unit: "sleeves", price: 5.99 },
    { name: "Paper Towels (case of 12)", quantity: 210, unit: "cases", price: 24.99 },
    { name: "Dish Soap 5L", quantity: 200, unit: "jugs", price: 16.99 },
    { name: "Bottled Water 500ml (case of 24)", quantity: 240, unit: "cases", price: 8.99 },
    { name: "White Rice 20kg", quantity: 200, unit: "bags", price: 29.99 }
];

const NUM_ORDERS = 220;
const DAYS_BACK = 420;

function randomStatus() {
    const r = Math.random();
    if (r < 0.78) return "Delivered";
    if (r < 0.90) return "Cancelled";
    return "Pending";
}

function randomDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date;
}

function toDateString(date) {
    return date.toISOString().split("T")[0];
}

async function columnExists(table, column) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows[0].cnt > 0;
}

async function addSessionIdColumnIfMissing(table) {
    if (await columnExists(table, "session_id")) return;
    await db.query(
        `ALTER TABLE ${table}
         ADD COLUMN session_id VARCHAR(36) NOT NULL DEFAULT '${DEFAULT_SESSION_ID}',
         ADD INDEX session_id (session_id)`
    );
}

export async function ensureSchema() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS demo_sessions (
            session_id VARCHAR(36) NOT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS clients (
            client_id INT NOT NULL AUTO_INCREMENT,
            session_id VARCHAR(36) NOT NULL,
            client_name VARCHAR(255) NOT NULL,
            phone VARCHAR(25) NOT NULL,
            balance DECIMAL(10,2) DEFAULT '0.00',
            join_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            is_active TINYINT(1) DEFAULT '1',
            PRIMARY KEY (client_id),
            KEY session_id (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS inventory (
            product_id INT NOT NULL AUTO_INCREMENT,
            session_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            quantity INT NOT NULL,
            unit VARCHAR(50) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            is_active TINYINT(1) DEFAULT '1',
            PRIMARY KEY (product_id),
            KEY session_id (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS orders (
            order_id INT NOT NULL AUTO_INCREMENT,
            session_id VARCHAR(36) NOT NULL,
            client_id INT NOT NULL,
            order_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            arrival_date DATE NOT NULL,
            status VARCHAR(20) DEFAULT 'Pending',
            is_active TINYINT(1) DEFAULT '1',
            PRIMARY KEY (order_id),
            KEY session_id (session_id),
            KEY client_id (client_id),
            CONSTRAINT orders_ibfk_1 FOREIGN KEY (client_id) REFERENCES clients (client_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS order_items (
            order_items_id INT NOT NULL AUTO_INCREMENT,
            session_id VARCHAR(36) NOT NULL,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            order_quantity INT NOT NULL,
            order_price DECIMAL(10,2) DEFAULT NULL,
            PRIMARY KEY (order_items_id),
            KEY session_id (session_id),
            KEY order_id (order_id),
            KEY product_id (product_id),
            CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (order_id),
            CONSTRAINT order_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES inventory (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await addSessionIdColumnIfMissing("clients");
    await addSessionIdColumnIfMissing("inventory");
    await addSessionIdColumnIfMissing("orders");
    await addSessionIdColumnIfMissing("order_items");
}

export async function clearSession(sessionId) {
    await db.query(
        `DELETE oi FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         WHERE o.session_id = ?`,
        [sessionId]
    );
    await db.query("DELETE FROM orders WHERE session_id = ?", [sessionId]);
    await db.query("DELETE FROM clients WHERE session_id = ?", [sessionId]);
    await db.query("DELETE FROM inventory WHERE session_id = ?", [sessionId]);
    await db.query("DELETE FROM demo_sessions WHERE session_id = ?", [sessionId]);
}

export async function claimSession(sessionId) {
    try {
        await db.query("INSERT INTO demo_sessions (session_id) VALUES (?)", [sessionId]);
        return true;
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return false;
        }
        throw err;
    }
}

export async function touchSession(sessionId) {
    await db.query(
        "UPDATE demo_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE session_id = ?",
        [sessionId]
    );
}

export async function seedForSession(sessionId) {
    const clientIds = [];
    for (const client of DEMO_CLIENTS) {
        const [result] = await db.query(
            "INSERT INTO clients (session_id, client_name, phone) VALUES (?, ?, ?)",
            [sessionId, client.client_name, client.phone]
        );
        clientIds.push(result.insertId);
    }

    const inventoryItems = [];
    const startingStock = new Map();
    for (const item of DEMO_INVENTORY) {
        const [result] = await db.query(
            "INSERT INTO inventory (session_id, name, quantity, unit, price) VALUES (?, ?, ?, ?, ?)",
            [sessionId, item.name, item.quantity, item.unit, item.price]
        );
        inventoryItems.push({ product_id: result.insertId, price: item.price });
        startingStock.set(result.insertId, item.quantity);
    }

    const remainingStock = new Map(startingStock);
    const clientBalances = new Map(clientIds.map(id => [id, 0]));

    const generatedOrders = [];
    for (let i = 0; i < NUM_ORDERS; i++) {
        generatedOrders.push({
            client_id: clientIds[Math.floor(Math.random() * clientIds.length)],
            order_date: randomDate(DAYS_BACK),
            status: randomStatus()
        });
    }
    generatedOrders.sort((a, b) => a.order_date - b.order_date);

    for (const order of generatedOrders) {
        const arrivalDate = new Date(order.order_date);
        arrivalDate.setDate(arrivalDate.getDate() + 3 + Math.floor(Math.random() * 11));

        const [orderResult] = await db.query(
            "INSERT INTO orders (session_id, client_id, order_date, arrival_date, status, is_active) VALUES (?, ?, ?, ?, ?, 1)",
            [sessionId, order.client_id, toDateString(order.order_date), toDateString(arrivalDate), order.status]
        );
        const orderId = orderResult.insertId;

        const numItems = 1 + Math.floor(Math.random() * 3);
        const chosenItems = [...inventoryItems].sort(() => Math.random() - 0.5).slice(0, numItems);

        let orderTotal = 0;
        for (const item of chosenItems) {
            let quantity = 1 + Math.floor(Math.random() * 15);

            if (order.status === "Cancelled") {
                quantity = Math.min(quantity, startingStock.get(item.product_id));
            } else {
                const available = remainingStock.get(item.product_id);
                quantity = Math.min(quantity, available);
                if (quantity <= 0) {
                    continue;
                }
                remainingStock.set(item.product_id, available - quantity);
                orderTotal += quantity * item.price;
            }

            await db.query(
                "INSERT INTO order_items (session_id, order_id, product_id, order_quantity, order_price) VALUES (?, ?, ?, ?, ?)",
                [sessionId, orderId, item.product_id, quantity, item.price]
            );
        }

        if (order.status !== "Cancelled") {
            clientBalances.set(order.client_id, clientBalances.get(order.client_id) + orderTotal);
        }
    }

    for (const [clientId, balance] of clientBalances) {
        await db.query("UPDATE clients SET balance = ? WHERE client_id = ?", [balance.toFixed(2), clientId]);
    }
    for (const [productId, quantity] of remainingStock) {
        await db.query("UPDATE inventory SET quantity = ? WHERE product_id = ?", [quantity, productId]);
    }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
    (async () => {
        try {
            console.log("Ensuring schema...");
            await ensureSchema();
            console.log(`Clearing existing '${DEFAULT_SESSION_ID}' session data...`);
            await clearSession(DEFAULT_SESSION_ID);
            console.log(`Seeding '${DEFAULT_SESSION_ID}' session...`);
            await seedForSession(DEFAULT_SESSION_ID);
            console.log(`Done. ${DEMO_CLIENTS.length} clients, ${DEMO_INVENTORY.length} products, ${NUM_ORDERS} orders seeded for '${DEFAULT_SESSION_ID}'.`);
            process.exit(0);
        } catch (err) {
            console.error("Seeding failed:", err);
            process.exit(1);
        }
    })();
}
