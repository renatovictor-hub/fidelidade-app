export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Garantindo que os dados existam ou tenham um padrão
    const titulo = req.body.titulo || "Novidade na Uai Sô!";
    const desc = req.body.desc || "Confira o que preparamos para você.";
    const link = req.body.link || "https://fidelidad-uai-so.vercel.app";

    const chave = (process.env.ONESIGNAL_REST_KEY || "").trim();

    if (!chave) {
      return res.status(500).json({ error: "ERRO: REST_KEY não configurada na Vercel." });
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${chave}`
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        // USANDO FILTROS EM VEZ DE SEGMENTOS (Mais robusto)
        // Isso seleciona qualquer um que tenha aberto o app pelo menos 1 vez
        filters: [
          { "field": "last_session", "relation": ">", "value": "0" }
        ],
        headings: { en: titulo, pt: titulo, es: titulo },
        contents: { en: desc, pt: desc, es: desc },
        url: link,
        // Garante que o OneSignal saiba que é para Push Notification
        target_channel: "push"
      })
    });

    const data = await response.json();

    return res.status(200).json({ success: true, data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
