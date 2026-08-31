import admin from "firebase-admin";
import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

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

const PESOS_POR_PONTO = 10;
const VALOR_MAXIMO_COMPRA = 100000;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!requireAdmin(req, res)) return;

    try {
        const { uid, valorCompra } = req.body || {};
        const uidLimpo = String(uid || "").trim();
        const valor = Number(valorCompra);
        if (!/^user_\d+$/.test(uidLimpo)) return res.status(400).json({ error: "UID inválido" });
        if (!Number.isFinite(valor) || valor <= 0 || valor > VALOR_MAXIMO_COMPRA) return res.status(400).json({ error: "Valor de compra inválido" });

        const valorNormalizado = Math.round(valor * 100) / 100;
        const pontosBase = Math.floor(valorNormalizado / PESOS_POR_PONTO);
        if (pontosBase <= 0) return res.status(400).json({ error: "El valor no genera puntos" });

        const db = admin.database();

        // Regra de bônus configurável por dia/horário, usando horário local de Cancún.
        const bonusSnap = await db.ref("config/bonus_pontos").once("value");
        const bonus = bonusSnap.val() || {};
        const agoraCancun = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Cancun" }));
        const dia = agoraCancun.getDay(); // 0 domingo ... 6 sábado
        const hhmm = `${String(agoraCancun.getHours()).padStart(2,"0")}:${String(agoraCancun.getMinutes()).padStart(2,"0")}`;
        const dias = Array.isArray(bonus.dias) ? bonus.dias.map(Number) : [];
        const inicio = String(bonus.inicio || "00:00");
        const fim = String(bonus.fim || "23:59");
        const multip = Math.max(1, Math.min(5, Number(bonus.multiplicador || 1)));
        const dentroHorario = inicio <= fim
            ? (hhmm >= inicio && hhmm <= fim)
            : (hhmm >= inicio || hhmm <= fim);
        const bonusAtivo = bonus.ativo === true && dias.includes(dia) && dentroHorario;
        const multiplicadorAplicado = bonusAtivo ? multip : 1;
        const pontosGanhos = Math.floor(pontosBase * multiplicadorAplicado);
        const userRef = db.ref(`users/${uidLimpo}`);
        const snapshot = await userRef.once("value");
        if (!snapshot.exists()) return res.status(404).json({ error: "Cliente no encontrado" });

        const cliente = snapshot.val();
        const pontosAtuais = Number(cliente.pontos || 0);
        const saldoCompra = pontosAtuais + pontosGanhos;
        const agora = new Date().toISOString();
        const transacaoRef = db.ref("transacoes").push();
        const updates = {};

        const acumuladosAtuais = Number(cliente.pontos_acumulados ?? cliente.pontos ?? 0);
        updates[`users/${uidLimpo}/pontos`] = saldoCompra;
        updates[`users/${uidLimpo}/pontos_acumulados`] = acumuladosAtuais + pontosGanhos;
        updates[`users/${uidLimpo}/ultima_compra`] = agora;
        updates[`transacoes/${transacaoRef.key}`] = {
            user_id: uidLimpo, nome: cliente.nome || cliente.nombre || "", telefone: cliente.telefone || "",
            tipo: "credito", valor_compra: valorNormalizado, pontos: pontosGanhos,
            pontos_base: pontosBase, multiplicador_bonus: multiplicadorAplicado,
            bonus_ativo: bonusAtivo, saldo_anterior: pontosAtuais, saldo_novo: saldoCompra, data: agora
        };

        // Recompensa de indicação: somente uma vez, em compra que atinja o mínimo configurado.
        let indicacao = { aplicada:false, pontos_amigo:0, pontos_indicador:0 };
        let saldoFinalCliente = saldoCompra;
        let indicadorCliente = null;

        const refUid = String(cliente.referido_por || "").trim();
        if (/^user_\d+$/.test(refUid) && refUid !== uidLimpo && cliente.referido_recompensado !== true) {
            const cfgRefSnap = await db.ref("config/referidos").once("value");
            const cfgRef = cfgRefSnap.val() || {};
            const ativoRef = cfgRef.ativo !== false;
            const compraMin = Math.max(0, Number(cfgRef.compra_minima || 100));

            if (ativoRef && valorNormalizado >= compraMin) {
                const indicadorSnap = await db.ref(`users/${refUid}`).once("value");

                if (indicadorSnap.exists()) {
                    indicadorCliente = indicadorSnap.val();
                    const pontosAmigo = Math.max(0, Math.floor(Number(cfgRef.pontos_amigo || 10)));
                    const pontosIndicador = Math.max(0, Math.floor(Number(cfgRef.pontos_indicador || 20)));
                    const saldoIndicador = Number(indicadorCliente.pontos || 0);
                    const novoSaldoIndicador = saldoIndicador + pontosIndicador;
                    saldoFinalCliente = saldoCompra + pontosAmigo;

                    updates[`users/${uidLimpo}/pontos`] = saldoFinalCliente;
                    updates[`users/${uidLimpo}/pontos_acumulados`] = acumuladosAtuais + pontosGanhos + pontosAmigo;
                    updates[`users/${uidLimpo}/referido_recompensado`] = true;
                    updates[`users/${uidLimpo}/referido_recompensado_em`] = agora;
                    updates[`users/${refUid}/pontos`] = novoSaldoIndicador;
                    updates[`users/${refUid}/pontos_acumulados`] = Number(indicadorCliente.pontos_acumulados ?? indicadorCliente.pontos ?? 0) + pontosIndicador;
                    updates[`users/${refUid}/referidos_recompensados`] = Number(indicadorCliente.referidos_recompensados || 0) + 1;
                    updates[`users/${refUid}/pontos_indicacao_total`] = Number(indicadorCliente.pontos_indicacao_total || 0) + pontosIndicador;

                    if (pontosAmigo > 0) {
                        const tAmigo = db.ref("transacoes").push();
                        updates[`transacoes/${tAmigo.key}`] = {
                            user_id: uidLimpo,
                            nome: cliente.nome || cliente.nombre || "",
                            telefone: cliente.telefone || "",
                            tipo: "credito",
                            origem: "indicacao",
                            descricao: "Bonus por primera compra indicada",
                            pontos: pontosAmigo,
                            saldo_anterior: saldoCompra,
                            saldo_novo: saldoFinalCliente,
                            data: agora
                        };
                    }

                    if (pontosIndicador > 0) {
                        const tIndicador = db.ref("transacoes").push();
                        updates[`transacoes/${tIndicador.key}`] = {
                            user_id: refUid,
                            nome: indicadorCliente.nome || indicadorCliente.nombre || "",
                            telefone: indicadorCliente.telefone || "",
                            tipo: "credito",
                            origem: "indicacao",
                            descricao: "Amigo indicado realizó su primera compra válida",
                            referido_uid: uidLimpo,
                            pontos: pontosIndicador,
                            saldo_anterior: saldoIndicador,
                            saldo_novo: novoSaldoIndicador,
                            data: agora
                        };
                    }

                    indicacao = {
                        aplicada:true,
                        pontos_amigo:pontosAmigo,
                        pontos_indicador:pontosIndicador,
                        indicador_uid:refUid
                    };
                }
            }
        }

        await db.ref().update(updates);

        const push = await enviarNotificacao({
            uid: uidLimpo,
            telefone: cliente.telefone || "",
            titulo: "⭐ ¡Ganaste puntos!",
            mensagem: bonusAtivo
                ? `¡Bonus x${multiplicadorAplicado}! Sumaste ${pontosGanhos} puntos. Tu saldo ahora es ${saldoFinalCliente}.`
                : `Sumaste ${pontosGanhos} punto${pontosGanhos === 1 ? "" : "s"}. Tu saldo ahora es ${saldoFinalCliente}.`,
            url: "https://fidelidad-uai-so.vercel.app/"
        }).catch(error => ({ error: true, details: error.message }));

        if (indicacao.aplicada) {
            await Promise.allSettled([
                enviarNotificacao({
                    uid: uidLimpo,
                    telefone: cliente.telefone || "",
                    titulo: "🎁 ¡Bonus por invitación!",
                    mensagem: `Ganaste ${indicacao.pontos_amigo} puntos extra por tu primera compra con invitación.`,
                    url: "https://fidelidad-uai-so.vercel.app/"
                }),
                enviarNotificacao({
                    uid: indicacao.indicador_uid,
                    telefone: indicadorCliente?.telefone || "",
                    titulo: "🤝 ¡Tu amigo compró!",
                    mensagem: `Ganaste ${indicacao.pontos_indicador} puntos porque tu amigo hizo su primera compra válida.`,
                    url: "https://fidelidad-uai-so.vercel.app/"
                })
            ]);
        }

        return res.status(200).json({
            success: true,
            uid: uidLimpo,
            nome: cliente.nome || cliente.nombre || "",
            pontos_adicionados: pontosGanhos,
            pontos_base: pontosBase,
            bonus_ativo: bonusAtivo,
            multiplicador_bonus: multiplicadorAplicado,
            saldo_anterior: pontosAtuais,
            saldo_novo: saldoFinalCliente,
            push,
            indicacao,
            regra: { pesos_por_ponto: PESOS_POR_PONTO }
        });
    } catch (error) {
        console.error("Erro API pontos:", error);
        return res.status(500).json({ error: "Error interno", details: error.message });
    }
}
