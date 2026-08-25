import admin from "firebase-admin";

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
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        const uid = String(req.query.uid || "").trim();
        if (!/^user_\d+$/.test(uid)) {
            return res.status(400).json({ error: "UID inválido" });
        }

        const db = admin.database();
        const [userSnap, txSnap] = await Promise.all([
            db.ref(`users/${uid}`).once("value"),
            db.ref("transacoes").orderByChild("user_id").equalTo(uid).once("value")
        ]);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const cliente = userSnap.val() || {};
        const saldo = Number(cliente.pontos || 0);

        const movimentos = txSnap.exists()
            ? Object.entries(txSnap.val()).map(([id, item]) => ({ id, ...item }))
                .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
            : [];

        const ganhos = movimentos
            .filter(item => item.tipo === "credito")
            .reduce((sum, item) => sum + Math.abs(Number(item.pontos || 0)), 0);

        const usados = movimentos
            .filter(item => item.tipo === "debito")
            .reduce((sum, item) => sum + Math.abs(Number(item.pontos || 0)), 0);

        return res.status(200).json({
            uid,
            nome: cliente.nome || cliente.nombre || "Cliente",
            saldo,
            total: movimentos.length,
            ganhos,
            usados,
            movimentos: movimentos.slice(0, 50)
        });
    } catch (error) {
        console.error("Erro API movimientos:", error);
        return res.status(500).json({ error: "Error interno", details: error.message });
    }
}
