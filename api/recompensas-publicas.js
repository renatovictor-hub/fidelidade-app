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
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=60");

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const snapshot = await admin.database().ref("recompensas").once("value");
        const data = snapshot.val() || {};

        const recompensas = Object.entries(data)
            .map(([id, item]) => ({
                id,
                nome: String(item?.nome || "").trim(),
                descricao: String(item?.descricao || item?.desc || "").trim(),
                pontos: Math.max(0, Math.floor(Number(item?.pontos || 0))),
                imagem: String(item?.imagem || "").trim(),
                ativa: item?.ativa !== false
            }))
            .filter(item => item.ativa && item.nome && item.pontos > 0)
            .sort((a, b) => a.pontos - b.pontos);

        return res.status(200).json({ recompensas });
    } catch (error) {
        console.error("Erro ao carregar recompensas públicas:", error);
        return res.status(500).json({ error: "Error interno" });
    }
}
