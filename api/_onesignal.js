const ONESIGNAL_APP_ID = "10fd0812-370f-408a-9ea5-cbb349f5d635";

function topicoUnico() {
    return `uaiso-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 64);
}

function filtrosTelefones(telefones) {
    const unicos = [...new Set((telefones || []).map(v => String(v || "").replace(/\D/g, "")).filter(v => v.length === 10))];
    const filtros = [];
    unicos.forEach((telefone, index) => {
        if (index > 0) filtros.push({ operator: "OR" });
        filtros.push({ field: "tag", key: "telefone", relation: "=", value: telefone });
    });
    return filtros;
}

export async function enviarNotificacao({ uid, telefone, telefones, titulo, mensagem, url = "https://fidelidad-uai-so.vercel.app/", todos = false, imagem = "" }) {
    const apiKey = String(process.env.ONESIGNAL_REST_KEY || process.env.ONESIGNAL_REST_API_KEY || "").trim();
    if (!apiKey) return { skipped: true };

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
        body.filters = [{ field: "last_session", relation: ">", value: "0" }];
    } else if (Array.isArray(telefones) && telefones.length) {
        body.filters = filtrosTelefones(telefones);
        if (!body.filters.length) return { error: true, status: 400, details: "Nenhum telefone válido para envio" };
    } else if (telefone) {
        body.filters = [{ field: "tag", key: "telefone", relation: "=", value: String(telefone).replace(/\D/g, "") }];
    } else if (uid) {
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
