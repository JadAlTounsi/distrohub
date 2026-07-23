import db from "../config/db.js";
import { clearSession } from "../seed-demo.js";
import { DEFAULT_SESSION_ID, SESSION_IDLE_TIMEOUT_MINUTES } from "../config/session.js";

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

export async function purgeIdleSessions() {
    const [staleSessions] = await db.query(
        `SELECT session_id FROM demo_sessions
         WHERE session_id != ? AND last_seen_at < NOW() - INTERVAL ? MINUTE`,
        [DEFAULT_SESSION_ID, SESSION_IDLE_TIMEOUT_MINUTES]
    );

    for (const { session_id } of staleSessions) {
        await clearSession(session_id);
        console.log(`Cleaned up idle demo session ${session_id}`);
    }
}

export function startSessionCleanupJob() {
    setInterval(() => {
        purgeIdleSessions().catch(err => console.error("Session cleanup failed:", err));
    }, CLEANUP_INTERVAL_MS);
}
