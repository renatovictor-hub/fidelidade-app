import crypto from "crypto";

const COOKIE_NAME = "uaiso_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function getSecret() {
    return String(process.env.DASHBOARD_PASSWORD || "").trim();
}

function sign(value) {
    return crypto
        .createHmac("sha256", getSecret())
        .update(value)
        .digest("hex");
}

function parseCookies(req) {
    const raw = req.headers.cookie || "";
    return Object.fromEntries(
        raw
            .split(";")
            .map(part => part.trim())
            .filter(Boolean)
            .map(part => {
                const index = part.indexOf("=");
                if (index === -1) return [part, ""];
                return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
            })
    );
}

export function createSessionToken() {
    const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const payload = String(expires);
    return `${payload}.${sign(payload)}`;
}

export function isValidSession(req) {
    const secret = getSecret();
    if (!secret) return false;

    const token = parseCookies(req)[COOKIE_NAME];
    if (!token) return false;

    const [expiresRaw, signature] = token.split(".");
    if (!expiresRaw || !signature) return false;

    const expires = Number(expiresRaw);
    if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) {
        return false;
    }

    const expected = sign(expiresRaw);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

export function requireAdmin(req, res) {
    if (!getSecret()) {
        res.status(503).json({
            error: "DASHBOARD_PASSWORD no configurada"
        });
        return false;
    }

    if (!isValidSession(req)) {
        res.status(401).json({
            error: "No autorizado"
        });
        return false;
    }

    return true;
}

export function setSessionCookie(res, token) {
    res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`
    );
}

export function clearSessionCookie(res) {
    res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
    );
}

export function passwordMatches(candidate) {
    const secret = getSecret();
    if (!secret) return false;

    const a = Buffer.from(String(candidate || ""));
    const b = Buffer.from(secret);

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}
