export default async function handler(req, res) {

  try {

    const { titulo, desc, link } = req.body;

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 2lnapwbmreg5uz7z76ur5il6v",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({

        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",

        target_channel: "push",

        // 🔥 ESSA LINHA É O SEGREDO
        include_aliases: {
          external_id: ["all"]
        },

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

    console.log("OneSignal:", data);

    if (!response.ok) {
      return res.status(400).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
