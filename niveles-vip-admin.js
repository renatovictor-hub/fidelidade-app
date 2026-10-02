(() => {
  if(document.getElementById("nivelesVipAdminCard")) return;
  const aside=document.querySelector("aside"); if(!aside) return;
  let staging=document.getElementById("vipHiddenStaging");
  if(!staging){
    staging=document.createElement("div");
    staging.id="vipHiddenStaging";
    staging.style.setProperty("display","none","important");
    document.body.appendChild(staging);
  }
  const style=document.createElement("style");
  style.textContent=`
    #nivelesVipAdminCard{padding:16px}
    .vip-thresholds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0 16px}
    .vip-levels-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .vip-level-card{border:1px solid #eadff0;background:#fff;border-radius:16px;padding:14px;box-shadow:0 5px 16px rgba(67,34,82,.04)}
    .vip-level-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:900;color:#4e3558;margin:0 0 10px}
    .vip-benefits-grid{display:grid;gap:9px;margin:0}
    .vip-benefit-editor{border:1px solid #eadff0;background:#faf8fb;border-radius:12px;overflow:hidden}
    .vip-benefit-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 12px;cursor:pointer}
    .vip-benefit-head h4{margin:0;color:#4f385b;font-size:13px}
    .vip-benefit-summary{font-size:11px;color:#756a79;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58%}
    .vip-benefit-chevron{font-weight:900;color:#7b32c5;transition:transform .2s ease}
    .vip-benefit-editor.is-open .vip-benefit-chevron{transform:rotate(180deg)}
    .vip-benefit-body{display:none;padding:0 12px 12px}
    .vip-benefit-editor.is-open .vip-benefit-body{display:block}
    .vip-benefit-row{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(140px,1fr);gap:8px}
    .vip-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
    .vip-field{display:grid;gap:4px}
    .vip-field label{font-size:11px;font-weight:800;color:#5d4d64}
    .vip-field small{font-size:10px;color:#7b707f;line-height:1.35}
    .vip-benefit-row input,.vip-benefit-row select,.vip-field input,.vip-field select,.vip-benefit-desc{min-width:0;width:100%}
    .vip-benefit-desc{margin-top:8px}
    .vip-inline-help{margin-top:8px;padding:8px 9px;border-radius:9px;background:#f4eef8;color:#65586b;font-size:11px;line-height:1.4}
    .vip-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid #eee7f1}
    .vip-requests{margin-top:18px;padding-top:16px;border-top:1px solid #eee7f1}
    .vip-requests-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
    .vip-requests-list{display:grid;gap:9px}
    .vip-request{border:1px solid #eadff0;border-radius:12px;padding:11px;background:#fff}
    .vip-request-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .vip-request strong{display:block;color:#4d3657;font-size:13px}.vip-request small{display:block;color:#776a7d;margin-top:2px}
    .vip-request-code{font-weight:900;color:#6a0dad;background:#f4eaff;border-radius:8px;padding:5px 7px;font-size:11px}
    .vip-request-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
    .vip-request-actions button{min-height:38px!important}
    .vip-request-lookup{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;margin-bottom:10px}
    .vip-request-lookup input{min-height:42px}
    .vip-scan-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}
    .vip-scan-box{width:min(100%,420px);background:#fff;border-radius:16px;padding:12px}
    .vip-scan-box video{width:100%;border-radius:12px;background:#111;max-height:60vh}
    .vip-scan-box button{width:100%!important;margin-top:9px}
    @media(max-width:700px){.vip-request-lookup{grid-template-columns:1fr 1fr}.vip-request-lookup input{grid-column:1/-1}}
    @media(max-width:980px){.vip-levels-layout{grid-template-columns:1fr}.vip-thresholds{grid-template-columns:1fr 1fr 1fr}}
    @media(max-width:700px){.vip-thresholds,.vip-field-grid,.vip-benefit-row{grid-template-columns:1fr}.vip-benefit-summary{max-width:50%}.vip-footer{align-items:stretch;flex-direction:column}.vip-footer button{width:100%!important}}
  `;
  document.head.appendChild(style);

  const card=document.createElement("div");
  card.className="card"; card.id="nivelesVipAdminCard";
  const levelBlock=(key,label,icon)=>`
    <section class="vip-level-card">
      <div class="vip-level-title"><span>${icon} ${label}</span><small>Hasta 2 beneficios</small></div>
      <div id="vipBenefits_${key}" class="vip-benefits-grid">
        ${[0,1].map(i=>`
          <div class="vip-benefit-editor" data-level="${key}" data-index="${i}">
            <div class="vip-benefit-head" role="button" tabindex="0" aria-expanded="false">
              <h4>Beneficio ${i+1}</h4>
              <span class="vip-benefit-summary">Sin configurar</span>
              <span class="vip-benefit-chevron">⌄</span>
            </div>
            <div class="vip-benefit-body">
              <div class="vip-benefit-row">
                <div class="vip-field">
                  <label>Nombre del beneficio</label>
                  <input class="vip-title" maxlength="80" placeholder="Ej. Envío gratis">
                </div>
                <div class="vip-field">
                  <label>Tipo</label>
                  <select class="vip-type">
                    <option value="free_delivery">Envío gratis</option>
                    <option value="percent_discount">% de descuento</option>
                    <option value="fixed_discount">Descuento MX$</option>
                    <option value="gift">Regalo / cortesía</option>
                    <option value="custom">Otro beneficio</option>
                  </select>
                </div>
              </div>
              <input class="vip-benefit-desc" maxlength="180" placeholder="Descripción opcional para el cliente">
              <div class="vip-field-grid">
                <div class="vip-field vip-value-field">
                  <label>Valor del beneficio</label>
                  <input class="vip-value" type="number" min="0" step="1" placeholder="Ej. 20">
                  <small class="vip-value-help">Solo se usa para descuentos. Ej.: 20 = 20%.</small>
                </div>
                <div class="vip-field">
                  <label>Usos permitidos por período</label>
                  <input class="vip-uses" type="number" min="1" max="20" value="1">
                  <small>Ej.: 1 = el cliente puede usarlo una vez antes de renovar.</small>
                </div>
                <div class="vip-field">
                  <label>Renovación</label>
                  <select class="vip-period">
                    <option value="monthly">Se renueva cada mes</option>
                    <option value="level">Una vez mientras esté en este nivel</option>
                  </select>
                </div>
                <div class="vip-field">
                  <label>Estado</label>
                  <label style="display:flex;align-items:center;gap:7px;min-height:44px"><input class="vip-active" type="checkbox" checked style="width:auto"> Beneficio activo</label>
                </div>
              </div>
              <div class="vip-inline-help">El cliente verá este beneficio en su app y el sistema controlará cuántas veces puede usarlo dentro del período configurado.</div>
            </div>
          </div>`).join('')}
      </div>
    </section>`;
  card.innerHTML=`
    <h3>👑 Niveles VIP</h3>
    <div style="font-size:13px;color:#666;margin-bottom:12px;">Define cuándo sube el cliente de nivel y configura hasta 2 beneficios rescatables por nivel.</div>
    <div class="vip-thresholds">
      <div class="input-group"><label>🥈 Plata desde</label><input id="vipPlata" type="number" min="1" value="300"><small>Puntos acumulados.</small></div>
      <div class="input-group"><label>🥇 Oro desde</label><input id="vipOro" type="number" min="2" value="800"><small>Debe ser mayor que Plata.</small></div>
      <div class="input-group"><label>💎 Diamante desde</label><input id="vipDiamante" type="number" min="3" value="1500"><small>Debe ser mayor que Oro.</small></div>
    </div>
    <div class="vip-levels-layout">
      ${levelBlock('bronce','Bronce','🥉')}
      ${levelBlock('plata','Plata','🥈')}
      ${levelBlock('oro','Oro','🥇')}
      ${levelBlock('diamante','Diamante','💎')}
    </div>
    <div class="vip-footer">
      <label style="display:flex;align-items:center;gap:8px;font-weight:700;"><input id="vipAtivo" type="checkbox" checked style="width:auto;"> Niveles VIP activos</label>
      <button id="vipSalvar" class="btn-primary">GUARDAR NIVELES Y BENEFICIOS</button>
    </div>
    <div id="vipEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>
    <section class="vip-requests">
      <div class="vip-requests-head">
        <div><h3 style="margin:0">Solicitudes de beneficios</h3><small style="color:#746979">WhatsApp y uso presencial. Solo al confirmar se descuenta el beneficio.</small></div>
        <button type="button" class="btn-secondary" id="vipRefreshRequests" style="width:auto!important">ACTUALIZAR</button>
      </div>
      <div class="vip-request-lookup">
        <input id="vipRequestCode" placeholder="Código VIP-XXXXXX o contenido del QR">
        <button type="button" class="btn-primary" id="vipValidateCode">VALIDAR</button>
        <button type="button" class="btn-secondary" id="vipScanQr">📷 QR</button>
      </div>
      <div id="vipRequestsList" class="vip-requests-list"><div style="color:#777;font-size:12px">Cargando solicitudes…</div></div>
    </section>
  `;
  staging.appendChild(card);
  const $=id=>document.getElementById(id);

  function editors(level){return [...card.querySelectorAll('.vip-benefit-editor[data-level="'+level+'"]')]}
  function refreshEditor(el){
    const type=el.querySelector('.vip-type')?.value||'custom';
    const title=el.querySelector('.vip-title')?.value.trim()||'';
    const valueField=el.querySelector('.vip-value-field');
    const valueHelp=el.querySelector('.vip-value-help');
    const needsValue=type==='percent_discount'||type==='fixed_discount';
    if(valueField)valueField.style.display=needsValue?'grid':'none';
    if(valueHelp)valueHelp.textContent=type==='percent_discount'?'Ej.: 20 = 20% de descuento.':'Ej.: 50 = MX$50 de descuento.';
    const summary=el.querySelector('.vip-benefit-summary');
    if(summary){
      const uses=Math.max(1,Number(el.querySelector('.vip-uses')?.value||1));
      summary.textContent=title?(title+' · '+uses+' uso'+(uses===1?'':'s')):'Sin configurar';
    }
  }
  function bindEditor(el){
    if(el.dataset.bound)return;el.dataset.bound='1';
    const head=el.querySelector('.vip-benefit-head');
    const toggle=()=>{const open=el.classList.toggle('is-open');head?.setAttribute('aria-expanded',open?'true':'false')};
    head?.addEventListener('click',toggle);
    head?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
    el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',()=>refreshEditor(el)));
    el.querySelector('.vip-type')?.addEventListener('change',()=>refreshEditor(el));
    refreshEditor(el);
  }
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
      bindEditor(el);
      refreshEditor(el);
      el.classList.remove('is-open');
      el.querySelector('.vip-benefit-head')?.setAttribute('aria-expanded','false');
    });
  }
  card.querySelectorAll('.vip-benefit-editor').forEach(bindEditor);
  let currentRequests=[];
  function requestFromCode(raw){
    const text=String(raw||"").trim();
    const parts=text.match(/^UAI_VIP:([^:]+):(VIP-[A-Z0-9]+)$/i);
    const id=parts?.[1]||"";
    const code=(parts?.[2]||text).toUpperCase();
    return currentRequests.find(x=>(id&&x.id===id)||String(x.code||"").toUpperCase()===code)||null;
  }
  async function validateTypedCode(raw){
    const req=requestFromCode(raw);
    if(!req)return alert("No encontramos una solicitud pendiente con ese código. Puede haber expirado.");
    if(!confirm("Confirmar uso de "+(req.benefit_title||"beneficio")+" para "+(req.nome||req.uid||"cliente")+"?"))return;
    await processRequest(req.id,"confirm_vip_benefit");
    if($("vipRequestCode"))$("vipRequestCode").value="";
  }
  async function scanVipQr(){
    if(!("BarcodeDetector" in window)||!navigator.mediaDevices?.getUserMedia){
      alert("Este navegador no permite escanear QR directamente. Ingresa el código VIP manualmente.");
      return;
    }
    let stream=null,raf=0;
    const overlay=document.createElement("div");overlay.className="vip-scan-overlay";
    overlay.innerHTML='<div class="vip-scan-box"><video playsinline autoplay></video><button type="button" class="btn-secondary">CERRAR</button></div>';
    document.body.appendChild(overlay);
    const video=overlay.querySelector("video");
    const close=()=>{cancelAnimationFrame(raf);stream?.getTracks?.().forEach(t=>t.stop());overlay.remove()};
    overlay.querySelector("button").onclick=close;
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      video.srcObject=stream;await video.play();
      const detector=new BarcodeDetector({formats:["qr_code"]});
      const loop=async()=>{
        try{
          const codes=await detector.detect(video);
          if(codes?.[0]?.rawValue){
            const value=codes[0].rawValue;close();
            $("vipRequestCode").value=value;
            await validateTypedCode(value);
            return;
          }
        }catch(_){}
        raf=requestAnimationFrame(loop);
      };
      loop();
    }catch(e){close();alert("No pudimos abrir la cámara. Ingresa el código VIP manualmente.")}
  }

  async function loadRequests(){
    const box=$("vipRequestsList"); if(!box)return;
    try{
      const r=await fetch("/api/fidelidad-growth?t="+Date.now(),{cache:"no-store"});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||"No se pudieron cargar las solicitudes");
      const rows=Array.isArray(d.benefit_requests)?d.benefit_requests:[];
      currentRequests=rows;
      if(!rows.length){box.innerHTML='<div style="padding:12px;border:1px dashed #ddd;border-radius:10px;color:#777;font-size:12px">No hay solicitudes pendientes.</div>';return}
      box.innerHTML=rows.map(x=>{
        const left=Math.max(0,Math.ceil((Date.parse(x.expires_at)-Date.now())/60000));
        const channel=x.channel==="whatsapp"?"WhatsApp":x.channel==="delivery"?"Delivery":"QR / presencial";
        return `<div class="vip-request" data-id="${x.id}">
          <div class="vip-request-top">
            <div><strong>${x.nome||x.uid||"Cliente"} · ${x.level||""}</strong><small>${x.benefit_title||"Beneficio"} · ${channel}</small><small>Expira en ${left} min</small></div>
            <div class="vip-request-code">${x.code||""}</div>
          </div>
          <div class="vip-request-actions">
            <button type="button" class="btn-primary" data-confirm>CONFIRMAR USO</button>
            <button type="button" class="btn-secondary" data-reject>RECHAZAR</button>
          </div>
        </div>`
      }).join("");
      box.querySelectorAll(".vip-request").forEach(row=>{
        const id=row.dataset.id;
        row.querySelector("[data-confirm]").onclick=()=>processRequest(id,"confirm_vip_benefit");
        row.querySelector("[data-reject]").onclick=()=>processRequest(id,"reject_vip_benefit");
      });
    }catch(e){box.innerHTML='<div style="color:#a31521;font-size:12px">❌ '+e.message+'</div>'}
  }
  async function processRequest(id,action){
    try{
      const r=await fetch("/api/fidelidad-growth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,id})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||"No se pudo procesar la solicitud");
      await loadRequests();
    }catch(e){alert(e.message)}
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
  $("vipRefreshRequests").onclick=loadRequests;
  $("vipValidateCode").onclick=()=>validateTypedCode($("vipRequestCode").value);
  $("vipRequestCode").addEventListener("keydown",e=>{if(e.key==="Enter")validateTypedCode(e.currentTarget.value)});
  $("vipScanQr").onclick=scanVipQr;
  cargar();loadRequests();setInterval(loadRequests,30000);
})();