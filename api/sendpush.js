import admin from "firebase-admin";
import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }), databaseURL: "https://fidelidade-app-9671c-default-rtdb.firebaseio.com" });
}

function telefoneValido(v) { const t = String(v || "").replace(/\D/g, ""); return t.length === 10 ? t : ""; }

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET","POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;
  const db = admin.database();

  if (req.method === "GET") {
    try {
      const snap = await db.ref("push_historico").limitToLast(30).once("value");
      const historico = Object.entries(snap.val() || {}).map(([id,item]) => ({ id, ...item })).sort((a,b) => String(b.data || "").localeCompare(String(a.data || "")));
      return res.status(200).json({ historico });
    } catch (error) { return res.status(500).json({ error: "Error interno", details: error.message }); }
  }

  try {
    const titulo = String(req.body?.titulo || "").trim();
    const desc = String(req.body?.desc || "").trim();
    const link = String(req.body?.link || "https://fidelidad-uai-so.vercel.app/").trim();
    const imagem = String(req.body?.imagem || "").trim();
    const segmento = String(req.body?.segmento || "todos").trim();
    const valorSegmento = req.body?.valorSegmento;
    if (!titulo || !desc) return res.status(400).json({ error: "Título y mensaje son obligatorios" });

    let telefones = [], publico = "Todos los clientes", todos = segmento === "todos";
    if (!todos) {
      const [usersSnap, recompensasSnap] = await Promise.all([db.ref("users").once("value"), db.ref("recompensas").once("value")]);
      const usuarios = Object.entries(usersSnap.val() || {}).map(([uid,u]) => ({ uid, ...(u || {}) }));
      if (segmento === "cliente") {
        const busca = String(valorSegmento || "").trim(), nums = busca.replace(/\D/g, "");
        const encontrados = usuarios.filter(u => u.uid === busca || telefoneValido(u.telefone) === nums);
        telefones = encontrados.map(u => telefoneValido(u.telefone)).filter(Boolean);
        publico = encontrados[0] ? `Cliente: ${encontrados[0].nome || encontrados[0].nombre || encontrados[0].telefone || encontrados[0].uid}` : "Cliente específico";
      }
      if (segmento === "pontos_min") {
        const minimo = Math.max(0, Number(valorSegmento || 0));
        telefones = usuarios.filter(u => Number(u.pontos || 0) >= minimo).map(u => telefoneValido(u.telefone)).filter(Boolean);
        publico = `Clientes con ${minimo}+ puntos`;
      }
      if (segmento === "inativos_dias") {
        const dias = Math.max(1, Number(valorSegmento || 30)), limite = Date.now() - dias * 86400000;
        telefones = usuarios.filter(u => { const base = u.ultima_compra || u.updated_at || u.created_at; const ts = base ? new Date(base).getTime() : 0; return !ts || ts <= limite; }).map(u => telefoneValido(u.telefone)).filter(Boolean);
        publico = `Clientes sin comprar hace ${dias}+ días`;
      }
      if (segmento === "perto_recompensa") {
        const faltamMax = Math.max(1, Number(valorSegmento || 20));
        const recompensas = Object.values(recompensasSnap.val() || {}).filter(r => r && r.ativa !== false && Number(r.pontos || 0) > 0).map(r => Number(r.pontos));
        telefones = usuarios.filter(u => { const saldo = Number(u.pontos || 0); return recompensas.some(custo => custo > saldo && custo - saldo <= faltamMax); }).map(u => telefoneValido(u.telefone)).filter(Boolean);
        publico = `A ≤${faltamMax} puntos de una recompensa`;
      }
      telefones = [...new Set(telefones)];
      if (!telefones.length) return res.status(400).json({ error: "No hay clientes con notificaciones disponibles en este segmento." });
    }

    const data = await enviarNotificacao({ titulo, mensagem: desc, url: link, imagem, todos, telefones });
    if (data?.skipped) return res.status(500).json({ error: "ONESIGNAL_REST_KEY no configurada en Vercel." });
    if (data?.error) return res.status(data.status || 502).json({ error: "OneSignal rechazó la notificación", details: data.details });

    await db.ref("push_historico").push().set({ titulo, mensagem: desc, segmento, publico, destinatarios_estimados: todos ? null : telefones.length, imagem: imagem || "", data: new Date().toISOString(), onesignal_id: data?.id || "" });
    return res.status(200).json({ success: true, data, publico, destinatarios_estimados: todos ? null : telefones.length });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
