import { requireAdmin } from "../lib/server/admin-auth.js";
import { getRestaurantConfig } from "../lib/server/restaurant-config.js";

function has(name){return String(process.env[name]||"").trim().length>0}

export default function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  if(!requireAdmin(req,res))return;
  const cfg=getRestaurantConfig();
  const items=[
    {
      id:"identity",
      label:"Identidad del restaurante",
      ok:!!(cfg.id&&cfg.name&&cfg.domain&&cfg.whatsapp),
      detail:"Nombre, dominio y WhatsApp"
    },
    {
      id:"firebase",
      label:"Firebase",
      ok:["FIREBASE_PROJECT_ID","FIREBASE_DATABASE_URL","FIREBASE_CLIENT_EMAIL","FIREBASE_PRIVATE_KEY"].every(has),
      detail:"Proyecto y cuenta de servicio aislados"
    },
    {
      id:"onesignal",
      label:"OneSignal",
      ok:!!cfg.oneSignalAppId&&has("ONESIGNAL_REST_KEY"),
      detail:"App y REST key del restaurante"
    },
    {
      id:"google",
      label:"Google Maps / Routes",
      ok:cfg.modules.delivery?has("GOOGLE_ROUTES_API_KEY"):true,
      detail:cfg.modules.delivery?"Obligatorio para Delivery":"No requerido sin Delivery"
    },
    {
      id:"admin_security",
      label:"Seguridad del panel",
      ok:has("DASHBOARD_PASSWORD")&&(has("ADMIN_SESSION_SECRET")||has("DASHBOARD_PASSWORD")),
      detail:"Contraseña y sesión administrativa"
    },
    {
      id:"client_security",
      label:"Sesión de clientes",
      ok:has("CLIENT_SESSION_SECRET")||has("DASHBOARD_PASSWORD"),
      detail:"Firma de sesión de cliente"
    }
  ];
  return res.status(200).json({
    ready:items.every(x=>x.ok),
    restaurant:{id:cfg.id,name:cfg.name,modules:cfg.modules},
    items
  });
}
