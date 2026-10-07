import admin from "firebase-admin";
import crypto from "crypto";
import { clearSessionCookie, createSessionToken, isValidSession, legacyPasswordMatches, setSessionCookie } from "./_admin-auth.js";
import { normalizeTenant } from "./_tenant.js";

if(!admin.apps.length){admin.initializeApp({credential:admin.credential.cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,"\n")}),databaseURL:process.env.FIREBASE_DATABASE_URL||"https://fidelidade-app-9671c-default-rtdb.firebaseio.com"})}
function verifyStored(password,record){const salt=String(record?.salt||""),hash=String(record?.hash||"");if(!salt||!hash)return false;const derived=crypto.scryptSync(String(password||""),Buffer.from(salt,"hex"),32).toString("hex");const a=Buffer.from(derived),b=Buffer.from(hash);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const tenant=normalizeTenant(req.method==="POST"?req.body?.company:req.query?.company);
 if(req.method==="GET")return res.status(200).json({authenticated:isValidSession(req,tenant),company:tenant});
 if(req.method==="POST"){
   const password=req.body?.password;let ok=false;
   if(tenant==="uai-so")ok=legacyPasswordMatches(password);
   else{const snap=await admin.database().ref(`saas/companies/${tenant}/adminAccess`).once("value");ok=verifyStored(password,snap.val()||{})}
   if(!ok)return res.status(401).json({error:"Contraseña incorrecta"});
   setSessionCookie(res,createSessionToken(tenant));return res.status(200).json({success:true,authenticated:true,company:tenant});
 }
 if(req.method==="DELETE"){clearSessionCookie(res);return res.status(200).json({success:true,authenticated:false})}
 return res.status(405).json({error:"Method not allowed"});
}