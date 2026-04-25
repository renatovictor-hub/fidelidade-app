export default async function handler(req, res) {

  // 1. Configuração de CORS para permitir que o dashboard.html envie dados
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Permitir apenas o método POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { titulo, desc, link } = req.body;

    if (!titulo || !desc || !link) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // 3. Procurar utilizadores no seu Firebase Realtime Database
    const usersRes = await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users.json");
    const usersData = await usersRes.json();

    if (!usersData) {
      return res.status(400).json({ error: "Nenhum utilizador encontrado no banco de dados." });
    }

    // 4. Extrair IDs dos utilizadores
    const userIds = Object.values(usersData)
      .map(u => u.user_id)
      .filter(id => id != null);

    if (userIds.length === 0) {
      return res.status(400).json({ error: "Nenhum ID de utilizador válido encontrado." });
    }

    // 5. Enviar para o OneSignal (URL e Autenticação corrigidas)
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // CORREÇÃO: "Basic" em vez de "Key" para chaves que começam com os_v2
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_KEY.trim()}`
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        target_channel: "push",
        include_aliases: {
          external_id: userIds // Envia para todos os IDs encontrados
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
      console.error("Erro detalhado do OneSignal:", data);
      return res.status(response.status).json(data);
    }

    // 6. Registar a promoção no histórico do Firebase
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

    return res.status(200).json({
      success: true,
      mensagem: "Notificação enviada com sucesso!",
      detalhes: data
    });

  } catch (err) {
    console.error("Erro no servidor Vercel:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
