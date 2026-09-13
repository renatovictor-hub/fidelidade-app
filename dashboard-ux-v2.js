(() => {
  if (document.getElementById('ux2Styles')) return;

  const style = document.createElement('style');
  style.id = 'ux2Styles';
  style.textContent = `
    :root{--ux-purple:#6a0dad;--ux-purple2:#8b2bd1;--ux-yellow:#ffcc00;--ux-bg:#f7f5f9;--ux-card:#fff;--ux-text:#2c2430;--ux-muted:#817789;--ux-border:#ebe3ef;--ux-green:#1fa968;--ux-blue:#377dff}
    html{scroll-behavior:smooth} body.ux2{background:var(--ux-bg)!important;color:var(--ux-text)!important;padding:96px 22px 30px 258px;min-height:100vh}
    body.ux2>header{display:none!important}
    #uxSidebar{position:fixed;z-index:9990;inset:0 auto 0 0;width:236px;background:#fff;border-right:1px solid var(--ux-border);padding:18px 14px;display:flex;flex-direction:column;box-shadow:8px 0 30px rgba(54,20,72,.04)}
    .ux-brand{display:flex;align-items:center;gap:10px;padding:4px 8px 18px}.ux-brand img{width:48px;height:48px;object-fit:contain}.ux-brand strong{display:block;color:var(--ux-purple);font-size:18px}.ux-brand small{display:block;color:var(--ux-muted);font-size:10px;margin-top:2px}
    .ux-company{margin:0 4px 16px;padding:12px;border:1px solid var(--ux-border);border-radius:14px;background:#faf7fc}.ux-company-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.ux-company b{font-size:13px}.ux-company small{display:block;color:var(--ux-muted);margin-top:3px;font-size:10px}.ux-plan{font-size:9px;font-weight:900;color:var(--ux-purple);background:#efe3f7;padding:5px 7px;border-radius:999px;white-space:nowrap}
    .ux-modules{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.ux-module{font-size:9px;font-weight:900;padding:5px 7px;border-radius:999px}.ux-module.loyalty{background:#f0e3f9;color:var(--ux-purple)}.ux-module.delivery{background:#e6f1ff;color:#2563c7}
    .ux-nav{display:grid;gap:3px}.ux-nav button{width:100%;border:0;background:transparent;color:#5f5364;padding:10px 11px;border-radius:11px;display:flex;align-items:center;gap:10px;text-align:left;font-size:12px;font-weight:750;cursor:pointer}.ux-nav button:hover,.ux-nav button.active{background:#f2e8f7;color:var(--ux-purple)}.ux-nav span{width:21px;text-align:center;font-size:15px}.ux-nav .ux-divider{height:1px;background:var(--ux-border);margin:7px 4px}
    .ux-side-foot{margin-top:auto;padding:12px 8px 2px}.ux-side-foot small{display:block;color:var(--ux-muted);font-size:9px;line-height:1.45}.ux-side-foot b{display:block;color:var(--ux-purple);font-size:11px;margin-bottom:3px}
    #uxTopbar{position:fixed;z-index:9980;left:236px;right:0;top:0;height:76px;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-bottom:1px solid var(--ux-border);display:flex;align-items:center;justify-content:space-between;padding:0 24px}.ux-title h1{margin:0;font-size:22px;color:#35243e}.ux-title p{margin:4px 0 0;color:var(--ux-muted);font-size:11px}.ux-top-actions{display:flex;align-items:center;gap:8px}.ux-top-badge{padding:7px 10px;border-radius:999px;background:#f3edf6;color:#72597d;font-size:10px;font-weight:850}.ux-top-actions button{width:auto!important;padding:9px 11px!important;border-radius:10px!important;font-size:11px!important}.ux-menu-btn{display:none!important}
    #uxOverview{max-width:1440px;margin:0 auto 18px}.ux-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.ux-kpi{background:#fff;border:1px solid var(--ux-border);border-radius:16px;padding:15px;box-shadow:0 8px 24px rgba(55,24,70,.05);display:flex;align-items:center;gap:12px}.ux-kpi-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#f2e7f8;font-size:19px}.ux-kpi:nth-child(2) .ux-kpi-icon{background:#e8f1ff}.ux-kpi:nth-child(3) .ux-kpi-icon{background:#fff5cf}.ux-kpi:nth-child(4) .ux-kpi-icon{background:#e7f7ef}.ux-kpi small{display:block;color:var(--ux-muted);font-size:10px;font-weight:750}.ux-kpi b{display:block;font-size:23px;margin-top:2px;color:#302538}.ux-kpi em{display:block;font-style:normal;color:#45a06a;font-size:9px;margin-top:2px;font-weight:800}
    .ux-overview-row{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-top:12px}.ux-welcome,.ux-quick{background:#fff;border:1px solid var(--ux-border);border-radius:16px;padding:16px;box-shadow:0 8px 24px rgba(55,24,70,.04)}.ux-welcome h2{margin:0;color:var(--ux-purple);font-size:17px}.ux-welcome p{margin:5px 0 0;color:var(--ux-muted);font-size:11px;line-height:1.45}.ux-pill-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.ux-pill-row span{padding:6px 8px;border-radius:999px;background:#f4eff7;color:#68566f;font-size:9px;font-weight:800}.ux-quick strong{font-size:12px}.ux-quick-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.ux-quick-actions button{width:auto!important;padding:9px 11px!important;border-radius:10px!important;font-size:10px!important;background:#f3e8f8!important;color:var(--ux-purple)!important}.ux-quick-actions button.primary{background:var(--ux-purple)!important;color:#fff!important}
    body.ux2 .main-container{max-width:1440px!important;margin:0 auto!important;padding:0!important;grid-template-columns:minmax(300px,.8fr) minmax(0,1.65fr)!important;gap:14px!important}body.ux2 .card{border:1px solid var(--ux-border)!important;border-radius:16px!important;box-shadow:0 8px 24px rgba(55,24,70,.05)!important;padding:18px!important;margin-bottom:14px!important}body.ux2 .card h3{border-left:0!important;padding-left:0!important;font-size:15px!important;color:#40264b!important;display:flex;align-items:center;gap:7px}body.ux2 input,body.ux2 textarea,body.ux2 select{border-color:#e5dce9!important;border-radius:11px!important;background:#fff!important;font-size:14px!important}body.ux2 button{border-radius:11px!important}body.ux2 .btn-primary{background:linear-gradient(135deg,#8c2bd2,#6a0dad)!important}body.ux2 .stats{font-size:28px!important}
    body.ux2 #ordersAdmin{max-width:1440px!important;margin:0 auto 14px!important;padding:0!important}body.ux2 #ordersAdmin .orders-card{border:1px solid var(--ux-border)!important;border-radius:16px!important;box-shadow:0 8px 24px rgba(55,24,70,.05)!important}body.ux2 #ordersAdmin .order-admin{border-radius:14px!important}
    #uxDrawerShade{display:none}
    @media(max-width:1050px){body.ux2{padding-left:22px}.ux-kpis{grid-template-columns:repeat(2,1fr)}#uxSidebar{transform:translateX(-102%);transition:.22s}body.ux-drawer #uxSidebar{transform:translateX(0)}#uxTopbar{left:0}.ux-menu-btn{display:inline-flex!important}#uxDrawerShade{display:none;position:fixed;z-index:9970;inset:0;background:rgba(23,10,29,.42)}body.ux-drawer #uxDrawerShade{display:block}}
    @media(max-width:780px){body.ux2{padding:86px 10px 22px}.ux-top-badge{display:none}.ux-title h1{font-size:18px}.ux-title p{font-size:9px}.ux-kpis{grid-template-columns:1fr 1fr;gap:8px}.ux-kpi{padding:11px;gap:9px}.ux-kpi-icon{width:36px;height:36px}.ux-kpi b{font-size:19px}.ux-overview-row{grid-template-columns:1fr}.main-container{display:block!important}body.ux2 #ordersAdmin{margin:0 0 12px!important}.ux-top-actions .ux-exit{display:none}}
    @media(max-width:430px){.ux-kpis{grid-template-columns:1fr}.ux-kpi{min-height:72px}.ux-quick-actions button{flex:1}.ux-welcome{padding:14px}}
  `;
  document.head.appendChild(style);
  document.body.classList.add('ux2');

  const sidebar = document.createElement('aside');
  sidebar.id = 'uxSidebar';
  sidebar.innerHTML = `
    <div class="ux-brand"><img src="/logo.png" alt="Uai Sô"><div><strong>Uai Sô</strong><small>Gestión del negocio</small></div></div>
    <div class="ux-company"><div class="ux-company-top"><div><b>Uai Sô · Cancún</b><small>Empresa activa</small></div><span class="ux-plan">SaaS</span></div><div class="ux-modules"><span class="ux-module loyalty">★ Fidelidad</span><span class="ux-module delivery">🛵 Delivery</span></div></div>
    <nav class="ux-nav">
      <button data-go="top" class="active"><span>▦</span>Resumen</button>
      <button data-find="Base de Clientes"><span>👥</span>Clientes</button>
      <button data-find="Agregar Puntos"><span>★</span>Fidelidad</button>
      <button data-find="Recompensas"><span>🎁</span>Recompensas</button>
      <button data-find="Promoción"><span>🔔</span>Ofertas / Push</button>
      <div class="ux-divider"></div>
      <button data-id="ordersAdmin"><span>🧾</span>Pedidos</button>
      <button data-id="ordersAdmin"><span>🛵</span>Entregas</button>
      <button data-find="envío"><span>⚙</span>Configurar envío</button>
      <div class="ux-divider"></div>
      <button data-soft="Relatórios"><span>▤</span>Relatórios</button>
      <button data-soft="Ajustes"><span>⚙</span>Ajustes</button>
    </nav>
    <div class="ux-side-foot"><b>Plataforma modular</b><small>Fidelidad como base · Delivery como módulo adicional. Preparado para futuras empresas e personalizaciones por tenant.</small></div>`;
  document.body.appendChild(sidebar);

  const topbar = document.createElement('div');
  topbar.id = 'uxTopbar';
  topbar.innerHTML = `<div class="ux-title"><h1>Dashboard general</h1><p>Clientes, fidelidad, campañas y pedidos en un solo lugar.</p></div><div class="ux-top-actions"><span class="ux-top-badge">Fidelidad + Delivery</span><button class="btn-secondary ux-menu-btn" type="button">☰</button><button class="btn-secondary ux-exit" type="button">Salir</button></div>`;
  document.body.appendChild(topbar);

  const shade = document.createElement('div'); shade.id='uxDrawerShade'; document.body.appendChild(shade);

  const overview = document.createElement('section');
  overview.id = 'uxOverview';
  overview.innerHTML = `
    <div class="ux-kpis">
      <div class="ux-kpi"><div class="ux-kpi-icon">👥</div><div><small>Clientes cadastrados</small><b id="uxClients">—</b><em>Base de fidelidad</em></div></div>
      <div class="ux-kpi"><div class="ux-kpi-icon">🧾</div><div><small>Pedidos activos</small><b id="uxOrders">—</b><em>Operación actual</em></div></div>
      <div class="ux-kpi"><div class="ux-kpi-icon">🔔</div><div><small>Ofertas activas</small><b id="uxPromos">—</b><em>Campañas visibles</em></div></div>
      <div class="ux-kpi"><div class="ux-kpi-icon">🎁</div><div><small>Recompensas</small><b id="uxRewards">—</b><em>Catálogo disponible</em></div></div>
    </div>
    <div class="ux-overview-row">
      <div class="ux-welcome"><h2>Visión general de Uai Sô</h2><p>Este dashboard ya está siendo organizado como una plataforma SaaS modular. Cada empresa podrá tener su propia marca, módulos contratados, reglas de fidelidad, catálogo y operación.</p><div class="ux-pill-row"><span>✓ Fidelidad activo</span><span>✓ Delivery activo</span><span>Personalización por empresa</span><span>Multiempresa preparado</span></div></div>
      <div class="ux-quick"><strong>Acciones rápidas</strong><div class="ux-quick-actions"><button class="primary" data-find="Agregar Puntos">+ Puntos</button><button data-find="Recompensas">+ Recompensa</button><button data-find="Promoción">+ Oferta</button><button data-id="ordersAdmin">Ver pedidos</button></div></div>
    </div>`;
  const main = document.querySelector('.main-container');
  document.body.insertBefore(overview, main || document.body.firstChild);

  function allHeadings(){return [...document.querySelectorAll('h1,h2,h3,h4')];}
  function goFind(term){const t=String(term).toLowerCase();const el=allHeadings().find(x=>x.textContent.toLowerCase().includes(t));if(el)el.closest('.card,section,article,div')?.scrollIntoView({behavior:'smooth',block:'start'});else toast(`${term}: módulo en preparación`);closeDrawer();}
  function goId(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});else toast('Cargando módulo...');closeDrawer();}
  function toast(text){let el=document.getElementById('uxToast');if(!el){el=document.createElement('div');el.id='uxToast';el.style.cssText='position:fixed;z-index:10000;left:50%;bottom:24px;transform:translateX(-50%);background:#2d2232;color:#fff;padding:10px 14px;border-radius:999px;font-size:11px;font-weight:800;box-shadow:0 10px 30px rgba(0,0,0,.2)';document.body.appendChild(el)}el.textContent=text;clearTimeout(el._t);el._t=setTimeout(()=>el.remove(),1800)}
  function closeDrawer(){document.body.classList.remove('ux-drawer')}
  sidebar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sidebar.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(b.dataset.go==='top')window.scrollTo({top:0,behavior:'smooth'});else if(b.dataset.find)goFind(b.dataset.find);else if(b.dataset.id)goId(b.dataset.id);else if(b.dataset.soft)toast(`${b.dataset.soft}: próxima etapa`);closeDrawer()});
  overview.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.find)goFind(b.dataset.find);if(b.dataset.id)goId(b.dataset.id)});
  topbar.querySelector('.ux-menu-btn').onclick=()=>document.body.classList.toggle('ux-drawer');
  shade.onclick=closeDrawer;
  topbar.querySelector('.ux-exit').onclick=()=>{const old=document.getElementById('adminLogoutBtn');if(old)old.click();else toast('Preview sin bloqueo de sesión')};

  function numericText(text){const m=String(text||'').replace(/\./g,'').match(/\d+/);return m?m[0]:'—'}
  function updateKpis(){
    const total=document.getElementById('totalClientes');
    document.getElementById('uxClients').textContent=total?numericText(total.textContent):'—';
    const active=document.querySelectorAll('#ordersAdmin .order-admin.active').length;
    document.getElementById('uxOrders').textContent=document.getElementById('ordersAdmin')?String(active):'—';
    const promos=[...document.querySelectorAll('#listaPromos .promo-item')].filter(x=>getComputedStyle(x).display!=='none').length;
    document.getElementById('uxPromos').textContent=document.getElementById('listaPromos')?String(promos):'—';
    const rewards=document.querySelectorAll('#listaRecompensas > *').length;
    document.getElementById('uxRewards').textContent=document.getElementById('listaRecompensas')?String(rewards):'—';
  }
  setInterval(updateKpis,1800); updateKpis();

  function keepOverviewFirst(){
    const orders=document.getElementById('ordersAdmin');
    const main=document.querySelector('.main-container');
    const anchor=orders||main;
    if(anchor && overview.compareDocumentPosition(anchor)&Node.DOCUMENT_POSITION_PRECEDING)document.body.insertBefore(overview,anchor);
  }
  setInterval(keepOverviewFirst,1200);
})();
