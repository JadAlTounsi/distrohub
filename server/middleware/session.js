import { randomUUID } from "crypto";
import { claimSession, seedForSession, touchSession } from "../seed-demo.js";
import { DEFAULT_SESSION_ID, SESSION_COOKIE_NAME, DEMO_SESSIONS_DISABLED } from "../config/session.js";

const isProduction = process.env.NODE_ENV === "production";

function parseCookies(header) {
    const cookies = {};
    if (!header) return cookies;
    for (const part of header.split(";")) {
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        cookies[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    }
    return cookies;
}

export default async function sessionMiddleware(req, res, next) {
    if (DEMO_SESSIONS_DISABLED) {
        req.sessionId = DEFAULT_SESSION_ID;
        return next();
    }

    try {
        const cookies = parseCookies(req.headers.cookie);
        const existingCookie = cookies[SESSION_COOKIE_NAME];
        const sessionId = existingCookie || randomUUID();

        const isNewSession = await claimSession(sessionId);
        if (isNewSession) {
            await seedForSession(sessionId);
        } else {
            await touchSession(sessionId);
        }

        if (!existingCookie) {
            let sameSite;
            if (isProduction) {
                sameSite = "none";
            } else {
                sameSite = "lax";
            }

            res.cookie(SESSION_COOKIE_NAME, sessionId, {
                httpOnly: true,
                sameSite: sameSite,
                secure: isProduction
            });
        }

        req.sessionId = sessionId;
        next();
    } catch (err) {
        next(err);
    }
}
