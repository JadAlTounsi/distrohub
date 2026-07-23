import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import errorHandler from "./middleware/error.js";
import sessionMiddleware from "./middleware/session.js";
import { ensureSchema } from "./seed-demo.js";
import { startSessionCleanupJob } from "./jobs/cleanupSessions.js";
import { DEMO_SESSIONS_DISABLED } from "./config/session.js";
import inventory from "./routes/inventory.js";
import clients from "./routes/clients.js";
import orders from "./routes/orders.js";
import session from "./routes/session.js";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5501";

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"]
        }
    }
}));
app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
});

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.static(path.join(__dirname, "public")));

const apiRouter = express.Router();
apiRouter.use(sessionMiddleware);
apiRouter.use("/session", session);
apiRouter.use("/inventory", inventory);
apiRouter.use("/clients", clients);
apiRouter.use("/orders", orders);

app.use("/api", apiRouter);
app.use(errorHandler);

ensureSchema()
    .then(() => {
        if (!DEMO_SESSIONS_DISABLED) {
            startSessionCleanupJob();
        }
        app.listen(port, () => console.log(`Server is running on port ${port}`));
    })
    .catch(err => {
        console.error("Failed to set up database schema:", err);
        process.exit(1);
    });