export default async function handler(req, res) {

  try {

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { titulo, desc, link } = req.body || {};

    if (!titulo || !desc) {
      return res.status(400).json({ error: "Faltando dados" });
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Bearer os_v2_app_cd6qqerxb5aivhvfzozut5owgwukxlod3ctuw5v2cep4jyxn46xk6urqt76rnkbwlzgm3ebgvytorglcc4wzkylfucyfldveye2omxq"
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",

        target_channel: "push",

        // 🔥 esse funciona na prática
        included_segments: ["All"],

        headings: {
          en: titulo
        },

        contents: {
          en: desc
        },

        web_url: link
      })
    });

    const data = await response.json();

    console.log("OneSignal response:", data);

    if (!response.ok) {
      return res.status(400).json({
        erro: data
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {
    console.error("ERRO SERVIDOR:", err);
    return res.status(500).json({
      error: "Erro interno"
    });
  }
}
