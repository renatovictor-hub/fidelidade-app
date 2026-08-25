import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!requireAdmin(req, res)) return;

    try {
        const titulo = String(req.body?.titulo || "").trim();
        const mensagem = String(req.body?.mensagem || "").trim();
        const uid = String(req.body?.uid || "").trim();
        const todos = req.body?.todos === true;

        if (!titulo || !mensagem) return res.status(400).json({ error: "Título y mensaje son obligatorios" });
        if (!todos && !/^user_\d+$/.test(uid)) return res.status(400).json({ error: "Cliente inválido" });

        const result = await enviarNotificacao({ uid, titulo, mensagem, todos, url: "/" });
        if (result?.skipped) return res.status(503).json({ error: "ONESIGNAL_REST_API_KEY no configurada" });
        if (result?.error) return res.status(502).json({ error: "OneSignal rechazó la notificación", details: result.details });

        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error("Erro envio push:", error);
        return res.status(500).json({ error: "Error interno", details: error.message });
    }
}
