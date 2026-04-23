export default async function handler(req, res) {
    // Permite apenas o método POST vindo do seu dashboard
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { titulo, desc, link } = req.body;
    
    const REST_API_KEY = "os_v2_app_cd6qqerxb5aivhvfzozut5owgubi5l5pvkqutnnclrleqng4gl4y3od5babtsob4nqqggdpkrfpgtyp7cld73giruoufaflvp3rrwtq";
    const APP_ID = "10fd0812-370f-408a-9ea5-cbb349f5d635";

    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": "Basic " + REST_API_KEY
            },
            body: JSON.stringify({
                app_id: APP_ID,
                included_segments: ["Total Subscriptions"],
                headings: { "en": titulo, "es": titulo },
                contents: { "en": desc, "es": desc },
                url: link,
                isAndroid: true,
                android_accent_color: "6A0DAD",
                android_channel_id: "fcm_fallback_notification_channel",
                content_available: true
            })
        });

        const data = await response.json();
        
        // Retorna a resposta real do OneSignal para o seu dashboard exibir no log
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Falha na comunicação com o OneSignal' });
    }
}
