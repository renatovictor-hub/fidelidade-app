export default async function handler(req, res) {
  // 1. CONFIGURAÇÃO DE CORS (ESSENCIAL PARA VERCEL)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { titulo, desc, link } = req.body;

    if (!titulo || !desc || !link) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // 2. BUSCAR UTILIZADORES NO FIREBASE
    const usersRes = await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users.json");
    const usersData = await usersRes.json();

    if (!usersData) {
      return res.status(400).json({ error: "Nenhum usuário encontrado no Firebase" });
    }

    const userIds = Object.values(usersData)
      .map(u => u.user_id)
      .filter(id => id != null);

    if (userIds.length === 0) {
      return res.status(400).json({ error: "Nenhum ID de usuário válido" });
    }

    // 3. ENVIAR PARA ONESIGNAL (URL E AUTH CORRIGIDOS)
    // URL correta da documentação: https://onesignal.com/api/v1/notifications
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // MUDANÇA CRÍTICA: "Basic" para chaves os_v2 + .trim() para evitar espaços
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_KEY.trim()}`
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        headings: { en: titulo, pt: titulo, es: titulo },
        contents: { en: desc, pt: desc, es: desc },
        web_url: link,
        // Enviar para todos que têm o External ID mapeado no banco
        include_aliases: {
          external_id: userIds
        },
        target_channel: "push"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro OneSignal:", data);
      return res.status(response.status).json(data);
    }

    // 4. SALVAR NO HISTÓRICO DO FIREBASE
    await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/promos.json", {
      method: "POST",
      body: JSON.stringify({
        titulo,
        desc,
        link,
        total_users: userIds.length,
        created_at: Date.now(),
        exp: Date.now() + (3600 * 1000)
      })
    });

    return res.status(200).json({ success: true, data });

  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ error: err.message });
  }
}
