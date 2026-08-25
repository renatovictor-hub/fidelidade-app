const ONESIGNAL_APP_ID = "10fd0812-370f-408a-9ea5-cbb349f5d635";

function topicoUnico() {
    return `uaiso-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 64);
}

export async function enviarNotificacao({ uid, telefone, titulo, mensagem, url = "https://fidelidad-uai-so.vercel.app/", todos = false, imagem = "" }) {
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
        priority: 10,
        web_push_topic: topicoUnico(),
        chrome_web_icon: "https://fidelidad-uai-so.vercel.app/logo.png",
        ...(imagem ? { big_picture: imagem, chrome_web_image: imagem, ios_attachments: { promo: imagem } } : {})
    };

    if (todos) {
        // Mantém o mesmo critério usado anteriormente, que já funcionava no projeto.
        body.filters = [
            {
                field: "last_session",
                relation: ">",
                value: "0"
            }
        ];
    } else if (telefone) {
        // Usuários antigos nem sempre possuem external_id no OneSignal,
        // mas o app já grava o telefone como tag durante o cadastro/recuperação.
        body.filters = [
            {
                field: "tag",
                key: "telefone",
                relation: "=",
                value: String(telefone)
            }
        ];
    } else if (uid) {
        // Fallback para contas que já possuem external_id corretamente vinculado.
        body.include_aliases = { external_id: [uid] };
        body.target_channel = "push";
    } else {
        return { error: true, status: 400, details: "Destino de push não informado" };
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
