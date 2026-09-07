import admin from "firebase-admin";
import { requireAdmin } from "./_admin-auth.js";

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

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const publicMode = String(req.query.public || "") === "1";
    if (!publicMode && !requireAdmin(req, res)) return;

    try {
        const uid = String(req.query.uid || "").trim();
        const limit = Math.max(1, Math.min(100, Number(req.query.limit || 100)));

        if (!/^user_\d+$/.test(uid)) {
            return res.status(400).json({ error: "UID inválido" });
        }

        if (publicMode) {
            const userSnap = await admin.database().ref(`users/${uid}`).once("value");
            if (!userSnap.exists()) {
                return res.status(404).json({ error: "Cliente no encontrado" });
            }
        }

        const snapshot = await admin
            .database()
            .ref("transacoes")
            .orderByChild("user_id")
            .equalTo(uid)
            .once("value");

        const raw = Object.entries(snapshot.val() || {})
            .map(([id, item]) => ({ id, ...(item || {}) }))
            .sort((a, b) => new Date(b.data || b.created_at || 0) - new Date(a.data || a.created_at || 0));

        if (!publicMode) {
            return res.status(200).json({
                uid,
                total: raw.length,
                transacoes: raw
            });
        }

        const movimientos = raw.slice(0, limit).map(item => {
            const pontos = Number(item?.pontos || 0);
            const tipo = String(item?.tipo || "").toLowerCase();
            const debito = tipo === "debito" || tipo === "resgate" || tipo === "canje" || pontos < 0;

            return {
                id: item.id,
                tipo: debito ? "debito" : "credito",
                pontos: debito ? -Math.abs(pontos) : Math.abs(pontos),
                origem: String(item?.origem || "").trim(),
                descricao: String(item?.descricao || item?.recompensa_nome || "").trim(),
                valor_compra: Number(item?.valor_compra || 0),
                multiplicador_bonus: Number(item?.multiplicador_bonus || 1),
                data: item?.data || item?.created_at || ""
            };
        });

        return res.status(200).json({
            uid,
            total: movimientos.length,
            compras: movimientos.filter(x => x.tipo === "credito" && x.valor_compra > 0).length,
            resgates: movimientos.filter(x => x.tipo === "debito").length,
            movimientos
        });
    } catch (error) {
        console.error("Erro API histórico:", error);
        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
