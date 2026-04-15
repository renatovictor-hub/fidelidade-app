export default async function handler(req, res) {

  try {

    const { titulo, desc, link } = req.body;

    // 🔥 BUSCAR USUÁRIOS NO FIREBASE
    const usersRes = await fetch("https://fidelidade-app-9671c-default-rtdb.firebaseio.com/users.json");
    const usersData = await usersRes.json();

    if (!usersData) {
      return res.status(400).json({ error: "Sem usuários" });
    }

    // 🔥 PEGAR TODOS OS IDS
    const userIds = Object.values(usersData).map(u => u.user_id);

    console.log("Usuarios:", userIds);

    // 🔥 ENVIAR PUSH
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Authorization": "Bearer os_v2_app_cd6qqerxb5aivhvfzozut5owgw2lnapwbmreg5uz7z76ur5il6vwde4sxehko5vrupfgj4zwvqy4najznu5a3bnljpyxsos7nieawlq",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",

        target_channel: "push",

        include_aliases: {
          external_id: userIds
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

    console.log("Resposta OneSignal:", data);

    if (!response.ok) {
      return res.status(400).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }

}
