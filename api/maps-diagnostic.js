export default async function handler(req, res) {
  const apiKey = String(process.env.GOOGLE_ROUTES_API_KEY || "").trim();
  if (!apiKey) return res.status(500).json({ ok:false, reason:"missing_key" });
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text"
      },
      body: JSON.stringify({ input:"Calle Mediterraneo", includedRegionCodes:["mx"], languageCode:"es", regionCode:"mx" })
    });
    const data = await response.json().catch(()=>({}));
    return res.status(200).json({ ok:response.ok, status:response.status, error:data?.error?.status||null, message:data?.error?.message||null, suggestions:(data?.suggestions||[]).length });
  } catch (error) {
    return res.status(200).json({ ok:false, status:0, message:error?.message||String(error) });
  }
}
