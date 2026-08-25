import admin from "firebase-admin";
import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }), databaseURL: "https://fidelidade-app-9671c-default-rtdb.firebaseio.com" });
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!requireAdmin(req, res)) return;
    try {
        const uid = String(req.body?.uid || "").trim();
        const recompensaId = String(req.body?.recompensaId || "").trim();
        if (!/^user_\d+$/.test(uid)) return res.status(400).json({ error: "UID inválido" });
        if (!recompensaId) return res.status(400).json({ error: "Recompensa obligatoria" });
        const db = admin.database();
        const recompensaSnap = await db.ref(`recompensas/${recompensaId}`).once("value");
        if (!recompensaSnap.exists()) return res.status(404).json({ error: "Recompensa no encontrada" });
        const recompensa = recompensaSnap.val();
        const custo = Math.floor(Number(recompensa.pontos || 0));
        if (recompensa.ativa === false) return res.status(400).json({ error: "Esta recompensa está inactiva" });
        if (!Number.isFinite(custo) || custo <= 0) return res.status(400).json({ error: "Recompensa con puntos inválidos" });
        const userSnap = await db.ref(`users/${uid}`).once("value");
        if (!userSnap.exists()) return res.status(404).json({ error: "Cliente no encontrado" });
        const cliente = userSnap.val();
        const saldoAnterior = Number(cliente.pontos || 0);
        if (!Number.isFinite(saldoAnterior) || saldoAnterior < custo) return res.status(400).json({ error: "Puntos insuficientes", saldo: saldoAnterior, necesarios: custo });
        const saldoNovo = saldoAnterior - custo;
        const agora = new Date().toISOString();
        const transacaoRef = db.ref("transacoes").push();
        const updates = {};
        updates[`users/${uid}/pontos`] = saldoNovo;
        updates[`transacoes/${transacaoRef.key}`] = { user_id: uid, nome: cliente.nome || cliente.nombre || "", telefone: cliente.telefone || "", tipo: "debito", origem: "recompensa", recompensa_id: recompensaId, recompensa_nome: recompensa.nome || "", pontos: custo, valor_compra: 0, saldo_anterior: saldoAnterior, saldo_novo: saldoNovo, data: agora };
        await db.ref().update(updates);

        const push = await enviarNotificacao({
            uid,
            telefone: cliente.telefone || "",
            titulo: "🎁 Recompensa canjeada",
            mensagem: `${recompensa.nome || "Tu recompensa"} fue canjeada por ${custo} puntos. Saldo: ${saldoNovo}.`,
            url: "https://fidelidad-uai-so.vercel.app/recompensas.html"
        }).catch(error => ({ error: true, details: error.message }));

        return res.status(200).json({ success: true, uid, recompensa_id: recompensaId, recompensa_nome: recompensa.nome || "", pontos_descontados: custo, saldo_anterior: saldoAnterior, saldo_novo: saldoNovo, transacao_id: transacaoRef.key, push });
    } catch (error) {
        console.error("Erro ao resgatar recompensa:", error);
        return res.status(500).json({ error: "Error interno", details: error.message });
    }
}
