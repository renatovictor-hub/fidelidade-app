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

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (!requireAdmin(req, res)) return;

    const ref = admin.database().ref("recompensas");

    try {
        if (req.method === "GET") {
            const snapshot = await ref.once("value");
            const data = snapshot.val() || {};

            const recompensas = Object.entries(data)
                .map(([id, item]) => ({ id, ...item }))
                .sort((a, b) => Number(a.pontos || 0) - Number(b.pontos || 0));

            return res.status(200).json({
                total: recompensas.length,
                recompensas
            });
        }

        if (req.method === "POST") {
            const nome = String(req.body?.nome || "").trim();
            const descricao = String(req.body?.descricao || "").trim();
            const pontos = Math.floor(Number(req.body?.pontos));

            if (!nome) {
                return res.status(400).json({ error: "Nombre obligatorio" });
            }

            if (!Number.isFinite(pontos) || pontos <= 0) {
                return res.status(400).json({ error: "Puntos inválidos" });
            }

            const novaRef = ref.push();
            const recompensa = {
                nome,
                descricao,
                pontos,
                ativa: true,
                created_at: new Date().toISOString()
            };

            await novaRef.set(recompensa);

            return res.status(201).json({
                success: true,
                id: novaRef.key,
                recompensa
            });
        }

        if (req.method === "PATCH") {
            const id = String(req.body?.id || "").trim();

            if (!id) {
                return res.status(400).json({ error: "ID obligatorio" });
            }

            const itemRef = ref.child(id);
            const snapshot = await itemRef.once("value");

            if (!snapshot.exists()) {
                return res.status(404).json({ error: "Recompensa no encontrada" });
            }

            const atualizacoes = {};

            if (typeof req.body?.ativa === "boolean") {
                atualizacoes.ativa = req.body.ativa;
            }

            if (req.body?.nome !== undefined) {
                const nome = String(req.body.nome || "").trim();
                if (!nome) {
                    return res.status(400).json({ error: "Nombre inválido" });
                }
                atualizacoes.nome = nome;
            }

            if (req.body?.descricao !== undefined) {
                atualizacoes.descricao = String(req.body.descricao || "").trim();
            }

            if (req.body?.pontos !== undefined) {
                const pontos = Math.floor(Number(req.body.pontos));
                if (!Number.isFinite(pontos) || pontos <= 0) {
                    return res.status(400).json({ error: "Puntos inválidos" });
                }
                atualizacoes.pontos = pontos;
            }

            if (Object.keys(atualizacoes).length === 0) {
                return res.status(400).json({ error: "Nada para actualizar" });
            }

            atualizacoes.updated_at = new Date().toISOString();
            await itemRef.update(atualizacoes);

            return res.status(200).json({ success: true });
        }

        if (req.method === "DELETE") {
            const id = String(req.query?.id || "").trim();

            if (!id) {
                return res.status(400).json({ error: "ID obligatorio" });
            }

            const itemRef = ref.child(id);
            const snapshot = await itemRef.once("value");

            if (!snapshot.exists()) {
                return res.status(404).json({ error: "Recompensa no encontrada" });
            }

            await itemRef.remove();

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("Erro API recompensas:", error);
        return res.status(500).json({
            error: "Error interno",
            details: error.message
        });
    }
}
