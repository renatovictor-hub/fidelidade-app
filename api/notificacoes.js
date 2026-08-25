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
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!requireAdmin(req, res)) return;

  try {
    const snap = await admin.database().ref("push_historico").limitToLast(30).once("value");
    const data = snap.val() || {};
    const historico = Object.entries(data)
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
    return res.status(200).json({ historico });
  } catch (error) {
    return res.status(500).json({ error: "Error interno", details: error.message });
  }
}
