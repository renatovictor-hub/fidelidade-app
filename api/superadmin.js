import admin from "firebase-admin";
import crypto from "crypto";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    databaseURL: "https://fidelidade-app-9671c-default-rtdb.firebaseio.com"
  });
}

const COOKIE="uaiso_superadmin_session";
const SESSION_SECONDS=60*60*8;

function secret(){return String(process.env.SUPERADMIN_PASSWORD||"").trim()}
function sign(v){return crypto.createHmac("sha256",secret()).update(v).digest("hex")}
function cookies(req){
  return Object.fromEntries(String(req.headers?.cookie||"").split(";").map(x=>x.trim()).filter(Boolean).map(x=>{
    const i=x.indexOf("="); return i<0?[x,""]:[x.slice(0,i),decodeURIComponent(x.slice(i+1))];
  }));
}
function validSession(req){
  if(!secret()) return false;
  const token=cookies(req)[COOKIE]; if(!token)return false;
  const [expRaw,sig]=String(token).split("."); if(!expRaw||!sig)return false;
  const exp=Number(expRaw); if(!Number.isFinite(exp)||exp<Math.floor(Date.now()/1000))return false;
  const expected=sign(expRaw),a=Buffer.from(sig),b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function setSession(res){
  const exp=String(Math.floor(Date.now()/1000)+SESSION_SECONDS);
  const token=exp+"."+sign(exp);
  res.setHeader("Set-Cookie",`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`);
}
function clearSession(res){res.setHeader("Set-Cookie",`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`)}
function timingEqual(a,b){
  const aa=Buffer.from(String(a||"")),bb=Buffer.from(String(b||""));
  return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
}
function clean(v,max=120){return String(v??"").trim().slice(0,max)}
function slugify(v){
  return clean(v,80).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,50);
}
function requestIp(req){return String(req.headers?.["x-forwarded-for"]||req.headers?.["x-real-ip"]||"unknown").split(",")[0].trim().slice(0,100)}
async function authRateLimit(req){
  const db=admin.database(),now=Date.now(),windowMs=15*60*1000,max=8;
  const key=crypto.createHash("sha256").update(requestIp(req)).digest("hex");
  const ref=db.ref("saas/security/superadmin_auth/"+key); let blocked=false;
  const tx=await ref.transaction(cur=>{
    cur=cur||{}; const start=Number(cur.window_start||0),count=Number(cur.count||0);
    if(!start||now-start>windowMs)return {window_start:now,count:1,last_at:now};
    if(count>=max){blocked=true;return cur}
    return {window_start:start,count:count+1,last_at:now};
  },undefined,false);
  const value=tx.snapshot?.val()||{}; if(Number(value.count||0)>=max&&blocked) return {allowed:false,ref};
  return {allowed:true,ref};
}
const legacyUaiSo={
  id:"uai-so",
  slug:"uai-so",
  name:"Uai Sô Brazilian Food",
  city:"Cancún",
  country:"MX",
  whatsapp:"5219986023759",
  status:"legacy",
  active:true,
  source:"legacy",
  modules:{fidelity:true,delivery:true,orders:true,notifications:true},
  branding:{primary:"#6a0dad",secondary:"#ffcc00"},
  notes:"Empresa original. Ainda usa a estrutura legada enquanto a migração multiempresa é concluída."
};
function publicCompany(id,c={}){
  return {
    id,slug:clean(c.slug||id,60),name:clean(c.name,120),legalName:clean(c.legalName,160),
    city:clean(c.city,100),country:clean(c.country||"MX",4),whatsapp:clean(c.whatsapp,30),
    status:["draft","provisioning","active","suspended","legacy"].includes(c.status)?c.status:"draft",
    active:c.active!==false,createdAt:c.createdAt||"",updatedAt:c.updatedAt||"",
    modules:{
      fidelity:c.modules?.fidelity!==false,
      delivery:c.modules?.delivery===true,
      orders:c.modules?.orders===true,
      notifications:c.modules?.notifications!==false
    },
    branding:{primary:clean(c.branding?.primary||"#6a0dad",20),secondary:clean(c.branding?.secondary||"#ffcc00",20)},
    notes:clean(c.notes,500),source:c.source||"saas"
  };
}
async function getCompany(id){
  const slug=slugify(id);
  if(slug==="uai-so") return legacyUaiSo;
  const snap=await admin.database().ref("saas/companies/"+slug).once("value");
  return snap.exists()?publicCompany(slug,snap.val()||{}):null;
}
async function listCompanies(){
  const snap=await admin.database().ref("saas/companies").once("value");
  const rows=Object.entries(snap.val()||{}).map(([id,c])=>publicCompany(id,c));
  if(!rows.some(x=>x.id==="uai-so"))rows.unshift(legacyUaiSo);
  return rows.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
}
async function createCompany(req,res){
  const body=req.body||{},name=clean(body.name,120),slug=slugify(body.slug||name);
  if(name.length<2||slug.length<2)return res.status(400).json({error:"Nombre o slug inválido"});
  if(slug==="uai-so")return res.status(409).json({error:"Este identificador está reservado para Uai Sô"});
  const ref=admin.database().ref("saas/companies/"+slug),snap=await ref.once("value");
  if(snap.exists())return res.status(409).json({error:"Ya existe una empresa con este identificador"});
  const now=new Date().toISOString();
  const company=publicCompany(slug,{
    slug,name,legalName:body.legalName,city:body.city,country:body.country||"MX",whatsapp:body.whatsapp,
    status:"draft",active:true,createdAt:now,updatedAt:now,
    modules:{fidelity:body.modules?.fidelity!==false,delivery:body.modules?.delivery===true,orders:body.modules?.orders===true,notifications:body.modules?.notifications!==false},
    branding:{primary:body.branding?.primary,secondary:body.branding?.secondary},
    notes:body.notes
  });
  const db=admin.database();
  await db.ref().update({
    [`saas/companies/${slug}`]: {...company,createdBy:"superadmin"},
    [`saas/tenantData/${slug}/config/company`]: company,
    [`saas/tenantData/${slug}/config/fidelity`]: {enabled:company.modules.fidelity===true,createdAt:now},
    [`saas/tenantData/${slug}/config/modules`]: company.modules
  });
  return res.status(201).json({success:true,company,previewUrl:`/tenant-preview.html?company=${encodeURIComponent(slug)}`});
}
async function updateCompany(req,res){
  const id=slugify(req.body?.id); if(!id||id==="uai-so")return res.status(400).json({error:"Empresa inválida para edición en esta fase"});
  const ref=admin.database().ref("saas/companies/"+id),snap=await ref.once("value");
  if(!snap.exists())return res.status(404).json({error:"Empresa no encontrada"});
  const cur=snap.val()||{},body=req.body||{},next=publicCompany(id,{
    ...cur,
    name:body.name??cur.name,legalName:body.legalName??cur.legalName,city:body.city??cur.city,country:body.country??cur.country,
    whatsapp:body.whatsapp??cur.whatsapp,status:body.status??cur.status,active:body.active??cur.active,
    modules:{...cur.modules,...(body.modules||{})},branding:{...cur.branding,...(body.branding||{})},
    notes:body.notes??cur.notes,createdAt:cur.createdAt,updatedAt:new Date().toISOString()
  });
  await ref.set({...next,createdBy:cur.createdBy||"superadmin"});
  return res.status(200).json({success:true,company:next});
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");

  if(req.method==="GET"&&String(req.query?.action||"")==="public_company"){
    const company=await getCompany(req.query?.company);
    if(!company||company.active===false)return res.status(404).json({error:"Empresa no encontrada"});
    return res.status(200).json({company});
  }

  if(!secret())return res.status(503).json({error:"SUPERADMIN_PASSWORD no configurada"});

  if(req.method==="POST"&&req.body?.action==="login"){
    const rate=await authRateLimit(req);
    if(!rate.allowed)return res.status(429).json({error:"Demasiados intentos. Intenta de nuevo en unos minutos."});
    if(!timingEqual(req.body?.password,secret()))return res.status(401).json({error:"Contraseña incorrecta"});
    await rate.ref.remove().catch(()=>{});
    setSession(res); return res.status(200).json({success:true,authenticated:true});
  }
  if(req.method==="DELETE"){clearSession(res);return res.status(200).json({success:true,authenticated:false})}
  if(!validSession(req))return res.status(401).json({error:"No autorizado"});

  if(req.method==="GET"){
    const companies=await listCompanies();
    return res.status(200).json({authenticated:true,companies,summary:{total:companies.length,active:companies.filter(x=>x.active).length,draft:companies.filter(x=>x.status==="draft").length,provisioning:companies.filter(x=>x.status==="provisioning").length}});
  }
  if(req.method==="POST"&&req.body?.action==="create_company")return createCompany(req,res);
  if(req.method==="PATCH"&&req.body?.action==="update_company")return updateCompany(req,res);
  return res.status(405).json({error:"Method not allowed"});
}
