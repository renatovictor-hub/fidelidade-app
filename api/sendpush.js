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
  const db = admin.database();

  // Job diário idempotente de aniversários. Pode ser chamado pelo Cron da Vercel.
  if (req.method === "GET" && String(req.query?.job || "") === "birthdays") {
    try {
      const [cfgSnap, usersSnap] = await Promise.all([
        db.ref("config/cumpleanos").once("value"),
        db.ref("users").once("value")
      ]);
      const cfg = cfgSnap.val() || {};
      if (cfg.ativo === false) return res.status(200).json({ success:true, skipped:"inactive" });

      const diasAntes = Math.max(0, Number(cfg.dias_antes ?? 3));
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const alvo = new Date(hoje.getTime() + diasAntes * 86400000);
      const alvoMes = alvo.getMonth() + 1;
      const alvoDia = alvo.getDate();
      let enviados = 0;

      for (const [uid,u] of Object.entries(usersSnap.val() || {})) {
        const nascimento = String(u?.nascimento || "");
        const partes = nascimento.split("-");
        if (partes.length !== 3) continue;
        if (Number(partes[1]) !== alvoMes || Number(partes[2]) !== alvoDia) continue;

        const telefone = telefoneValido(u?.telefone);
        if (!telefone) continue;

        const markerRef = db.ref(`users/${uid}/cumpleanos_push/${ano}`);
        const marker = await markerRef.once("value");
        if (marker.exists()) continue;

        const titulo = diasAntes > 0 ? "🎂 ¡Tu cumpleaños se acerca!" : "🎂 ¡Feliz cumpleaños!";
        const mensagem = diasAntes > 0
          ? `Tu regalo de cumpleaños estará disponible muy pronto: ${cfg.regalo || "beneficio especial"}.`
          : `¡Hoy es tu día! Ya tienes disponible: ${cfg.regalo || "un regalo especial"}.`;

        const r = await enviarNotificacao({
          telefone,
          titulo,
          mensagem,
          url: "https://fidelidad-uai-so.vercel.app/"
        });

        if (!r?.error && !r?.skipped) {
          await markerRef.set(new Date().toISOString());
          enviados++;
        }
      }

      return res.status(200).json({ success:true, enviados, fecha_objetivo: alvo.toISOString().slice(0,10) });
    } catch (error) {
      return res.status(500).json({ error:"Error job cumpleaños", details:error.message });
    }
  }

  if (!requireAdmin(req, res)) return;

  if (req.method === "GET") {
    try {
      const config = String(req.query?.config || "").trim();
      if (config === "cumpleanos" || config === "bonus_pontos") {
        const snap = await db.ref(`config/${config}`).once("value");
        return res.status(200).json({ success:true, config: snap.val() || {} });
      }

      const snap = await db.ref("push_historico").limitToLast(30).once("value");
      const historico = Object.entries(snap.val() || {}).map(([id,item]) => ({ id, ...item })).sort((a,b) => String(b.data || "").localeCompare(String(a.data || "")));
      return res.status(200).json({ historico });
    } catch (error) { return res.status(500).json({ error: "Error interno", details: error.message }); }
  }

  try {
    const action = String(req.body?.action || "").trim();

    if (action === "save_config") {
      const config = String(req.body?.config || "").trim();
      if (!["cumpleanos","bonus_pontos"].includes(config)) return res.status(400).json({ error:"Configuración inválida" });

      const value = req.body?.value && typeof req.body.value === "object" ? req.body.value : {};
      if (config === "cumpleanos") {
        const limpio = {
          regalo: String(value.regalo || "Regalo especial de cumpleaños").trim(),
          dias_antes: Math.max(0, Math.min(30, Number(value.dias_antes || 0))),
          dias_depois: Math.max(0, Math.min(30, Number(value.dias_depois || 0))),
          ativo: value.ativo === true,
          updated_at: new Date().toISOString()
        };
        await db.ref("config/cumpleanos").set(limpio);
        return res.status(200).json({ success:true, config:limpio });
      }

      const dias = Array.isArray(value.dias) ? [...new Set(value.dias.map(Number).filter(n => n >= 0 && n <= 6))] : [];
      if (!dias.length) return res.status(400).json({ error:"Selecciona por lo menos un día" });
      const limpio = {
        ativo: value.ativo === true,
        multiplicador: Math.max(1, Math.min(5, Number(value.multiplicador || 1))),
        inicio: /^\d{2}:\d{2}$/.test(String(value.inicio || "")) ? String(value.inicio) : "00:00",
        fim: /^\d{2}:\d{2}$/.test(String(value.fim || "")) ? String(value.fim) : "23:59",
        dias,
        updated_at: new Date().toISOString()
      };
      await db.ref("config/bonus_pontos").set(limpio);
      return res.status(200).json({ success:true, config:limpio });
    }

    if (action === "birthday_redeem") {
      const uid = String(req.body?.uid || "").trim();
      if (!/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });
      const ano = String(new Date().getFullYear());
      await db.ref(`users/${uid}/cumpleanos_canjes/${ano}`).set(true);
      await db.ref(`users/${uid}/updated_at`).set(new Date().toISOString());
      return res.status(200).json({ success:true, ano });
    }
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
