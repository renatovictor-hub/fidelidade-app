import admin from "firebase-admin";
import crypto from "crypto";
import { requireAdmin, isValidSession as isAdminSession } from "./_admin-auth.js";
import { requireClient, setClientSession } from "./_client-auth.js";
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

const RESTAURANT = { latitude: 21.119855, longitude: -86.87269 };
const ORDER_STATUS = {
    received: { label:"Pedido enviado", push:"Recibimos tu pedido. En breve lo confirmaremos." },
    accepted: { label:"Pedido aceptado", push:"✅ Tu pedido fue aceptado." },
    preparing: { label:"En preparación", push:"🍳 Tu pedido ya está en preparación." },
    waiting_driver: { label:"Esperando repartidor", push:"📦 Tu pedido está listo y estamos esperando al repartidor." },
    out_for_delivery: { label:"Salió para entrega", push:"🛵 Tu pedido salió para entrega y va en camino." },
    delivered: { label:"Entregado", push:"🎉 Tu pedido fue entregado. ¡Buen provecho!" },
    cancelled: { label:"Cancelado", push:"Tu pedido fue cancelado. Contáctanos si necesitas ayuda." }
};
const ACTIVE_ORDER_STATUS = new Set(["received","accepted","preparing","waiting_driver","out_for_delivery"]);
function requireClientOrAdmin(req,res,uid){
    if(isAdminSession(req))return true;
    return requireClient(req,res,uid);
}
const ORDER_TRANSITIONS = {
    received:new Set(["accepted","cancelled"]),
    accepted:new Set(["preparing","cancelled"]),
    preparing:new Set(["waiting_driver","cancelled"]),
    waiting_driver:new Set(["out_for_delivery","cancelled"]),
    out_for_delivery:new Set(["delivered","cancelled"]),
    delivered:new Set(),
    cancelled:new Set()
};

function requestIp(req){
    return String(req.headers?.["x-forwarded-for"]||req.headers?.["x-real-ip"]||"unknown").split(",")[0].trim().slice(0,100);
}
async function authRateLimit(db,req,phone){
    const key=crypto.createHash("sha256").update(requestIp(req)+"|"+String(phone||"")).digest("hex");
    const ref=db.ref("security/auth_attempts/"+key),now=Date.now(),windowMs=15*60*1000,max=8;
    let blocked=false;
    const tx=await ref.transaction(current=>{
        const cur=current||{};
        const start=Number(cur.window_start||0);
        const count=Number(cur.count||0);
        if(!start||now-start>windowMs)return {window_start:now,count:1,last_at:now};
        if(count>=max){blocked=true;return cur}
        return {window_start:start,count:count+1,last_at:now};
    },undefined,false);
    const value=tx.snapshot?.val()||{};
    if(Number(value.count||0)>max)blocked=true;
    return {allowed:!blocked,key,ref};
}
async function clearAuthRate(ref){try{await ref?.remove()}catch(_){}}

function cleanOrderText(value, max = 220) {
    return String(value ?? "").trim().slice(0, max);
}

function cleanOrderMoney(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
}

const ORDER_CATALOG = Object.freeze({
    "carne":{ name:"Carne", price:45 },
    "carne-queso":{ name:"Carne con Queso", price:45 },
    "queso-cremoso":{ name:"Queso Cremoso", price:45 },
    "marguerita":{ name:"Marguerita", price:45 },
    "portuguesa":{ name:"Portuguesa", price:45 },
    "brasilena":{ name:"Brasileña", price:45 },
    "brasilena-habanero":{ name:"Brasileña Habanero", price:45 },
    "dulce-leche":{ name:"Dulce de Leche", price:50 },
    "platano-lechera":{ name:"Plátano con Lechera", price:50 },
    "chabacano-macha":{ name:"Chabacano con Macha", price:50 },
    "romeo-julieta":{ name:"Romeo y Julieta", price:50 },
    "coxinha":{ name:"Coxinha", price:50 },
    "coca-600":{ name:"Coca-Cola 600 ml", price:35 }
});

function normalizeOrderName(value){
    return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
const ORDER_CATALOG_BY_NAME = Object.fromEntries(Object.entries(ORDER_CATALOG).map(([id,p])=>[normalizeOrderName(p.name),{id,...p}]));

function normalizedCatalog(raw){
    const source=raw&&typeof raw==="object"&&Object.keys(raw).length?raw:ORDER_CATALOG;
    const out={};
    for(const [id,p] of Object.entries(source)){
        if(!p||p.active===false)continue;
        const price=Math.max(0,Number(p.price||0));
        if(!id||!String(p.name||"").trim()||!Number.isFinite(price))continue;
        out[id]={name:String(p.name).trim().slice(0,120),price,active:p.active!==false,modifiers:Array.isArray(p.modifiers)?p.modifiers.slice(0,30):[]};
    }
    return Object.keys(out).length?out:ORDER_CATALOG;
}
function secureOrderItems(items,catalogRaw) {
    if (!Array.isArray(items)) return { items:[], invalid:true };
    const catalog=normalizedCatalog(catalogRaw);
    const byName=Object.fromEntries(Object.entries(catalog).map(([id,p])=>[normalizeOrderName(p.name),{id,...p}]));
    const priced=[];
    let invalid=false;
    for (const raw of items.slice(0,50)) {
        const requestedId=cleanOrderText(raw?.productId,80);
        const byId=requestedId ? catalog[requestedId] : null;
        const byNameMatch=byName[normalizeOrderName(raw?.name)];
        const product=byId ? {id:requestedId,...byId} : byNameMatch;
        if(!product){invalid=true;continue}
        const qty=Math.max(1,Math.min(99,Math.floor(Number(raw?.qty)||1)));
        let modifierTotal=0,modifierDetails=[];
        const requestedModifiers=Array.isArray(raw?.modifiers)?raw.modifiers.slice(0,20):[];
        for(const m of requestedModifiers){
            const mid=String(m?.id||"").trim();
            const allowed=(product.modifiers||[]).find(x=>String(x?.id||"")===mid&&x?.active!==false);
            if(!allowed){invalid=true;continue}
            const mq=Math.max(1,Math.min(qty,Math.floor(Number(m?.qty)||1)));
            modifierTotal+=Math.max(0,Number(allowed.price||0))*mq;
            modifierDetails.push(String(allowed.name||mid)+" x"+mq);
        }
        priced.push({
            productId:product.id,
            name:product.name,
            qty,
            unitPrice:product.price+(modifierTotal/qty),
            baseUnitPrice:product.price,
            modifiers:requestedModifiers.map(m=>({id:String(m?.id||""),qty:Math.max(1,Math.floor(Number(m?.qty)||1))})),
            details:modifierDetails.length?modifierDetails.join(", "):cleanOrderText(raw?.details,300)
        });
    }
    return { items:priced, invalid };
}

function publicOrder(id, order) {
    return {
        id,
        code: order.code || id,
        uid: order.uid || "",
        status: order.status || "received",
        statusLabel: ORDER_STATUS[order.status]?.label || order.status || "",
        createdAt: order.createdAt || "",
        updatedAt: order.updatedAt || "",
        fulfillment: order.fulfillment || "delivery",
        scheduledAt: order.scheduledAt || "",
        subtotal: Number(order.subtotal || 0),
        deliveryFee: Number(order.deliveryFee || 0),
        total: Number(order.total || 0),
        discount: Number(order.discount || 0),
        vipBenefitRequestId: order.vipBenefitRequestId || "",
        vipBenefit: order.vipBenefit || null,
        address: order.address || "",
        references: order.references || "",
        payment: order.payment || "",
        items: Array.isArray(order.items) ? order.items : [],
        history: order.history || {},
        name: order.name || "",
        phone: order.phone || ""
    };
}

async function notifyOrderStatus(order) {
    const meta = ORDER_STATUS[order.status];
    if (!meta) return;
    await enviarNotificacao({
        uid: order.uid || "",
        telefone: order.phone || "",
        titulo: `${meta.label} · ${order.code || "Uai Sô"}`,
        mensagem: meta.push,
        url: "https://fidelidad-uai-so.vercel.app/"
    }).catch(() => null);
}

async function claimVipRequestForOrder(db, requestId, uid, orderId) {
    const id = cleanOrderText(requestId, 120);
    if (!id || !uid || !orderId) return null;
    const ref = db.ref(`vip_benefit_requests/${id}`);
    const tx = await ref.transaction(current => {
        if (!current || current.status !== "pending" || String(current.uid || "") !== uid) return;
        if (Date.parse(String(current.expires_at || "")) <= Date.now()) return;
        if (current.channel !== "delivery") return;
        if (current.order_id && current.order_id !== orderId) return;
        return { ...current, order_id:orderId, linked_at:current.linked_at || new Date().toISOString() };
    }, undefined, false);
    if (!tx.committed) return null;
    return { id, ...(tx.snapshot.val() || {}) };
}

function applyVipBenefitToOrder(request, subtotal, deliveryFee) {
    let discount = 0;
    let fee = deliveryFee;
    const type = String(request?.benefit_type || "");
    const value = Math.max(0, Number(request?.benefit_value || 0));
    if (type === "free_delivery") fee = 0;
    else if (type === "percent_discount") discount = Math.min(subtotal, Math.round((subtotal * Math.min(100, value) / 100) * 100) / 100);
    else if (type === "fixed_discount") discount = Math.min(subtotal, value);
    return { discount, deliveryFee: fee, total: Math.max(0, Math.round((subtotal - discount + fee) * 100) / 100) };
}

async function confirmVipRequestForOrder(db, requestId, orderId) {
    const snap = await db.ref(`vip_benefit_requests/${requestId}`).once("value");
    if (!snap.exists()) return { ok:false };
    const request = snap.val() || {};
    if (request.status === "confirmed") return { ok:request.order_id === orderId, already:true };
    if (request.status !== "pending" || request.channel !== "delivery" || request.order_id !== orderId || Date.parse(String(request.expires_at || "")) <= Date.now()) return { ok:false };
    const usageRef = db.ref(`users/${request.uid}/vip_benefit_usage/${request.benefit_id}/${request.period_key}`);
    const limit = Math.max(1, Math.min(20, Number(request.limit || 1)));
    const tx = await usageRef.transaction(current => {
        const used = Math.max(0, Number(current || 0));
        if (used >= limit) return;
        return used + 1;
    }, undefined, false);
    if (!tx.committed) return { ok:false, exhausted:true };
    const used = Math.max(0, Number(tx.snapshot.val() || 0)), now = new Date().toISOString();
    await db.ref(`vip_benefit_requests/${requestId}`).update({
        status:"confirmed", processed_at:now, processed_by:"Pedido integrado", order_id:orderId || "", use_number:used
    });
    await db.ref("vip_benefit_redemptions").push().set({
        ...request, request_id:requestId, status:"redeemed", order_id:orderId || "", use_number:used, confirmed_at:now
    });
    return { ok:true, used, remaining:Math.max(0, limit-used) };
}

async function secureDeliveryQuote(body){
    const raw=body?.deliveryDestination||{};
    const safeDestination={placeId:String(raw.placeId||"").trim(),address:String(raw.address||"").trim()};
    const destination=destinationWaypoint(safeDestination);
    if(!destination)throw Object.assign(new Error("Dirección de entrega inválida."),{status:400});
    const apiKey=String(process.env.GOOGLE_ROUTES_API_KEY||"").trim();
    if(!apiKey)throw Object.assign(new Error("No podemos validar la tarifa de envío en este momento."),{status:503});
    const response=await fetch("https://routes.googleapis.com/directions/v2:computeRoutes",{
        method:"POST",
        headers:{"Content-Type":"application/json","X-Goog-Api-Key":apiKey,"X-Goog-FieldMask":"routes.distanceMeters,routes.duration"},
        body:JSON.stringify({origin:{location:{latLng:RESTAURANT}},destination,travelMode:"DRIVE",routingPreference:"TRAFFIC_UNAWARE",languageCode:"es-MX",units:"METRIC"})
    });
    const data=await response.json();
    if(!response.ok)throw Object.assign(new Error("No pudimos validar la ruta de entrega."),{status:502});
    const route=data?.routes?.[0],distanceMeters=Number(route?.distanceMeters);
    if(!Number.isFinite(distanceMeters)||distanceMeters<=0)throw Object.assign(new Error("No encontramos una ruta válida para esta dirección."),{status:422});
    const distanceKm=Math.round(distanceMeters/100)/10,tariff=calculateDeliveryFee(distanceMeters/1000);
    const address=String(body?.deliveryDestination?.address||"").trim();
    const bonfil=/(^|\b)(alfredo v\.? bonfil|bonfil)(\b|$)/i.test(address)?20:0;
    const plaza=body?.insidePlaza===true?20:0;
    const outsideHours=isOutsideServiceHours(body?.deliveryAt)?20:0;
    const rain=String(process.env.DELIVERY_RAIN_ACTIVE||"").toLowerCase()==="true"?10:0;
    const fee=tariff.distanceFee+bonfil+plaza+outsideHours+rain;
    const durationSeconds=Math.max(0,Number.parseInt(String(route.duration||"0s"),10)||0);
    return {
        distanceKm,
        durationMinutes:Math.max(1,Math.ceil(durationSeconds/60)),
        fee,
        breakdown:{distance:tariff.distanceFee,base:tariff.baseFee,extraKm:tariff.extraKm,bonfil,plaza,outsideHours,rain}
    };
}

async function loadMenuCatalog(db){
    const snap=await db.ref("config/menu_catalog").once("value");
    return normalizedCatalog(snap.val()||ORDER_CATALOG);
}
function promoEligibleForUser(p,user,rewards,uid){
    const segmento=String(p?.segmento||"todos"),value=String(p?.valor_segmento??"").trim();
    if(segmento==="todos"||!segmento)return true;
    if(segmento==="cliente"){
        const phone=String(user?.telefone||"").replace(/\D/g,"");
        return value===uid||value.replace(/\D/g,"")===phone;
    }
    if(segmento==="pontos_min")return Number(user?.pontos||0)>=Math.max(0,Number(value||0));
    if(segmento==="inativos_dias"){
        const days=Math.max(1,Number(value||30)),ts=Date.parse(String(user?.ultima_compra||user?.updated_at||user?.created_at||""));
        return !Number.isFinite(ts)||ts<=Date.now()-days*86400000;
    }
    if(segmento==="perto_recompensa"){
        const max=Math.max(1,Number(value||20)),saldo=Number(user?.pontos||0);
        return rewards.some(r=>Number(r?.pontos||0)>saldo&&Number(r.pontos)-saldo<=max);
    }
    return false;
}
async function refundVipBenefitForCancelledOrder(db,order){
    if(!order?.vipBenefitRequestId||!["accepted","preparing","waiting_driver"].includes(String(order.status||"")))return false;
    const ref=db.ref("vip_benefit_requests/"+order.vipBenefitRequestId),snap=await ref.once("value");
    if(!snap.exists())return false;
    const request=snap.val()||{};
    if(request.status!=="confirmed"||request.refunded===true)return false;
    const usageRef=db.ref(`users/${request.uid}/vip_benefit_usage/${request.benefit_id}/${request.period_key}`);
    await usageRef.transaction(current=>Math.max(0,Number(current||0)-1),undefined,false);
    await ref.update({status:"refunded",refunded:true,refunded_at:new Date().toISOString(),refund_reason:"order_cancelled"});
    await db.ref("vip_benefit_redemptions").push().set({...request,request_id:order.vipBenefitRequestId,status:"refunded",order_id:order.id||"",refunded_at:new Date().toISOString()});
    return true;
}
async function awardLoyaltyForDeliveredOrder(db,id,order){
    if(!order?.uid||!/^user_\d+$/.test(String(order.uid)))return {awarded:false};
    const [baseSnap,bonusSnap]=await Promise.all([db.ref("config/loyalty_base").once("value"),db.ref("config/bonus_pontos").once("value")]);
    const baseCfg=baseSnap.val()||{},bonus=bonusSnap.val()||{};
    const pesos=Math.max(1,Math.min(1000,Number(baseCfg.pesos_por_punto||10)));
    const amount=Math.max(0,Number(order.subtotal||0)-Number(order.discount||0));
    const basePts=Math.floor(amount/pesos);
    if(basePts<=0)return {awarded:false};
    const nowCancun=new Date(new Date().toLocaleString("en-US",{timeZone:"America/Cancun"}));
    const day=nowCancun.getDay(),hhmm=`${String(nowCancun.getHours()).padStart(2,"0")}:${String(nowCancun.getMinutes()).padStart(2,"0")}`;
    const days=Array.isArray(bonus.dias)?bonus.dias.map(Number):[],ini=String(bonus.inicio||"00:00"),fim=String(bonus.fim||"23:59");
    const inside=ini<=fim?(hhmm>=ini&&hhmm<=fim):(hhmm>=ini||hhmm<=fim);
    const mult=bonus.ativo===true&&days.includes(day)&&inside?Math.max(1,Math.min(5,Number(bonus.multiplicador||1))):1;
    const points=Math.floor(basePts*mult),userRef=db.ref("users/"+order.uid);
    let before=0,after=0;
    const tx=await userRef.transaction(user=>{
        if(!user)return;
        user.loyalty_order_markers=user.loyalty_order_markers||{};
        if(user.loyalty_order_markers[id])return;
        before=Number(user.pontos||0);after=before+points;
        user.pontos=after;
        user.pontos_acumulados=Number(user.pontos_acumulados??before)+points;
        user.ultima_compra=new Date().toISOString();
        user.loyalty_order_markers[id]={points,at:new Date().toISOString()};
        return user;
    },undefined,false);
    if(!tx.committed)return {awarded:false,duplicate:true};
    const t=db.ref("transacoes").push();
    await t.set({user_id:order.uid,nome:order.name||"",telefone:order.phone||"",tipo:"credito",origem:"delivery",order_id:id,valor_compra:amount,pontos:points,pontos_base:basePts,multiplicador_bonus:mult,saldo_anterior:before,saldo_novo:after,data:new Date().toISOString()});
    let referral={applied:false,friend_points:0,referrer_points:0};
    const deliveredUser=tx.snapshot.val()||{};
    const refUid=String(deliveredUser.referido_por||"").trim();
    if(/^user_\d+$/.test(refUid)&&refUid!==order.uid&&deliveredUser.referido_recompensado!==true){
        const cfgSnap=await db.ref("config/referidos").once("value"),cfg=cfgSnap.val()||{};
        const min=Math.max(0,Number(cfg.compra_minima||100));
        if(cfg.ativo!==false&&amount>=min){
            const friendPts=Math.max(0,Math.floor(Number(cfg.pontos_amigo||10)));
            const refPts=Math.max(0,Math.floor(Number(cfg.pontos_indicador||20)));
            const refRef=db.ref("users/"+refUid),refSnap=await refRef.once("value");
            if(!refSnap.exists())return {awarded:true,points,referral};
            let friendBefore=0,friendAfter=0;
            const claim=await userRef.transaction(user=>{
                if(!user||user.referido_recompensado===true)return;
                friendBefore=Number(user.pontos||0);friendAfter=friendBefore+friendPts;
                user.pontos=friendAfter;
                user.pontos_acumulados=Number(user.pontos_acumulados??friendBefore)+friendPts;
                user.referido_recompensado=true;
                user.referido_recompensado_em=new Date().toISOString();
                return user;
            },undefined,false);
            if(claim.committed){
                    let refBefore=0,refAfter=0;
                    await refRef.transaction(user=>{
                        if(!user)return;
                        refBefore=Number(user.pontos||0);refAfter=refBefore+refPts;
                        user.pontos=refAfter;
                        user.pontos_acumulados=Number(user.pontos_acumulados??refBefore)+refPts;
                        user.referidos_recompensados=Number(user.referidos_recompensados||0)+1;
                        user.pontos_indicacao_total=Number(user.pontos_indicacao_total||0)+refPts;
                        return user;
                    },undefined,false);
                    const now=new Date().toISOString(),updates={};
                    if(friendPts>0){const a=db.ref("transacoes").push();updates[`transacoes/${a.key}`]={user_id:order.uid,nome:order.name||"",telefone:order.phone||"",tipo:"credito",origem:"indicacao",descricao:"Bonus por primera compra indicada",pontos:friendPts,saldo_anterior:friendBefore,saldo_novo:friendAfter,data:now}}
                    if(refPts>0){const b=db.ref("transacoes").push();updates[`transacoes/${b.key}`]={user_id:refUid,tipo:"credito",origem:"indicacao",descricao:"Amigo indicado realizó su primera compra válida",referido_uid:order.uid,pontos:refPts,saldo_anterior:refBefore,saldo_novo:refAfter,data:now}}
                    if(Object.keys(updates).length)await db.ref().update(updates);
                    referral={applied:true,friend_points:friendPts,referrer_points:refPts,referrer_uid:refUid};
                    await Promise.allSettled([
                        friendPts?enviarNotificacao({uid:order.uid,telefone:order.phone||"",titulo:"🎁 ¡Bonus por invitación!",mensagem:`Ganaste ${friendPts} puntos extra por tu primera compra con invitación.`,url:"https://fidelidad-uai-so.vercel.app/"}):null,
                        refPts?enviarNotificacao({uid:refUid,telefone:refSnap.val()?.telefone||"",titulo:"🤝 ¡Tu amigo compró!",mensagem:`Ganaste ${refPts} puntos porque tu amigo hizo su primera compra válida.`,url:"https://fidelidad-uai-so.vercel.app/"}):null
                    ]);
            }
        }
    }
    await db.ref("pedidos/"+id).update({loyalty_awarded:true,loyalty_points:points,loyalty_awarded_at:new Date().toISOString(),loyalty_referral:referral});
    await enviarNotificacao({uid:order.uid,telefone:order.phone||"",titulo:"⭐ ¡Ganaste puntos!",mensagem:`Sumaste ${points} puntos por tu pedido. Ya están disponibles en tu cuenta.`,url:"https://fidelidad-uai-so.vercel.app/"}).catch(()=>null);
    return {awarded:true,points,referral};
}

async function handleOrderCreate(req, res) {
    const body = req.body || {};
    const uid = cleanOrderText(body.uid, 80);
    if (uid && !/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });
    const db = admin.database();
    const catalog=await loadMenuCatalog(db);
    const secure = secureOrderItems(body.items,catalog);
    const items = secure.items;
    if (secure.invalid) return res.status(400).json({ error:"El pedido contiene un producto no válido o con precio desactualizado." });
    if (!items.length) return res.status(400).json({ error:"El pedido no tiene productos" });
    const orderRef = db.ref("pedidos").push();
    const now = new Date().toISOString();
    const code = `US-${now.slice(2,10).replace(/-/g,"")}-${orderRef.key.slice(-4).toUpperCase()}`;
    let profile = {};
    if (uid) {
        const snap = await db.ref(`users/${uid}`).once("value");
        if (snap.exists()) profile = snap.val() || {};
    }
    const status = "received";
    const requestedVipId = cleanOrderText(body.benefit_request_id, 120);
    const vipRequest = requestedVipId ? await claimVipRequestForOrder(db, requestedVipId, uid, orderRef.key) : null;
    if (requestedVipId && !vipRequest) return res.status(409).json({ error:"El beneficio VIP ya no está disponible para este pedido. Vuelve a solicitarlo." });
    const subtotal = Math.round(items.reduce((sum,item)=>sum+(item.unitPrice*item.qty),0)*100)/100;
    const fulfillment = body.fulfillment === "pickup" ? "pickup" : "delivery";
    let secureRoute=null, originalDeliveryFee=0;
    if(fulfillment==="delivery"){
        try{secureRoute=await secureDeliveryQuote(body);originalDeliveryFee=secureRoute.fee}
        catch(error){return res.status(error.status||500).json({error:error.message||"No pudimos validar el envío."})}
    }
    const vipPricing = vipRequest ? applyVipBenefitToOrder(vipRequest, subtotal, originalDeliveryFee) : { discount:0, deliveryFee:originalDeliveryFee, total:Math.max(0,Math.round((subtotal+originalDeliveryFee)*100)/100) };
    const order = {
        code,
        uid,
        name: cleanOrderText(body.name || profile.nome || profile.nombre, 80),
        phone: cleanOrderText(body.phone || profile.telefone, 30),
        status,
        createdAt: now,
        updatedAt: now,
        fulfillment,
        scheduledAt: cleanOrderText(body.scheduledAt, 40),
        subtotal,
        deliveryFee: vipPricing.deliveryFee,
        discount: vipPricing.discount,
        total: vipPricing.total,
        vipBenefitRequestId: vipRequest?.id || "",
        vipBenefit: vipRequest ? {
            title: vipRequest.benefit_title || "",
            type: vipRequest.benefit_type || "custom",
            value: Number(vipRequest.benefit_value || 0),
            code: vipRequest.code || ""
        } : null,
        address: cleanOrderText(body.address, 260),
        references: cleanOrderText(body.references, 180),
        payment: cleanOrderText(body.payment, 80),
        route: secureRoute ? {
            distanceKm: secureRoute.distanceKm,
            durationMinutes: secureRoute.durationMinutes,
            breakdown: secureRoute.breakdown
        } : null,
        items,
        history: { received: { at: now, label: ORDER_STATUS.received.label } }
    };

    await orderRef.set(order);
    if (uid) await db.ref(`users/${uid}/ultimo_pedido`).set({ id:orderRef.key, code, status, updatedAt:now });
    return res.status(201).json({ success:true, order:publicOrder(orderRef.key, order) });
}

async function handleCustomersGet(req, res) {
    if (!requireAdmin(req, res)) return;

    const db = admin.database();
    const [usersSnap, txSnap] = await Promise.all([
        db.ref("users").once("value"),
        db.ref("transacoes").once("value")
    ]);

    const usersRaw = usersSnap.val() || {};
    const txRaw = txSnap.val() || {};
    const byUser = new Map();

    for (const item of Object.values(txRaw)) {
        const uid = String(item?.user_id || item?.uid || "").trim();
        if (!uid) continue;
        if (!byUser.has(uid)) byUser.set(uid, []);
        byUser.get(uid).push(item || {});
    }

    const now = Date.now();
    const dayMs = 86400000;
    const daysSince = value => {
        const t = Date.parse(String(value || ""));
        return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / dayMs)) : null;
    };
    const birthdayInDays = value => {
        const raw = String(value || "").trim();
        const m = raw.match(/^(?:\d{4}-)?(\d{1,2})-(\d{1,2})$/) || raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{4})?$/);
        if (!m) return null;
        const month = Number(m[1]) - 1, day = Number(m[2]);
        if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
        const d = new Date();
        let target = new Date(d.getFullYear(), month, day);
        const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (target < today) target = new Date(d.getFullYear() + 1, month, day);
        return Math.round((target - today) / dayMs);
    };

    const customers = Object.entries(usersRaw).filter(([uid]) => /^user_\d+$/.test(uid)).map(([uid, user]) => {
        const txs = (byUser.get(uid) || []).slice();
        const purchases = txs.filter(item => Number(item?.valor_compra || 0) > 0 && !["debito","resgate","canje"].includes(String(item?.tipo || "").toLowerCase()));
        const totalSpent = purchases.reduce((sum, item) => sum + Math.max(0, Number(item?.valor_compra || 0)), 0);
        const dates = txs.map(item => item?.data || item?.created_at).filter(Boolean).sort((a,b)=>String(b).localeCompare(String(a)));
        const lastPurchase = dates[0] || user?.ultima_compra || "";
        const purchaseCount = purchases.length;
        const createdAt = user?.created_at || "";
        const inactiveDays = daysSince(lastPurchase);
        const createdDays = daysSince(createdAt);
        const birthday = user?.nascimento || user?.cumpleanos || "";
        return {
            uid,
            nome: user?.nome || user?.nombre || "",
            telefone: user?.telefone || "",
            pontos: Number(user?.pontos || 0),
            pontos_acumulados: Number(user?.pontos_acumulados ?? user?.pontos ?? 0),
            nivel: user?.nivel_vip || user?.nivel || user?.vip_nivel || "",
            nascimento: birthday,
            created_at: createdAt,
            ultima_compra: lastPurchase,
            dias_sem_comprar: inactiveDays,
            compras: purchaseCount,
            gasto_total: Math.round(totalSpent * 100) / 100,
            ticket_medio: purchaseCount ? Math.round((totalSpent / purchaseCount) * 100) / 100 : 0,
            aniversario_em_dias: birthdayInDays(birthday),
            feedback_last_at: user?.feedback_last_at || "",
            google_review_clicked: user?.google_review_clicked === true,
            push_status: {
                permission: String(user?.push_status?.permission || "default"),
                opted_in: user?.push_status?.opted_in === true,
                token_present: user?.push_status?.token_present === true,
                last_sync: user?.push_status?.last_sync || user?.push_last_sync || ""
            },
            status: inactiveDays == null ? "sin_compras" : inactiveDays <= 30 ? "activo" : "inactivo",
            nuevo_30d: createdDays != null && createdDays <= 30
        };
    }).sort((a,b) => b.gasto_total - a.gasto_total || b.compras - a.compras || String(a.nome).localeCompare(String(b.nome)));

    const active30 = customers.filter(c => c.status === "activo").length;
    const inactive30 = customers.filter(c => c.status === "inactivo").length;
    const new30 = customers.filter(c => c.nuevo_30d).length;
    const birthdays30 = customers.filter(c => c.aniversario_em_dias != null && c.aniversario_em_dias <= 30).length;
    const frequent = customers.filter(c => c.compras >= 3).length;
    const totalRevenue = Math.round(customers.reduce((s,c)=>s+c.gasto_total,0) * 100) / 100;
    const pushActive = customers.filter(c => c.push_status?.permission === "granted" && c.push_status?.opted_in === true && c.push_status?.token_present === true).length;
    const pushBlocked = customers.filter(c => c.push_status?.permission === "denied").length;

    return res.status(200).json({
        customers,
        summary: {
            total: customers.length,
            activos_30d: active30,
            inactivos_30d: inactive30,
            nuevos_30d: new30,
            frecuentes: frequent,
            aniversarios_30d: birthdays30,
            gasto_total: totalRevenue,
            push_activos: pushActive,
            push_bloqueados: pushBlocked
        }
    });
}

async function handleOrdersGet(req, res) {
    const db = admin.database();
    if (String(req.query.admin || "") === "1") {
        if (!requireAdmin(req, res)) return;
        const snap = await db.ref("pedidos").orderByChild("createdAt").limitToLast(100).once("value");
        const raw = snap.val() || {};
        const orders = Object.entries(raw).map(([id, order]) => publicOrder(id, order)).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return res.status(200).json({ orders, statuses:ORDER_STATUS });
    }

    const uid = cleanOrderText(req.query.uid, 80);
    if (!/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });
    if (!requireClient(req,res,uid)) return;
    const snap = await db.ref("pedidos").orderByChild("uid").equalTo(uid).limitToLast(30).once("value");
    const raw = snap.val() || {};
    const orders = Object.entries(raw).map(([id, order]) => publicOrder(id, order)).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return res.status(200).json({ orders, active:orders.find(order => ACTIVE_ORDER_STATUS.has(order.status)) || null });
}

async function handleOrderStatus(req, res) {
    if (!requireAdmin(req, res)) return;
    const id = cleanOrderText(req.body?.id, 100);
    const status = cleanOrderText(req.body?.status, 40);
    if (!id || !ORDER_STATUS[status]) return res.status(400).json({ error:"Pedido o estado inválido" });

    const db = admin.database();
    const ref = db.ref(`pedidos/${id}`);
    const snap = await ref.once("value");
    if (!snap.exists()) return res.status(404).json({ error:"Pedido no encontrado" });
    const current = snap.val() || {};
    if(!ORDER_TRANSITIONS[current.status]?.has(status))return res.status(409).json({error:`Transición inválida: ${current.status} → ${status}`});
    const now = new Date().toISOString();
    if (status === "accepted" && current.vipBenefitRequestId) {
        const confirmed = await confirmVipRequestForOrder(db, current.vipBenefitRequestId, id);
        if (!confirmed.ok) return res.status(409).json({ error: confirmed.exhausted ? "El beneficio VIP ya fue utilizado" : "La solicitud VIP ya no es válida para este pedido" });
    }
    if(status==="cancelled")await refundVipBenefitForCancelledOrder(db,{...current,id});
    await ref.update({
        status,
        updatedAt: now,
        [`history/${status}`]: { at:now, label:ORDER_STATUS[status].label }
    });
    if (current.uid) await db.ref(`users/${current.uid}/ultimo_pedido`).set({ id, code:current.code || id, status, updatedAt:now });
    const order = {
        ...current,
        status,
        updatedAt: now,
        history: { ...(current.history || {}), [status]:{ at:now, label:ORDER_STATUS[status].label } }
    };
    let loyalty=null;
    if(status==="delivered")loyalty=await awardLoyaltyForDeliveredOrder(db,id,order);
    await notifyOrderStatus(order);
    return res.status(200).json({ success:true, order:publicOrder(id, order), loyalty });
}

export function calculateDeliveryFee(distanceKm) {
    const km = Math.max(0, Number(distanceKm) || 0);
    if (km <= 2.5) return { baseFee: 40, extraKm: 0, distanceFee: 40 };
    if (km <= 4) return { baseFee: 50, extraKm: 0, distanceFee: 50 };
    if (km <= 5.5) return { baseFee: 60, extraKm: 0, distanceFee: 60 };
    if (km <= 7) return { baseFee: 70, extraKm: 0, distanceFee: 70 };
    if (km <= 10) return { baseFee: 80, extraKm: 0, distanceFee: 80 };
    const extraKm = Math.ceil(km - 10);
    return { baseFee: 80, extraKm, distanceFee: 80 + extraKm * 10 };
}

function isOutsideServiceHours(deliveryAt) {
    if (typeof deliveryAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(deliveryAt)) {
        const hour = Number(deliveryAt.slice(11, 13));
        return hour < 8 || hour >= 23;
    }
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Cancun", hour: "2-digit", hour12: false }).format(new Date()));
    return hour < 8 || hour >= 23;
}

function destinationWaypoint(destination) {
    const placeId = String(destination?.placeId || "").trim();
    if (/^[A-Za-z0-9_-]{10,200}$/.test(placeId)) return { placeId };
    const latitude = Number(destination?.latitude);
    const longitude = Number(destination?.longitude);
    if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
        return { location: { latLng: { latitude, longitude } } };
    }
    const address = String(destination?.address || "").trim().slice(0, 240);
    if (address.length < 8) return null;
    return { address: /canc[uú]n|quintana roo|m[eé]xico/i.test(address) ? address : `${address}, Cancún, Quintana Roo, México` };
}

async function handlePlaceAutocomplete(req, res) {
    const input = String(req.body?.input || "").trim().slice(0, 120);
    if (input.length < 3) return res.status(200).json({ suggestions: [] });
    const apiKey = String(process.env.GOOGLE_ROUTES_API_KEY || "").trim();
    if (!apiKey) return res.status(200).json({ suggestions: [], unavailable: true });
    const sessionToken = String(req.body?.sessionToken || "").trim().slice(0, 80);

    try {
        const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text"
            },
            body: JSON.stringify({
                input,
                ...(sessionToken ? { sessionToken } : {}),
                includedRegionCodes: ["mx"],
                languageCode: "es",
                regionCode: "mx",
                locationBias: { circle: { center: RESTAURANT, radius: 50000 } }
            })
        });
        const data = await response.json();
        if (!response.ok) {
            console.error("Google Places error:", response.status, data?.error?.status || "unknown", data?.error?.message || "");
            return res.status(502).json({ suggestions: [], error: "No pudimos buscar direcciones." });
        }
        const suggestions = (data?.suggestions || []).map(item => item?.placePrediction).filter(Boolean).slice(0, 5).map(place => ({
            placeId: String(place.placeId || ""),
            text: String(place.text?.text || ""),
            main: String(place.structuredFormat?.mainText?.text || place.text?.text || ""),
            secondary: String(place.structuredFormat?.secondaryText?.text || "")
        })).filter(item => item.placeId && item.text);
        return res.status(200).json({ suggestions });
    } catch (error) {
        console.error("Place autocomplete error:", error?.message || error);
        return res.status(500).json({ suggestions: [], error: "No pudimos buscar direcciones." });
    }
}

async function handleDeliveryQuote(req, res) {
    const apiKey = String(process.env.GOOGLE_ROUTES_API_KEY || "").trim();
    if (!apiKey) return res.status(503).json({ error: "El cálculo automático todavía no está habilitado.", code: "GOOGLE_MAPS_NOT_CONFIGURED" });
    const destination = destinationWaypoint(req.body?.destination);
    if (!destination) return res.status(400).json({ error: "Indica una ubicación o dirección válida." });

    try {
        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration" },
            body: JSON.stringify({ origin: { location: { latLng: RESTAURANT } }, destination, travelMode: "DRIVE", routingPreference: "TRAFFIC_UNAWARE", languageCode: "es-MX", units: "METRIC" })
        });
        const data = await response.json();
        if (!response.ok) {
            console.error("Google Routes error:", response.status, data?.error?.status || "unknown", data?.error?.message || "");
            return res.status(502).json({ error: "No pudimos calcular la ruta. Revisa la dirección e inténtalo de nuevo." });
        }
        const route = data?.routes?.[0];
        const distanceMeters = Number(route?.distanceMeters);
        if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return res.status(422).json({ error: "No encontramos una ruta para esta dirección." });

        const distanceKm = Math.round(distanceMeters / 100) / 10;
        const tariff = calculateDeliveryFee(distanceMeters / 1000);
        const address = String(req.body?.destination?.address || "").trim();
        const bonfilSurcharge = /(^|\b)(alfredo v\.? bonfil|bonfil)(\b|$)/i.test(address) ? 20 : 0;
        const plazaSurcharge = req.body?.insidePlaza === true ? 20 : 0;
        const outsideHoursSurcharge = isOutsideServiceHours(req.body?.deliveryAt) ? 20 : 0;
        const rainSurcharge = String(process.env.DELIVERY_RAIN_ACTIVE || "").toLowerCase() === "true" ? 10 : 0;
        const fee = tariff.distanceFee + bonfilSurcharge + plazaSurcharge + outsideHoursSurcharge + rainSurcharge;
        const durationSeconds = Math.max(0, Number.parseInt(String(route.duration || "0s"), 10) || 0);
        return res.status(200).json({ distanceKm, durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)), fee, breakdown: { distance: tariff.distanceFee, base: tariff.baseFee, extraKm: tariff.extraKm, bonfil: bonfilSurcharge, plaza: plazaSurcharge, outsideHours: outsideHoursSurcharge, rain: rainSurcharge } });
    } catch (error) {
        console.error("Delivery quote error:", error?.message || error);
        return res.status(500).json({ error: "No pudimos calcular el envío en este momento." });
    }
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (!["GET","POST","PATCH"].includes(req.method)) {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (req.method === "POST" && req.body?.action === "auth_register") {
        try {
            const nome=cleanOrderText(req.body?.nome,100);
            const telefone=String(req.body?.telefone||"").replace(/\D/g,"");
            const nascimento=String(req.body?.nascimento||"").trim();
            const referidoPor=cleanOrderText(req.body?.referido_por,80);
            if(nome.length<2||telefone.length!==10||!/^\d{4}-\d{2}-\d{2}$/.test(nascimento))return res.status(400).json({error:"Datos de registro inválidos"});
            const db=admin.database();
            const rate=await authRateLimit(db,req,telefone);
            if(!rate.allowed)return res.status(429).json({error:"Demasiados intentos. Intenta nuevamente en unos minutos."});
            const existingSnap=await db.ref("users").orderByChild("telefone").equalTo(telefone).once("value");
            let uid,user,recovered=false;
            if(existingSnap.exists()){
                [uid,user]=Object.entries(existingSnap.val())[0];
                const savedBirth=String(user?.nascimento||user?.cumpleanos||"").trim();
                if(savedBirth&&savedBirth!==nascimento)return res.status(403).json({error:"La fecha de nacimiento no coincide con esta cuenta"});
                await db.ref(`users/${uid}`).update({nascimento,updated_at:new Date().toISOString()});
                recovered=true;
            }else{
                const randomId=crypto.randomBytes(8).readBigUInt64BE().toString();
                uid="user_"+randomId;
                user={nome,telefone,nascimento,pontos:0,pontos_acumulados:0};
                await db.ref(`users/${uid}`).set({
                    ...user,user_id:uid,
                    referido_por:/^user_\d+$/.test(referidoPor)&&referidoPor!==uid?referidoPor:null,
                    referido_recompensado:false,
                    created_at:new Date().toISOString(),
                    updated_at:new Date().toISOString()
                });
            }
            setClientSession(res,uid);
            await clearAuthRate(rate.ref);
            return res.status(200).json({success:true,uid,nome:user?.nome||user?.nombre||nome,telefone,nascimento,recovered});
        } catch(error) {
            return res.status(500).json({error:"No se pudo crear la sesión del cliente",details:error.message});
        }
    }

    if (req.method === "POST" && req.body?.action === "session_restore") {
        try{
            const uid=cleanOrderText(req.body?.uid,80);
            const telefone=String(req.body?.telefone||"").replace(/\D/g,"");
            const nascimento=String(req.body?.nascimento||"").trim();
            if(!/^user_\d+$/.test(uid)||telefone.length!==10)return res.status(400).json({error:"Datos de sesión inválidos"});
            const db=admin.database();
            const rate=await authRateLimit(db,req,telefone);
            if(!rate.allowed)return res.status(429).json({error:"Demasiados intentos. Intenta nuevamente en unos minutos."});
            const snap=await db.ref(`users/${uid}`).once("value");
            if(!snap.exists())return res.status(404).json({error:"Cliente no encontrado"});
            const user=snap.val()||{};
            if(String(user.telefone||"").replace(/\D/g,"")!==telefone)return res.status(403).json({error:"No pudimos validar esta sesión"});
            const savedBirth=String(user.nascimento||user.cumpleanos||"").trim();
            if(savedBirth&&(!nascimento||savedBirth!==nascimento))return res.status(403).json({error:"No pudimos validar esta sesión"});
            setClientSession(res,uid);
            await clearAuthRate(rate.ref);
            return res.status(200).json({success:true,uid,nome:user.nome||user.nombre||"",telefone:user.telefone||"",nascimento:savedBirth});
        }catch(error){return res.status(500).json({error:"No se pudo restaurar la sesión",details:error.message})}
    }

    if (req.method === "POST" && req.body?.action === "delivery_quote") {
        return handleDeliveryQuote(req, res);
    }

    if (req.method === "POST" && req.body?.action === "place_autocomplete") {
        return handlePlaceAutocomplete(req, res);
    }

    if (req.method === "POST" && req.body?.action === "order_create") {
        const uid=cleanOrderText(req.body?.uid,80);
        if(!requireClient(req,res,uid))return;
        return handleOrderCreate(req, res);
    }

    if (req.method === "PATCH" && req.body?.action === "order_status") {
        return handleOrderStatus(req, res);
    }

    if (req.method === "GET" && String(req.query.action || "") === "app_data") {
        const uid=cleanOrderText(req.query.uid,80);
        if(!/^user_\d+$/.test(uid))return res.status(400).json({error:"Cliente inválido"});
        if(!requireClient(req,res,uid))return;
        const db=admin.database();
        const [userSnap,vipSnap,bonusSnap,birthdaySnap,reviewsSnap,promosSnap,rewardsSnap,contactSnap]=await Promise.all([
            db.ref("users/"+uid).once("value"),
            db.ref("config/niveles_vip").once("value"),
            db.ref("config/bonus_pontos").once("value"),
            db.ref("config/cumpleanos").once("value"),
            db.ref("config/reviews").once("value"),
            db.ref("promos").once("value"),
            db.ref("recompensas").once("value"),
            db.ref("config/restaurant_contact").once("value")
        ]);
        if(!userSnap.exists())return res.status(404).json({error:"Cliente no encontrado"});
        const user=userSnap.val()||{};
        const rewards=Object.values(rewardsSnap.val()||{}).filter(r=>r&&r.ativa!==false&&Number(r.pontos||0)>0);
        const promos=Object.entries(promosSnap.val()||{}).map(([id,p])=>({id,...(p||{})}))
            .filter(p=>promoEligibleForUser(p,user,rewards,uid))
            .sort((a,b)=>Number(b.exp||0)-Number(a.exp||0));
        const contact=contactSnap.val()||{};
        return res.status(200).json({
            vip:vipSnap.val()||{},
            bonus:bonusSnap.val()||{},
            birthday:birthdaySnap.val()||{},
            birthday_claims:user.cumpleanos_canjes||{},
            reviews:reviewsSnap.val()||{},
            promos,
            whatsapp:String(contact.whatsapp||"5219986023759").replace(/\D/g,"").slice(0,15)
        });
    }

    if (req.method === "GET" && String(req.query.action || "") === "menu_catalog") {
        const snap=await admin.database().ref("config/menu_catalog").once("value");
        return res.status(200).json({catalog:normalizedCatalog(snap.val()||ORDER_CATALOG)});
    }

    if (req.method === "GET" && String(req.query.action || "") === "admin_catalog") {
        if(!requireAdmin(req,res))return;
        const snap=await admin.database().ref("config/menu_catalog").once("value");
        return res.status(200).json({catalog:normalizedCatalog(snap.val()||ORDER_CATALOG)});
    }

    if (req.method === "POST" && req.body?.action === "catalog_save") {
        if(!requireAdmin(req,res))return;
        const incoming=req.body?.catalog&&typeof req.body.catalog==="object"?req.body.catalog:{};
        const clean={};
        for(const [id,p] of Object.entries(incoming).slice(0,200)){
            const pid=cleanOrderText(id,80);
            const name=cleanOrderText(p?.name,120);
            const price=Math.max(0,Math.round(Number(p?.price||0)*100)/100);
            if(!pid||!name||!Number.isFinite(price))continue;
            const modifiers=(Array.isArray(p?.modifiers)?p.modifiers:[]).slice(0,30).map(m=>({
                id:cleanOrderText(m?.id,80),
                name:cleanOrderText(m?.name,100),
                price:Math.max(0,Math.round(Number(m?.price||0)*100)/100),
                active:m?.active!==false
            })).filter(m=>m.id&&m.name);
            clean[pid]={name,price,active:p?.active!==false,modifiers};
        }
        if(!Object.keys(clean).length)return res.status(400).json({error:"El catálogo no puede quedar vacío"});
        await admin.database().ref("config/menu_catalog").set(clean);
        return res.status(200).json({success:true,catalog:clean});
    }

    if (req.method === "GET" && String(req.query.action || "") === "public_config") {
        const snap = await admin.database().ref("config/restaurant_contact").once("value");
        const cfg = snap.val() || {};
        const whatsapp = String(cfg.whatsapp || "5219986023759").replace(/\D/g,"").slice(0,15);
        return res.status(200).json({ whatsapp: whatsapp || "5219986023759" });
    }

    if (req.method === "GET" && String(req.query.action || "") === "orders") {
        return handleOrdersGet(req, res);
    }

    if (req.method === "GET" && String(req.query.action || "") === "customers") {
        return handleCustomersGet(req, res);
    }

    try {
        if (req.method === "POST") {
            const uid = String(req.body?.uid || "").trim();
            const action = String(req.body?.action || "").trim();

            if (!/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });
            if (!requireClient(req,res,uid)) return;

            if (action === "push_sync") {
                const agora = new Date().toISOString();
                const userRef = admin.database().ref(`users/${uid}`);
                const userSnap = await userRef.once("value");
                if (!userSnap.exists()) return res.status(404).json({ error:"Cliente no encontrado" });

                const permission = ["granted","denied","default"].includes(String(req.body?.permission || ""))
                    ? String(req.body.permission) : "default";
                const optedIn = req.body?.opted_in === true;
                const subscriptionId = String(req.body?.subscription_id || "").trim().slice(0, 200);
                const reason = String(req.body?.reason || "app_open").trim().slice(0, 50);

                await userRef.update({
                    push_status: {
                        permission,
                        opted_in: optedIn,
                        subscription_id: subscriptionId,
                        token_present: req.body?.token_present === true,
                        last_sync: agora,
                        last_reason: reason
                    },
                    push_last_sync: agora
                });

                return res.status(200).json({ success:true, last_sync:agora });
            }

            if (action === "google_review_clicked") {
                const agora = new Date().toISOString();
                const userRef = admin.database().ref(`users/${uid}`);
                const userSnap = await userRef.once("value");
                if (!userSnap.exists()) return res.status(404).json({ error:"Cliente no encontrado" });

                await userRef.update({
                    google_review_clicked: true,
                    google_review_clicked_at: agora
                });

                return res.status(200).json({ success:true });
            }

            const estrelas = Math.floor(Number(req.body?.estrelas || 0));
            const comentario = String(req.body?.comentario || "").trim().slice(0, 1200);
            const compraRef = String(req.body?.compra_ref || "").trim().slice(0, 80);

            if (estrelas < 1 || estrelas > 5) return res.status(400).json({ error:"Calificación inválida" });

            const userRef = admin.database().ref(`users/${uid}`);
            const userSnap = await userRef.once("value");
            if (!userSnap.exists()) return res.status(404).json({ error:"Cliente no encontrado" });

            const user = userSnap.val() || {};
            const agora = new Date().toISOString();
            const feedbackRef = admin.database().ref("feedback").push();
            await admin.database().ref().update({
                [`feedback/${feedbackRef.key}`]: {
                    user_id: uid,
                    nome: user.nome || user.nombre || "",
                    telefone: user.telefone || "",
                    estrelas,
                    comentario,
                    compra_ref: compraRef || user.ultima_compra || "",
                    data: agora
                },
                [`users/${uid}/feedback_last_at`]: agora,
                [`users/${uid}/feedback_last_purchase`]: compraRef || user.ultima_compra || agora
            });

            return res.status(200).json({ success:true, id:feedbackRef.key });
        }

        const uid = String(req.query.uid || "").trim();

        if (!uid) {
            return res.status(400).json({ error: "UID obligatorio" });
        }
        if (!/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });
        if (!requireClientOrAdmin(req,res,uid)) return;

        const snapshot = await admin.database().ref(`users/${uid}`).once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const cliente = snapshot.val();
        const reviewsSnap = await admin.database().ref("config/reviews").once("value");
        const reviewsCfg = reviewsSnap.val() || {};

        return res.status(200).json({
            uid,
            nome: cliente.nome || cliente.nombre || "",
            telefone: cliente.telefone || "",
            nascimento: cliente.nascimento || cliente.cumpleanos || "",
            created_at: cliente.created_at || "",
            pontos: Number(cliente.pontos || 0),
            pontos_acumulados: Number(cliente.pontos_acumulados ?? cliente.pontos ?? 0),
            referidos_recompensados: Number(cliente.referidos_recompensados || 0),
            pontos_indicacao_total: Number(cliente.pontos_indicacao_total || 0),
            ultima_compra: cliente.ultima_compra || "",
            feedback_last_purchase: cliente.feedback_last_purchase || "",
            google_review_clicked: cliente.google_review_clicked === true,
            reviews: {
                ativo: reviewsCfg.ativo !== false,
                google_url: String(reviewsCfg.google_url || ""),
                dias_apos_compra: Math.max(1, Number(reviewsCfg.dias_apos_compra || 3))
            }
        });
    } catch (error) {
        console.error("Erro API cliente:", error);
        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
