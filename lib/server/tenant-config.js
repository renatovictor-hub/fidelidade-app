function clean(v,max=160){return String(v??"").trim().slice(0,max)}
export function normalizeCompanyId(value){
  const raw=clean(value,80).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  if(!raw||raw==="uaiso"||raw==="uai-so")return "uai-so";
  return raw.slice(0,50);
}
export async function getPublicCompanyConfig(admin,req,legacy){
  const companyId=normalizeCompanyId(req.query?.company||req.headers?.["x-restaurant-id"]||"uai-so");
  if(companyId==="uai-so"){
    const snap=await admin.database().ref("config/restaurant_contact").once("value");
    const cfg=snap.val()||{};
    const whatsapp=String(cfg.whatsapp||legacy.whatsapp).replace(/\D/g,"").slice(0,15);
    return {
      id:"uai-so",
      restaurant_id:"uai-so",
      name:legacy.name,
      short_name:legacy.shortName,
      whatsapp:whatsapp||legacy.whatsapp,
      primary_color:legacy.primaryColor,
      accent_color:legacy.accentColor,
      logo:legacy.logo,
      instagram_url:legacy.instagramUrl,
      timezone:legacy.timezone,
      currency:legacy.currency,
      locale:legacy.locale,
      modules:legacy.modules,
      onesignal_app_id:legacy.oneSignalAppId,
      data_mode:"legacy"
    };
  }
  const snap=await admin.database().ref("saas/companies/"+companyId).once("value");
  if(!snap.exists())return null;
  const c=snap.val()||{};
  if(c.active===false||c.status==="suspended")return null;
  const modules={
    loyalty:c.modules?.fidelity!==false,
    delivery:c.modules?.delivery===true,
    orders:c.modules?.orders===true,
    notifications:c.modules?.notifications!==false,
    missions:c.modules?.missions!==false,
    reviews:c.modules?.reviews!==false
  };
  return {
    id:companyId,
    restaurant_id:companyId,
    name:clean(c.name||"Restaurante",120),
    short_name:clean(c.shortName||c.short_name||c.name||"Restaurante",80),
    whatsapp:String(c.whatsapp||"").replace(/\D/g,"").slice(0,15),
    primary_color:clean(c.branding?.primary||"#6a0dad",20),
    accent_color:clean(c.branding?.secondary||"#ffcc00",20),
    logo:clean(c.logo||c.branding?.logo||"",800),
    instagram_url:clean(c.instagramUrl||c.instagram_url||"",800),
    timezone:clean(c.timezone||legacy.timezone||"America/Cancun",80),
    currency:clean(c.currency||legacy.currency||"MXN",8).toUpperCase(),
    locale:clean(c.locale||legacy.locale||"es-MX",20),
    modules,
    onesignal_app_id:clean(c.oneSignalAppId||"",120),
    data_mode:"tenant"
  };
}
