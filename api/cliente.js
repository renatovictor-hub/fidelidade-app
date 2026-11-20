import { getFirebaseAdmin } from "../lib/server/firebase.js";
import crypto from "crypto";
import { requireAdmin, isValidSession as isAdminSession } from "../lib/server/admin-auth.js";
import { requireClient, setClientSession } from "../lib/server/client-auth.js";
import { enviarNotificacao } from "../lib/server/onesignal.js";
import { getRestaurantConfig } from "../lib/server/restaurant-config.js";
import { getPublicCompanyConfig } from "../lib/server/tenant-config.js";
import { tenantDatabase, tenantFromRequest, requireTenant } from "../lib/server/tenant-data.js";

import { initialDeliverySettings, normalizeDeliverySettings, deliveryPrice } from "../lib/server/delivery-settings.js";

import { availableComboGroups, normalizeComboGroups, priceCombo } from "../lib/server/menu-combos.js";

import { checkModifierGroups, listedModifierGroups, normalizeMenuSettings, normalizeModifierRules, generalModifierGroups, MAX_PAID_ADDONS } from "../lib/server/menu-settings.js";

const admin=getFirebaseAdmin();

const RESTAURANT_CONFIG=getRestaurantConfig();

function requestDb(req){return tenantDatabase(admin.database(),tenantFromRequest(req));}
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
    "carne":{ name:"Carne", price:45, category:"ESFIHAS SALADAS" },
    "carne-queso":{ name:"Carne con Queso", price:45, category:"ESFIHAS SALADAS" },
    "queso-cremoso":{ name:"Queso Cremoso", price:45, category:"ESFIHAS SALADAS" },
    "marguerita":{ name:"Marguerita", price:45, category:"ESFIHAS SALADAS" },
    "portuguesa":{ name:"Portuguesa", price:45, category:"ESFIHAS SALADAS" },
    "brasilena":{ name:"Brasileña", price:45, category:"ESFIHAS SALADAS" },
    "brasilena-habanero":{ name:"Brasileña Habanero", price:45, category:"ESFIHAS SALADAS" },
    "dulce-leche":{ name:"Dulce de Leche", price:50, category:"ESFIHAS DULCES" },
    "platano-lechera":{ name:"Plátano con Lechera", price:50, category:"ESFIHAS DULCES" },
    "chabacano-macha":{ name:"Chabacano con Macha", price:50, category:"ESFIHAS DULCES" },
    "romeo-julieta":{ name:"Romeo y Julieta", price:50, category:"ESFIHAS DULCES" },
    "coxinha":{ name:"Coxinha", price:50, category:"COXINHAS" },
    "coca-600":{ name:"Coca-Cola 600 ml", price:35, category:"BEBIDAS" }
});

function normalizeOrderName(value){
    return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

function catalogFallback(tenant="uai-so"){
    return tenant==="uai-so" && RESTAURANT_CONFIG.legacyCatalogFallback ? ORDER_CATALOG : {};
}
function normalizedCatalog(raw,includeInactive=false,tenant="uai-so",settings={groups:[]}){
    const source=raw&&typeof raw==="object"&&Object.keys(raw).length?raw:catalogFallback(tenant);
    const catalog={};
    for(const [id,p] of Object.entries(source)){
        const name=cleanOrderText(p?.name,120),price=Number(p?.price??0);
        if(!name||!Number.isFinite(price)||price<0||!validCatalogId(id))continue;
        catalog[id]={
            name,price,category:cleanOrderText(p.category||(tenant==="uai-so"&&ORDER_CATALOG[id]?.category)||"OTROS",80),active:p.active!==false,
            image:cleanOrderText(p.image,800),description:cleanOrderText(p.description,240),
            modifiers:Array.isArray(p.modifiers)?p.modifiers.slice(0,30):[]
        };
        if(Array.isArray(p.modifierGroupIds)&&p.modifierGroupIds.length)catalog[id].modifierGroupIds=p.modifierGroupIds;
        if(Array.isArray(p.modifierGroupRules)&&p.modifierGroupRules.length)catalog[id].modifierGroupRules=p.modifierGroupRules;
        if(p.type==="combo"){
            catalog[id].type="combo";
            catalog[id].groups=normalizeComboGroups(p.groups);
        }
    }
    if(includeInactive)return catalog;
    for(const item of Object.values(catalog)){
        if(!item.modifierGroupRules&&!item.modifierGroupIds)continue;
        item.modifierGroups=listedModifierGroups(item.modifierGroupRules,settings.groups,item.modifierGroupIds);
        if(item.modifierGroups.some(group=>group.min>0&&(!group.options.length||(group.repeat===false&&group.options.length<group.min))))item.active=false;
    }
    return Object.fromEntries(Object.entries(catalog).flatMap(([id,item])=>{
        if(!item.active)return [];
        if(item.type!=="combo")return [[id,item]];
        const groups=availableComboGroups(item.groups,catalog);
        return groups?[[id,{...item,groups}]]:[];
    }));
}

function validCatalogId(id){
    return /^[a-zA-Z0-9_-]{1,80}$/.test(id)&&!Object.hasOwn(Object.prototype,id);
}

async function saveCatalogItem(req,res){
    if(!requireAdmin(req,res))return;
    const {id,item,previous,photo}=req.body;
    const name=cleanOrderText(item?.name,120),price=Number(item?.price);
    if(typeof id!=="string"||!validCatalogId(id)||!name||!Number.isFinite(price)||price<0||price>100000){
        return res.status(400).json({error:"Revisa el nombre y el precio del artículo."});
    }
    const tenant=tenantFromRequest(req);
    let image=cleanOrderText(item.image,800);
    let photoData;
    if(photo!==undefined){
        if(typeof photo!=="string"||photo.length>175000||!/^[A-Za-z0-9+/]+={0,2}$/.test(photo)){
            return res.status(400).json({error:"La foto supera el tamaño permitido o tiene un formato inválido."});
        }
        const bytes=Buffer.from(photo,"base64");
        if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff){
            return res.status(400).json({error:"No se pudo leer la foto."});
        }
        const version=crypto.createHash("sha256").update(bytes).digest("hex").slice(0,16);
        image="/api/cliente?"+new URLSearchParams({action:"menu_photo",id,company:tenant,v:version});
        photoData=photo;
    }
    if(image&&image!=="-"&&!/^(https?:\/\/|\/(?!\/))/i.test(image)){
        return res.status(400).json({error:"Usa un enlace válido para la foto."});
    }
    const entry={
        name, price:cleanOrderMoney(price), category:cleanOrderText(item.category,80)||"OTROS",
        active:item.active!==false, image, description:cleanOrderText(item.description,240),
        modifiers:[]
    };
    if(item.type==="combo"){
        entry.type="combo";
        entry.groups=normalizeComboGroups(item.groups);
        if(!entry.groups)return res.status(400).json({error:"Revisa las cantidades y los productos del combo."});
    }else{
        const modifiers=Array.isArray(item.modifiers)?item.modifiers:[];
        const ids=new Set();
        for(const modifier of modifiers.slice(0,30)){
            const mid=String(modifier?.id||""),mname=cleanOrderText(modifier?.name,100),mprice=Number(modifier?.price);
            if(!validCatalogId(mid)||!mname||ids.has(mid)||!Number.isFinite(mprice)||mprice<0||mprice>100000){
                return res.status(400).json({error:"Revisa los nombres y precios de los complementos."});
            }
            ids.add(mid);
            entry.modifiers.push({id:mid,name:mname,price:cleanOrderMoney(mprice),active:modifier.active!==false});
        }
    }
    if(item.modifierGroupRules!==undefined){
        const settings=await loadMenuSettings(requestDb(req));
        const rules=normalizeModifierRules(item.modifierGroupRules,settings.groups);
        if(!rules)return res.status(400).json({error:"Revisa los grupos y sus límites para este artículo."});
        if(rules.length)entry.modifierGroupRules=rules;
    }else if(item.type!=="combo"&&Array.isArray(item.modifierGroupIds)&&item.modifierGroupIds.length){
        const settings=await loadMenuSettings(requestDb(req));
        const ids=[...new Set(item.modifierGroupIds)];
        if(ids.length>10||ids.some(id=>!settings.groups.some(group=>group.id===id))){
            return res.status(400).json({error:"Revisa los grupos de complementos de este producto."});
        }
        entry.modifierGroupIds=ids;
    }
    const ref=requestDb(req).ref("config/menu_catalog");
    // Prime the transaction with the current state before comparing the edited item.
    await ref.once("value");
    let error="";
    const result=await ref.transaction(current=>{
        const catalog=normalizedCatalog(current,true,tenant);
        const existing=Object.hasOwn(catalog,id)?catalog[id]:null;
        if(JSON.stringify(existing)!==JSON.stringify(previous??null)){
            error="El artículo cambió. Recarga el menú antes de editarlo.";
            return;
        }
        if(!existing&&Object.keys(catalog).length>=200){
            error="El catálogo ya tiene 200 artículos.";
            return;
        }
        if(entry.groups?.some(group=>group.options.some(option=>
            !Object.hasOwn(catalog,option.productId)||catalog[option.productId].type==="combo"||option.productId===id
        ))){
            error="El combo debe usar productos del catálogo.";
            return;
        }
        const stored=current?.[id];
        const savedPhoto=photoData??(stored?.image===entry.image?stored.photoData:undefined);
        const next=savedPhoto?{...entry,photoData:savedPhoto}:entry;
        return {...(current&&Object.keys(current).length?current:catalog),[id]:next};
    });
    if(!result.committed)return res.status(409).json({error:error||"No se pudo guardar el artículo."});
    return res.status(200).json({catalog:normalizedCatalog(result.snapshot.val(),true,tenant)});
}

function priceModifiers(requested, legacyOptions, groups, qty) {
    const requestedModifiers=Array.isArray(requested)?requested:[];
    if(requestedModifiers.length>230)return null;
    const available=new Map([...(legacyOptions||[]),...(groups||[]).flatMap(group=>group.options)]
        .filter(option=>option?.active!==false).map(option=>[option.id,option]));
    const generalLimits=new Map((groups||[]).filter(group=>group.freeLimit!==undefined)
        .flatMap(group=>group.options.map(option=>[option.id,option.price>0?MAX_PAID_ADDONS:group.freeLimit])));
    const validated=[], modifierDetails=[];
    const seen=new Set();
    let modifierTotal=0;
    for(const modifier of requestedModifiers){
        const id=String(modifier?.id||"").trim();
        const allowed=available.get(id);
        if(!allowed||seen.has(id))return null;
        seen.add(id);
        const requestedQty=Number(modifier?.qty);
        const shared=id.startsWith("group:");
        const count=shared?requestedQty:Math.max(1,Math.min(qty,Math.floor(requestedQty)||1));
        if(shared&&(!Number.isSafeInteger(count)||count<1||count>(generalLimits.get(id)??20*qty)))return null;
        validated.push({id,qty:count});
        modifierTotal+=Math.max(0,Number(allowed.price||0))*count;
        modifierDetails.push(allowed.name+" ×"+count);
    }
    return checkModifierGroups(groups,validated,qty)?{modifierTotal,modifierDetails,validated}:null;
}

function secureOrderItems(items,catalog) {
    if (!Array.isArray(items) || items.length > 50) return { items:[], invalid:true };
    const byName=new Map(Object.entries(catalog).map(([id,p])=>[normalizeOrderName(p.name),{id,...p}]));
    const priced=[];
    let invalid=false;
    for (const raw of items) {
        const requestedId=cleanOrderText(raw?.productId,80);
        const byId=Object.hasOwn(catalog,requestedId) ? catalog[requestedId] : null;
        const byNameMatch=!requestedId ? byName.get(normalizeOrderName(raw?.name)) : null;
        const product=byId ? {id:requestedId,...byId} : byNameMatch;
        if(!product){invalid=true;continue}
        const qty=Math.max(1,Math.min(99,Math.floor(Number(raw?.qty)||1)));
        const modifiers=priceModifiers(raw?.modifiers,product.modifiers,product.modifierGroups,qty);
        if(!modifiers){invalid=true;continue}
        const { modifierTotal, modifierDetails, validated }=modifiers;
        const note=cleanOrderText(raw?.note,200);
        if(product.type==="combo"){
            const combo=priceCombo(product.groups,raw?.comboSelections??[],qty);
            if(!combo){invalid=true;continue}
            priced.push({
                productId:product.id,name:product.name,qty,
                unitPrice:product.price+(combo.surcharge+modifierTotal)/qty,baseUnitPrice:product.price,
                components:combo.components,modifiers:validated,
                details:[...combo.components.map(component=>`${component.qty}× ${component.name}`),
                    ...modifierDetails,note].filter(Boolean).join(", ")
            });
            continue;
        }
        priced.push({
            productId:product.id,
            name:product.name,
            qty,
            unitPrice:product.price+(modifierTotal/qty),
            baseUnitPrice:product.price,
            modifiers:validated,
            details:modifierDetails.length?[...modifierDetails,note&&"Nota: "+note].filter(Boolean).join(", "):cleanOrderText(raw?.details,300)
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
        generalModifiers: order.generalModifiers || null,
        route: order.route || null,
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
        titulo: `${meta.label} · ${order.code || RESTAURANT_CONFIG.shortName}`,
        mensagem: meta.push,
        url: RESTAURANT_CONFIG.domain+"/"
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

async function deliveryCompany(req) {
    const id = tenantFromRequest(req);
    return id === "uai-so" ? { id, timezone: RESTAURANT_CONFIG.timezone, currency: RESTAURANT_CONFIG.currency, modules: RESTAURANT_CONFIG.modules }
        : getPublicCompanyConfig(admin, { query: { company: id } }, RESTAURANT_CONFIG);
}

async function loadDeliverySettings(db, company) {
    const snapshot = (await db.ref("config/delivery_settings").once("value")).val();
    const defaults = initialDeliverySettings(company.id === "uai-so", RESTAURANT_CONFIG);
    return { settings: normalizeDeliverySettings(snapshot?.settings) || defaults, revision: snapshot?.revision || "" };
}

async function handleDeliverySettings(req, res, company) {
    if (!requireAdmin(req, res)) return;
    const db = requestDb(req);
    if (req.method === "GET") return res.status(200).json({...(await loadDeliverySettings(db, company)), currency:company.currency});
    const settings = normalizeDeliverySettings(req.body?.settings);
    if (!settings) return res.status(400).json({ error: "Revisa las coordenadas, los montos y el orden de las distancias." });
    const ref = db.ref("config/delivery_settings");
    const next = { settings, revision: crypto.randomUUID() };
    let listener;
    try {
        await new Promise((resolve, reject) => {
            listener = () => resolve();
            ref.on("value", listener, reject);
        });
        const saved = await ref.transaction(current => {
            if ((current?.revision || "") === req.body?.revision) return next;
        }, undefined, false);
        if (!saved.committed) return res.status(409).json({error:"La configuración cambió. Recarga antes de guardar."});
        return res.status(200).json(next);
    } finally {
        if (listener) ref.off("value", listener);
    }
}

async function addressFromDeliveryLocation({latitude, longitude}, apiKey) {
    const key = String(process.env.GOOGLE_GEOCODING_API_KEY || apiKey).trim();
    const params = new URLSearchParams({latlng:`${latitude},${longitude}`,language:"es",key});
    try {
        const response = await fetch("https://maps.googleapis.com/maps/api/geocode/json?" + params, {
            signal: AbortSignal.timeout(4500)
        });
        if (!response.ok) {
            console.warn("Delivery geocoding HTTP status:", response.status);
            return "";
        }
        const data = await response.json();
        if (data.status !== "OK" || !Array.isArray(data.results)) {
            const status = ["ZERO_RESULTS", "OVER_QUERY_LIMIT", "OVER_DAILY_LIMIT", "REQUEST_DENIED", "INVALID_REQUEST", "UNKNOWN_ERROR"]
                .find(value => value === data.status) || "UNEXPECTED_RESPONSE";
            const detail = String(data.error_message || "");
            const reason = /not (?:been )?activated|not (?:been )?enabled|has not been used/i.test(detail) ? "API_DISABLED"
                : /not authori[sz]ed|restriction|referer|referrer/i.test(detail) ? "KEY_RESTRICTED"
                : /billing/i.test(detail) ? "BILLING"
                : /api key is invalid/i.test(detail) ? "INVALID_KEY" : "";
            console.warn("Delivery geocoding status:", status, reason);
            return "";
        }
        const result = data.results.find(row => row.types?.some(type =>
            ["street_address", "premise", "subpremise", "establishment", "route"].includes(type)));
        if (!result?.formatted_address) {
            console.info("Delivery geocoding returned no street address");
            return "";
        }
        const address = cleanOrderText(result.formatted_address, 180);
        const compare = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const district = result.address_components?.find(component =>
            component.types?.some(type=>["neighborhood","sublocality_level_1"].includes(type)) &&
            typeof component.long_name === "string" && !compare(address).includes(compare(component.long_name)));
        return cleanOrderText(district ? `${address}, ${district.long_name}` : address, 220);
    } catch (error) {
        console.warn("Delivery geocoding failed:", error?.name === "TimeoutError" ? "TIMEOUT" : "REQUEST_FAILED");
        return "";
    }
}

async function secureDeliveryQuote(body, db, company){
    const { settings } = await loadDeliverySettings(db, company);
    if (!normalizeDeliverySettings(settings)) {
        throw Object.assign(new Error("Este restaurante todavía no configuró sus tarifas de envío."), { status: 503 });
    }
    const raw = body.deliveryDestination || {};
    const destination = destinationWaypoint(raw, settings.addressSuffix);
    if (!destination) throw Object.assign(new Error("Indica una ubicación o dirección válida."), { status: 400 });
    const apiKey = String(process.env.GOOGLE_ROUTES_API_KEY || "").trim();
    if (!apiKey) throw Object.assign(new Error("El cálculo automático de envío no está disponible en este momento."), { status: 503 });
    const hasZoneSurcharges = settings.zones.some(zone => zone.fee > 0);
    let address = cleanOrderText(raw.address, 220);
    if (address.length < 8 && destination.location) {
        address = await addressFromDeliveryLocation(destination.location.latLng, apiKey);
        if (address.length < 8 && hasZoneSurcharges) {
            throw Object.assign(new Error("Guardamos tu ubicación. Escribe la calle, el número y la colonia para calcular el envío desde ese punto."), { status: 422 });
        }
    }
    if (address.length < 8 && hasZoneSurcharges) {
        throw Object.assign(new Error("Agrega la dirección completa, incluida la colonia, para calcular el recargo de zona."), { status: 400 });
    }
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration" },
        body: JSON.stringify({ origin: { location: { latLng: settings.origin } }, destination, travelMode: "DRIVE",
            routingPreference: "TRAFFIC_UNAWARE", languageCode: "es-MX", units: "METRIC" })
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error("No pudimos calcular la ruta. Revisa la dirección."), { status: 502 });
    const route = data?.routes?.[0], distanceMeters = Number(route?.distanceMeters);
    if (!Number.isInteger(distanceMeters) || distanceMeters < 0) {
        throw Object.assign(new Error("No encontramos una ruta para esta dirección."), { status: 422 });
    }
    const price = deliveryPrice(settings, distanceMeters, {
        address, insidePlaza: body.insidePlaza === true,
        residential: body.residential === true, deliveryAt: body.deliveryAt, timezone: company.timezone
    });
    if (!price) throw Object.assign(new Error("La dirección está fuera de la zona de entrega."), { status: 422 });
    const durationSeconds = Math.max(0, Number.parseInt(String(route.duration || "0s"),10) || 0);
    return { distanceKm: distanceMeters / 1000, durationMinutes: Math.max(1,Math.ceil(durationSeconds/60)), address, ...price };
}

async function loadMenuSettings(db){
    const snap=await db.ref("config/menu_workspace").once("value");
    return normalizeMenuSettings(snap.val())||{categories:[],groups:[],generalRules:[]};
}

async function loadMenuCatalog(db,tenant="uai-so",includeInactive=false){
    const [catalogSnap,settings]=await Promise.all([
        db.ref("config/menu_catalog").once("value"),
        loadMenuSettings(db)
    ]);
    return {catalog:normalizedCatalog(catalogSnap.val(),includeInactive,tenant,settings),settings};
}

async function saveMenuSettings(req,res){
    if(!requireAdmin(req,res))return;
    const settings=normalizeMenuSettings(req.body.settings);
    if(!settings)return res.status(400).json({error:"Revisa los nombres, opciones y límites del menú."});
    const db=requestDb(req);
    const ref=db.ref("config/menu_workspace");
    const previous=normalizeMenuSettings(req.body.previous);
    if(!previous)return res.status(400).json({error:"Recarga el menú antes de guardar."});
    let listener;
    let updated;
    try {
        // Keep the workspace in the local Firebase cache until the transaction finishes.
        await new Promise((resolve,reject)=>{
            listener=()=>resolve();
            ref.on("value",listener,reject);
        });
        const previousJson=JSON.stringify(previous);
        updated=await ref.transaction(current=>{
            if(JSON.stringify(normalizeMenuSettings(current))!==previousJson)return;
            return settings;
        },undefined,false);
    } finally {
        if(listener)ref.off("value",listener);
    }
    if(!updated.committed)return res.status(409).json({error:"El menú cambió. Recarga la pantalla antes de guardar."});
    return res.status(200).json({settings});
}

async function getMenuPhoto(req,res){
    const id=String(req.query.id||"");
    const version=String(req.query.v||"");
    if(!validCatalogId(id)||!/^[0-9a-f]{16}$/.test(version))return res.status(404).end();
    const snap=await requestDb(req).ref(`config/menu_catalog/${id}/photoData`).once("value");
    const encoded=snap.val();
    if(typeof encoded!=="string")return res.status(404).end();
    const bytes=Buffer.from(encoded,"base64");
    if(crypto.createHash("sha256").update(bytes).digest("hex").slice(0,16)!==version)return res.status(404).end();
    res.setHeader("Content-Type","image/jpeg");
    res.setHeader("Cache-Control","public, max-age=31536000, immutable");
    return res.status(200).end(bytes);
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
    const nowCancun=new Date(new Date().toLocaleString("en-US",{timeZone:RESTAURANT_CONFIG.timezone}));
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
            if(refSnap.exists()){
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
                        friendPts?enviarNotificacao({uid:order.uid,telefone:order.phone||"",titulo:"🎁 ¡Bonus por invitación!",mensagem:`Ganaste ${friendPts} puntos extra por tu primera compra con invitación.`,url:RESTAURANT_CONFIG.domain+"/"}):null,
                        refPts?enviarNotificacao({uid:refUid,telefone:refSnap.val()?.telefone||"",titulo:"🤝 ¡Tu amigo compró!",mensagem:`Ganaste ${refPts} puntos porque tu amigo hizo su primera compra válida.`,url:RESTAURANT_CONFIG.domain+"/"}):null
                    ]);
            }
            }
        }
    }
    await db.ref("pedidos/"+id).update({loyalty_awarded:true,loyalty_points:points,loyalty_awarded_at:new Date().toISOString(),loyalty_referral:referral});
    await enviarNotificacao({uid:order.uid,telefone:order.phone||"",titulo:"⭐ ¡Ganaste puntos!",mensagem:`Sumaste ${points} puntos por tu pedido. Ya están disponibles en tu cuenta.`,url:RESTAURANT_CONFIG.domain+"/"}).catch(()=>null);
    return {awarded:true,points,referral};
}

async function handleOrderCreate(req, res, company) {
    const body = req.body || {};
    const uid = cleanOrderText(body.uid, 80);
    if (uid && !/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });
    const db = requestDb(req);
    const {catalog,settings}=await loadMenuCatalog(db,tenantFromRequest(req));
    const secure = secureOrderItems(body.items,catalog);
    const items = secure.items;
    if (secure.invalid) return res.status(400).json({ error:"El pedido contiene un producto no válido o con precio desactualizado." });
    if (!items.length) return res.status(400).json({ error:"El pedido no tiene productos" });
    const looseItems=items.filter(item=>catalog[item.productId]?.type!=="combo")
        .map(item=>({category:catalog[item.productId].category,qty:item.qty}));
    const generalGroups=generalModifierGroups(settings,looseItems);
    const general=priceModifiers(body.generalModifiers,[],generalGroups,1);
    if(!general)return res.status(400).json({error:"Revisa los complementos generales para tus productos sueltos."});
    const orderRef = db.ref("pedidos").push();
    const now = new Date().toISOString();
    const code = `US-${now.slice(2,10).replace(/-/g,"")}-${orderRef.key.slice(-4).toUpperCase()}`;
    let profile = {};
    if (uid) {
        const snap = await db.ref(`users/${uid}`).once("value");
        if (snap.exists()) profile = snap.val() || {};
    }
    const status = "received";
    const subtotal = Math.round(items.reduce((sum,item)=>sum+(item.unitPrice*item.qty),general.modifierTotal)*100)/100;
    const fulfillment = body.fulfillment === "pickup" ? "pickup" : "delivery";
    let secureRoute=null, originalDeliveryFee=0;
    if(fulfillment==="delivery"){
        try{secureRoute=await secureDeliveryQuote({...body,deliveryAt:body.scheduledAt},db,company);originalDeliveryFee=secureRoute.fee}
        catch(error){return res.status(error.status||500).json({error:error.message||"No pudimos validar el envío."})}
        if (Number(body.deliveryFee) !== originalDeliveryFee) {
            return res.status(409).json({ error:"La tarifa de envío cambió. Revisa el nuevo total antes de confirmar.",
                code:"DELIVERY_FEE_CHANGED", quote:secureRoute });
        }
    }
    const requestedVipId = cleanOrderText(body.benefit_request_id, 120);
    const vipRequest = requestedVipId ? await claimVipRequestForOrder(db, requestedVipId, uid, orderRef.key) : null;
    if (requestedVipId && !vipRequest) return res.status(409).json({ error:"El beneficio VIP ya no está disponible para este pedido. Vuelve a solicitarlo." });
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
        address: secureRoute?.address || cleanOrderText(body.address, 260),
        references: cleanOrderText(body.references, 180),
        payment: cleanOrderText(body.payment, 80),
        route: secureRoute ? {
            distanceKm: secureRoute.distanceKm,
            durationMinutes: secureRoute.durationMinutes,
            breakdown: secureRoute.breakdown
        } : null,
        items,
        generalModifiers: general.modifierDetails.length ? {
            selections:general.validated, details:general.modifierDetails.join(", "), total:cleanOrderMoney(general.modifierTotal)
        } : null,
        history: { received: { at: now, label: ORDER_STATUS.received.label } }
    };

    await orderRef.set(order);
    if (uid) await db.ref(`users/${uid}/ultimo_pedido`).set({ id:orderRef.key, code, status, updatedAt:now });
    return res.status(201).json({ success:true, order:publicOrder(orderRef.key, order) });
}

async function handleCustomersGet(req, res) {
    if (!requireAdmin(req, res)) return;

    const db = requestDb(req);
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
    const db = requestDb(req);
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

    const db = requestDb(req);
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

function destinationWaypoint(destination, addressSuffix) {
    const placeId = String(destination?.placeId || "").trim();
    if (/^[A-Za-z0-9_-]{10,200}$/.test(placeId)) return { placeId };
    const latitude = destination?.latitude;
    const longitude = destination?.longitude;
    if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
        return { location: { latLng: { latitude, longitude } } };
    }
    const address = String(destination?.address || "").trim().slice(0, 240);
    if (address.length < 8) return null;
    const suffix=String(addressSuffix||"").trim();
    if(!suffix)return {address};
    const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    const city=norm(suffix.split(",")[0]);
    const full=norm(address);
    return { address: city&&full.includes(city) ? address : `${address}, ${suffix}` };
}

async function handlePlaceAutocomplete(req, res, company) {
    const input = String(req.body?.input || "").trim().slice(0, 120);
    if (input.length < 3) return res.status(200).json({ suggestions: [] });
    const apiKey = String(process.env.GOOGLE_ROUTES_API_KEY || "").trim();
    if (!apiKey) return res.status(200).json({ suggestions: [], unavailable: true });
    const sessionToken = String(req.body?.sessionToken || "").trim().slice(0, 80);

    try {
        const {settings} = await loadDeliverySettings(requestDb(req), company);
        const hasOrigin = Number.isFinite(settings.origin.latitude) && Number.isFinite(settings.origin.longitude);
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
                ...(hasOrigin ? { locationBias: { circle: { center: settings.origin, radius: 50000 } } } : {})
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

async function handleDeliveryQuote(req, res, company) {
    try {
        const quote = await secureDeliveryQuote({ ...req.body, deliveryDestination: req.body.destination }, requestDb(req), company);
        return res.status(200).json(quote);
    } catch (error) {
        if (!error.status) console.error("Delivery quote error:", error?.message || error);
        return res.status(error.status || 500).json({ error: error.status ? error.message : "No pudimos calcular el envío en este momento." });
    }
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (!["GET","POST","PATCH"].includes(req.method)) {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const activeTenant=await requireTenant(admin,req,res);
    if(!activeTenant)return;

    if (req.method === "POST" && req.body?.action === "auth_register") {
        try {
            const nome=cleanOrderText(req.body?.nome,100);
            const telefone=String(req.body?.telefone||"").replace(/\D/g,"");
            const nascimento=String(req.body?.nascimento||"").trim();
            const referidoPor=cleanOrderText(req.body?.referido_por,80);
            if(nome.length<2||telefone.length!==10||!/^\d{4}-\d{2}-\d{2}$/.test(nascimento))return res.status(400).json({error:"Datos de registro inválidos"});
            const db=requestDb(req);
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
            setClientSession(res,uid,tenantFromRequest(req));
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
            const db=requestDb(req);
            const rate=await authRateLimit(db,req,telefone);
            if(!rate.allowed)return res.status(429).json({error:"Demasiados intentos. Intenta nuevamente en unos minutos."});
            const snap=await db.ref(`users/${uid}`).once("value");
            if(!snap.exists())return res.status(404).json({error:"Cliente no encontrado"});
            const user=snap.val()||{};
            if(String(user.telefone||"").replace(/\D/g,"")!==telefone)return res.status(403).json({error:"No pudimos validar esta sesión"});
            const savedBirth=String(user.nascimento||user.cumpleanos||"").trim();
            if(savedBirth&&(!nascimento||savedBirth!==nascimento))return res.status(403).json({error:"No pudimos validar esta sesión"});
            setClientSession(res,uid,tenantFromRequest(req));
            await clearAuthRate(rate.ref);
            return res.status(200).json({success:true,uid,nome:user.nome||user.nombre||"",telefone:user.telefone||"",nascimento:savedBirth});
        }catch(error){return res.status(500).json({error:"No se pudo restaurar la sesión",details:error.message})}
    }

    const deliveryAction = req.method === "GET" ? req.query?.action : req.method === "POST" ? req.body?.action : "";
    if (["delivery_settings", "delivery_quote", "place_autocomplete", "order_create"].includes(deliveryAction)) {
        const company = await deliveryCompany(req);
        if (!company?.modules?.delivery) return res.status(403).json({error:"El módulo Delivery no está habilitado para este restaurante."});
        if (deliveryAction === "delivery_settings") return handleDeliverySettings(req, res, company);
        if (req.method === "POST") {
            if (deliveryAction === "delivery_quote") return handleDeliveryQuote(req, res, company);
            if (deliveryAction === "place_autocomplete") return handlePlaceAutocomplete(req, res, company);
            const uid = cleanOrderText(req.body?.uid, 80);
            if (!requireClient(req, res, uid)) return;
            return handleOrderCreate(req, res, company);
        }
    }

    if (req.method === "PATCH" && req.body?.action === "order_status") {
        return handleOrderStatus(req, res);
    }

    if (req.method === "GET" && String(req.query.action || "") === "app_data") {
        const uid=cleanOrderText(req.query.uid,80);
        if(!/^user_\d+$/.test(uid))return res.status(400).json({error:"Cliente inválido"});
        if(!requireClient(req,res,uid))return;
        const db=requestDb(req);
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
        const tenantCfg=await getPublicCompanyConfig(admin,req,RESTAURANT_CONFIG);
        return res.status(200).json({
            restaurant:tenantCfg||{
                restaurant_id:"uai-so",
                name:RESTAURANT_CONFIG.name,
                short_name:RESTAURANT_CONFIG.shortName,
                logo:RESTAURANT_CONFIG.logo,
                primary_color:RESTAURANT_CONFIG.primaryColor,
                accent_color:RESTAURANT_CONFIG.accentColor,
                instagram_url:RESTAURANT_CONFIG.instagramUrl,
                modules:RESTAURANT_CONFIG.modules
            },
            vip:vipSnap.val()||{},
            bonus:bonusSnap.val()||{},
            birthday:birthdaySnap.val()||{},
            birthday_claims:user.cumpleanos_canjes||{},
            reviews:reviewsSnap.val()||{},
            promos,
            whatsapp:String(contact.whatsapp||tenantCfg?.whatsapp||RESTAURANT_CONFIG.whatsapp).replace(/\D/g,"").slice(0,15)
        });
    }

    if(req.method==="GET"&&req.query.action==="menu_photo")return getMenuPhoto(req,res);

    if (req.method === "GET" && req.query.action === "menu_catalog") {
        const {catalog,settings}=await loadMenuCatalog(requestDb(req),tenantFromRequest(req));
        return res.status(200).json({catalog,categories:settings.categories,generalModifierGroups:generalModifierGroups(settings)});
    }

    if (req.method === "GET" && req.query.action === "admin_catalog") {
        if(!requireAdmin(req,res))return;
        return res.status(200).json(await loadMenuCatalog(requestDb(req),tenantFromRequest(req),true));
    }

    if(req.method==="POST"&&req.body?.action==="menu_settings_save")return saveMenuSettings(req,res);

    if (req.method === "POST" && req.body?.action === "catalog_item_save") {
        return saveCatalogItem(req,res);
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
            clean[pid]={name,category:cleanOrderText(p?.category||"OTROS",80),price,active:p?.active!==false,image:cleanOrderText(p?.image,800),description:cleanOrderText(p?.description,240),modifiers};
        }
        if(!Object.keys(clean).length)return res.status(400).json({error:"El catálogo no puede quedar vacío"});
        const ref=requestDb(req).ref("config/menu_catalog");
        await ref.transaction(current=>Object.fromEntries(Object.entries(clean).map(([pid,item])=>{
            const stored=current?.[pid];
            if(!stored)return [pid,item];
            const {photoData,modifierGroupIds,modifierGroupRules,type,groups}=stored;
            return [pid,{...item,...(item.image===stored.image&&photoData?{photoData}:{}),
                ...(modifierGroupIds?{modifierGroupIds}:{}),...(modifierGroupRules?{modifierGroupRules}:{}),...(type==="combo"?{type,groups}:{})}];
        })));
        return res.status(200).json({success:true,catalog:clean});
    }

    if (req.method === "GET" && String(req.query.action || "") === "installation_status") {
        if(!requireAdmin(req,res))return;
        const has=name=>String(process.env[name]||"").trim().length>0;
        const items=[
            {id:"identity",label:"Identidad del restaurante",ok:!!(RESTAURANT_CONFIG.id&&RESTAURANT_CONFIG.name&&RESTAURANT_CONFIG.domain&&RESTAURANT_CONFIG.whatsapp),detail:"Nombre, dominio y WhatsApp"},
            {id:"firebase",label:"Firebase",ok:["FIREBASE_PROJECT_ID","FIREBASE_DATABASE_URL","FIREBASE_CLIENT_EMAIL","FIREBASE_PRIVATE_KEY"].every(has),detail:"Proyecto y cuenta de servicio aislados"},
            {id:"onesignal",label:"OneSignal",ok:!!RESTAURANT_CONFIG.oneSignalAppId&&has("ONESIGNAL_REST_KEY"),detail:"App y REST key del restaurante"},
            {id:"google",label:"Google Maps / Routes",ok:RESTAURANT_CONFIG.modules.delivery?has("GOOGLE_ROUTES_API_KEY"):true,detail:RESTAURANT_CONFIG.modules.delivery?"Obligatorio para Delivery":"No requerido sin Delivery"},
            {id:"admin_security",label:"Seguridad del panel",ok:has("DASHBOARD_PASSWORD")&&(has("ADMIN_SESSION_SECRET")||has("DASHBOARD_PASSWORD")),detail:"Contraseña y sesión administrativa"},
            {id:"client_security",label:"Sesión de clientes",ok:has("CLIENT_SESSION_SECRET")||has("DASHBOARD_PASSWORD"),detail:"Firma de sesión de cliente"}
        ];
        return res.status(200).json({ready:items.every(x=>x.ok),restaurant:{id:RESTAURANT_CONFIG.id,name:RESTAURANT_CONFIG.name,modules:RESTAURANT_CONFIG.modules},items});
    }

    if (req.method === "GET" && String(req.query.action || "") === "public_config") {
        const cfg = await getPublicCompanyConfig(admin, req, RESTAURANT_CONFIG);
        if (!cfg) return res.status(404).json({ error:"Empresa no encontrada" });
        return res.status(200).json(cfg);
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
                const userRef = requestDb(req).ref(`users/${uid}`);
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
                const userRef = requestDb(req).ref(`users/${uid}`);
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

            const userRef = requestDb(req).ref(`users/${uid}`);
            const userSnap = await userRef.once("value");
            if (!userSnap.exists()) return res.status(404).json({ error:"Cliente no encontrado" });

            const user = userSnap.val() || {};
            const agora = new Date().toISOString();
            const feedbackRef = requestDb(req).ref("feedback").push();
            await requestDb(req).ref().update({
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

        const snapshot = await requestDb(req).ref(`users/${uid}`).once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const cliente = snapshot.val();
        const reviewsSnap = await requestDb(req).ref("config/reviews").once("value");
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
