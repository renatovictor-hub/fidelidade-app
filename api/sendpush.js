export default async function handler(req, res) {

  // ==============================
  // PERMITIR APENAS POST
  // ==============================
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {

    const { titulo, desc, link } = req.body;

    if (!titulo || !desc || !link) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // ==============================
    // BUSCAR USUÁRIOS NO FIREBASE
    // ==============================
    const usersRes = await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users.json");
    const usersData = await usersRes.json();

    if (!usersData) {
      return res.status(400).json({ error: "Nenhum usuário encontrado" });
    }

    // ==============================
    // EXTRAIR IDS
    // ==============================
    const userIds = Object.values(usersData)
      .map(u => u.user_id)
      .filter(id => id != null);

    if (userIds.length === 0) {
      return res.status(400).json({ error: "Nenhum ID válido" });
    }

    console.log("Total usuários:", userIds.length);

    // ==============================
    // ENVIAR EM LOTES (IMPORTANTE)
    // ==============================
    const chunkSize = 2000;
    const chunks = [];

    for (let i = 0; i < userIds.length; i += chunkSize) {
      chunks.push(userIds.slice(i, i + chunkSize));
    }

    let resultados = [];

    for (const chunk of chunks) {

      const response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Key ${process.env.ONESIGNAL_REST_KEY}`
        },
        body: JSON.stringify({
          app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",

          target_channel: "push",

          include_aliases: {
            external_id: chunk
          },

          headings: {
            en: titulo,
            pt: titulo
          },

          contents: {
            en: desc,
            pt: desc
          },

          web_url: link
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erro OneSignal:", data);
        return res.status(response.status).json(data);
      }

      resultados.push(data);
    }

    // ==============================
    // SALVAR HISTÓRICO DE PROMO
    // ==============================
    await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/promos.json", {
      method: "POST",
      body: JSON.stringify({
        titulo,
        desc,
        link,
        total_users: userIds.length,
        created_at: Date.now()
      })
    });

    // ==============================
    // RESPOSTA FINAL
    // ==============================
    return res.status(200).json({
      success: true,
      enviados: userIds.length,
      lotes: chunks.length,
      resultados
    });

  } catch (err) {
    console.error("Erro no servidor:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }

}
