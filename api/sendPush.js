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
        "Authorization": "Bearer os_v2_app_cd6qqerxb5aivhvfzozut5owgvnremvccsduz3nf2fe2xxyxyxpoeh4p62regkczzri2vmdrydgqujcjwafcmggvgxr5fj6n4shvk6a"
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
        target_channel: "push",
        included_segments: ["Subscribed Users"],
        headings: {
          en: titulo,
          es: titulo
        },
        contents: {
          en: desc,
          es: desc
        },
        url: link
      })
    });

    const data = await response.json();

    console.log("OneSignal response:", data);

    if (!response.ok) {
      return res.status(400).json(data);
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
