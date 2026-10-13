import { getFirebaseAdmin } from "../lib/server/firebase.js";
import { requireAdmin, isValidSession as isAdminSession } from "../lib/server/admin-auth.js";
import { requireClient } from "../lib/server/client-auth.js";
import { enviarNotificacao } from "../lib/server/onesignal.js";
import { getRestaurantConfig } from "../lib/server/restaurant-config.js";
import { tenantDatabase, requireTenant } from "../lib/server/tenant-data.js";
const CFG=getRestaurantConfig();

const admin=getFirebaseAdmin();

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

function vipKey(level){return String(level||"").toLowerCase().replace("plata","plata").replace("oro","oro").replace("diamante","diamante").replace("bronce","bronce")}
function vipBenefitsFor(config,level){
  const key=vipKey(level), structured=Array.isArray(config?.benefits?.[key])?config.benefits[key].filter(x=>x&&x.active!==false&&String(x.title||"").trim()).slice(0,2):[];
  if(structured.length)return structured;
  const legacyMap={Bronce:config?.beneficio_bronce,Plata:config?.beneficio_plata,Oro:config?.beneficio_ouro,Diamante:config?.beneficio_diamante};
  const text=String(legacyMap[level]||"").trim();
  return text?[{id:key+"_1",title:text,description:"",type:"custom",value:0,uses:1,period:"monthly",active:true}]:[];
}
function benefitPeriodKey(benefit,level,now=new Date()){
  if(String(benefit?.period||"monthly")==="level")return "level_"+vipKey(level);
  return now.toISOString().slice(0,7);
}
function benefitIcon(type){return type==="free_delivery"?"🚚":type==="percent_discount"?"%":type==="fixed_discount"?"💵":type==="gift"?"🎁":"👑"}
function benefitDescription(b){
  const desc=String(b?.description||"").trim();if(desc)return desc;
  if(b?.type==="free_delivery")return "Envío gratis";
  if(b?.type==="percent_discount")return Number(b?.value||0)+"% de descuento";
  if(b?.type==="fixed_discount")return "MX$"+Number(b?.value||0)+" de descuento";
  if(b?.type==="gift")return "Beneficio de cortesía";
  return String(b?.title||"Beneficio VIP");
}

async function loadAll(db){
  const [usersSnap,txSnap,rewardsSnap,missionsSnap,autosSnap,vipSnap,baseSnap]=await Promise.all([
    db.ref("users").once("value"),db.ref("transacoes").once("value"),db.ref("recompensas").once("value"),
    db.ref("fidelity_missions").once("value"),db.ref("fidelity_automations").once("value"),
    db.ref("config/niveles_vip").once("value"),
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
    const tenant=await requireTenant(admin,req,res);
    if(!tenant)return;
    const db=tenantDatabase(admin.database(),tenant);
    if(req.method==="GET"&&req.query.uid){
      const uid=String(req.query.uid||"").trim();
      if(!validUid(uid))return res.status(400).json({error:"Cliente inválido"});
      if(!isAdminSession(req)&&!requireClient(req,res,uid))return;
      const all=await loadAll(db),user=all.users[uid];
      if(!user)return res.status(404).json({error:"Cliente no encontrado"});
      const stats=customerStats(uid,user,all.byUser.get(uid)||[]);
      const points=Number(user.pontos||0),acc=Number(user.pontos_acumulados??points);
      const nextReward=all.rewards.find(r=>Number(r.pontos||0)>points)||null;
      const pesosPorPunto=Math.max(1,Math.min(1000,Number(all.base.pesos_por_punto||10)));
      const vip=all.vip.ativo===false?"":acc>=Number(all.vip.diamante||1500)?"Diamante":acc>=Number(all.vip.ouro||800)?"Oro":acc>=Number(all.vip.prata||300)?"Plata":"Bronce";
      const claims=user.mission_claims||{};
      const missions=all.missions.filter(m=>m.ativa!==false).map(m=>({...m,progress:missionProgress(m,stats),claimed:claims[m.id]===true}));
      const badges=[];
      if(stats.compras>=1)badges.push({icon:"🛍️",name:"Primera compra",text:"Realizaste tu primera compra."});
      if(stats.compras>=10)badges.push({icon:"🏆",name:"10 compras",text:"Llegaste a 10 compras registradas."});
      if(stats.canjes>=1)badges.push({icon:"🎁",name:"Primer canje",text:"Canjeaste tu primera recompensa."});
      if(Number(user.referidos_recompensados||0)>=1)badges.push({icon:"🤝",name:"Primer referido",text:"Un amigo referido completó su primera compra válida."});
      const memberDays=daysSince(user.created_at);
      if(memberDays!=null&&memberDays>=365)badges.push({icon:"🎂",name:"1 año como cliente",text:"Cumpliste un año en el programa de fidelidad."});
      return res.status(200).json({
        success:true,
        client:{uid,nome:user.nome||user.nombre||"",pontos:points,pontos_acumulados:acc,vip,compras:stats.compras,gasto:stats.gasto},
        next_reward:nextReward?{...nextReward,faltan:Math.max(0,Number(nextReward.pontos||0)-points),compra_aprox:Math.max(0,(Number(nextReward.pontos||0)-points)*pesosPorPunto)}:null,
        loyalty_rule:{pesos_por_punto:pesosPorPunto},
        missions,badges,
        benefits:vipBenefitsFor(all.vip,vip).map(b=>{
          const period_key=benefitPeriodKey(b,vip),used=Math.max(0,Number(user?.vip_benefit_usage?.[b.id]?.[period_key]||0)),limit=Math.max(1,Number(b.uses||1));
          return {id:b.id,icon:benefitIcon(b.type),title:b.title,text:benefitDescription(b),description:String(b.description||""),type:b.type||"custom",value:Number(b.value||0),period:b.period||"monthly",period_key,limit,used,remaining:Math.max(0,limit-used),available:used<limit};
        })
      });
    }

    if(req.method==="POST"&&["request_vip_benefit","redeem_vip_benefit"].includes(String(req.body?.action||""))){
      const uid=String(req.body?.uid||"").trim(),benefitId=String(req.body?.benefit_id||"").trim();
      const channel=["remote","counter","delivery"].includes(String(req.body?.channel||""))?String(req.body.channel):"remote";
      if(!validUid(uid)||!benefitId)return res.status(400).json({error:"Datos inválidos"});
      if(channel==="counter"){
        if(!requireAdmin(req,res))return;
      }else if(!requireClient(req,res,uid))return;
      const all=await loadAll(db),user=all.users[uid];
      if(!user)return res.status(404).json({error:"Cliente no encontrado"});
      if(all.vip.ativo===false)return res.status(400).json({error:"Los niveles VIP están desactivados"});
      const points=Number(user.pontos||0),acc=Number(user.pontos_acumulados??points);
      const vip=acc>=Number(all.vip.diamante||1500)?"Diamante":acc>=Number(all.vip.ouro||800)?"Oro":acc>=Number(all.vip.prata||300)?"Plata":"Bronce";
      const benefit=vipBenefitsFor(all.vip,vip).find(b=>String(b.id)===benefitId&&b.active!==false);
      if(!benefit)return res.status(404).json({error:"Este beneficio no está disponible para tu nivel actual"});
      const periodKey=benefitPeriodKey(benefit,vip),limit=Math.max(1,Math.min(20,Number(benefit.uses||1)));
      const used=Math.max(0,Number(user?.vip_benefit_usage?.[benefitId]?.[periodKey]||0));
      if(used>=limit)return res.status(409).json({error:"Ya utilizaste todos los usos disponibles de este beneficio",remaining:0});

      const existingSnap=await db.ref("vip_benefit_requests").orderByChild("uid").equalTo(uid).once("value");
      const nowMs=Date.now();
      const existing=Object.entries(existingSnap.val()||{}).find(([id,x])=>String(x?.benefit_id)===benefitId&&x?.status==="pending"&&Date.parse(String(x?.expires_at||""))>nowMs);
      if(existing){
        const [id,x]=existing;
        if(x.channel!==channel)await db.ref("vip_benefit_requests/"+id).update({channel});
        return res.status(200).json({success:true,request_id:id,code:x.code,status:"pending",expires_at:x.expires_at,title:x.benefit_title,text:x.benefit_text,channel,reused:true});
      }

      const reqRef=db.ref("vip_benefit_requests").push();
      const now=new Date(),expires=new Date(now.getTime()+30*60000).toISOString();
      const code=("VIP-"+reqRef.key.slice(-6)).toUpperCase();
      const value={
        uid,nome:user.nome||user.nombre||"",telefone:user.telefone||"",level:vip,
        benefit_id:benefitId,benefit_title:benefit.title||"Beneficio VIP",benefit_text:benefitDescription(benefit),
        benefit_type:benefit.type||"custom",benefit_value:Number(benefit.value||0),
        period_key:periodKey,limit,used_at_request:used,channel,code,status:"pending",
        created_at:now.toISOString(),expires_at:expires
      };
      await reqRef.set(value);
      return res.status(200).json({success:true,request_id:reqRef.key,code,status:"pending",expires_at:expires,title:value.benefit_title,text:value.benefit_text,channel});
    }

    if(req.method==="POST"&&String(req.body?.action||"")==="claim_mission"){
      const uid=String(req.body?.uid||"").trim(),id=String(req.body?.id||"").trim();
      if(!validUid(uid)||!id)return res.status(400).json({error:"Datos inválidos"});
      if(!requireClient(req,res,uid))return;
      const all=await loadAll(db),user=all.users[uid],mission=all.missions.find(m=>m.id===id&&m.ativa!==false);
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
      const all=await loadAll(db);
      const stats=Object.entries(all.users).filter(([uid])=>validUid(uid)).map(([uid,u])=>customerStats(uid,u,all.byUser.get(uid)||[]));
      const segments=segmentCounts(stats);
      const revenue=money(stats.reduce((s,x)=>s+x.gasto,0));
      const redeemed=stats.reduce((s,x)=>s+x.canjes,0);
      const automationPreview=all.automations.map(a=>({...a,audiencia:stats.filter(s=>automationMatch(a,s,all.rewards)).length}));
      const requestSnap=await db.ref("vip_benefit_requests").orderByChild("status").equalTo("pending").once("value");
      const benefit_requests=Object.entries(requestSnap.val()||{}).map(([id,x])=>({id,...x}))
        .filter(x=>Date.parse(String(x.expires_at||""))>Date.now())
        .sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")));
      return res.status(200).json({
        success:true,missions:all.missions,automations:automationPreview,benefit_requests,
        segments,roi:{ventas_fidelidad:revenue,clientes_con_compra:stats.filter(x=>x.compras>0).length,compras:stats.reduce((s,x)=>s+x.compras,0),canjes:redeemed,ticket_medio:stats.reduce((s,x)=>s+x.compras,0)?money(revenue/stats.reduce((s,x)=>s+x.compras,0)):0}
      });
    }

    if(req.method==="POST"){
      const action=String(req.body?.action||"");
      if(action==="confirm_vip_benefit"||action==="reject_vip_benefit"){
        const id=String(req.body?.id||"").trim();
        if(!id)return res.status(400).json({error:"Solicitud inválida"});
        const ref=db.ref("vip_benefit_requests/"+id),snap=await ref.once("value");
        if(!snap.exists())return res.status(404).json({error:"Solicitud no encontrada"});
        const request=snap.val()||{};
        if(request.status!=="pending")return res.status(409).json({error:"Esta solicitud ya fue procesada"});
        if(Date.parse(String(request.expires_at||""))<=Date.now()){
          await ref.update({status:"expired",processed_at:new Date().toISOString()});
          return res.status(409).json({error:"La solicitud expiró"});
        }
        if(action==="reject_vip_benefit"){
          await ref.update({status:"rejected",processed_at:new Date().toISOString(),processed_by:"Administrador"});
          return res.status(200).json({success:true,status:"rejected"});
        }
        const usageRef=db.ref(`users/${request.uid}/vip_benefit_usage/${request.benefit_id}/${request.period_key}`);
        const limit=Math.max(1,Math.min(20,Number(request.limit||1)));
        const tx=await usageRef.transaction(current=>{
          const used=Math.max(0,Number(current||0));
          if(used>=limit)return;
          return used+1;
        },undefined,false);
        if(!tx.committed)return res.status(409).json({error:"El cliente ya agotó este beneficio"});
        const used=Math.max(0,Number(tx.snapshot.val()||0)),now=new Date().toISOString();
        await ref.update({status:"confirmed",processed_at:now,processed_by:"Administrador",use_number:used});
        await db.ref("vip_benefit_redemptions").push().set({...request,request_id:id,status:"redeemed",use_number:used,confirmed_at:now});
        return res.status(200).json({success:true,status:"confirmed",used,remaining:Math.max(0,limit-used)});
      }
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
      if(action==="run_automation"){
        const id=String(req.body?.id||""),all=await loadAll(db),a=all.automations.find(x=>x.id===id);
        if(!a)return res.status(404).json({error:"Automatización no encontrada"});
        const stats=Object.entries(all.users).filter(([uid])=>validUid(uid)).map(([uid,u])=>customerStats(uid,u,all.byUser.get(uid)||[]));
        const targets=stats.filter(s=>automationMatch(a,s,all.rewards)).slice(0,100);
        let sent=0;
        for(const s of targets){
          const out=await enviarNotificacao({uid:s.uid,telefone:s.user.telefone||"",titulo:a.titulo,mensagem:a.mensaje,url: CFG.domain+"/"}).catch(()=>null);
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
