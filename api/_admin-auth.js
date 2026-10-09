import crypto from "crypto";
import { normalizeTenant } from "./_tenant.js";

const COOKIE_NAME="uaiso_admin_session";
const SESSION_SECONDS=60*60*12;
function getSecret(){return String(process.env.ADMIN_SESSION_SECRET||process.env.DASHBOARD_PASSWORD||"").trim()}
function sign(v){return crypto.createHmac("sha256",getSecret()).update(v).digest("hex")}
function parseCookies(req){const raw=req.headers?.cookie||"";return Object.fromEntries(raw.split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("=");return i<0?[x,""]:[x.slice(0,i),decodeURIComponent(x.slice(i+1))]}))}
export function createSessionToken(tenant="uai-so"){if(!getSecret())throw new Error("ADMIN_SESSION_SECRET no configurado");const exp=Math.floor(Date.now()/1000)+SESSION_SECONDS;const payload=Buffer.from(JSON.stringify({tenant:normalizeTenant(tenant),exp})).toString("base64url");return payload+"."+sign(payload)}
export function readAdminSession(req){if(!getSecret())return null;const token=parseCookies(req)[COOKIE_NAME];if(!token)return null;const [payload,sig]=String(token).split(".");if(!payload||!sig)return null;const expected=sign(payload),a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;try{const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));if(!Number.isFinite(Number(data.exp))||Number(data.exp)<Math.floor(Date.now()/1000))return null;return {tenant:normalizeTenant(data.tenant||"uai-so"),exp:Number(data.exp)}}catch{return null}}
export function isValidSession(req,tenant="uai-so"){const s=readAdminSession(req);return !!s&&s.tenant===normalizeTenant(tenant)}
export function requireAdmin(req,res,tenant="uai-so"){if(!getSecret()){res.status(503).json({error:"ADMIN_SESSION_SECRET no configurado"});return false}if(!isValidSession(req,tenant)){res.status(401).json({error:"No autorizado"});return false}return true}
export function setSessionCookie(res,token){res.setHeader("Set-Cookie",`${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`)}
export function clearSessionCookie(res){res.setHeader("Set-Cookie",`${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`)}
export function legacyPasswordMatches(candidate){const secret=String(process.env.DASHBOARD_PASSWORD||"").trim();if(!secret)return false;const a=Buffer.from(String(candidate||"")),b=Buffer.from(secret);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
