export default async function handler(req, res) {

  // ==============================
  // 1. CABEÇALHOS CORS (Muito Importante)
  // ==============================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Se o navegador enviar uma requisição de verificação, respondemos com sucesso na hora
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==============================
  // 2. PERMITIR APENAS POST
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
    // 3. BUSCAR USUÁRIOS NO FIREBASE
    // ==============================
    const usersRes = await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users.json");
    const usersData = await usersRes.json();

    if (!usersData) {
      return res.status(400).json({ error: "Nenhum usuário encontrado" });
    }

    const userIds = Object.values(usersData)
      .map(u => u.user_id)
      .filter(id => id != null);

    if (userIds.length === 0) {
      return res.status(400).json({ error: "Nenhum ID válido" });
    }

    // ==============================
    // 4. ENVIAR EM LOTES PARA ONESIGNAL
    // ==============================
    const chunkSize = 2000;
    const chunks = [];

    for (let i = 0; i < userIds.length; i += chunkSize) {
      chunks.push(userIds.slice(i, i + chunkSize));
    }

    let resultados = [];

    for (const chunk of chunks) {

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          // AQUI ESTAVA O ERRO! Trocado "Key" por "Basic"
          "Authorization": `Basic ${process.env.ONESIGNAL_REST_KEY.trim()}`
        },
        body: JSON.stringify({
          app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
          target_channel: "push",
          include_aliases: {
            external_id: chunk
          },
          headings: {
            en: titulo,
            pt: titulo,
            es: titulo
          },
          contents: {
            en: desc,
            pt: desc,
            es: desc
          },
          web_url: link,
          isAndroid: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erro OneSignal:", data);
        // É esta linha que devolvia o 403 pro seu navegador!
        return res.status(response.status).json(data);
      }

      resultados.push(data);
    }

    // ==============================
    // 5. SALVAR HISTÓRICO DE PROMO
    // ==============================
    await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/promos.json", {
      method: "POST",
      body: JSON.stringify({
        titulo,
        desc,
        link,
        total_users: userIds.length,
        created_at: Date.now(),
        // Define o tempo de expiração que você enviou ou um padrão
        exp: Date.now() + (3600 * 1000) 
      })
    });

    // ==============================
    // 6. RESPOSTA FINAL
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
