import { requireAdmin } from "./_admin-auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const titulo = req.body?.titulo || "Novidade na Uai Sô!";
    const desc = req.body?.desc || "Confira o que preparamos para você.";
    const link = req.body?.link || "https://fidelidad-uai-so.vercel.app";
    const imagem = String(req.body?.imagem || "").trim();

    const chave = String(process.env.ONESIGNAL_REST_KEY || "").trim();

    if (!chave) {
      return res.status(500).json({
        error: "ERRO: REST_KEY não configurada na Vercel."
      });
    }

    const response = await fetch(
      "https://onesignal.com/api/v1/notifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": `Basic ${chave}`
        },
        body: JSON.stringify({
          app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
          filters: [
            {
              field: "last_session",
              relation: ">",
              value: "0"
            }
          ],
          headings: {
            en: titulo,
            pt: titulo,
            es: titulo
          },
          contents: {
            en: desc,
            pt: desc,
            es: desc
          },
          url: link,
          target_channel: "push",
          ...(imagem ? {
            big_picture: imagem,
            chrome_web_image: imagem,
            ios_attachments: {
              promo: imagem
            }
          } : {})
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.errors) {
      return res.status(response.status || 502).json({
        error: "OneSignal rechazó la notificación",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
