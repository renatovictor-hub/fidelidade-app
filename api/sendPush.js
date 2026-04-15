export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { titulo, desc, link } = req.body;

    // 1. BUSCAR USUÁRIOS NO FIREBASE
    const usersRes = await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users.json");
    const usersData = await usersRes.json();

    if (!usersData) {
      return res.status(400).json({ error: "Nenhum usuário encontrado no banco de dados." });
    }

    // 2. EXTRAIR OS IDS (external_id)
    const userIds = Object.values(usersData)
      .map(u => u.user_id)
      .filter(id => id != null);

    if (userIds.length === 0) {
      return res.status(400).json({ error: "Nenhum ID de usuário válido para envio." });
    }

    // 3. ENVIAR PARA O ONESIGNAL
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // AQUI ESTÁ A CORREÇÃO: "Key" em vez de "Bearer"
        "Authorization": `Key ${process.env.ONESIGNAL_REST_KEY}`
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        target_channel: "push",
        include_aliases: {
          external_id: userIds
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

    return res.status(200).json({ success: true, data });

  } catch (err) {
    console.error("Erro no Servidor:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
