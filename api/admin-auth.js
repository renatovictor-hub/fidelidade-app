import crypto from "crypto";
import {
    clearSessionCookie,
    createSessionToken,
    isValidSession,
    passwordMatches,
    setSessionCookie
} from "../lib/server/admin-auth.js";
import { handleSuperadmin } from "../lib/server/superadmin.js";
import { getFirebaseAdmin } from "../lib/server/firebase.js";
import { tenantFromRequest } from "../lib/server/tenant-data.js";

const admin=getFirebaseAdmin();

function verifyStoredPassword(candidate,record){
    const salt=String(record?.salt||"");
    const hash=String(record?.hash||"");
    if(!salt||!hash)return false;
    try{
        const derived=crypto.scryptSync(String(candidate||""),Buffer.from(salt,"hex"),32).toString("hex");
        const a=Buffer.from(derived),b=Buffer.from(hash);
        return a.length===b.length&&crypto.timingSafeEqual(a,b);
    }catch{return false}
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const scope = String(req.query?.scope || req.body?.scope || "").trim().toLowerCase();
    if (scope === "superadmin") {
        return handleSuperadmin(req, res);
    }

    const tenant=tenantFromRequest(req);

    if (req.method === "GET") {
        return res.status(200).json({
            authenticated: isValidSession(req,tenant),
            company: tenant
        });
    }

    if (req.method === "POST") {
        if (req.body?.action === "preview_login" && process.env.VERCEL_ENV === "preview") {
            setSessionCookie(res, createSessionToken(tenant));
            return res.status(200).json({ success:true, authenticated:true, preview:true, company:tenant });
        }

        const password = req.body?.password;
        let valid=false;

        if(tenant==="uai-so"){
            if (!process.env.DASHBOARD_PASSWORD) {
                return res.status(503).json({ error: "DASHBOARD_PASSWORD no configurada" });
            }
            valid=passwordMatches(password);
        }else{
            const snap=await admin.database().ref("saas/companies/"+tenant).once("value");
            if(!snap.exists()||snap.val()?.active===false||snap.val()?.status==="suspended"){
                return res.status(404).json({error:"Empresa no encontrada"});
            }
            valid=verifyStoredPassword(password,snap.val()?.adminAccess||{});
        }

        if (!valid) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        setSessionCookie(res, createSessionToken(tenant));
        return res.status(200).json({ success: true, authenticated: true, company:tenant });
    }

    if (req.method === "DELETE") {
        clearSessionCookie(res);
        return res.status(200).json({ success: true, authenticated: false });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
