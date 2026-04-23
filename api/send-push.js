export default async function handler(req, res) {
  // Cabeçalhos de CORS para permitir que seu dashboard fale com esta API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { titulo, desc, app_id, api_key } = req.body;

  // Verificação básica para não enviar vazio
  if (!api_key || !app_id) {
    return res.status(400).json({ error: "Faltan chaves API" });
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${api_key}` // Formato estrito: Key espaço CHAVE
      },
      body: JSON.stringify({
        app_id: app_id,
        included_segments: ["Total Subscriptions"],
        headings: { "en": titulo, "es": titulo },
        contents: { "en": desc, "es": desc },
        android_accent_color: "6A0DAD",
        isAndroid: true
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      return res.status(200).json(data);
    } else {
      return res.status(response.status).json(data);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
