export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { titulo, desc, link } = req.body;

    // Puxa a chave e limpa qualquer erro de espaço
    const chave = (process.env.ONESIGNAL_REST_KEY || "").trim();

    if (!chave) {
      return res.status(500).json({ error: "ERRO: A variável ONESIGNAL_REST_KEY não foi encontrada ou está vazia na Vercel." });
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${chave}`
      },
    body: JSON.stringify({
  app_id: "10fd0812-370f-408a-9ea5-cbb349f5d635",
  included_segments: ["All Users"],
  headings: { en: titulo, pt: titulo, es: titulo },
  contents: { en: desc, pt: desc, es: desc },
  web_url: link
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        msg: "O OneSignal recusou a chave. Verifique se a chave na Vercel é a 'REST API KEY' e não a 'User Auth Key'.",
        detalhes: data 
      });
    }

    return res.status(200).json({ success: true, data });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
