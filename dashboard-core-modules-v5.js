(() => {
  if (document.getElementById('uxCoreModulesV5Styles')) return;

  const style = document.createElement('style');
  style.id = 'uxCoreModulesV5Styles';
  style.textContent = `
    #uxCoreToolbar{display:none;max-width:1180px;margin:0 auto 12px;background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:10px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-core-tabs{display:flex;gap:7px;flex-wrap:wrap}.ux-core-tabs button{width:auto!important;border:0!important;background:#f5f1f7!important;color:#6e6074!important;padding:9px 12px!important;border-radius:10px!important;font-size:11px!important;font-weight:850!important}
    .ux-core-tabs button.active{background:#6a0dad!important;color:#fff!important}
    .ux-core-summary{margin-top:9px;display:flex;gap:8px;flex-wrap:wrap}.ux-core-chip{font-size:9px;font-weight:800;color:#6c5e72;background:#faf8fb;border:1px solid #eee7f1;border-radius:999px;padding:5px 8px}
    body.ux3[data-ux-view="clientes"] #uxCoreToolbar,body.ux3[data-ux-view="fidelidad"] #uxCoreToolbar{display:block}
    body.ux3[data-ux-view="clientes"] .main-container,body.ux3[data-ux-view="fidelidad"] .main-container{max-width:1180px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important;gap:12px!important}
    body.ux3[data-ux-view="clientes"] .main-container .card.ux-show,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-show{max-width:none!important;margin:0!important;min-height:100%}
    body.ux3[data-ux-view="clientes"] .main-container .card.ux-featured,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-featured{grid-column:1/-1}
    body.ux3 .card .ux-card-kicker{display:block;color:#8d8093;font-size:9px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;margin:-4px 0 10px}
    body.ux3 .card.ux-hide-subsection{display:none!important}
    .ux-client-hero{display:none;max-width:1180px;margin:0 auto 12px;grid-template-columns:1.15fr .85fr;gap:12px}
    body.ux3[data-ux-view="clientes"] .ux-client-hero{display:grid}
    .ux-client-panel{background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:17px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-client-panel h2{margin:0 0 5px;font-size:17px;color:#302337}.ux-client-panel p{margin:0 0 13px;font-size:10px;color:#887c8e;line-height:1.45}
    .ux-client-searchline{display:grid;grid-template-columns:1fr auto auto;gap:7px}.ux-client-searchline input{min-width:0}.ux-client-searchline button{width:auto!important;padding:10px 12px!important;font-size:10px!important}
    .ux-client-total{display:flex;align-items:center;justify-content:space-between;gap:10px}.ux-client-total .big{font-size:34px;font-weight:900;color:#6a0dad}.ux-client-total small{font-size:9px;color:#8c8091}
    .ux-client-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.ux-client-actions button{font-size:10px!important;padding:10px!important}
    @media(max-width:900px){
      body.ux3[data-ux-view="clientes"] .main-container,body.ux3[data-ux-view="fidelidad"] .main-container{grid-template-columns:1fr!important}
      .ux-client-hero{grid-template-columns:1fr}
    }
    @media(max-width:780px){
      #uxCoreToolbar{margin:0 0 8px;padding:7px;overflow-x:auto;border-radius:14px}.ux-core-tabs{flex-wrap:nowrap;min-width:max-content}.ux-core-summary{display:none}
      body.ux3[data-ux-view="clientes"] .main-container .card.ux-show,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-show{display:none!important}
      body.ux3[data-ux-view="clientes"] .main-container .card.ux-show.ux-mobile-active,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-show.ux-mobile-active{display:block!important}
      .ux-client-hero{margin:0 0 8px}.ux-client-searchline{grid-template-columns:1fr 44px}.ux-client-searchline button span.label{display:none}.ux-client-searchline .ux-client-search-btn{grid-column:1/-1}
    }
  `;
  document.head.appendChild(style);

  const main = document.querySelector('.main-container');
  if (!main) return;

  const toolbar = document.createElement('section');
  toolbar.id = 'uxCoreToolbar';
  toolbar.innerHTML = '<div class="ux-core-tabs"></div><div class="ux-core-summary"></div>';
  main.parentNode.insertBefore(toolbar, main);

  const clientHero = document.createElement('section');
  clientHero.className = 'ux-client-hero';
  clientHero.innerHTML = `
    <div class="ux-client-panel">
      <h2>Buscar cliente</h2>
      <p>Encuentra un cliente por teléfono o ID, o escanea su QR.</p>
      <div class="ux-client-searchline">
        <input id="uxClientLookup" placeholder="Teléfono o ID del cliente">
        <button class="btn-secondary" id="uxClientQr" type="button">📷 <span class="label">QR</span></button>
        <button class="btn-primary ux-client-search-btn" id="uxClientSearch" type="button">BUSCAR CLIENTE</button>
      </div>
    </div>
    <div class="ux-client-panel">
      <div class="ux-client-total"><div><small>Clientes cadastrados</small><div class="big" id="uxClientTotal">—</div></div><span style="font-size:34px">👥</span></div>
      <div class="ux-client-actions"><button class="btn-secondary" type="button" id="uxGoPoints">+ Puntos</button><button class="btn-secondary" type="button" id="uxGoRewards">Recompensas</button></div>
    </div>
  `;
  main.parentNode.insertBefore(clientHero, main);

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function visibleCards(view){
    return [...document.querySelectorAll('.main-container .card')].filter(c => c.dataset.uxGroup === view);
  }
  function cardTitle(card){ return (card.querySelector('h1,h2,h3,h4')?.textContent || '').trim(); }
  function addKickers(){
    visibleCards('clientes').forEach(c => {
      if (!c.querySelector('.ux-card-kicker')) {
        const s=document.createElement('span');s.className='ux-card-kicker';s.textContent='Clientes';c.querySelector('h3')?.after(s);
      }
    });
    visibleCards('fidelidad').forEach(c => {
      if (!c.querySelector('.ux-card-kicker')) {
        const s=document.createElement('span');s.className='ux-card-kicker';s.textContent='Fidelidad';c.querySelector('h3')?.after(s);
      }
    });
  }

  let currentSection = {};
  function sectionLabels(view){
    const cards=visibleCards(view);
    return cards.map((c,i)=>({key:String(i),label:cardTitle(c).replace(/^[^\p{L}\p{N}]+/u,'').trim() || ('Sección '+(i+1)),card:c}));
  }
  function applyMobileSection(view,key){
    const sections=sectionLabels(view);
    currentSection[view]=key ?? sections[0]?.key ?? '0';
    sections.forEach(s=>s.card.classList.toggle('ux-mobile-active',s.key===currentSection[view]));
    toolbar.querySelectorAll('.ux-core-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.section===currentSection[view]));
  }
  function renderToolbar(view){
    if (!['clientes','fidelidad'].includes(view)) return;
    addKickers();
    const tabs=toolbar.querySelector('.ux-core-tabs');
    const summary=toolbar.querySelector('.ux-core-summary');
    const sections=sectionLabels(view);
    tabs.innerHTML=sections.map((s,i)=>'<button type="button" data-section="'+s.key+'" class="'+(i===0?'active':'')+'">'+s.label+'</button>').join('');
    if(view==='clientes') summary.innerHTML='<span class="ux-core-chip">👥 Base de clientes</span><span class="ux-core-chip">🔎 Busca rápida</span><span class="ux-core-chip">📷 QR</span><span class="ux-core-chip">🧾 Histórico</span>';
    else summary.innerHTML='<span class="ux-core-chip">⭐ Pontos</span><span class="ux-core-chip">👑 Níveis VIP</span><span class="ux-core-chip">🎯 Bônus</span><span class="ux-core-chip">🤝 Referidos</span>';
    const chosen=currentSection[view]||sections[0]?.key;
    applyMobileSection(view,chosen);
  }
  toolbar.addEventListener('click',e=>{const b=e.target.closest('button[data-section]');if(!b)return;applyMobileSection(document.body.dataset.uxView,b.dataset.section)});

  function syncClientTotal(){
    const raw=document.getElementById('totalClientes')?.textContent||'';
    const m=raw.replace(/\./g,'').match(/\d+/);
    document.getElementById('uxClientTotal').textContent=m?m[0]:'—';
  }
  document.getElementById('uxClientSearch').onclick=()=>{
    const q=document.getElementById('uxClientLookup').value.trim();if(!q)return;
    const input=document.getElementById('clienteUid');if(input){input.value=q;typeof buscarCliente==='function'&&buscarCliente()}
    const fidelityBtn=[...document.querySelectorAll('#uxSidebar .ux-nav button')].find(x=>norm(x.textContent)==='fidelidad');fidelityBtn?.click();
    setTimeout(()=>{const cards=visibleCards('fidelidad');const target=cards.find(c=>norm(cardTitle(c)).includes('agregar puntos'));if(target){currentSection.fidelidad=String(cards.indexOf(target));renderToolbar('fidelidad')}},100);
  };
  document.getElementById('uxClientQr').onclick=()=>{typeof abrirScannerQr==='function'&&abrirScannerQr()};
  document.getElementById('uxGoPoints').onclick=()=>{[...document.querySelectorAll('#uxSidebar .ux-nav button')].find(x=>norm(x.textContent)==='fidelidad')?.click()};
  document.getElementById('uxGoRewards').onclick=()=>{[...document.querySelectorAll('#uxSidebar .ux-nav button')].find(x=>norm(x.textContent)==='recompensas')?.click()};

  const observer=new MutationObserver(()=>{
    const view=document.body.dataset.uxView;
    if(['clientes','fidelidad'].includes(view)) renderToolbar(view);
    syncClientTotal();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(syncClientTotal,1800);

  const bodyObserver=new MutationObserver(muts=>{
    if(muts.some(m=>m.attributeName==='data-ux-view')){
      const view=document.body.dataset.uxView;
      if(['clientes','fidelidad'].includes(view)) setTimeout(()=>renderToolbar(view),20);
    }
  });
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['data-ux-view']});
})();