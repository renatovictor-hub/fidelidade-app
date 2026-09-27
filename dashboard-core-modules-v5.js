(() => {
  if (document.getElementById('uxCoreModulesV5Styles')) return;

  const style = document.createElement('style');
  style.id = 'uxCoreModulesV5Styles';
  style.textContent = `
    #uxCoreToolbar{display:none;max-width:1180px;margin:0 auto 12px;background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:10px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-core-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.ux-core-tabs button{width:100%!important;border:1px solid #e9e1ed!important;background:#fff!important;color:#56465d!important;padding:13px 14px!important;border-radius:13px!important;font-size:11px!important;font-weight:850!important;text-align:left!important;box-shadow:0 4px 12px rgba(55,24,70,.035);transition:.18s ease}
    .ux-core-tabs button:hover{transform:translateY(-1px);border-color:#d8c1e8!important}
    .ux-core-tabs button.active{background:linear-gradient(135deg,#6a0dad,#8a35cf)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 18px rgba(106,13,173,.18)}
    .ux-core-tabs button::after{content:'›';float:right;font-size:16px;line-height:10px;opacity:.65}.ux-core-tabs button.active::after{content:'⌄'}
    .ux-core-summary{display:none!important}
    body.ux3[data-ux-view="clientes"] #uxCoreToolbar,body.ux3[data-ux-view="fidelidad"] #uxCoreToolbar{display:block}
    body.ux3[data-ux-view="clientes"] .main-container,body.ux3[data-ux-view="fidelidad"] .main-container{max-width:1180px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important;gap:12px!important}
    body.ux3[data-ux-view="clientes"] .main-container .card.ux-show,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-show{display:none!important;max-width:none!important;margin:0!important;min-height:100%}
    body.ux3[data-ux-view="clientes"] .main-container .card.ux-show.ux-mobile-active,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-show.ux-mobile-active{display:block!important}
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
    .ux-client-result{display:none;grid-column:1/-1;background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:16px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-client-result.show{display:block}.ux-client-result-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ux-client-result h3{margin:0!important;color:#35273c!important;font-size:17px!important}
    .ux-client-result-meta{font-size:11px;color:#7f7385;margin-top:4px}.ux-client-result-points{background:#f2e8f7;color:#6a0dad;font-weight:900;border-radius:12px;padding:9px 11px;white-space:nowrap}
    .ux-client-history{margin-top:12px;border-top:1px solid #eee7f1;padding-top:12px}.ux-client-history-title{font-size:10px;font-weight:900;color:#6a0dad;margin-bottom:7px}
    @media(max-width:900px){
      body.ux3[data-ux-view="clientes"] .main-container,body.ux3[data-ux-view="fidelidad"] .main-container{grid-template-columns:1fr!important}
      .ux-client-hero{grid-template-columns:1fr}
    }
    @media(max-width:780px){
      #uxCoreToolbar{margin:0 0 8px;padding:7px;border-radius:14px}.ux-core-tabs{grid-template-columns:1fr 1fr;min-width:0}.ux-core-tabs button{padding:11px 10px!important;font-size:10px!important}.ux-core-summary{display:none}
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
      <div class="ux-client-total"><div><small>Clientes registrados</small><div class="big" id="uxClientTotal">—</div></div><span style="font-size:34px">👥</span></div>
      <div class="ux-client-actions"><button class="btn-secondary" type="button" id="uxGoPoints">+ Puntos</button><button class="btn-secondary" type="button" id="uxGoRewards">Recompensas</button></div>
    </div>
    <div class="ux-client-result" id="uxClientResult">
      <div class="ux-client-result-head">
        <div><h3 id="uxClientResultName">Cliente</h3><div class="ux-client-result-meta" id="uxClientResultMeta"></div></div>
        <div class="ux-client-result-points"><span id="uxClientResultPoints">0</span> pts</div>
      </div>
      <div class="ux-client-history"><div class="ux-client-history-title">HISTORIAL RECIENTE</div><div id="uxClientResultHistory">Sin movimientos.</div></div>
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
    let sections=sectionLabels(view);
    if(view==='clientes'){
      const rank=t=>norm(t).includes('base de clientes')?0:norm(t).includes('opiniones')?1:9;
      sections=sections.sort((a,b)=>rank(a.label)-rank(b.label));
    }else{
      const rank=t=>norm(t).includes('agregar puntos')?0:norm(t).includes('niveles vip')?1:(norm(t).includes('bonus')||norm(t).includes('bono'))?2:norm(t).includes('referidos')?3:9;
      sections=sections.sort((a,b)=>rank(a.label)-rank(b.label));
    }
    tabs.innerHTML=sections.map((s,i)=>'<button type="button" data-section="'+s.key+'" class="'+(i===0?'active':'')+'">'+s.label+'</button>').join('');
    const chosen=currentSection[view]||sections[0]?.key;
    applyMobileSection(view,chosen);
  }
  toolbar.addEventListener('click',e=>{const b=e.target.closest('button[data-section]');if(!b)return;applyMobileSection(document.body.dataset.uxView,b.dataset.section)});

  function syncClientTotal(){
    const raw=document.getElementById('totalClientes')?.textContent||'';
    const m=raw.replace(/\./g,'').match(/\d+/);
    document.getElementById('uxClientTotal').textContent=m?m[0]:'—';
  }
  async function renderClientResult(){
    const result=document.getElementById('uxClientResult');
    try{
      if(typeof clienteSelecionado==='undefined'||!clienteSelecionado){result?.classList.remove('show');return}
      document.getElementById('uxClientResultName').textContent=clienteSelecionado.nome||'Sin nombre';
      document.getElementById('uxClientResultMeta').textContent=(clienteSelecionado.telefone||'Sin teléfono')+' · ID: '+(clienteSelecionado.uid||'—');
      document.getElementById('uxClientResultPoints').textContent=String(Number(clienteSelecionado.pontos||0));
      const src=document.getElementById('clienteHistorico');
      document.getElementById('uxClientResultHistory').innerHTML=src?.innerHTML||'Sin movimientos.';
      result?.classList.add('show');
      if(typeof window.actualizarOpinionesCliente==='function')window.actualizarOpinionesCliente();
    }catch(_){}
  }
  document.getElementById('uxClientSearch').onclick=async()=>{
    const q=document.getElementById('uxClientLookup').value.trim();if(!q)return;
    const input=document.getElementById('clienteUid');
    if(!input||typeof buscarCliente!=='function')return;
    input.value=q;
    await buscarCliente();
    await new Promise(r=>setTimeout(r,250));
    renderClientResult();
    setTimeout(renderClientResult,700);
  };
  document.getElementById('uxClientQr').onclick=()=>{typeof abrirScannerQr==='function'&&abrirScannerQr()};
  document.getElementById('uxGoPoints').onclick=()=>{[...document.querySelectorAll('#uxSidebar .ux-nav button')].find(x=>norm(x.textContent)==='fidelidad')?.click()};
  document.getElementById('uxGoRewards').onclick=()=>{[...document.querySelectorAll('#uxSidebar .ux-nav button')].find(x=>norm(x.textContent)==='recompensas')?.click()};

  function refreshCore(){
    syncClientTotal();
    const view=document.body.dataset.uxView;
    if(!['clientes','fidelidad'].includes(view)) return;
    const key=view+'|'+sectionLabels(view).map(s=>s.label).join('|');
    if(toolbar.dataset.renderKey!==key){
      renderToolbar(view);
      toolbar.dataset.renderKey=key;
    }
  }
  setInterval(refreshCore,1800);

  const bodyObserver=new MutationObserver(muts=>{
    if(muts.some(m=>m.attributeName==='data-ux-view')){
      const view=document.body.dataset.uxView;
      toolbar.dataset.renderKey='';
      if(['clientes','fidelidad'].includes(view)) setTimeout(refreshCore,20);
    }
  });
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['data-ux-view']});
  setTimeout(refreshCore,120);
})();