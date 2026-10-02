import { getFirebaseAdmin } from "./_firebase.js";
import { requireAdmin } from "./_admin-auth.js";

const admin=getFirebaseAdmin();

const db=admin.database();
const REF="config/client_banners";
const validDataUrl=v=>/^data:image\/(jpeg|jpg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(String(v||""));
const cleanItems=items=>(Array.isArray(items)?items:[]).slice(0,6).map((x,i)=>({
  id:String(x?.id||("banner_"+(i+1))).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,50),
  image:String(x?.image||""),
  alt:String(x?.alt||"").trim().slice(0,100),
  order:i
})).filter(x=>validDataUrl(x.image)&&x.image.length<=600000);

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method==="OPTIONS") return res.status(200).end();
  try{
    if(req.method==="GET"){
      const snap=await db.ref(REF).once("value");
      const cfg=snap.val()||{};
      const items=cleanItems(cfg.items||[]);
      return res.status(200).json({success:true,enabled:cfg.enabled!==false,interval_ms:Math.max(3000,Math.min(15000,Number(cfg.interval_ms||5000))),items});
    }
    if(!requireAdmin(req,res)) return;
    if(req.method==="POST"){
      const original=Array.isArray(req.body?.items)?req.body.items:[];
      const items=cleanItems(original);
      if(original.length>items.length) return res.status(400).json({error:"Una o más imágenes no son válidas o superan el tamaño permitido."});
      const value={
        enabled:req.body?.enabled!==false,
        interval_ms:Math.max(3000,Math.min(15000,Number(req.body?.interval_ms||5000))),
        items,
        updated_at:new Date().toISOString()
      };
      await db.ref(REF).set(value);
      await db.ref("config_audit").push().set({config:"client_banners",value:{enabled:value.enabled,interval_ms:value.interval_ms,count:items.length},data:value.updated_at,origen:"dashboard",actor:"Administrador"});
      return res.status(200).json({success:true,config:value});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(error){
    console.error("client-banners",error);
    return res.status(500).json({error:"Error interno",details:error.message});
  }
}
