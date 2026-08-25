import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  try {
    const titulo = String(req.body?.titulo || "Novidade na Uai Sô!").trim();
    const desc = String(req.body?.desc || "Confira o que preparamos para você.").trim();
    const link = String(req.body?.link || "https://fidelidad-uai-so.vercel.app/").trim();
    const imagem = String(req.body?.imagem || "").trim();

    const data = await enviarNotificacao({ titulo, mensagem: desc, url: link, imagem, todos: true });
    if (data?.skipped) return res.status(500).json({ error: "ERRO: ONESIGNAL_REST_KEY não configurada na Vercel." });
    if (data?.error) return res.status(data.status || 502).json({ error: "OneSignal rechazó la notificación", details: data.details });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
