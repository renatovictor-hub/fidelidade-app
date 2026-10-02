(() => {
  if (document.getElementById('fidelitySettingsSaasStyles')) return;

  const style=document.createElement('style');
  style.id='fidelitySettingsSaasStyles';
  style.textContent=`
    .fs-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}
    .fs-summary>div{border:1px solid #eee7f1;background:#faf8fb;border-radius:11px;padding:10px}
    .fs-summary small{display:block;color:#6b606f;font-size:11px!important;font-weight:750}
    .fs-summary b{display:block;margin-top:3px;color:#5f168f;font-size:14px}
    .fs-base-card{grid-column:1/-1!important}
    .fs-base-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start}
    .fs-base-row button{width:auto!important;min-width:150px;margin-top:29px!important;height:44px}
    .fs-impact{margin-top:10px;padding:10px 12px;border-radius:10px;background:#fff7d6;color:#6b5700;font-size:12px;line-height:1.5}
    .fs-history{grid-column:1/-1!important}
    .fs-history-list{display:grid;gap:7px;margin-top:10px;max-height:260px;overflow:auto}
    .fs-history-item{padding:9px 10px;border:1px solid #eee7f1;border-radius:10px;background:#faf8fb;font-size:12px}
    .fs-history-item b{display:block;color:#493550}.fs-history-item small{color:#756a79}
    .fs-card-note{display:block;margin:-6px 0 12px;color:#6d6271;font-size:11px;line-height:1.45}
    .fs-banner-card{grid-column:1/-1!important}
    .fs-banner-tools{display:grid;grid-template-columns:minmax(0,1fr) 160px auto;gap:10px;align-items:end}
    .fs-banner-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px}
    .fs-banner-item{position:relative;border:1px solid #e7deeb;border-radius:12px;overflow:hidden;background:#faf8fb}
    .fs-banner-item img{display:block;width:100%;aspect-ratio:16/5;object-fit:cover}
    .fs-banner-actions{display:flex;gap:6px;padding:8px}
    .fs-banner-actions button{width:auto!important;flex:1;min-width:0!important;padding:7px!important;font-size:11px!important}
    .fs-banner-empty{padding:18px;border:1px dashed #d8c9df;border-radius:12px;color:#716477;text-align:center;margin-top:12px}
    @media(max-width:900px){.fs-summary{grid-template-columns:1fr 1fr}.fs-base-row{grid-template-columns:1fr}.fs-base-row button{width:100%!important;margin-top:0!important}.fs-banner-tools{grid-template-columns:1fr}.fs-banner-tools button{width:100%!important}}
  `;
  document.head.appendChild(style);

  const API='/api/sendpush';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  async function getConfig(name){
    const r=await fetch(API+'?config='+encodeURIComponent(name)+'&t='+Date.now(),{cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||'No se pudo cargar la configuración.');
    return d.config||{};
  }

  async function saveConfig(name,value){
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_config',config:name,value})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||'No se pudo guardar.');
    return d.config||value;
  }

  function ensureStructure(){
    const panel=$('uxFidelityConfigHost')?.closest('.ux-panel');
    const host=$('uxFidelityConfigHost');
    if(!panel||!host)return false;

    let summary=$('fsProgramSummary');
    if(!summary){
      summary=document.createElement('div');
      summary.id='fsProgramSummary';
      summary.className='fs-summary';
      summary.innerHTML=`
        <div><small>Regla de puntos</small><b id="fsSumBase">Cargando…</b></div>
        <div><small>Niveles VIP</small><b id="fsSumVip">Cargando…</b></div>
        <div><small>Puntos Bonus</small><b id="fsSumBonus">Cargando…</b></div>
        <div><small>Referidos</small><b id="fsSumRef">Cargando…</b></div>
        <div><small>Último cambio</small><b id="fsSumUpdated">—</b></div>
      `;
      const rule=panel.querySelector('.ux-fid-rule');
      (rule||host).insertAdjacentElement('afterend',summary);
    }

    let base=$('fsBasePointsCard');
    if(!base){
      base=document.createElement('div');
      base.id='fsBasePointsCard';
      base.className='card fs-base-card';
      base.innerHTML=`
        <h3>⭐ Acumulación de puntos</h3>
        <span class="fs-card-note">Define cuántos pesos debe gastar un cliente para ganar 1 punto. Esta regla se usa realmente al registrar compras y calcular cuánto falta para una recompensa.</span>
        <div class="fs-base-row">
          <div class="input-group" style="margin:0">
            <label for="fsPesosPorPunto">Pesos mexicanos por 1 punto</label>
            <input id="fsPesosPorPunto" type="number" min="1" max="1000" step="0.5" value="10">
            <small>Ej. 10 = por cada MX$10 de compra se genera 1 punto base.</small>
          </div>
          <button class="btn-primary" id="fsSaveBase">GUARDAR REGLA</button>
        </div>
        <div class="fs-impact" id="fsImpact">Cargando impacto…</div>
        <div id="fsBaseState" style="font-size:12px;color:#6d6271;margin-top:8px"></div>
      `;
      host.prepend(base);
    }

    let banner=$('fsClientBannerCard');
    if(!banner){
      banner=document.createElement('div');
      banner.id='fsClientBannerCard';
      banner.className='card fs-banner-card';
      banner.innerHTML=`
        <h3>🖼️ Banner del app del cliente</h3>
        <span class="fs-card-note">Sube de 1 a 6 imágenes. Con varias imágenes, el app las muestra como carrusel automático de derecha a izquierda. Si no subes ninguna, se mantiene el banner actual de Uai Sô.</span>
        <div class="fs-banner-tools">
          <div class="input-group" style="margin:0">
            <label for="fsBannerFiles">Imágenes del banner</label>
            <input id="fsBannerFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple>
            <small>Se ajustan y comprimen antes de guardar. Máximo 6 imágenes.</small>
          </div>
          <div class="input-group" style="margin:0">
            <label for="fsBannerInterval">Cambio automático</label>
            <select id="fsBannerInterval">
              <option value="4000">Cada 4 s</option>
              <option value="5000" selected>Cada 5 s</option>
              <option value="7000">Cada 7 s</option>
              <option value="10000">Cada 10 s</option>
            </select>
          </div>
          <button class="btn-primary" id="fsSaveBanners">GUARDAR BANNERS</button>
        </div>
        <div id="fsBannerPreview" class="fs-banner-preview"></div>
        <div id="fsBannerState" style="font-size:12px;color:#6d6271;margin-top:8px"></div>
      `;
      host.appendChild(banner);
    }

    let history=$('fsConfigHistory');
    if(!history){
      history=document.createElement('div');
      history.id='fsConfigHistory';
      history.className='card fs-history uai-no-help';
      history.innerHTML='<h3>🕘 Historial de cambios</h3><span class="fs-card-note">Muestra las últimas modificaciones de configuración para facilitar auditoría y soporte.</span><div class="fs-history-list" id="fsHistoryList"><div class="ux-crm-empty">Cargando…</div></div>';
      host.appendChild(history);
    }

    const oldRule=panel.querySelector('.ux-fid-rule');
    if(oldRule){
      oldRule.querySelector('b')?.replaceChildren(document.createTextNode('Configuración del programa'));
      const small=oldRule.querySelector('small');
      if(small) small.textContent='Los cambios realizados aquí afectan el cálculo real del programa. Revisa el impacto antes de guardar.';
    }
    return true;
  }

  function impact(v){
    const n=Math.max(1,Number(v||10));
    const p300=Math.floor(300/n), p500=Math.floor(500/n), p1000=Math.floor(1000/n);
    return `Con esta regla: una compra de MX$300 genera <b>${p300} pts</b>, MX$500 genera <b>${p500} pts</b> y MX$1,000 genera <b>${p1000} pts</b> antes de cualquier bonus.`;
  }

  function decorateExisting(){
    const bonus=$('bonusPontosAdminCard'),ref=$('referidosAdminCard');
    if(bonus&&!bonus.dataset.saasReady){
      bonus.dataset.saasReady='1';
      bonus.querySelector('h3')?.insertAdjacentHTML('afterend','<span class="fs-card-note">Úsalo para mover demanda hacia días u horarios estratégicos. El multiplicador se aplica sobre la regla-base.</span>');
      const btn=$('bonusSalvar');
      if(btn) btn.addEventListener('click',()=>setTimeout(()=>window.dispatchEvent(new CustomEvent('uai:fidelity-config-saved',{detail:{config:'bonus_pontos'}})),500));
    }
    if(ref&&!ref.dataset.saasReady){
      ref.dataset.saasReady='1';
      ref.querySelector('h3')?.insertAdjacentHTML('afterend','<span class="fs-card-note">El premio se libera una sola vez cuando el amigo indicado realiza su primera compra que alcanza el mínimo configurado.</span>');
      const min=$('refCompraMinima');
      if(min) min.insertAdjacentHTML('afterend','<small>Evita premiar registros sin compra real.</small>');
      const btn=$('refSalvar');
      if(btn) btn.addEventListener('click',()=>setTimeout(()=>window.dispatchEvent(new CustomEvent('uai:fidelity-config-saved',{detail:{config:'referidos'}})),500));
    }
  }

  async function loadSummary(){
    try{
      const [base,vip,bonus,ref]=await Promise.all([getConfig('loyalty_base'),getConfig('niveles_vip'),getConfig('bonus_pontos'),getConfig('referidos')]);
      const pesos=Math.max(1,Number(base.pesos_por_punto||10));
      if($('fsPesosPorPunto')) $('fsPesosPorPunto').value=String(pesos);
      if($('fsImpact')) $('fsImpact').innerHTML=impact(pesos);
      if($('fsSumBase')) $('fsSumBase').textContent=`MX$${pesos} = 1 punto`;
      if($('fsSumVip')) $('fsSumVip').textContent=vip.ativo===false?'Desactivados':'4 niveles activos';
      if($('fsSumBonus')) $('fsSumBonus').textContent=bonus.ativo===true?`Activo · x${Number(bonus.multiplicador||1)}`:'Desactivado';
      if($('fsSumRef')) $('fsSumRef').textContent=ref.ativo===false?'Desactivados':'Activos';
      const dates=[base.updated_at,vip.updated_at,bonus.updated_at,ref.updated_at].filter(Boolean).map(Date.parse).filter(Number.isFinite);
      if($('fsSumUpdated')) $('fsSumUpdated').textContent=dates.length?new Date(Math.max(...dates)).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):'Sin registro';
    }catch(e){
      if($('fsBaseState')) $('fsBaseState').textContent='No se pudo cargar el resumen: '+e.message;
    }
  }

  async function loadHistory(){
    const box=$('fsHistoryList');if(!box)return;
    try{
      const r=await fetch(API+'?config_audit=1&t='+Date.now(),{cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Error');
      const names={loyalty_base:'Regla de puntos',niveles_vip:'Niveles VIP',bonus_pontos:'Puntos Bonus',referidos:'Referidos',reviews:'Google Reviews',cumpleanos:'Cumpleaños'};
      const items=(d.items||[]).filter(x=>['loyalty_base','niveles_vip','bonus_pontos','referidos'].includes(x.config)).slice(0,12);
      box.innerHTML=items.length?items.map(x=>`<div class="fs-history-item"><b>${esc(names[x.config]||x.config)}</b><small>${x.data?new Date(x.data).toLocaleString('es-MX'):'—'} · dashboard</small></div>`).join(''):'<div class="ux-crm-empty">Todavía no hay cambios registrados.</div>';
    }catch(e){box.innerHTML='<div class="ux-crm-empty">No se pudo cargar el historial.</div>'}
  }

  function bind(){
    const input=$('fsPesosPorPunto'),btn=$('fsSaveBase');
    if(input&&!input.dataset.bound){
      input.dataset.bound='1';
      input.addEventListener('input',()=>{$('fsImpact').innerHTML=impact(input.value)});
    }
    if(btn&&!btn.dataset.bound){
      btn.dataset.bound='1';
      btn.onclick=async()=>{
        const value=Number(input.value);
        if(!Number.isFinite(value)||value<1||value>1000)return alert('Ingresa un valor entre MX$1 y MX$1,000 por punto.');
        if(!confirm(`¿Cambiar la regla-base a MX$${value} = 1 punto? Las próximas compras usarán esta nueva regla.`))return;
        btn.disabled=true;btn.textContent='GUARDANDO…';
        try{
          await saveConfig('loyalty_base',{ativo:true,pesos_por_punto:value});
          $('fsBaseState').textContent='✅ Regla guardada. Las próximas compras ya usarán este valor.';
          window.dispatchEvent(new CustomEvent('uai:fidelity-config-saved',{detail:{config:'loyalty_base'}}));
        }catch(e){$('fsBaseState').textContent='❌ '+e.message}
        finally{btn.disabled=false;btn.textContent='GUARDAR REGLA'}
      };
    }
  }


  let bannerItems=[];

  async function readBannerConfig(){
    const r=await fetch('/api/client-banners?t='+Date.now(),{cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||'No se pudieron cargar los banners.');
    bannerItems=Array.isArray(d.items)?d.items:[];
    if($('fsBannerInterval')) $('fsBannerInterval').value=String(Number(d.interval_ms||5000));
    renderBannerPreview();
  }

  function renderBannerPreview(){
    const box=$('fsBannerPreview');if(!box)return;
    if(!bannerItems.length){
      box.className='fs-banner-empty';
      box.innerHTML='No hay banners personalizados. El app seguirá mostrando el banner actual.';
      return;
    }
    box.className='fs-banner-preview';
    box.innerHTML=bannerItems.map((x,i)=>`
      <div class="fs-banner-item" data-banner-index="${i}">
        <img src="${x.image}" alt="">
        <div class="fs-banner-actions">
          <button class="btn-secondary" data-move="-1" ${i===0?'disabled':''}>←</button>
          <button class="btn-secondary" data-move="1" ${i===bannerItems.length-1?'disabled':''}>→</button>
          <button class="btn-danger" data-remove="1">ELIMINAR</button>
        </div>
      </div>`).join('');
    box.querySelectorAll('.fs-banner-item').forEach(el=>{
      const i=Number(el.dataset.bannerIndex);
      el.querySelectorAll('[data-move]').forEach(btn=>btn.onclick=()=>{
        const next=i+Number(btn.dataset.move);
        if(next<0||next>=bannerItems.length)return;
        [bannerItems[i],bannerItems[next]]=[bannerItems[next],bannerItems[i]];
        renderBannerPreview();
      });
      el.querySelector('[data-remove]').onclick=()=>{
        bannerItems.splice(i,1);
        renderBannerPreview();
      };
    });
  }

  function compressBanner(file){
    return new Promise((resolve,reject)=>{
      if(!/^image\/(jpeg|png|webp)$/.test(file.type))return reject(new Error('Formato no compatible.'));
      const url=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{
        try{
          const maxW=1400,maxH=500,scale=Math.min(1,maxW/img.width,maxH/img.height);
          const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
          const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
          const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
          let quality=.82,data=canvas.toDataURL('image/jpeg',quality);
          while(data.length>560000&&quality>.5){quality-=.08;data=canvas.toDataURL('image/jpeg',quality)}
          URL.revokeObjectURL(url);
          if(data.length>600000)return reject(new Error('La imagen sigue siendo demasiado pesada.'));
          resolve({id:'banner_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),image:data,alt:file.name.slice(0,100)});
        }catch(e){URL.revokeObjectURL(url);reject(e)}
      };
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la imagen.'))};
      img.src=url;
    });
  }

  function bindBanners(){
    const input=$('fsBannerFiles'),save=$('fsSaveBanners');
    if(input&&!input.dataset.bound){
      input.dataset.bound='1';
      input.addEventListener('change',async()=>{
        const files=[...input.files||[]];
        if(!files.length)return;
        const room=Math.max(0,6-bannerItems.length);
        if(!room){alert('Ya tienes 6 imágenes. Elimina una antes de agregar otra.');input.value='';return}
        const picked=files.slice(0,room);
        const state=$('fsBannerState');if(state)state.textContent='Procesando imágenes…';
        try{
          for(const file of picked)bannerItems.push(await compressBanner(file));
          renderBannerPreview();
          if(state)state.textContent='Imágenes listas. Pulsa GUARDAR BANNERS para publicarlas.';
        }catch(e){if(state)state.textContent='❌ '+e.message}
        input.value='';
      });
    }
    if(save&&!save.dataset.bound){
      save.dataset.bound='1';
      save.onclick=async()=>{
        save.disabled=true;save.textContent='GUARDANDO…';
        const state=$('fsBannerState');
        try{
          const r=await fetch('/api/client-banners',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,interval_ms:Number($('fsBannerInterval')?.value||5000),items:bannerItems})});
          const d=await r.json().catch(()=>({}));
          if(!r.ok)throw new Error(d.error||'No se pudieron guardar los banners.');
          bannerItems=Array.isArray(d.config?.items)?d.config.items:bannerItems;
          renderBannerPreview();
          if(state)state.textContent='✅ Banners guardados y publicados en el app del cliente.';
        }catch(e){if(state)state.textContent='❌ '+e.message}
        finally{save.disabled=false;save.textContent='GUARDAR BANNERS'}
      };
    }
  }

  async function refresh(){
    if(!ensureStructure())return;
    decorateExisting();bind();bindBanners();
    await Promise.all([loadSummary(),loadHistory(),readBannerConfig()]);
  }

  window.addEventListener('uai:fidelity-config-saved',()=>setTimeout(refresh,150));
  const obs=new MutationObserver(()=>{if(document.body.dataset.uxView==='fidelidad')setTimeout(()=>{ensureStructure();decorateExisting();bind();bindBanners()},30)});
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(refresh,500);
})();