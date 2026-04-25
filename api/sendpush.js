export default async function handler(req, res) {
  // 1. Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { titulo, desc, link } = req.body;

    // LIMPEZA DA CHAVE: Remove espaços, quebras de linha e aspas extras
    const rawKey = process.env.ONESIGNAL_REST_KEY || "";
    const cleanKey = rawKey.replace(/\r?\n|\r/g, "").trim();

    if (!cleanKey) {
      return res.status(500).json({ error: "A chave ONESIGNAL_REST_KEY não foi encontrada na Vercel." });
    }

    // 2. Chamada ao OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // AUTH: Basic + Chave Limpa
        "Authorization": `Basic ${cleanKey}`
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
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
        debug_chave_comprimento: cleanKey.length // Ajuda a saber se a chave foi lida
      });
    }

    return res.status(200).json({ success: true, data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
