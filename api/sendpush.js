import admin from "firebase-admin";
import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }), databaseURL: "https://fidelidade-app-9671c-default-rtdb.firebaseio.com" });
}

function telefoneValido(v) { const t = String(v || "").replace(/\D/g, ""); return t.length === 10 ? t : ""; }

async function resolverPublico(db, segmento, valorSegmento) {
  const todos = segmento === "todos";
  if (todos) return { todos:true, telefones:[], publico:"Todos los clientes", destinatarios_estimados:null };

  const [usersSnap, recompensasSnap] = await Promise.all([
    db.ref("users").once("value"),
    db.ref("recompensas").once("value")
  ]);
  const usuarios = Object.entries(usersSnap.val() || {}).map(([uid,u]) => ({ uid, ...(u || {}) }));
  let telefones = [], publico = "Segmento seleccionado";

  if (segmento === "cliente") {
    const busca = String(valorSegmento || "").trim(), nums = busca.replace(/\D/g, "");
    const encontrados = usuarios.filter(u => u.uid === busca || telefoneValido(u.telefone) === nums);
    telefones = encontrados.map(u => telefoneValido(u.telefone)).filter(Boolean);
    publico = encontrados[0] ? `Cliente: ${encontrados[0].nome || encontrados[0].nombre || encontrados[0].telefone || encontrados[0].uid}` : "Cliente específico";
  } else if (segmento === "pontos_min") {
    const minimo = Math.max(0, Number(valorSegmento || 0));
    telefones = usuarios.filter(u => Number(u.pontos || 0) >= minimo).map(u => telefoneValido(u.telefone)).filter(Boolean);
    publico = `Clientes con ${minimo}+ puntos`;
  } else if (segmento === "inativos_dias") {
    const dias = Math.max(1, Number(valorSegmento || 30)), limite = Date.now() - dias * 86400000;
    telefones = usuarios.filter(u => {
      const base = u.ultima_compra || u.updated_at || u.created_at;
      const ts = base ? new Date(base).getTime() : 0;
      return !ts || ts <= limite;
    }).map(u => telefoneValido(u.telefone)).filter(Boolean);
    publico = `Clientes sin comprar hace ${dias}+ días`;
  } else if (segmento === "perto_recompensa") {
    const faltamMax = Math.max(1, Number(valorSegmento || 20));
    const recompensas = Object.values(recompensasSnap.val() || {})
      .filter(r => r && r.ativa !== false && Number(r.pontos || 0) > 0)
      .map(r => Number(r.pontos));
    telefones = usuarios.filter(u => {
      const saldo = Number(u.pontos || 0);
      return recompensas.some(custo => custo > saldo && custo - saldo <= faltamMax);
    }).map(u => telefoneValido(u.telefone)).filter(Boolean);
    publico = `A ≤${faltamMax} puntos de una recompensa`;
  } else {
    throw new Error("Segmento inválido");
  }

  telefones = [...new Set(telefones)];
  return { todos:false, telefones, publico, destinatarios_estimados:telefones.length };
}

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
      if (config === "cumpleanos" || config === "bonus_pontos" || config === "referidos" || config === "niveles_vip" || config === "reviews" || config === "loyalty_base") {
        const snap = await db.ref(`config/${config}`).once("value");
        return res.status(200).json({ success:true, config: snap.val() || {} });
      }

      if (String(req.query?.config_audit || "") === "1") {
        const snap = await db.ref("config_audit").limitToLast(30).once("value");
        const items = Object.entries(snap.val() || {}).map(([id,item]) => ({ id, ...(item || {}) }))
          .sort((a,b) => String(b.data || "").localeCompare(String(a.data || "")));
        return res.status(200).json({ success:true, items });
      }

      if (String(req.query?.feedback || "") === "1") {
        const [feedbackSnap, usersSnap, txSnap] = await Promise.all([
          db.ref("feedback").limitToLast(100).once("value"),
          db.ref("users").once("value"),
          db.ref("transacoes").once("value")
        ]);

        const users = usersSnap.val() || {};
        const txRaw = txSnap.val() || {};
        const txByUser = new Map();
        for (const tx of Object.values(txRaw)) {
          const uid = String(tx?.user_id || tx?.uid || "").trim();
          if (!uid) continue;
          if (!txByUser.has(uid)) txByUser.set(uid, []);
          txByUser.get(uid).push(tx || {});
        }
        for (const items of txByUser.values()) {
          items.sort((a,b) => String(b.data || b.created_at || "").localeCompare(String(a.data || a.created_at || "")));
        }

        const feedback = Object.entries(feedbackSnap.val() || {}).map(([id,item]) => {
          const base = item || {};
          const uid = String(base.user_id || base.uid || "").trim();
          const user = users[uid] || {};
          const compraRef = String(base.compra_ref || "");
          const txs = txByUser.get(uid) || [];
          let compra = null;
          if (compraRef) {
            const target = Date.parse(compraRef);
            compra = txs.find(tx => {
              const ts = Date.parse(String(tx.data || tx.created_at || ""));
              return Number.isFinite(target) && Number.isFinite(ts) && Math.abs(ts - target) <= 5 * 60 * 1000;
            }) || null;
          }
          return {
            id,
            ...base,
            user_id: uid,
            cliente_pontos: Number(user.pontos || 0),
            google_review_clicked: user.google_review_clicked === true,
            compra_valor: Number(compra?.valor_compra || 0),
            compra_pontos: Number(compra?.pontos || 0),
            atendido: base.atendido === true,
            atendido_em: base.atendido_em || ""
          };
        }).sort((a,b) => String(b.data || "").localeCompare(String(a.data || "")));

        const total = feedback.length;
        const media = total ? feedback.reduce((s,x)=>s+Number(x.estrelas||0),0) / total : 0;
        const atencao = feedback.filter(x => Number(x.estrelas||0) <= 2 && !x.atendido).length;
        const comComentario = feedback.filter(x => String(x.comentario||"").trim()).length;
        const googleClicks = new Set(
          feedback.filter(x => x.google_review_clicked && x.user_id).map(x => x.user_id)
        ).size;

        return res.status(200).json({
          success:true,
          feedback,
          summary:{
            total,
            media:Number(media.toFixed(1)),
            atencao,
            com_comentario:comComentario,
            google_clicks:googleClicks
          }
        });
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
      if (!["cumpleanos","bonus_pontos","referidos","niveles_vip","reviews","loyalty_base"].includes(config)) return res.status(400).json({ error:"Configuración inválida" });

      const value = req.body?.value && typeof req.body.value === "object" ? req.body.value : {};
      const audit = async (cleanValue) => {
        await db.ref("config_audit").push().set({
          config,
          value: cleanValue,
          data: new Date().toISOString(),
          origen: "dashboard",
          actor: "Administrador"
        });
      };
      if (config === "cumpleanos") {
        const limpio = {
          regalo: String(value.regalo || "Regalo especial de cumpleaños").trim(),
          dias_antes: Math.max(0, Math.min(30, Number(value.dias_antes || 0))),
          dias_depois: Math.max(0, Math.min(30, Number(value.dias_depois || 0))),
          ativo: value.ativo === true,
          updated_at: new Date().toISOString()
        };
        await db.ref("config/cumpleanos").set(limpio); await audit(limpio);
        return res.status(200).json({ success:true, config:limpio });
      }

      if (config === "reviews") {
        const limpio = {
          ativo: value.ativo !== false,
          google_url: String(value.google_url || "").trim().slice(0, 500),
          dias_apos_compra: Math.max(1, Math.min(30, Math.floor(Number(value.dias_apos_compra || 3)))),
          updated_at: new Date().toISOString()
        };
        await db.ref("config/reviews").set(limpio); await audit(limpio);
        return res.status(200).json({ success:true, config:limpio });
      }

      if (config === "niveles_vip") {
        const prata = Math.max(1, Math.floor(Number(value.prata || 300)));
        const ouro = Math.max(prata + 1, Math.floor(Number(value.ouro || 800)));
        const diamante = Math.max(ouro + 1, Math.floor(Number(value.diamante || 1500)));
        const tipos = new Set(["free_delivery","percent_discount","fixed_discount","gift","custom"]);
        const periodos = new Set(["monthly","level"]);
        const cleanBenefit = (item,level,index) => {
          const title = String(item?.title || "").trim().slice(0,80);
          if (!title) return null;
          const type = tipos.has(String(item?.type||"")) ? String(item.type) : "custom";
          const period = periodos.has(String(item?.period||"")) ? String(item.period) : "monthly";
          return {
            id: String(item?.id || (level+"_"+(index+1))).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,50),
            title,
            description: String(item?.description || "").trim().slice(0,180),
            type,
            value: Math.max(0, Math.min(100000, Number(item?.value || 0))),
            uses: Math.max(1, Math.min(20, Math.floor(Number(item?.uses || 1)))),
            period,
            active: item?.active !== false
          };
        };
        const levels = {};
        for (const level of ["bronce","plata","oro","diamante"]) {
          const source = Array.isArray(value?.benefits?.[level]) ? value.benefits[level] : [];
          levels[level] = source.slice(0,2).map((item,index)=>cleanBenefit(item,level,index)).filter(Boolean);
        }
        const legacy = {
          bronce:String(value.beneficio_bronce || "").trim().slice(0,120),
          plata:String(value.beneficio_plata || "").trim().slice(0,120),
          oro:String(value.beneficio_ouro || "").trim().slice(0,120),
          diamante:String(value.beneficio_diamante || "").trim().slice(0,120)
        };
        for (const level of Object.keys(levels)) {
          if (!levels[level].length && legacy[level]) levels[level].push({
            id:level+"_1",title:legacy[level],description:"",type:"custom",value:0,uses:1,period:"monthly",active:true
          });
        }
        const limpio = {
          ativo: value.ativo !== false,
          prata, ouro, diamante,
          benefits: levels,
          beneficio_bronce: legacy.bronce,
          beneficio_plata: legacy.plata,
          beneficio_ouro: legacy.oro,
          beneficio_diamante: legacy.diamante,
          updated_at: new Date().toISOString()
        };
        await db.ref("config/niveles_vip").set(limpio); await audit(limpio);
        return res.status(200).json({ success:true, config:limpio });
      }

      if (config === "referidos") {
        const limpio = {
          ativo: value.ativo !== false,
          pontos_indicador: Math.max(0, Math.min(1000, Math.floor(Number(value.pontos_indicador || 20)))),
          pontos_amigo: Math.max(0, Math.min(1000, Math.floor(Number(value.pontos_amigo || 10)))),
          compra_minima: Math.max(0, Math.min(100000, Number(value.compra_minima || 100))),
          updated_at: new Date().toISOString()
        };
        await db.ref("config/referidos").set(limpio); await audit(limpio);
        return res.status(200).json({ success:true, config:limpio });
      }

      if (config === "loyalty_base") {
        const pesosPorPunto = Math.max(1, Math.min(1000, Number(value.pesos_por_punto || 10)));
        const limpio = {
          ativo: value.ativo !== false,
          pesos_por_punto: Math.round(pesosPorPunto * 100) / 100,
          updated_at: new Date().toISOString()
        };
        await db.ref("config/loyalty_base").set(limpio); await audit(limpio);
        return res.status(200).json({ success:true, config:limpio });
      }

      const dias = Array.isArray(value.dias) ? [...new Set(value.dias.map(Number).filter(n => n >= 0 && n <= 6))] : [];
      if (value.ativo === true && !dias.length) return res.status(400).json({ error:"Selecciona por lo menos un día para activar el bonus" });
      const limpio = {
        ativo: value.ativo === true,
        multiplicador: Math.max(1, Math.min(5, Number(value.multiplicador || 1))),
        inicio: /^\d{2}:\d{2}$/.test(String(value.inicio || "")) ? String(value.inicio) : "00:00",
        fim: /^\d{2}:\d{2}$/.test(String(value.fim || "")) ? String(value.fim) : "23:59",
        dias,
        updated_at: new Date().toISOString()
      };
      await db.ref("config/bonus_pontos").set(limpio); await audit(limpio);
      return res.status(200).json({ success:true, config:limpio });
    }

    if (action === "preview_segment") {
      const segmento = String(req.body?.segmento || "todos").trim();
      const valorSegmento = req.body?.valorSegmento;
      const audiencia = await resolverPublico(db, segmento, valorSegmento);
      return res.status(200).json({
        success:true,
        publico:audiencia.publico,
        destinatarios_estimados:audiencia.todos ? null : audiencia.destinatarios_estimados,
        todos:audiencia.todos
      });
    }

    if (action === "feedback_attended") {
      const id = String(req.body?.id || "").trim();
      const attended = req.body?.atendido !== false;
      if (!id) return res.status(400).json({ error:"Opinión inválida" });
      const ref = db.ref(`feedback/${id}`);
      const snap = await ref.once("value");
      if (!snap.exists()) return res.status(404).json({ error:"Opinión no encontrada" });
      await ref.update({
        atendido: attended,
        atendido_em: attended ? new Date().toISOString() : null
      });
      return res.status(200).json({ success:true, id, atendido:attended });
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

    const audiencia = await resolverPublico(db, segmento, valorSegmento);
    const { todos, telefones, publico } = audiencia;
    if (!todos && !telefones.length) return res.status(400).json({ error: "No hay clientes con notificaciones disponibles en este segmento." });

    const data = await enviarNotificacao({ titulo, mensagem: desc, url: link, imagem, todos, telefones });
    if (data?.skipped) return res.status(500).json({ error: "ONESIGNAL_REST_KEY no configurada en Vercel." });
    if (data?.error) return res.status(data.status || 502).json({ error: "OneSignal rechazó la notificación", details: data.details });

    await db.ref("push_historico").push().set({ titulo, mensagem: desc, segmento, publico, destinatarios_estimados: todos ? null : telefones.length, imagem: imagem || "", data: new Date().toISOString(), onesignal_id: data?.id || "" });
    return res.status(200).json({ success: true, data, publico, destinatarios_estimados: todos ? null : telefones.length });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
