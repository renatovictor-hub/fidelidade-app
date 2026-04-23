export default async function handler(req, res) {
    // 1. CORS - Permite que seu dashboard fale com a API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { titulo, desc, app_id, api_key } = req.body;

    // 2. Validação da Chave (O OneSignal v2 exige 'Basic')
    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${api_key.trim()}`
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
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
