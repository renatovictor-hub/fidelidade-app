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

export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { uid, valorCompra, pontos } = req.body || {};

        if (!uid) {
            return res.status(400).json({
                error: "UID obligatorio"
            });
        }

        if (!pontos || Number(pontos) <= 0) {
            return res.status(400).json({
                error: "Puntos inválidos"
            });
        }

        const userRef = admin
            .database()
            .ref(`users/${uid}`);

        const snapshot = await userRef.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({
                error: "Cliente no encontrado"
            });
        }

        const cliente = snapshot.val();

        const pontosAtuais = Number(cliente.pontos || 0);
        const pontosGanhos = Number(pontos);
        const novoSaldo = pontosAtuais + pontosGanhos;

        const agora = new Date().toISOString();

        const transacaoRef = admin
            .database()
            .ref("transacoes")
            .push();

        const updates = {};

        updates[`users/${uid}/pontos`] = novoSaldo;
        updates[`users/${uid}/ultima_compra`] = agora;

        updates[`transacoes/${transacaoRef.key}`] = {
            user_id: uid,
            nome: cliente.nome || cliente.nombre || "",
            tipo: "credito",
            valor_compra: Number(valorCompra || 0),
            pontos: pontosGanhos,
            saldo_anterior: pontosAtuais,
            saldo_novo: novoSaldo,
            data: agora
        };

        await admin
            .database()
            .ref()
            .update(updates);

        return res.status(200).json({
            success: true,
            uid,
            nome: cliente.nome || cliente.nombre || "",
            pontos_adicionados: pontosGanhos,
            saldo_anterior: pontosAtuais,
            saldo_novo: novoSaldo
        });

    } catch (error) {

        console.error("Erro API pontos:", error);

        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
