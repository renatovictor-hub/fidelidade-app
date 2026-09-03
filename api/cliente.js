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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    if (!["GET","POST"].includes(req.method)) {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        if (req.method === "POST") {
            const uid = String(req.body?.uid || "").trim();
            const action = String(req.body?.action || "").trim();

            if (!/^user_\d+$/.test(uid)) return res.status(400).json({ error:"Cliente inválido" });

            if (action === "register") {
                const nome = String(req.body?.nome || "").trim().slice(0, 100);
                const telefone = String(req.body?.telefone || "").replace(/\D/g, "");
                const nascimento = String(req.body?.nascimento || "").trim();
                const referidoPor = String(req.body?.referido_por || "").trim();

                if (!nome) return res.status(400).json({ error:"Nombre obligatorio" });
                if (telefone.length !== 10) return res.status(400).json({ error:"Teléfono inválido" });
                if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) return res.status(400).json({ error:"Fecha de nacimiento inválida" });

                const db = admin.database();
                const duplicado = await db.ref("users").orderByChild("telefone").equalTo(telefone).once("value");
                if (duplicado.exists()) {
                    const [existUid, existUser] = Object.entries(duplicado.val() || {})[0] || [];
                    return res.status(409).json({
                        error:"Este teléfono ya está registrado",
                        uid:existUid || "",
                        nome:existUser?.nome || existUser?.nombre || ""
                    });
                }

                const agora = new Date().toISOString();
                const payload = {
                    nome,
                    telefone,
                    nascimento,
                    user_id: uid,
                    pontos: 0,
                    pontos_acumulados: 0,
                    referido_por: /^user_\d+$/.test(referidoPor) && referidoPor !== uid ? referidoPor : null,
                    referido_recompensado: false,
                    created_at: agora,
                    updated_at: agora
                };

                await db.ref(`users/${uid}`).set(payload);
                return res.status(200).json({ success:true, uid, nome, telefone });
            }

            if (action === "sync_profile") {
                const nascimento = String(req.body?.nascimento || "").trim();
                const userRef = admin.database().ref(`users/${uid}`);
                const userSnap = await userRef.once("value");
                if (!userSnap.exists()) return res.status(404).json({ error:"Cliente no encontrado" });

                const updates = { updated_at:new Date().toISOString() };
                if (/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) updates.nascimento = nascimento;

                await userRef.update(updates);
                return res.status(200).json({ success:true });
            }

            if (action === "google_review_clicked") {
                const agora = new Date().toISOString();
                const userRef = admin.database().ref(`users/${uid}`);
                const userSnap = await userRef.once("value");
                if (!userSnap.exists()) return res.status(404).json({ error:"Cliente no encontrado" });

                await userRef.update({
                    google_review_clicked: true,
                    google_review_clicked_at: agora
                });

                return res.status(200).json({ success:true });
            }

            const estrelas = Math.floor(Number(req.body?.estrelas || 0));
            const comentario = String(req.body?.comentario || "").trim().slice(0, 1200);
            const compraRef = String(req.body?.compra_ref || "").trim().slice(0, 80);

            if (estrelas < 1 || estrelas > 5) return res.status(400).json({ error:"Calificación inválida" });

            const userRef = admin.database().ref(`users/${uid}`);
            const userSnap = await userRef.once("value");
            if (!userSnap.exists()) return res.status(404).json({ error:"Cliente no encontrado" });

            const user = userSnap.val() || {};
            const agora = new Date().toISOString();
            const feedbackRef = admin.database().ref("feedback").push();
            await admin.database().ref().update({
                [`feedback/${feedbackRef.key}`]: {
                    user_id: uid,
                    nome: user.nome || user.nombre || "",
                    telefone: user.telefone || "",
                    estrelas,
                    comentario,
                    compra_ref: compraRef || user.ultima_compra || "",
                    data: agora
                },
                [`users/${uid}/feedback_last_at`]: agora,
                [`users/${uid}/feedback_last_purchase`]: compraRef || user.ultima_compra || agora
            });

            return res.status(200).json({ success:true, id:feedbackRef.key });
        }

        const uid = String(req.query.uid || "").trim();

        if (!uid) {
            return res.status(400).json({ error: "UID obligatorio" });
        }

        const snapshot = await admin.database().ref(`users/${uid}`).once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        const cliente = snapshot.val();
        const reviewsSnap = await admin.database().ref("config/reviews").once("value");
        const reviewsCfg = reviewsSnap.val() || {};

        return res.status(200).json({
            uid,
            nome: cliente.nome || cliente.nombre || "",
            telefone: cliente.telefone || "",
            pontos: Number(cliente.pontos || 0),
            pontos_acumulados: Number(cliente.pontos_acumulados ?? cliente.pontos ?? 0),
            referidos_recompensados: Number(cliente.referidos_recompensados || 0),
            pontos_indicacao_total: Number(cliente.pontos_indicacao_total || 0),
            ultima_compra: cliente.ultima_compra || "",
            feedback_last_purchase: cliente.feedback_last_purchase || "",
            google_review_clicked: cliente.google_review_clicked === true,
            reviews: {
                ativo: reviewsCfg.ativo !== false,
                google_url: String(reviewsCfg.google_url || ""),
                dias_apos_compra: Math.max(1, Number(reviewsCfg.dias_apos_compra || 3))
            }
        });
    } catch (error) {
        console.error("Erro API cliente:", error);
        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
