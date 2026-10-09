import {
    clearSessionCookie,
    createSessionToken,
    isValidSession,
    passwordMatches,
    setSessionCookie
} from "../lib/server/admin-auth.js";
import { handleSuperadmin } from "../lib/server/superadmin.js";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const scope = String(req.query?.scope || req.body?.scope || "").trim().toLowerCase();
    if (scope === "superadmin") {
        return handleSuperadmin(req, res);
    }

    if (req.method === "GET") {
        return res.status(200).json({
            authenticated: isValidSession(req)
        });
    }

    if (req.method === "POST") {
        if (req.body?.action === "preview_login" && process.env.VERCEL_ENV === "preview") {
            setSessionCookie(res, createSessionToken());
            return res.status(200).json({ success:true, authenticated:true, preview:true });
        }
        const password = req.body?.password;

        if (!process.env.DASHBOARD_PASSWORD) {
            return res.status(503).json({
                error: "DASHBOARD_PASSWORD no configurada"
            });
        }

        if (!passwordMatches(password)) {
            return res.status(401).json({
                error: "Contraseña incorrecta"
            });
        }

        setSessionCookie(res, createSessionToken());

        return res.status(200).json({
            success: true,
            authenticated: true
        });
    }

    if (req.method === "DELETE") {
        clearSessionCookie(res);
        return res.status(200).json({
            success: true,
            authenticated: false
        });
    }

    return res.status(405).json({
        error: "Method not allowed"
    });
}
