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

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireAdmin(req, res)) return;

    try {
        const uid = String(req.body?.uid || "").trim();
        const recompensaId = String(req.body?.recompensaId || "").trim();

        if (!/^user_\d+$/.test(uid)) {
            return res.status(400).json({ error: "UID inválido" });
        }

        if (!recompensaId) {
            return res.status(400).json({ error: "Recompensa obligatoria" });
        }

        const recompensaRef = admin.database().ref(`recompensas/${recompensaId}`);
        const recompensaSnap = await recompensaRef.once("value");

        if (!recompensaSnap.exists()) {
            return res.status(404).json({ error: "Recompensa no encontrada" });
        }

        const recompensa = recompensaSnap.val();
        const custo = Math.floor(Number(recompensa.pontos || 0));

        if (recompensa.ativa === false) {
            return res.status(400).json({ error: "Esta recompensa está inactiva" });
        }

        if (!Number.isFinite(custo) || custo <= 0) {
            return res.status(400).json({ error: "Recompensa con puntos inválidos" });
        }

        const userRef = admin.database().ref(`users/${uid}`);
        const userSnap = await userRef.once("value");

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const clienteInicial = userSnap.val();
        const saldoAntes = Number(clienteInicial.pontos || 0);

        if (saldoAntes < custo) {
            return res.status(400).json({ error: "Puntos insuficientes", saldo: saldoAntes, necesarios: custo });
        }

        const pontosRef = userRef.child("pontos");
        const transactionResult = await pontosRef.transaction(current => {
            const saldoAtual = Number(current || 0);
            if (!Number.isFinite(saldoAtual) || saldoAtual < custo) return;
            return saldoAtual - custo;
        });

        if (!transactionResult.committed) {
            const saldoAtualSnap = await pontosRef.once("value");
            return res.status(409).json({
                error: "Puntos insuficientes o saldo actualizado por otra operación",
                saldo: Number(saldoAtualSnap.val() || 0),
                necesarios: custo
            });
        }

        const saldoNovoConfirmado = Number(transactionResult.snapshot.val());
        const saldoAnteriorConfirmado = saldoNovoConfirmado + custo;
        const agora = new Date().toISOString();
        const transacaoRef = admin.database().ref("transacoes").push();

        try {
            await transacaoRef.set({
                user_id: uid,
                nome: clienteInicial.nome || clienteInicial.nombre || "",
                telefone: clienteInicial.telefone || "",
                tipo: "debito",
                origem: "recompensa",
                recompensa_id: recompensaId,
                recompensa_nome: recompensa.nome || "",
                pontos: custo,
                valor_compra: 0,
                saldo_anterior: saldoAnteriorConfirmado,
                saldo_novo: saldoNovoConfirmado,
                data: agora
            });
        } catch (logError) {
            console.error("Falha ao registrar resgate, tentando estornar:", logError);
            await pontosRef.transaction(current => {
                const saldoAtual = Number(current || 0);
                if (saldoAtual !== saldoNovoConfirmado) return;
                return saldoAnteriorConfirmado;
            });
            throw new Error("No se pudo registrar el canje. El saldo fue restaurado.");
        }

        return res.status(200).json({
            success: true,
            uid,
            recompensa_id: recompensaId,
            recompensa_nome: recompensa.nome || "",
            pontos_descontados: custo,
            saldo_anterior: saldoAnteriorConfirmado,
            saldo_novo: saldoNovoConfirmado,
            transacao_id: transacaoRef.key
        });
    } catch (error) {
        console.error("Erro ao resgatar recompensa:", error);
        return res.status(500).json({ error: "Error interno", details: error.message });
    }
}
