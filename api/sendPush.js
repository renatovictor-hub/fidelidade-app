export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { titulo, desc, link } = req.body;

  try {

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Key os_v2_app_cd6qqerxb5aivhvfzozut5owgucs23efcdcemzedbmcboer2ggjbs3xbavievtp5o67eds43x6fd4w3jla3sjf6v6wwviq4fdgtsuey"
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        included_segments: ["All"],
        headings: { en: titulo },
        contents: { en: desc },
        url: link
      })
    });

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: "Erro ao enviar push" });
  }
}
