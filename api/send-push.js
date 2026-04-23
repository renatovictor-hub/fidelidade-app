export default async function handler(req, res) {
  // Configura os cabeçalhos para evitar erro de CORS entre sua própria API e o front
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { titulo, desc, app_id, api_key } = req.body;

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Key " + api_key
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
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
