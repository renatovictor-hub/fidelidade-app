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

function cleanOrderText(value, max = 220) {
    return String(value ?? "").trim().slice(0, max);
}

function cleanOrderMoney(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
}

function cleanOrderItems(items) {
    if (!Array.isArray(items)) return [];
    return items.slice(0, 50).map(item => ({
        name: cleanOrderText(item?.name, 100),
        qty: Math.max(1, Math.min(99, Math.floor(Number(item?.qty) || 1))),
        unitPrice: cleanOrderMoney(item?.unitPrice),
        details: cleanOrderText(item?.details, 300)
    })).filter(item => item.name);
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

async function handleOrderCreate(req, res) {
    const body = req.body || {};
    const uid = cleanOrderText(body.uid, 80);
    if (uid && !/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });
    const items = cleanOrderItems(body.items);
    if (!items.length) return res.status(400).json({ error:"El pedido no tiene productos" });

    const db = admin.database();
    const orderRef = db.ref("pedidos").push();
    const now = new Date().toISOString();
    const code = `US-${now.slice(2,10).replace(/-/g,"")}-${orderRef.key.slice(-4).toUpperCase()}`;
    let profile = {};
    if (uid) {
        const snap = await db.ref(`users/${uid}`).once("value");
        if (snap.exists()) profile = snap.val() || {};
    }
    const status = "received";
    const order = {
        code,
        uid,
        name: cleanOrderText(body.name || profile.nome || profile.nombre, 80),
        phone: cleanOrderText(body.phone || profile.telefone, 30),
        status,
        createdAt: now,
        updatedAt: now,
        fulfillment: body.fulfillment === "pickup" ? "pickup" : "delivery",
        scheduledAt: cleanOrderText(body.scheduledAt, 40),
        subtotal: cleanOrderMoney(body.subtotal),
        deliveryFee: cleanOrderMoney(body.deliveryFee),
        total: cleanOrderMoney(body.total),
        address: cleanOrderText(body.address, 260),
        references: cleanOrderText(body.references, 180),
        payment: cleanOrderText(body.payment, 80),
        route: body.route && typeof body.route === "object" ? {
            distanceKm: Number(body.route.distanceKm || 0),
            durationMinutes: Number(body.route.durationMinutes || 0)
        } : null,
        items,
        history: { received: { at: now, label: ORDER_STATUS.received.label } }
    };

    await orderRef.set(order);
    if (uid) await db.ref(`users/${uid}/ultimo_pedido`).set({ id:orderRef.key, code, status, updatedAt:now });
    return res.status(201).json({ success:true, order:publicOrder(orderRef.key, order) });
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
    const now = new Date().toISOString();
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
    await notifyOrderStatus(order);
    return res.status(200).json({ success:true, order:publicOrder(id, order) });
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

    if (req.method === "POST" && req.body?.action === "delivery_quote") {
        return handleDeliveryQuote(req, res);
    }

    if (req.method === "POST" && req.body?.action === "place_autocomplete") {
        return handlePlaceAutocomplete(req, res);
    }

    if (req.method === "POST" && req.body?.action === "order_create") {
        return handleOrderCreate(req, res);
    }

    if (req.method === "PATCH" && req.body?.action === "order_status") {
        return handleOrderStatus(req, res);
    }

    if (req.method === "GET" && String(req.query.action || "") === "orders") {
        return handleOrdersGet(req, res);
    }

    try {
        if (req.method === "POST") {
            const uid = String(req.body?.uid || "").trim();
            const action = String(req.body?.action || "").trim();

            if (!/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });

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
