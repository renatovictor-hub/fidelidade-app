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

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireAdmin(req, res)) return;

    try {
        const telefone = String(req.query.telefone || "").replace(/\D/g, "");

        if (telefone.length !== 10) {
            return res.status(400).json({ error: "Teléfono inválido" });
        }

        const snapshot = await admin
            .database()
            .ref("users")
            .orderByChild("telefone")
            .equalTo(telefone)
            .once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const [uid, cliente] = Object.entries(snapshot.val())[0];

        return res.status(200).json({
            uid,
            nome: cliente.nome || cliente.nombre || "",
            telefone: cliente.telefone || "",
            pontos: Number(cliente.pontos || 0)
        });
    } catch (error) {
        console.error("Erro busca telefone:", error);
        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
