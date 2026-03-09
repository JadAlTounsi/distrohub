import express from "express";
import dotenv from "dotenv";
import errorHandler from "./middleware/error.js";
import inventory from "./routes/inventory.js";
dotenv.config();

const port = process.env.PORT || 8000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/api/inventory", inventory);

app.use(errorHandler);

app.listen(port, () => console.log(`Server is running on port ${port}`));