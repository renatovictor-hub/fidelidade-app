export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { titulo, desc } = req.body;

    // AS CHAVES FICAM AQUI (PROTEGIDAS NO SERVIDOR)
    const APP_ID = "10fd0812-370f-408a-9ea5-cbb349f5d635";
    const API_KEY = "os_v2_app_cd6qqerxb5aivhvfzozut5owgubi5l5pvkqutnnclrleqng4gl4y3od5babtsob4nqqggdpkrfpgtyp7cld73giruoufaflvp3rrwtq";

    try {
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": "Basic " + API_KEY.trim()
            },
            body: JSON.stringify({
                app_id: APP_ID,
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
