import admin from "firebase-admin";

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
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { uid, valorCompra } = req.body || {};
        const uidLimpo = String(uid || "").trim();
        const valor = Number(valorCompra);

        if (!/^user_\d+$/.test(uidLimpo)) {
            return res.status(400).json({ error: "UID inválido" });
        }

        if (!Number.isFinite(valor) || valor <= 0 || valor > VALOR_MAXIMO_COMPRA) {
            return res.status(400).json({ error: "Valor de compra inválido" });
        }

        const valorNormalizado = Math.round(valor * 100) / 100;
        const pontosGanhos = Math.floor(valorNormalizado / PESOS_POR_PONTO);

        if (pontosGanhos <= 0) {
            return res.status(400).json({ error: "El valor no genera puntos" });
        }

        const userRef = admin.database().ref(`users/${uidLimpo}`);
        const snapshot = await userRef.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const cliente = snapshot.val();
        const pontosAtuais = Number(cliente.pontos || 0);
        const novoSaldo = pontosAtuais + pontosGanhos;
        const agora = new Date().toISOString();
        const transacaoRef = admin.database().ref("transacoes").push();

        const updates = {};
        updates[`users/${uidLimpo}/pontos`] = novoSaldo;
        updates[`users/${uidLimpo}/ultima_compra`] = agora;
        updates[`transacoes/${transacaoRef.key}`] = {
            user_id: uidLimpo,
            nome: cliente.nome || cliente.nombre || "",
            telefone: cliente.telefone || "",
            tipo: "credito",
            valor_compra: valorNormalizado,
            pontos: pontosGanhos,
            saldo_anterior: pontosAtuais,
            saldo_novo: novoSaldo,
            data: agora
        };

        await admin.database().ref().update(updates);

        return res.status(200).json({
            success: true,
            uid: uidLimpo,
            nome: cliente.nome || cliente.nombre || "",
            pontos_adicionados: pontosGanhos,
            saldo_anterior: pontosAtuais,
            saldo_novo: novoSaldo,
            regra: {
                pesos_por_ponto: PESOS_POR_PONTO
            }
        });
    } catch (error) {
        console.error("Erro API pontos:", error);
        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
