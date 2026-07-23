import mysql2 from "mysql2/promise";

const dbName = process.env.AZURE_DB_NAME || "distrohub";

const connection = await mysql2.createConnection({
    host: process.env.AZURE_DB_HOST,
    user: process.env.AZURE_DB_USER,
    password: process.env.AZURE_DB_PASSWORD,
    ssl: { rejectUnauthorized: true }
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
console.log(`Database '${dbName}' ready on ${process.env.AZURE_DB_HOST}.`);

await connection.end();
