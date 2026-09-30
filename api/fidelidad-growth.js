import admin from "firebase-admin";
import { requireAdmin } from "./_admin-auth.js";
import { enviarNotificacao } from "./_onesignal.js";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    databaseURL: "https://fidelidade-app-9671c-default-rtdb.firebaseio.com"
  });
}

const db=admin.database();
const validUid=uid=>/^user_\d+$/.test(String(uid||""));
const daysSince=v=>{const t=Date.parse(String(v||""));return Number.isFinite(t)?Math.max(0,Math.floor((Date.now()-t)/86400000)):null};
const money=n=>Math.round((Number(n)||0)*100)/100;

function customerStats(uid,user,txs){
  const credits=txs.filter(x=>String(x.tipo||"").toLowerCase()!=="debito"&&Number(x.valor_compra||0)>0);
  const debits=txs.filter(x=>String(x.tipo||"").toLowerCase()==="debito");
  const gasto=credits.reduce((s,x)=>s+Math.max(0,Number(x.valor_compra||0)),0);
  const pontosGanhos=credits.reduce((s,x)=>s+Math.max(0,Number(x.pontos||0)),0);
  const last=[...credits].map(x=>x.data||x.created_at).filter(Boolean).sort().pop()||user.ultima_compra||"";
  return {uid,user,txs,compras:credits.length,gasto:money(gasto),pontosGanhos,canjes:debits.length,last,diasSemComprar:daysSince(last)};
}

function missionProgress(m,stats){
  const type=String(m.tipo||"compras");
  const target=Math.max(1,Number(m.meta||1));
  const since=Date.now()-Math.max(1,Number(m.dias||30))*86400000;
  const txs=stats.txs.filter(x=>{const t=Date.parse(String(x.data||x.created_at||""));return Number.isFinite(t)&&t>=since});
  let value=0;
  if(type==="compras") value=txs.filter(x=>Number(x.valor_compra||0)>0&&String(x.tipo||"").toLowerCase()!=="debito").length;
  else if(type==="gasto") value=txs.filter(x=>Number(x.valor_compra||0)>0).reduce((s,x)=>s+Number(x.valor_compra||0),0);
  else if(type==="puntos") value=txs.filter(x=>String(x.tipo||"").toLowerCase()!=="debito").reduce((s,x)=>s+Math.max(0,Number(x.pontos||0)),0);
  return {value:money(value),target,percent:Math.min(100,Math.round((value/target)*100)),completed:value>=target};
}

async function loadAll(){
  const [usersSnap,txSnap,rewardsSnap,missionsSnap,autosSnap,vipSnap,surpriseSnap,baseSnap]=await Promise.all([
    db.ref("users").once("value"),db.ref("transacoes").once("value"),db.ref("recompensas").once("value"),
    db.ref("fidelity_missions").once("value"),db.ref("fidelity_automations").once("value"),
    db.ref("config/niveles_vip").once("value"),db.ref("config/fidelity_surprise").once("value"),
    db.ref("config/loyalty_base").once("value")
  ]);
  const users=usersSnap.val()||{},txRaw=txSnap.val()||{},byUser=new Map();
  Object.values(txRaw).forEach(x=>{const uid=String(x.user_id||x.uid||"");if(!uid)return;if(!byUser.has(uid))byUser.set(uid,[]);byUser.get(uid).push(x||{})});
  return {
    users,byUser,
    rewards:Object.entries(rewardsSnap.val()||{}).map(([id,x])=>({id,...x})).filter(x=>x.ativa!==false).sort((a,b)=>Number(a.pontos||0)-Number(b.pontos||0)),
    missions:Object.entries(missionsSnap.val()||{}).map(([id,x])=>({id,...x})).sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||""))),
    automations:Object.entries(autosSnap.val()||{}).map(([id,x])=>({id,...x})),
    vip:vipSnap.val()||{},
    surprise:surpriseSnap.val()||{},
    base:baseSnap.val()||{}
  };
}

function segmentCounts(stats){
  return {
    total:stats.length,
    nuevos:stats.filter(x=>(daysSince(x.user.created_at)||999)<=30).length,
    activos:stats.filter(x=>x.diasSemComprar!=null&&x.diasSemComprar<=30).length,
    inactivos:stats.filter(x=>x.diasSemComprar!=null&&x.diasSemComprar>30).length,
    frecuentes:stats.filter(x=>x.compras>=3).length,
    alto_gasto:stats.filter(x=>x.gasto>=1000).length,
    sin_compras:stats.filter(x=>x.compras===0).length
  };
}

function automationMatch(a,s,rewards){
  const type=String(a.tipo||"inactive");
  const threshold=Number(a.valor||30);
  if(type==="inactive") return s.diasSemComprar!=null&&s.diasSemComprar>=threshold;
  if(type==="new") return (daysSince(s.user.created_at)||999)<=threshold;
  if(type==="frequent") return s.compras>=threshold;
  if(type==="near_reward"){
    const next=rewards.find(r=>Number(r.pontos||0)>Number(s.user.pontos||0));
    return !!next&&(Number(next.pontos)-Number(s.user.pontos||0))<=threshold;
  }
  return false;
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method==="OPTIONS")return res.status(200).end();
  try{
    if(req.method==="GET"&&req.query.uid){
      const uid=String(req.query.uid||"").trim();
      if(!validUid(uid))return res.status(400).json({error:"Cliente inválido"});
      const all=await loadAll(),user=all.users[uid];
      if(!user)return res.status(404).json({error:"Cliente no encontrado"});
      const stats=customerStats(uid,user,all.byUser.get(uid)||[]);
      const points=Number(user.pontos||0),acc=Number(user.pontos_acumulados??points);
      const nextReward=all.rewards.find(r=>Number(r.pontos||0)>points)||null;
      const pesosPorPunto=Math.max(1,Math.min(1000,Number(all.base.pesos_por_punto||10)));
      const vip=all.vip.ativo===false?"":acc>=Number(all.vip.diamante||1500)?"Diamante":acc>=Number(all.vip.ouro||800)?"Oro":acc>=Number(all.vip.prata||300)?"Plata":"Bronce";
      const claims=user.mission_claims||{};
      const missions=all.missions.filter(m=>m.ativa!==false).map(m=>({...m,progress:missionProgress(m,stats),claimed:claims[m.id]===true}));
      const badges=[];
      if(stats.compras>=1)badges.push({icon:"🥉",name:"Primera compra"});
      if(stats.compras>=3)badges.push({icon:"🔥",name:"Cliente frecuente"});
      if(stats.compras>=10)badges.push({icon:"🏆",name:"10 compras"});
      if(stats.gasto>=2500)badges.push({icon:"💎",name:"Cliente premium"});
      return res.status(200).json({
        success:true,
        client:{uid,nome:user.nome||user.nombre||"",pontos:points,pontos_acumulados:acc,vip,compras:stats.compras,gasto:stats.gasto},
        next_reward:nextReward?{...nextReward,faltan:Math.max(0,Number(nextReward.pontos||0)-points),compra_aprox:Math.max(0,(Number(nextReward.pontos||0)-points)*pesosPorPunto)}:null,
        loyalty_rule:{pesos_por_punto:pesosPorPunto},
        missions,badges,
        surprise:(()=>{
          if(all.surprise.ativa===false)return null;
          const rank={Bronce:0,Plata:1,Oro:2,Diamante:3};
          return (rank[vip]??0)>=(rank[String(all.surprise.min_nivel||"Bronce")]??0)?all.surprise:null;
        })(),
        benefits:[
          vip==="Diamante"&&all.vip.beneficio_diamante?{icon:"💎",title:"Beneficio Diamante",text:all.vip.beneficio_diamante}:null,
          vip==="Oro"&&all.vip.beneficio_ouro?{icon:"👑",title:"Beneficio Oro",text:all.vip.beneficio_ouro}:null,
          vip==="Plata"&&all.vip.beneficio_plata?{icon:"🥈",title:"Beneficio Plata",text:all.vip.beneficio_plata}:null,
          vip==="Bronce"&&all.vip.beneficio_bronce?{icon:"🥉",title:"Beneficio Bronce",text:all.vip.beneficio_bronce}:null,
          stats.compras>=3?{icon:"🔥",title:"Cliente frecuente",text:"Ya formas parte de nuestros clientes frecuentes."}:null
        ].filter(Boolean)
      });
    }

    if(req.method==="POST"&&String(req.body?.action||"")==="claim_mission"){
      const uid=String(req.body?.uid||"").trim(),id=String(req.body?.id||"").trim();
      if(!validUid(uid)||!id)return res.status(400).json({error:"Datos inválidos"});
      const all=await loadAll(),user=all.users[uid],mission=all.missions.find(m=>m.id===id&&m.ativa!==false);
      if(!user||!mission)return res.status(404).json({error:"Misión no encontrada"});
      if(user.mission_claims?.[id]===true)return res.status(409).json({error:"Premio ya reclamado"});
      const stats=customerStats(uid,user,all.byUser.get(uid)||[]),progress=missionProgress(mission,stats);
      if(!progress.completed)return res.status(400).json({error:"Misión todavía incompleta"});
      const reward=Math.max(0,Number(mission.premio_puntos||0)),old=Number(user.pontos||0),next=old+reward,tx=db.ref("transacoes").push(),now=new Date().toISOString();
      const updates={};
      updates[`users/${uid}/mission_claims/${id}`]=true;
      updates[`users/${uid}/mission_claimed_at/${id}`]=now;
      if(reward>0){
        updates[`users/${uid}/pontos`]=next;
        updates[`users/${uid}/pontos_acumulados`]=Number(user.pontos_acumulados??old)+reward;
        updates[`transacoes/${tx.key}`]={user_id:uid,nome:user.nome||user.nombre||"",telefone:user.telefone||"",tipo:"credito",origem:"mision",mision_id:id,mision_titulo:mission.titulo||"",pontos:reward,valor_compra:0,saldo_anterior:old,saldo_novo:next,data:now};
      }
      await db.ref().update(updates);
      return res.status(200).json({success:true,puntos:reward,saldo_nuevo:next});
    }

    if(!requireAdmin(req,res))return;
    if(req.method==="GET"){
      const all=await loadAll();
      const stats=Object.entries(all.users).filter(([uid])=>validUid(uid)).map(([uid,u])=>customerStats(uid,u,all.byUser.get(uid)||[]));
      const segments=segmentCounts(stats);
      const revenue=money(stats.reduce((s,x)=>s+x.gasto,0));
      const redeemed=stats.reduce((s,x)=>s+x.canjes,0);
      const automationPreview=all.automations.map(a=>({...a,audiencia:stats.filter(s=>automationMatch(a,s,all.rewards)).length}));
      return res.status(200).json({
        success:true,missions:all.missions,automations:automationPreview,surprise:all.surprise,
        segments,roi:{ventas_fidelidad:revenue,clientes_con_compra:stats.filter(x=>x.compras>0).length,compras:stats.reduce((s,x)=>s+x.compras,0),canjes:redeemed,ticket_medio:stats.reduce((s,x)=>s+x.compras,0)?money(revenue/stats.reduce((s,x)=>s+x.compras,0)):0}
      });
    }

    if(req.method==="POST"){
      const action=String(req.body?.action||"");
      if(action==="save_mission"){
        const id=String(req.body?.id||"").trim(),ref=id?db.ref("fidelity_missions/"+id):db.ref("fidelity_missions").push();
        const value={titulo:String(req.body?.titulo||"").trim().slice(0,80),descripcion:String(req.body?.descripcion||"").trim().slice(0,180),tipo:["compras","gasto","puntos"].includes(req.body?.tipo)?req.body.tipo:"compras",meta:Math.max(1,Number(req.body?.meta||1)),dias:Math.max(1,Math.min(365,Number(req.body?.dias||30))),premio_puntos:Math.max(0,Number(req.body?.premio_puntos||0)),premio_texto:String(req.body?.premio_texto||"").trim().slice(0,100),ativa:req.body?.ativa!==false,created_at:new Date().toISOString()};
        if(!value.titulo)return res.status(400).json({error:"Título obligatorio"});
        await ref.set(value);return res.status(200).json({success:true,id:ref.key});
      }
      if(action==="delete_mission"){await db.ref("fidelity_missions/"+String(req.body?.id||"")).remove();return res.status(200).json({success:true})}
      if(action==="save_automation"){
        const id=String(req.body?.id||"").trim(),ref=id?db.ref("fidelity_automations/"+id):db.ref("fidelity_automations").push();
        const value={nombre:String(req.body?.nombre||"").trim().slice(0,80),tipo:["inactive","near_reward","new","frequent"].includes(req.body?.tipo)?req.body.tipo:"inactive",valor:Math.max(1,Number(req.body?.valor||30)),titulo:String(req.body?.titulo||"").trim().slice(0,80),mensaje:String(req.body?.mensaje||"").trim().slice(0,180),ativa:req.body?.ativa!==false,created_at:new Date().toISOString()};
        if(!value.nombre||!value.titulo||!value.mensaje)return res.status(400).json({error:"Completa nombre, título y mensaje"});
        await ref.set(value);return res.status(200).json({success:true,id:ref.key});
      }
      if(action==="delete_automation"){await db.ref("fidelity_automations/"+String(req.body?.id||"")).remove();return res.status(200).json({success:true})}
      if(action==="save_surprise"){
        const value={ativa:req.body?.ativa!==false,titulo:String(req.body?.titulo||"").trim().slice(0,80),texto:String(req.body?.texto||"").trim().slice(0,180),min_nivel:String(req.body?.min_nivel||"Bronce"),updated_at:new Date().toISOString()};
        await db.ref("config/fidelity_surprise").set(value);return res.status(200).json({success:true});
      }
      if(action==="run_automation"){
        const id=String(req.body?.id||""),all=await loadAll(),a=all.automations.find(x=>x.id===id);
        if(!a)return res.status(404).json({error:"Automatización no encontrada"});
        const stats=Object.entries(all.users).filter(([uid])=>validUid(uid)).map(([uid,u])=>customerStats(uid,u,all.byUser.get(uid)||[]));
        const targets=stats.filter(s=>automationMatch(a,s,all.rewards)).slice(0,100);
        let sent=0;
        for(const s of targets){
          const out=await enviarNotificacao({uid:s.uid,telefone:s.user.telefone||"",titulo:a.titulo,mensagem:a.mensaje,url:"https://fidelidad-uai-so.vercel.app/"}).catch(()=>null);
          if(out&&!out.error)sent++;
        }
        await db.ref("fidelity_automation_runs").push().set({automation_id:id,audiencia:targets.length,enviados:sent,data:new Date().toISOString()});
        return res.status(200).json({success:true,audiencia:targets.length,enviados:sent});
      }
      return res.status(400).json({error:"Acción inválida"});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(error){
    console.error("fidelidad-growth",error);
    return res.status(500).json({error:"Error interno",details:error.message});
  }
}
