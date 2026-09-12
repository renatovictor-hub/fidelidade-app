import admin from "firebase-admin";
import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

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

const STATUS = {
  received: { label:"Pedido enviado", push:"Recibimos tu pedido. En breve lo confirmaremos." },
  accepted: { label:"Pedido aceptado", push:"✅ Tu pedido fue aceptado." },
  preparing: { label:"En preparación", push:"🍳 Tu pedido ya está en preparación." },
  waiting_driver: { label:"Esperando repartidor", push:"📦 Tu pedido está listo y estamos esperando al repartidor." },
  out_for_delivery: { label:"Salió para entrega", push:"🛵 Tu pedido salió para entrega y va en camino." },
  delivered: { label:"Entregado", push:"🎉 Tu pedido fue entregado. ¡Buen provecho!" },
  cancelled: { label:"Cancelado", push:"Tu pedido fue cancelado. Contáctanos si necesitas ayuda." }
};
const ACTIVE = new Set(["received","accepted","preparing","waiting_driver","out_for_delivery"]);

function cleanText(value, max=220){ return String(value ?? "").trim().slice(0,max); }
function cleanMoney(value){ const n=Number(value); return Number.isFinite(n) ? Math.max(0, Math.round(n*100)/100) : 0; }
function cleanItems(items){
  if(!Array.isArray(items)) return [];
  return items.slice(0,50).map(x=>({
    name:cleanText(x?.name,100), qty:Math.max(1,Math.min(99,Math.floor(Number(x?.qty)||1))),
    unitPrice:cleanMoney(x?.unitPrice), details:cleanText(x?.details,300)
  })).filter(x=>x.name);
}
function publicOrder(id, p){
  return {
    id, code:p.code||id, uid:p.uid||"", status:p.status||"received", statusLabel:STATUS[p.status]?.label||p.status||"",
    createdAt:p.createdAt||"", updatedAt:p.updatedAt||"", fulfillment:p.fulfillment||"delivery",
    scheduledAt:p.scheduledAt||"", subtotal:Number(p.subtotal||0), deliveryFee:Number(p.deliveryFee||0), total:Number(p.total||0),
    address:p.address||"", references:p.references||"", payment:p.payment||"", items:Array.isArray(p.items)?p.items:[],
    history:p.history||{}, name:p.name||"", phone:p.phone||""
  };
}
async function notifyStatus(order){
  const meta=STATUS[order.status]; if(!meta) return;
  await enviarNotificacao({
    uid:order.uid||"", telefone:order.phone||"", titulo:`${meta.label} · ${order.code||"Uai Sô"}`,
    mensagem:meta.push, url:"https://fidelidad-uai-so.vercel.app/"
  }).catch(()=>null);
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method==="OPTIONS") return res.status(200).end();
  const db=admin.database();
  try{
    if(req.method==="POST"){
      const body=req.body||{};
      const uid=cleanText(body.uid,80);
      if(uid && !/^user_\d+$/.test(uid)) return res.status(400).json({error:"Cliente inválido"});
      const items=cleanItems(body.items);
      if(!items.length) return res.status(400).json({error:"El pedido no tiene productos"});
      const orderRef=db.ref("pedidos").push();
      const now=new Date().toISOString();
      const code=`US-${now.slice(2,10).replace(/-/g,"")}-${orderRef.key.slice(-4).toUpperCase()}`;
      let profile={};
      if(uid){ const snap=await db.ref(`users/${uid}`).once("value"); if(snap.exists()) profile=snap.val()||{}; }
      const status="received";
      const order={
        code, uid, name:cleanText(body.name||profile.nome||profile.nombre,80), phone:cleanText(body.phone||profile.telefone,30),
        status, createdAt:now, updatedAt:now, fulfillment:body.fulfillment==="pickup"?"pickup":"delivery",
        scheduledAt:cleanText(body.scheduledAt,40), subtotal:cleanMoney(body.subtotal), deliveryFee:cleanMoney(body.deliveryFee), total:cleanMoney(body.total),
        address:cleanText(body.address,260), references:cleanText(body.references,180), payment:cleanText(body.payment,80),
        route: body.route && typeof body.route==="object" ? {distanceKm:Number(body.route.distanceKm||0),durationMinutes:Number(body.route.durationMinutes||0)} : null,
        items, history:{ received:{at:now,label:STATUS.received.label} }
      };
      await orderRef.set(order);
      if(uid) await db.ref(`users/${uid}/ultimo_pedido`).set({id:orderRef.key,code,status,updatedAt:now});
      return res.status(201).json({success:true,order:publicOrder(orderRef.key,order)});
    }

    if(req.method==="PATCH"){
      if(!requireAdmin(req,res)) return;
      const id=cleanText(req.body?.id,100), status=cleanText(req.body?.status,40);
      if(!id || !STATUS[status]) return res.status(400).json({error:"Pedido o estado inválido"});
      const ref=db.ref(`pedidos/${id}`), snap=await ref.once("value");
      if(!snap.exists()) return res.status(404).json({error:"Pedido no encontrado"});
      const current=snap.val()||{}, now=new Date().toISOString();
      const updates={status,updatedAt:now,[`history/${status}`]:{at:now,label:STATUS[status].label}};
      await ref.update(updates);
      const order={...current,...updates,status,updatedAt:now};
      if(current.uid) await db.ref(`users/${current.uid}/ultimo_pedido`).set({id,code:current.code||id,status,updatedAt:now});
      await notifyStatus(order);
      return res.status(200).json({success:true,order:publicOrder(id,{...current,status,updatedAt:now,history:{...(current.history||{}),[status]:{at:now,label:STATUS[status].label}}})});
    }

    if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});

    if(String(req.query.admin||"")==="1"){
      if(!requireAdmin(req,res)) return;
      const snap=await db.ref("pedidos").orderByChild("createdAt").limitToLast(100).once("value");
      const raw=snap.val()||{};
      const orders=Object.entries(raw).map(([id,p])=>publicOrder(id,p)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
      return res.status(200).json({orders,statuses:STATUS});
    }

    const uid=cleanText(req.query.uid,80);
    if(!/^user_\d+$/.test(uid)) return res.status(400).json({error:"Cliente inválido"});
    const snap=await db.ref("pedidos").orderByChild("uid").equalTo(uid).limitToLast(30).once("value");
    const raw=snap.val()||{};
    const orders=Object.entries(raw).map(([id,p])=>publicOrder(id,p)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    return res.status(200).json({orders,active:orders.find(o=>ACTIVE.has(o.status))||null});
  }catch(error){
    console.error("Pedidos API error:",error);
    return res.status(500).json({error:"Error interno",details:error.message});
  }
}
