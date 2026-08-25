const ONESIGNAL_APP_ID = "10fd0812-370f-408a-9ea5-cbb349f5d635";

export async function enviarNotificacao({ uid, titulo, mensagem, url = "https://fidelidad-uai-so.vercel.app/", todos = false, imagem = "" }) {
    // Mantém compatibilidade com a variável que já existe na Vercel.
    const apiKey = String(process.env.ONESIGNAL_REST_KEY || process.env.ONESIGNAL_REST_API_KEY || "").trim();
    if (!apiKey) {
        console.warn("ONESIGNAL_REST_KEY no configurada; push omitido.");
        return { skipped: true };
    }

    const body = {
        app_id: ONESIGNAL_APP_ID,
        headings: { es: titulo, pt: titulo, en: titulo },
        contents: { es: mensagem, pt: mensagem, en: mensagem },
        url,
        target_channel: "push",
        priority: 10,
        ...(imagem ? { big_picture: imagem, chrome_web_image: imagem, ios_attachments: { promo: imagem } } : {})
    };

    if (todos) {
        body.included_segments = ["Subscribed Users"];
    } else {
        body.include_aliases = { external_id: [uid] };
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": `Key ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.errors) {
        console.error("OneSignal error:", response.status, data);
        return { error: true, status: response.status, details: data };
    }
    return data;
}
