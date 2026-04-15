export default async function handler(req, res) {
  try {
    const { titulo, desc, link } = req.body;

    // 1. BUSCAR USUÁRIOS NO FIREBASE
    const usersRes = await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users.json");
    const usersData = await usersRes.json();

    if (!usersData) {
      return res.status(400).json({ error: "Sem usuários no banco de dados" });
    }

    // 2. PEGAR TODOS OS IDS (garantindo que não venham nulos)
    const userIds = Object.values(usersData)
      .map(u => u.user_id)
      .filter(id => id != null);

    if (userIds.length === 0) {
      return res.status(400).json({ error: "Nenhum ID de usuário válido encontrado" });
    }

    // 3. ENVIAR PUSH
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        // AJUSTE AQUI: Use "Key" em vez de "Bearer"
        "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        target_channel: "push",
        include_aliases: {
          external_id: userIds
        },
        headings: { en: titulo },
        contents: { en: desc },
        web_url: link
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Erro no servidor:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
