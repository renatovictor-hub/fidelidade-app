const bool=(v,fallback=false)=>{
  if(v==null||v==="")return fallback;
  return ["1","true","yes","on"].includes(String(v).toLowerCase());
};
const num=(v,fallback)=>{
  const n=Number(v);return Number.isFinite(n)?n:fallback;
};
export function getRestaurantConfig(){
  const vercelUrl=String(process.env.VERCEL_URL||"").trim();
  const domain=String(process.env.APP_PUBLIC_URL||(vercelUrl?("https://"+vercelUrl):"")).replace(/\/$/,"");
  return {
    id:String(process.env.RESTAURANT_ID||"restaurant").trim(),
    name:String(process.env.RESTAURANT_NAME||"Restaurant").trim(),
    shortName:String(process.env.RESTAURANT_SHORT_NAME||process.env.RESTAURANT_NAME||"Restaurant").trim(),
    whatsapp:String(process.env.RESTAURANT_WHATSAPP||"").replace(/\D/g,"").slice(0,15),
    instagramUrl:String(process.env.RESTAURANT_INSTAGRAM_URL||"").trim(),
    domain,
    logo:String(process.env.RESTAURANT_LOGO_URL||(domain?domain+"/logo.png":"/logo.png")).trim(),
    icon192:String(process.env.RESTAURANT_ICON_192_URL||(domain?domain+"/icon-192.png":"/icon-192.png")).trim(),
    icon512:String(process.env.RESTAURANT_ICON_512_URL||(domain?domain+"/icon-512.png":"/icon-512.png")).trim(),
    primaryColor:String(process.env.RESTAURANT_PRIMARY_COLOR||"#6a0dad").trim(),
    accentColor:String(process.env.RESTAURANT_ACCENT_COLOR||"#ffcc00").trim(),
    timezone:String(process.env.RESTAURANT_TIMEZONE||"America/Cancun").trim(),
    currency:String(process.env.RESTAURANT_CURRENCY||"MXN").trim().toUpperCase(),
    locale:String(process.env.RESTAURANT_LOCALE||"es-MX").trim(),
    addressSuffix:String(process.env.RESTAURANT_ADDRESS_SUFFIX||"Cancún, Quintana Roo, México").trim(),
    modules:{
      loyalty:bool(process.env.MODULE_LOYALTY,true),
      delivery:bool(process.env.MODULE_DELIVERY,false),
      missions:bool(process.env.MODULE_MISSIONS,true),
      reviews:bool(process.env.MODULE_REVIEWS,true)
    },
    location:{
      latitude:num(process.env.RESTAURANT_LATITUDE,0),
      longitude:num(process.env.RESTAURANT_LONGITUDE,0)
    },
    oneSignalAppId:String(process.env.ONESIGNAL_APP_ID||"").trim(),
    legacyCatalogFallback:bool(process.env.LEGACY_CATALOG_FALLBACK,false)
  };
}
