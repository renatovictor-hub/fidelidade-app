export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { titulo, desc, link } = req.body;

  try {

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer os_v2_app_cd6qqerxb5aivhvfzozut5owgw7eg6jube3up3nmw45ydck3i4cdr2ij2cwvoucasf3mlcyiz4k7v7xh4tc55tiet4vkjxhdt7ml3sy"
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",

        target_channel: "push",

        // 🔥 NOVO PADRÃO OBRIGATÓRIO
        included_segments: ["Total Subscriptions"],

        headings: {
          en: titulo,
          es: titulo
        },

        contents: {
          en: desc,
          es: desc
        },

        web_url: link   // 🔥 IMPORTANTE (não usar mais "url")
      })
    });

    const data = await response.json();

    console.log("OneSignal:", data);

    if (!response.ok) {
      return res.status(400).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao enviar push" });
  }
}
