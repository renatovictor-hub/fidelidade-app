(() => {
  if(document.getElementById("nivelesVipAdminCard")) return;
  const aside=document.querySelector("aside"); if(!aside) return;
  const style=document.createElement("style");
  style.textContent=`
    .vip-benefits-grid{display:grid;gap:10px;margin:8px 0 14px}
    .vip-benefit-editor{border:1px solid #eadff0;background:#faf8fb;border-radius:12px;padding:11px}
    .vip-benefit-editor h4{margin:0 0 8px;color:#4f385b;font-size:13px}
    .vip-benefit-row{display:grid;grid-template-columns:1.35fr 1fr .7fr .8fr;gap:7px}
    .vip-benefit-row input,.vip-benefit-row select{min-width:0}
    .vip-benefit-desc{margin-top:7px}
    .vip-level-title{font-weight:900;color:#4e3558;margin:14px 0 7px;padding-top:10px;border-top:1px solid #eee6f1}
    .vip-level-title.first{border-top:0;padding-top:0}
    @media(max-width:760px){.vip-benefit-row{grid-template-columns:1fr 1fr}.vip-benefit-row .vip-title{grid-column:1/-1}}
  `;
  document.head.appendChild(style);

  const card=document.createElement("div");
  card.className="card"; card.id="nivelesVipAdminCard";
  const levelBlock=(key,label,icon)=>`
    <div class="vip-level-title ${key==='bronce'?'first':''}">${icon} ${label}</div>
    <div id="vipBenefits_${key}" class="vip-benefits-grid">
      ${[0,1].map(i=>`
        <div class="vip-benefit-editor" data-level="${key}" data-index="${i}">
          <h4>Beneficio ${i+1}</h4>
          <div class="vip-benefit-row">
            <input class="vip-title" maxlength="80" placeholder="Ej. 1 envío gratis">
            <select class="vip-type">
              <option value="free_delivery">Envío gratis</option>
              <option value="percent_discount">% de descuento</option>
              <option value="fixed_discount">Descuento MX$</option>
              <option value="gift">Regalo / cortesía</option>
              <option value="custom">Otro beneficio</option>
            </select>
            <input class="vip-value" type="number" min="0" step="1" placeholder="Valor">
            <input class="vip-uses" type="number" min="1" max="20" value="1" title="Usos permitidos">
          </div>
          <input class="vip-benefit-desc" maxlength="180" placeholder="Descripción opcional para el cliente">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px">
            <select class="vip-period">
              <option value="monthly">Se renueva cada mes</option>
              <option value="level">Una vez mientras esté en este nivel</option>
            </select>
            <label style="display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700"><input class="vip-active" type="checkbox" checked style="width:auto"> Beneficio activo</label>
          </div>
          <small style="display:block;margin-top:6px;color:#756a79">“Usos” define cuántas veces puede canjearlo dentro del período.</small>
        </div>`).join('')}
    </div>`;
  card.innerHTML=`
    <h3>👑 Niveles VIP</h3>
    <div style="font-size:13px;color:#666;margin-bottom:14px;">Los niveles usan puntos acumulados históricos. Cada nivel puede tener hasta 2 beneficios controlados por cliente.</div>
    <div class="input-group"><label>🥈 Plata desde</label><input id="vipPlata" type="number" min="1" value="300"><small>Puntos acumulados históricos necesarios para alcanzar Plata.</small></div>
    <div class="input-group"><label>🥇 Oro desde</label><input id="vipOro" type="number" min="2" value="800"><small>Debe ser mayor que Plata.</small></div>
    <div class="input-group"><label>💎 Diamante desde</label><input id="vipDiamante" type="number" min="3" value="1500"><small>Debe ser mayor que Oro.</small></div>
    ${levelBlock('bronce','Bronce','🥉')}
    ${levelBlock('plata','Plata','🥈')}
    ${levelBlock('oro','Oro','🥇')}
    ${levelBlock('diamante','Diamante','💎')}
    <label style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;font-weight:700;"><input id="vipAtivo" type="checkbox" checked style="width:auto;"> Niveles VIP activos</label>
    <button id="vipSalvar" class="btn-primary">GUARDAR NIVELES Y BENEFICIOS</button>
    <div id="vipEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>
  `;
  aside.appendChild(card);
  const $=id=>document.getElementById(id);

  function editors(level){return [...card.querySelectorAll('.vip-benefit-editor[data-level="'+level+'"]')]}
  function readBenefit(el,level,index){
    const title=el.querySelector('.vip-title').value.trim();
    if(!title)return null;
    return {
      id:(el.dataset.id||level+"_"+(index+1)),
      title,
      description:el.querySelector('.vip-benefit-desc').value.trim(),
      type:el.querySelector('.vip-type').value,
      value:Number(el.querySelector('.vip-value').value||0),
      uses:Math.max(1,Number(el.querySelector('.vip-uses').value||1)),
      period:el.querySelector('.vip-period').value,
      active:el.querySelector('.vip-active').checked
    };
  }
  function fillLevel(level,items,legacy){
    const list=Array.isArray(items)&&items.length?items:(legacy?[{id:level+"_1",title:legacy,type:"custom",value:0,uses:1,period:"monthly",active:true}]:[]);
    editors(level).forEach((el,i)=>{
      const b=list[i]||{};
      el.dataset.id=b.id||level+"_"+(i+1);
      el.querySelector('.vip-title').value=b.title||"";
      el.querySelector('.vip-benefit-desc').value=b.description||"";
      el.querySelector('.vip-type').value=b.type||"custom";
      el.querySelector('.vip-value').value=Number(b.value||0)||"";
      el.querySelector('.vip-uses').value=Math.max(1,Number(b.uses||1));
      el.querySelector('.vip-period').value=b.period||"monthly";
      el.querySelector('.vip-active').checked=b.active!==false;
    });
  }
  async function cargar(){
    try{
      const r=await fetch(`/api/sendpush?config=niveles_vip&t=${Date.now()}`,{cache:"no-store"});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Error");
      const cfg=d.config||{};
      $("vipPlata").value=Number(cfg.prata??300); $("vipOro").value=Number(cfg.ouro??800); $("vipDiamante").value=Number(cfg.diamante??1500);
      $("vipAtivo").checked=cfg.ativo!==false;
      fillLevel("bronce",cfg.benefits?.bronce,cfg.beneficio_bronce);
      fillLevel("plata",cfg.benefits?.plata,cfg.beneficio_plata);
      fillLevel("oro",cfg.benefits?.oro,cfg.beneficio_ouro);
      fillLevel("diamante",cfg.benefits?.diamante,cfg.beneficio_diamante);
      $("vipEstado").textContent=cfg.ativo===false?"Niveles desactivados":"✅ Niveles activos";
    }catch(e){$("vipEstado").textContent="No se pudo cargar: "+e.message;}
  }
  $("vipSalvar").onclick=async()=>{
    const benefits={};
    for(const level of ["bronce","plata","oro","diamante"])benefits[level]=editors(level).map((el,i)=>readBenefit(el,level,i)).filter(Boolean);
    const value={
      ativo:$("vipAtivo").checked,
      prata:Number($("vipPlata").value),ouro:Number($("vipOro").value),diamante:Number($("vipDiamante").value),
      benefits,
      beneficio_bronce:benefits.bronce[0]?.title||"",
      beneficio_plata:benefits.plata[0]?.title||"",
      beneficio_ouro:benefits.oro[0]?.title||"",
      beneficio_diamante:benefits.diamante[0]?.title||""
    };
    if(!(value.prata<value.ouro&&value.ouro<value.diamante)) return alert("Los límites deben cumplir: Plata < Oro < Diamante.");
    for(const [level,items] of Object.entries(benefits)){
      for(const b of items){
        if(b.type==="percent_discount"&&(b.value<=0||b.value>100))return alert("El porcentaje de descuento debe estar entre 1% y 100%.");
        if(b.type==="fixed_discount"&&b.value<=0)return alert("El descuento fijo debe ser mayor que MX$0.");
      }
    }
    const btn=$("vipSalvar");btn.disabled=true;btn.textContent="GUARDANDO...";
    try{
      const r=await fetch("/api/sendpush",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save_config",config:"niveles_vip",value})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||"Error al guardar.");
      $("vipEstado").textContent="✅ Niveles y beneficios guardados. Los límites de uso ya están activos.";
      window.dispatchEvent(new CustomEvent("uai:fidelity-config-saved",{detail:{config:"niveles_vip"}}));
    }catch(e){$("vipEstado").textContent="❌ "+e.message}
    finally{btn.disabled=false;btn.textContent="GUARDAR NIVELES Y BENEFICIOS"}
  };
  cargar();
})();