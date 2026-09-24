(() => {
  if (document.getElementById('uxGrowthModulesV6Styles')) return;

  const style=document.createElement('style');
  style.id='uxGrowthModulesV6Styles';
  style.textContent=`
    #uxGrowthToolbar{display:none;max-width:1180px;margin:0 auto 12px;background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:10px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    #uxGrowthToolbar .tabs{display:flex;gap:7px;flex-wrap:wrap}
    #uxGrowthToolbar button{width:auto!important;border:0!important;background:#f5f1f7!important;color:#6e6074!important;padding:9px 12px!important;border-radius:10px!important;font-size:11px!important;font-weight:850!important}
    #uxGrowthToolbar button.active{background:#6a0dad!important;color:#fff!important}
    #uxGrowthToolbar .meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
    #uxGrowthToolbar .meta span{font-size:9px;font-weight:800;color:#6c5e72;background:#faf8fb;border:1px solid #eee7f1;border-radius:999px;padding:5px 8px}

    body.ux3[data-ux-view="recompensas"] #uxGrowthToolbar,body.ux3[data-ux-view="ofertas"] #uxGrowthToolbar{display:block}
    body.ux3[data-ux-view="recompensas"] .main-container,body.ux3[data-ux-view="ofertas"] .main-container{max-width:1180px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-items:start!important}
    body.ux3[data-ux-view="recompensas"] .main-container .card.ux-show,body.ux3[data-ux-view="ofertas"] .main-container .card.ux-show{max-width:none!important;margin:0!important}
    body.ux3[data-ux-view="recompensas"] .main-container .card[data-growth-span="full"],body.ux3[data-ux-view="ofertas"] .main-container .card[data-growth-span="full"]{grid-column:1/-1}

    .ux-reward-shell{display:grid;grid-template-columns:.85fr 1.15fr;gap:14px}
    .ux-reward-panel{min-width:0}
    .ux-reward-panel.catalog{border-left:1px solid #eee7f1;padding-left:14px}
    .ux-reward-panel h4{margin:0 0 11px;color:#3b2d42;font-size:13px}
    .ux-reward-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
    .ux-reward-metric{border:1px solid #eee7f1;background:#faf8fb;border-radius:11px;padding:10px}
    .ux-reward-metric small{display:block;font-size:8px;color:#897d8f}.ux-reward-metric b{display:block;font-size:18px;color:#5f0fa8;margin-top:3px}
    #listaRecompensas{margin-top:0!important;max-height:560px;overflow:auto;padding-right:3px}
    .reward-item{box-shadow:none!important;border-color:#ece5ef!important;border-radius:12px!important}
    .reward-actions button{border-radius:9px!important}

    .ux-offer-hero{display:none;max-width:1180px;margin:0 auto 12px;grid-template-columns:1.2fr .8fr;gap:12px}
    body.ux3[data-ux-view="ofertas"] .ux-offer-hero{display:grid}
    .ux-offer-panel{background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:16px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-offer-panel h2{margin:0 0 5px;color:#322438;font-size:16px}.ux-offer-panel p{margin:0;color:#8b7f91;font-size:10px;line-height:1.45}
    .ux-offer-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
    .ux-offer-kpi{background:#faf8fb;border:1px solid #eee7f1;border-radius:11px;padding:10px;text-align:center}
    .ux-offer-kpi b{display:block;font-size:18px;color:#6a0dad}.ux-offer-kpi small{font-size:8px;color:#897d8e}
    .ux-offer-tip{background:linear-gradient(135deg,#6b11bd,#8d33d6);color:#fff}
    .ux-offer-tip h2,.ux-offer-tip p{color:#fff}.ux-offer-tip p{opacity:.85}.ux-offer-tip .tip{margin-top:12px;background:rgba(255,255,255,.13);border-radius:11px;padding:10px;font-size:10px;line-height:1.45}

    body.ux3[data-ux-view="ofertas"] .promo-item{border-left:0!important;border:1px solid #eee5d7!important;border-radius:12px!important;background:#fffdf5!important}
    body.ux3[data-ux-view="ofertas"] .expired-dashboard{background:#f8f8f8!important;border-color:#ececec!important}
    #segmentacaoPushBox{background:#faf8fb;border:1px solid #eee7f1;border-radius:12px;padding:12px!important;margin:16px 0 12px!important}
    #pushSegmentoResumo{border:1px solid #eadcf3!important}

    @media(max-width:900px){
      body.ux3[data-ux-view="recompensas"] .main-container,body.ux3[data-ux-view="ofertas"] .main-container{grid-template-columns:1fr!important}
      .ux-reward-shell{grid-template-columns:1fr}.ux-reward-panel.catalog{border-left:0;border-top:1px solid #eee7f1;padding-left:0;padding-top:14px}
      .ux-offer-hero{grid-template-columns:1fr}
    }
    @media(max-width:780px){
      #uxGrowthToolbar{margin:0 0 8px;padding:7px;overflow-x:auto;border-radius:14px}
      #uxGrowthToolbar .tabs{flex-wrap:nowrap;min-width:max-content}#uxGrowthToolbar .meta{display:none}
      body.ux3[data-ux-view="ofertas"] .main-container .card.ux-show{display:none!important}
      body.ux3[data-ux-view="ofertas"] .main-container .card.ux-show.ux-growth-active{display:block!important}
      .ux-offer-hero{margin:0 0 8px}
      body.ux3[data-ux-view="recompensas"] .ux-reward-shell{display:block}
      body.ux3[data-ux-view="recompensas"] .ux-reward-panel{display:none}
      body.ux3[data-ux-view="recompensas"][data-growth-sub="crear"] .ux-reward-panel.create,body.ux3[data-ux-view="recompensas"]:not([data-growth-sub]) .ux-reward-panel.create{display:block}
      body.ux3[data-ux-view="recompensas"][data-growth-sub="catalogo"] .ux-reward-panel.catalog{display:block;border:0;padding:0}
      .ux-reward-summary{grid-template-columns:repeat(3,1fr)}
    }
  `;
  document.head.appendChild(style);

  const main=document.querySelector('.main-container');
  if(!main) return;

  const toolbar=document.createElement('section');
  toolbar.id='uxGrowthToolbar';
  toolbar.innerHTML='<div class="tabs"></div><div class="meta"></div>';
  main.parentNode.insertBefore(toolbar,main);

  const offerHero=document.createElement('section');
  offerHero.className='ux-offer-hero';
  offerHero.innerHTML=`
    <div class="ux-offer-panel">
      <h2>Campañas y notificaciones</h2>
      <p>Crea promociones, segmenta el público y revisa el historial sin mezclar todo en una sola pantalla.</p>
      <div class="ux-offer-kpis">
        <div class="ux-offer-kpi"><b id="uxActiveOffers">—</b><small>Ofertas activas</small></div>
        <div class="ux-offer-kpi"><b id="uxExpiredOffers">—</b><small>Expiradas</small></div>
        <div class="ux-offer-kpi"><b id="uxPushCount">—</b><small>Push registrados</small></div>
      </div>
    </div>
    <div class="ux-offer-panel ux-offer-tip">
      <h2>Venta inteligente</h2>
      <p>Fidelidad + campañas trabajan juntas.</p>
      <div class="tip">Puedes enviar una oferta a todos, a un cliente específico, a clientes inactivos o a quienes estén cerca de alcanzar una recompensa.</div>
    </div>
  `;
  main.parentNode.insertBefore(offerHero,main);

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function title(card){return (card.querySelector('h1,h2,h3,h4')?.textContent||'').trim()}
  function cards(view){return [...document.querySelectorAll('.main-container .card')].filter(c=>c.dataset.uxGroup===view)}

  function prepareRewards(){
    const card=cards('recompensas').find(c=>norm(title(c)).includes('recompensas'));
    if(!card||card.dataset.growthPrepared) return;
    card.dataset.growthPrepared='1';card.dataset.growthSpan='full';
    const h=card.querySelector('h3');if(h)h.textContent='🎁 Recompensas';
    const list=card.querySelector('#listaRecompensas');
    if(!list)return;
    const shell=document.createElement('div');shell.className='ux-reward-shell';
    const create=document.createElement('div');create.className='ux-reward-panel create';
    create.innerHTML='<h4>Crear recompensa</h4>';
    const catalog=document.createElement('div');catalog.className='ux-reward-panel catalog';
    catalog.innerHTML='<h4>Catálogo de recompensas</h4><div class="ux-reward-summary"><div class="ux-reward-metric"><small>Total</small><b id="uxRewardTotal">—</b></div><div class="ux-reward-metric"><small>Activas</small><b id="uxRewardActive">—</b></div><div class="ux-reward-metric"><small>Inactivas</small><b id="uxRewardInactive">—</b></div></div>';
    const children=[...card.children].filter(x=>x!==h);
    children.forEach(el=>{if(el===list)catalog.appendChild(el);else create.appendChild(el)});
    shell.append(create,catalog);card.appendChild(shell);
  }

  const OFFER_MAP=[
    ['crear nueva promocion','crear'],
    ['promociones activas','activas'],
    ['promociones expiradas','expiradas'],
    ['historial de notificaciones','historial']
  ];
  function prepareOffers(){
    cards('ofertas').forEach(c=>{
      const t=norm(title(c));
      const found=OFFER_MAP.find(([term])=>t.includes(term));
      if(found)c.dataset.growthSection=found[1];
    });
  }

  function rewardMetrics(){
    const items=[...document.querySelectorAll('#listaRecompensas .reward-item')];
    const active=items.filter(x=>!x.classList.contains('inactive')).length;
    const inactive=items.length-active;
    const a=document.getElementById('uxRewardTotal'),b=document.getElementById('uxRewardActive'),c=document.getElementById('uxRewardInactive');
    if(a)a.textContent=String(items.length);if(b)b.textContent=String(active);if(c)c.textContent=String(inactive);
  }
  function offerMetrics(){
    const active=document.querySelectorAll('#listaPromos .promo-item').length;
    const expired=document.querySelectorAll('#listaExpiradas .promo-item').length;
    const push=document.querySelectorAll('#pushHistoricoLista > div').length;
    const a=document.getElementById('uxActiveOffers'),e=document.getElementById('uxExpiredOffers'),p=document.getElementById('uxPushCount');
    if(a)a.textContent=String(active);if(e)e.textContent=String(expired);if(p)p.textContent=String(push);
  }

  function render(view){
    prepareRewards();prepareOffers();
    const tabs=toolbar.querySelector('.tabs'),meta=toolbar.querySelector('.meta');
    if(view==='recompensas'){
      const sub=document.body.dataset.growthSub||'crear';
      tabs.innerHTML='<button data-growth="crear">Crear recompensa</button><button data-growth="catalogo">Catálogo</button>';
      meta.innerHTML='<span>🎁 Beneficios</span><span>⭐ Puntos configurables</span><span>✅ Activar / desactivar</span><span>🧾 Canje por cliente</span>';
      tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.growth===sub));
    } else if(view==='ofertas'){
      let sub=document.body.dataset.growthSub||'crear';if(!['crear','activas','expiradas','historial'].includes(sub))sub='crear';
      tabs.innerHTML='<button data-growth="crear">Nueva campaña</button><button data-growth="activas">Activas</button><button data-growth="expiradas">Expiradas</button><button data-growth="historial">Historial</button>';
      meta.innerHTML='<span>🔔 Push</span><span>🎯 Segmentación</span><span>🔥 Promociones</span><span>🕘 Histórico</span>';
      cards('ofertas').forEach(c=>c.classList.toggle('ux-growth-active',c.dataset.growthSection===sub));
      tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.growth===sub));
    }
    rewardMetrics();offerMetrics();
  }

  toolbar.addEventListener('click',e=>{
    const b=e.target.closest('button[data-growth]');if(!b)return;
    document.body.dataset.growthSub=b.dataset.growth;
    render(document.body.dataset.uxView);
  });

  const attrObs=new MutationObserver(muts=>{
    if(muts.some(m=>m.attributeName==='data-ux-view')){
      delete document.body.dataset.growthSub;
      const view=document.body.dataset.uxView;
      if(['recompensas','ofertas'].includes(view))setTimeout(()=>render(view),30);
    }
  });
  attrObs.observe(document.body,{attributes:true,attributeFilter:['data-ux-view']});

  const contentObs=new MutationObserver(()=>{
    const view=document.body.dataset.uxView;
    prepareRewards();prepareOffers();rewardMetrics();offerMetrics();
    if(['recompensas','ofertas'].includes(view))render(view);
  });
  contentObs.observe(main,{childList:true,subtree:true});

  prepareRewards();prepareOffers();
  setInterval(()=>{rewardMetrics();offerMetrics()},1800);
})();