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
        "Authorization": "Bearer os_v2_app_cd6qqerxb5aivhvfzozut5owgw7eg6jube3up3nmw45ydck3i4cdr2ij2cwvuocasf3mlcyiz4k7v7xh4tc55tiet4vkjxhdt7ml3sy"
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",

        target_channel: "push",

        // 🔥 CORRETO
        included_segments: ["All"],

        headings: {
          en: titulo,
          es: titulo
        },

        contents: {
          en: desc,
          es: desc
        },

        web_url: link
      })
    });

    const data = await response.json();

    console.log("OneSignal response:", data);

    if (!response.ok) {
  console.error("ERRO ONESIGNAL:", data);
  return res.status(400).json({
    erro: data
  });
}

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao enviar push"
    });
  }
}
