import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        }),

        databaseURL:
            "https://fidelidade-app-9671c-default-rtdb.firebaseio.com"
    });
}

export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const uid =
            String(req.query.uid || "").trim();

        if (!uid) {
            return res.status(400).json({
                error: "UID obligatorio"
            });
        }

        const snapshot = await admin
            .database()
            .ref("transacoes")
            .orderByChild("user_id")
            .equalTo(uid)
            .once("value");

        if (!snapshot.exists()) {
            return res.status(200).json({
                uid,
                total: 0,
                transacoes: []
            });
        }

        const data = snapshot.val();

        const transacoes = Object
            .entries(data)
            .map(([id, item]) => ({
                id,
                ...item
            }))
            .sort((a, b) => {
                return new Date(b.data) - new Date(a.data);
            });

        return res.status(200).json({
            uid,
            total: transacoes.length,
            transacoes
        });

    } catch (error) {

        console.error(
            "Erro API histórico:",
            error
        );

        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
