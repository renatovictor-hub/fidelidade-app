(() => {
  if(window.__uaiCatalogAdmin)return; window.__uaiCatalogAdmin=true;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let catalog={};

  function ensure(){
    const grid=document.querySelector('#uxSettingsView .ux-section-grid');
    if(!grid||document.getElementById('uxCatalogAdminPanel'))return false;
    const panel=document.createElement('section');
    panel.id='uxCatalogAdminPanel';
    panel.className='ux-panel ux-span-12';
    panel.innerHTML=`
      <style>
        .cat-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
        .cat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
        .cat-item{border:1px solid #e9e0ed;border-radius:13px;padding:11px;background:#faf8fb}
        .cat-main{display:grid;grid-template-columns:minmax(0,1fr) 120px auto;gap:8px;align-items:end}
        .cat-item label{display:block;font-size:11px;font-weight:800;color:#5f5364;margin-bottom:4px}
        .cat-item input{width:100%;box-sizing:border-box;min-height:40px}
        .cat-active{display:flex;align-items:center;gap:6px;height:40px;font-size:12px;font-weight:800}
        .cat-mods{margin-top:9px;border-top:1px solid #eee4f1;padding-top:8px}
        .cat-mods summary{cursor:pointer;font-size:12px;font-weight:900;color:#6a0dad}
        .cat-mod-row{display:grid;grid-template-columns:minmax(0,1fr) 100px auto;gap:6px;margin-top:7px}
        .cat-remove{width:38px!important;min-width:38px!important;padding:0!important}
        @media(max-width:760px){.cat-grid{grid-template-columns:1fr}.cat-main{grid-template-columns:1fr 100px auto}}
      </style>
      <div class="cat-head"><div><h2>Menú y precios</h2><p>Estos precios son los oficiales usados por el servidor al calcular pedidos. Los adicionales también se validan aquí.</p></div><button class="btn-primary" id="uxCatalogSave" style="width:auto!important">GUARDAR CATÁLOGO</button></div>
      <div id="uxCatalogState" style="font-size:11px;color:#6b6170;margin-top:6px"></div>
      <div id="uxCatalogGrid" class="cat-grid"><div class="ux-crm-empty">Cargando catálogo…</div></div>`;
    grid.appendChild(panel);
    panel.querySelector('#uxCatalogSave').onclick=save;
    load();
    return true;
  }

  function render(){
    const box=document.getElementById('uxCatalogGrid'); if(!box)return;
    const entries=Object.entries(catalog);
    box.innerHTML=entries.map(([id,p])=>`
      <div class="cat-item" data-id="${esc(id)}">
        <div class="cat-main">
          <div><label>Producto</label><input data-name value="${esc(p.name||'')}"></div>
          <div><label>Precio MX$</label><input data-price type="number" min="0" step="1" value="${Number(p.price||0)}"></div>
          <label class="cat-active"><input data-active type="checkbox" ${p.active===false?'':'checked'}> Activo</label>
        </div>
        <details class="cat-mods">
          <summary>Adicionales (${Array.isArray(p.modifiers)?p.modifiers.length:0})</summary>
          <div data-mods>${(p.modifiers||[]).map(m=>modRow(m)).join('')}</div>
          <button type="button" class="btn-secondary" data-add-mod style="margin-top:7px;width:auto!important">+ ADICIONAL</button>
        </details>
      </div>`).join('');
    box.querySelectorAll('[data-add-mod]').forEach(btn=>btn.onclick=()=>{
      const host=btn.closest('.cat-item').querySelector('[data-mods]');
      host.insertAdjacentHTML('beforeend',modRow({id:'extra_'+Date.now(),name:'Nuevo adicional',price:0,active:true}));
      bindRemove(host);
    });
    box.querySelectorAll('[data-mods]').forEach(bindRemove);
  }
  function modRow(m){return `<div class="cat-mod-row" data-mod><input data-mid value="${esc(m.id||'')}" placeholder="ID"><input data-mname value="${esc(m.name||'')}" placeholder="Nombre"><input data-mprice type="number" min="0" step="1" value="${Number(m.price||0)}" placeholder="$"><button type="button" class="btn-secondary cat-remove" data-remove-mod>×</button></div>`}
  function bindRemove(host){host.querySelectorAll('[data-remove-mod]').forEach(b=>b.onclick=()=>b.closest('[data-mod]')?.remove())}

  async function load(){
    const state=document.getElementById('uxCatalogState');
    try{
      const r=await fetch('/api/cliente?action=admin_catalog&t='+Date.now(),{cache:'no-store'});
      const d=await r.json(); if(!r.ok)throw new Error(d.error||'Error');
      catalog=d.catalog||{}; render(); if(state)state.textContent='Catálogo cargado.';
    }catch(e){if(state)state.textContent='❌ No se pudo cargar el catálogo.'}
  }
  async function save(){
    const btn=document.getElementById('uxCatalogSave'),state=document.getElementById('uxCatalogState');
    const next={};
    document.querySelectorAll('#uxCatalogGrid .cat-item').forEach(item=>{
      const id=item.dataset.id;
      next[id]={
        name:item.querySelector('[data-name]').value.trim(),
        price:Number(item.querySelector('[data-price]').value||0),
        active:item.querySelector('[data-active]').checked,
        modifiers:[...item.querySelectorAll('[data-mod]')].map(row=>({
          id:row.querySelector('[data-mid]').value.trim(),
          name:row.querySelector('[data-mname]').value.trim(),
          price:Number(row.querySelector('[data-mprice]').value||0),
          active:true
        })).filter(x=>x.id&&x.name)
      };
    });
    btn.disabled=true;btn.textContent='GUARDANDO...';
    try{
      const r=await fetch('/api/cliente',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'catalog_save',catalog:next})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');
      catalog=d.catalog||next;render();if(state)state.textContent='✅ Catálogo guardado. Los nuevos pedidos usarán estos precios.';
    }catch(e){if(state)state.textContent='❌ '+e.message}
    finally{btn.disabled=false;btn.textContent='GUARDAR CATÁLOGO'}
  }

  const timer=setInterval(()=>{if(ensure())clearInterval(timer)},700);
  ensure();
})();