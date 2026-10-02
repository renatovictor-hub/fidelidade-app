import crypto from "crypto";

const COOKIE_NAME="uaiso_client_session";
const SESSION_SECONDS=60*60*24*180;

function secret(){
  return String(process.env.CLIENT_SESSION_SECRET||process.env.DASHBOARD_PASSWORD||"").trim();
}
function previewBypass(){
  return process.env.VERCEL_ENV==="preview"&&process.env.VERCEL_GIT_COMMIT_REF==="feat/v1.1-ux-profile";
}
function cookies(req){
  const raw=String(req.headers?.cookie||"");
  return Object.fromEntries(raw.split(";").map(x=>x.trim()).filter(Boolean).map(x=>{
    const i=x.indexOf("=");return i<0?[x,""]:[x.slice(0,i),decodeURIComponent(x.slice(i+1))];
  }));
}
function sign(payload){
  return crypto.createHmac("sha256",secret()).update(payload).digest("hex");
}
export function createClientSession(uid){
  if(!secret())throw new Error("CLIENT_SESSION_SECRET no configurado");
  const exp=Math.floor(Date.now()/1000)+SESSION_SECONDS;
  const payload=Buffer.from(JSON.stringify({uid,exp})).toString("base64url");
  return payload+"."+sign(payload);
}
export function readClientSession(req){
  if(previewBypass()){
    const uid=String(req.query?.uid||req.body?.uid||"").trim();
    return uid?{uid,preview:true}:null;
  }
  if(!secret())return null;
  const token=cookies(req)[COOKIE_NAME];
  if(!token)return null;
  const [payload,sig]=String(token).split(".");
  if(!payload||!sig)return null;
  const expected=sign(payload);
  const a=Buffer.from(sig),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  try{
    const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    if(!data?.uid||!Number.isFinite(Number(data.exp))||Number(data.exp)<Math.floor(Date.now()/1000))return null;
    return data;
  }catch{return null}
}
export function requireClient(req,res,uid){
  const session=readClientSession(req);
  if(!session||String(session.uid)!==String(uid)){
    res.status(401).json({error:"Sesión de cliente inválida o expirada"});
    return false;
  }
  return true;
}
export function setClientSession(res,uid){
  const token=createClientSession(uid);
  res.setHeader("Set-Cookie",`${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`);
}
