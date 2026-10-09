import { getFirebaseAdmin } from "../lib/server/firebase.js";
import { requireAdmin } from "../lib/server/admin-auth.js";
import { setClientSession } from "../lib/server/client-auth.js";

const admin=getFirebaseAdmin();

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const preview = process.env.VERCEL_ENV === "preview";
    if (!preview && !requireAdmin(req, res)) return;

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
        if (preview) setClientSession(res, uid);

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
