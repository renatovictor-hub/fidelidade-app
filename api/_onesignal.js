const ONESIGNAL_APP_ID = "10fd0812-370f-408a-9ea5-cbb349f5d635";

export async function enviarNotificacao({ uid, titulo, mensagem, url = "/", todos = false }) {
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    if (!apiKey) {
        console.warn("ONESIGNAL_REST_API_KEY no configurada; push omitido.");
        return { skipped: true };
    }

    const body = {
        app_id: ONESIGNAL_APP_ID,
        headings: { es: titulo, en: titulo },
        contents: { es: mensagem, en: mensagem },
        url,
        web_url: url,
        chrome_web_icon: "/logo.png",
        chrome_web_badge: "/logo.png",
        priority: 10
    };

    if (todos) {
        body.included_segments = ["Subscribed Users"];
    } else {
        body.include_aliases = { external_id: [uid] };
        body.target_channel = "push";
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Key ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        console.error("OneSignal error:", response.status, data);
        return { error: true, status: response.status, details: data };
    }
    return data;
}
