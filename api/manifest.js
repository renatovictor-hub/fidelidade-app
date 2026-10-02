import { getRestaurantConfig } from "../lib/server/restaurant-config.js";

export default function handler(req,res){
  const cfg=getRestaurantConfig();
  res.setHeader("Content-Type","application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control","public, max-age=300");
  return res.status(200).json({
    name:cfg.name+" Fidelidad",
    short_name:cfg.shortName,
    start_url:"/",
    display:"standalone",
    background_color:"#ffffff",
    theme_color:cfg.primaryColor,
    orientation:"portrait",
    icons:[
      {src:cfg.icon192,sizes:"192x192",type:"image/png"},
      {src:cfg.icon512,sizes:"512x512",type:"image/png"}
    ]
  });
}
