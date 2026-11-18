import crypto from "crypto";
import { normalizeCompanyId } from "./tenant-config.js";
import { tenantFromRequest } from "./tenant-data.js";

const COOKIE_NAME = "restaurant_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function getSecret() {
    return String(process.env.DASHBOARD_PASSWORD || "").trim();
}
function sessionSecret(){
    return String(process.env.ADMIN_SESSION_SECRET||getSecret()).trim();
}
function sign(value) {
    return crypto.createHmac("sha256", sessionSecret()).update(value).digest("hex");
}
function parseCookies(req) {
    const raw = req.headers.cookie || "";
    return Object.fromEntries(
        raw.split(";").map(part => part.trim()).filter(Boolean).map(part => {
            const index = part.indexOf("=");
            if (index === -1) return [part, ""];
            return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
        })
    );
}
export function createSessionToken(tenant="uai-so") {
    const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const payload = Buffer.from(JSON.stringify({tenant:normalizeCompanyId(tenant),exp})).toString("base64url");
    return `${payload}.${sign(payload)}`;
}
export function readAdminSession(req) {
    const secret = getSecret();
    if (!secret) return null;
    const token = parseCookies(req)[COOKIE_NAME];
    if (!token) return null;
    const [payload, signature] = String(token).split(".");
    if (!payload || !signature) return null;
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    try {
        const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
        if(!Number.isFinite(Number(data.exp))||Number(data.exp)<Math.floor(Date.now()/1000))return null;
        return {tenant:normalizeCompanyId(data.tenant||"uai-so"),exp:Number(data.exp),legacy:false};
    } catch (_) {
        const expires=Number(payload);
        if(!Number.isFinite(expires)||expires<Math.floor(Date.now()/1000))return null;
        return {tenant:"uai-so",exp:expires,legacy:true};
    }
}
export function isValidSession(req,tenant=tenantFromRequest(req)) {
    const session=readAdminSession(req);
    return !!session && session.tenant===normalizeCompanyId(tenant);
}
export function requireAdmin(req, res, tenant=tenantFromRequest(req)) {
    if (!getSecret()) {
        res.status(503).json({ error: "DASHBOARD_PASSWORD no configurada" });
        return false;
    }
    if (!isValidSession(req,tenant)) {
        res.status(401).json({ error: "No autorizado" });
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
