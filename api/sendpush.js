export default async function handler(req, res) {
  // 1. Cabeçalhos de Permissão (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { titulo, desc, link } = req.body;

    // 2. Chamada ao OneSignal usando SEGMENTOS (Mais seguro contra 403)
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // AQUI: Basic + Espaço + Chave (sem quebras de linha)
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_KEY.trim()}`
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        // Enviando para TODOS os inscritos (evita erro de ID inexistente)
        included_segments: ["Total Subscriptions"],
        headings: { en: titulo, pt: titulo, es: titulo },
        contents: { en: desc, pt: desc, es: desc },
        web_url: link,
        isAndroid: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        erro_onesignal: data,
        msg: "O OneSignal recusou a chave ou os dados."
      });
    }

    // 3. Salvar no Firebase apenas se o envio acima der certo
    await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/promos.json", {
      method: "POST",
      body: JSON.stringify({
        titulo,
        desc,
        link,
        exp: Date.now() + (3600 * 1000), // 1 hora de validade
        created_at: Date.now()
      })
    });

    return res.status(200).json({ success: true, data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
