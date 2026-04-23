export default async function handler(req, res) {
  // Configuração de CORS para permitir que o dashboard acesse a API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responde rapidamente a requisições de verificação (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { titulo, desc, app_id, api_key } = req.body;

  if (!api_key || !app_id) {
    return res.status(400).json({ error: "Faltan chaves API" });
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // MUDANÇA CRÍTICA: Usar 'Basic' e aplicar .trim() para evitar espaços invisíveis
        "Authorization": "Basic " + api_key.trim() 
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
      // Retorna o erro detalhado da OneSignal para o seu console
      return res.status(response.status).json({ erro_onesignal: data });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
