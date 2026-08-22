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
        const uid = String(req.query.uid || "").trim();

        if (!uid) {
            return res.status(400).json({
                error: "UID obligatorio"
            });
        }

        const url =
            `https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users/${encodeURIComponent(uid)}.json`;

        const response = await fetch(url, {
            headers: {
                Authorization:
                    `Bearer ${process.env.FIREBASE_DATABASE_SECRET}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Firebase error",
                details: data
            });
        }

        if (!data) {
            return res.status(404).json({
                error: "Cliente no encontrado"
            });
        }

        return res.status(200).json({
            uid,
            nome:
                data.nome ||
                data.nombre ||
                "",
            pontos:
                Number(data.pontos || 0),
            data
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}
