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
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = String(req.query.uid || "").trim();
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 30)));

    if (!/^user_\d+$/.test(uid)) {
      return res.status(400).json({ error: "Cliente inválido" });
    }

    const userSnap = await admin.database().ref(`users/${uid}`).once("value");
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const snap = await admin.database()
      .ref("transacoes")
      .orderByChild("user_id")
      .equalTo(uid)
      .once("value");

    const itens = Object.entries(snap.val() || {})
      .map(([id, item]) => {
        const pontos = Number(item?.pontos || 0);
        const tipo = String(item?.tipo || "").toLowerCase();
        const debito = tipo === "debito" || tipo === "resgate" || tipo === "canje" || pontos < 0;
        const valorPontos = debito ? -Math.abs(pontos) : Math.abs(pontos);

        return {
          id,
          tipo: debito ? "debito" : "credito",
          pontos: valorPontos,
          origem: String(item?.origem || "").trim(),
          descricao: String(item?.descricao || item?.recompensa_nome || "").trim(),
          valor_compra: Number(item?.valor_compra || 0),
          multiplicador_bonus: Number(item?.multiplicador_bonus || 1),
          data: item?.data || item?.created_at || ""
        };
      })
      .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
      .slice(0, limit);

    const compras = itens.filter(x => x.tipo === "credito" && x.valor_compra > 0).length;
    const resgates = itens.filter(x => x.tipo === "debito").length;

    return res.status(200).json({
      uid,
      total: itens.length,
      compras,
      resgates,
      movimientos: itens
    });
  } catch (error) {
    console.error("Erro API movimientos:", error);
    return res.status(500).json({ error: "Error interno", details: error.message });
  }
}
