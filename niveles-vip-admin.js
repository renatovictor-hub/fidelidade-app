(() => {
  if(document.getElementById("nivelesVipAdminCard")) return;
  const aside=document.querySelector("aside"); if(!aside) return;
  const card=document.createElement("div");
  card.className="card"; card.id="nivelesVipAdminCard";
  card.innerHTML=`
    <h3>👑 Niveles VIP</h3>
    <div style="font-size:13px;color:#666;margin-bottom:14px;">Los niveles usan puntos acumulados históricos. Canjear una recompensa no baja el nivel del cliente.</div>
    <div class="input-group"><label>🥈 Plata desde</label><input id="vipPlata" type="number" min="1" value="300"></div>
    <div class="input-group"><label>🥇 Oro desde</label><input id="vipOro" type="number" min="2" value="800"></div>
    <div class="input-group"><label>💎 Diamante desde</label><input id="vipDiamante" type="number" min="3" value="1500"></div>
    <label style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;font-weight:700;"><input id="vipAtivo" type="checkbox" checked style="width:auto;"> Niveles VIP activos</label>
    <button id="vipSalvar" class="btn-primary">GUARDAR NIVELES</button>
    <div id="vipEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>
  `;
  aside.appendChild(card);
  const $=id=>document.getElementById(id);
  async function cargar(){
    try{
      const r=await fetch(`/api/sendpush?config=niveles_vip&t=${Date.now()}`,{cache:"no-store"});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Error");
      const c=d.config||{};
      $("vipPlata").value=Number(c.prata??300); $("vipOro").value=Number(c.ouro??800); $("vipDiamante").value=Number(c.diamante??1500);
      $("vipAtivo").checked=c.ativo!==false;
      $("vipEstado").textContent=c.ativo===false?"Niveles desactivados":"✅ Niveles activos";
    }catch(e){$("vipEstado").textContent="No se pudo cargar: "+e.message;}
  }
  $("vipSalvar").onclick=async()=>{
    const value={ativo:$("vipAtivo").checked,prata:Number($("vipPlata").value),ouro:Number($("vipOro").value),diamante:Number($("vipDiamante").value)};
    if(!(value.prata<value.ouro&&value.ouro<value.diamante)) return alert("Los límites deben cumplir: Plata < Oro < Diamante.");
    const r=await fetch("/api/sendpush",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save_config",config:"niveles_vip",value})});
    const d=await r.json().catch(()=>({}));
    $("vipEstado").textContent=r.ok?"✅ Niveles guardados":"❌ "+(d.error||"Error al guardar.");
  };
  cargar();
})();