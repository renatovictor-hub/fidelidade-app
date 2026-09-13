(() => {
  if (document.getElementById('uxNavV3Styles')) return;
  const style=document.createElement('style');
  style.id='uxNavV3Styles';
  style.textContent=`
    body.ux3 #uxOverview,body.ux3 .main-container,body.ux3 #ordersAdmin{display:none!important}
    body.ux3[data-ux-view="resumen"] #uxOverview{display:block!important}
    body.ux3[data-ux-view="pedidos"] #ordersAdmin,body.ux3[data-ux-view="entregas"] #ordersAdmin{display:block!important}
    body.ux3:not([data-ux-view="resumen"]):not([data-ux-view="pedidos"]):not([data-ux-view="entregas"]) .main-container{display:grid!important;grid-template-columns:1fr!important}
    body.ux3 .main-container>aside,body.ux3 .main-container>main{display:contents!important}
    body.ux3 .main-container .card{display:none!important}
    body.ux3 .main-container .card[data-ux-group].ux-show{display:block!important;max-width:980px;width:100%;margin-left:auto!important;margin-right:auto!important}
    #uxMobileNav{display:none}
    #uxEmptyView{display:none;max-width:760px;margin:30px auto;background:#fff;border:1px solid #ebe3ef;border-radius:18px;padding:28px;text-align:center;box-shadow:0 8px 24px rgba(55,24,70,.05)}
    #uxEmptyView.show{display:block}
    #uxEmptyView h2{margin:0 0 8px;color:#6a0dad;font-size:20px}#uxEmptyView p{margin:0;color:#817789;font-size:13px;line-height:1.5}
    @media(max-width:780px){
      body.ux3{padding-bottom:86px!important}
      body.ux3:not([data-ux-view="resumen"]):not([data-ux-view="pedidos"]):not([data-ux-view="entregas"]) .main-container{display:block!important}
      body.ux3 .main-container .card[data-ux-group].ux-show{margin:0 0 12px!important;padding:16px!important;border-radius:15px!important}
      #uxMobileNav{position:fixed;z-index:9985;left:8px;right:8px;bottom:8px;height:64px;border:1px solid #e9e0ed;border-radius:19px;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);box-shadow:0 10px 35px rgba(46,18,58,.16);display:grid;grid-template-columns:repeat(4,1fr);padding:5px}
      #uxMobileNav button{border:0!important;background:transparent!important;color:#817789!important;padding:3px!important;font-size:9px!important;font-weight:800!important;display:grid;place-items:center;gap:1px;border-radius:13px!important}
      #uxMobileNav button span{display:block;font-size:19px;line-height:1}
      #uxMobileNav button.active{background:#f1e6f7!important;color:#6a0dad!important}
      #uxOverview{margin-bottom:6px!important}.ux-overview-row{margin-top:8px!important}
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add('ux3');

  const TITLES={resumen:['Dashboard general','Clientes, fidelidad, campañas y pedidos en un solo lugar.'],clientes:['Clientes','Base de clientes y actividad.'],fidelidad:['Fidelidad','Puntos, niveles y beneficios.'],recompensas:['Recompensas','Crea y administra beneficios para tus clientes.'],ofertas:['Ofertas / Push','Campañas, promociones y notificaciones.'],pedidos:['Pedidos','Gestiona los pedidos activos y su progreso.'],entregas:['Entregas','Seguimiento operativo de pedidos para entrega.'],envio:['Configurar envío','Reglas, zonas y tarifas de entrega.'],reportes:['Relatórios','Indicadores y rendimiento del negocio.'],ajustes:['Ajustes','Configuración de la empresa y sus módulos.']};

  const GROUPS={
    clientes:['base de clientes','cumpleaños','reseñas','reviews'],
    fidelidad:['agregar puntos','niveles vip','bonus','bono','referidos'],
    recompensas:['recompensas'],
    ofertas:['promociones activas','promociones expiradas','crear nueva promoción','notificaciones'],
    envio:['configurar envío','tarifa','entrega'],
    ajustes:['logs del sistema']
  };

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function classify(){
    document.querySelectorAll('.main-container .card').forEach(card=>{
      const title=norm(card.querySelector('h1,h2,h3,h4')?.textContent||'');
      let group='';
      for(const [g,terms] of Object.entries(GROUPS)){if(terms.some(t=>title.includes(norm(t)))){group=g;break}}
      if(!group)group='ajustes';
      card.dataset.uxGroup=group;
    });
  }

  const empty=document.createElement('section');empty.id='uxEmptyView';document.body.appendChild(empty);
  const mobile=document.createElement('nav');mobile.id='uxMobileNav';mobile.innerHTML=`<button data-view="resumen" class="active"><span>▦</span>Resumen</button><button data-view="fidelidad"><span>★</span>Fidelidad</button><button data-view="pedidos"><span>🧾</span>Pedidos</button><button data-more="1"><span>☰</span>Más</button>`;document.body.appendChild(mobile);

  function setActiveNav(view){
    document.querySelectorAll('#uxSidebar .ux-nav button').forEach(b=>b.classList.remove('active'));
    const map={resumen:'Resumen',clientes:'Clientes',fidelidad:'Fidelidad',recompensas:'Recompensas',ofertas:'Ofertas / Push',pedidos:'Pedidos',entregas:'Entregas',envio:'Configurar envío',reportes:'Relatórios',ajustes:'Ajustes'};
    [...document.querySelectorAll('#uxSidebar .ux-nav button')].find(b=>norm(b.textContent)===norm(map[view]))?.classList.add('active');
    mobile.querySelectorAll('button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  }

  function show(view){
    classify();
    document.body.dataset.uxView=view;
    document.querySelectorAll('.main-container .card').forEach(c=>c.classList.toggle('ux-show',c.dataset.uxGroup===view));
    const title=TITLES[view]||[view,''];
    const h=document.querySelector('#uxTopbar .ux-title h1'),p=document.querySelector('#uxTopbar .ux-title p');if(h)h.textContent=title[0];if(p)p.textContent=title[1];
    const supported=['resumen','pedidos','entregas'];
    const hasCards=[...document.querySelectorAll('.main-container .card')].some(c=>c.classList.contains('ux-show'));
    if(!supported.includes(view)&&!hasCards){empty.classList.add('show');empty.innerHTML=`<h2>${title[0]}</h2><p>Este módulo todavía no tiene una pantalla propia. La estructura ya está preparada para recibirlo sin mezclarlo con las demás funciones.</p>`}else empty.classList.remove('show');
    setActiveNav(view);window.scrollTo({top:0,behavior:'auto'});document.body.classList.remove('ux-drawer');
  }

  function inferView(btn){
    const txt=norm(btn.textContent);
    if(txt.includes('resumen'))return'resumen';if(txt.includes('clientes'))return'clientes';if(txt.includes('fidelidad'))return'fidelidad';if(txt.includes('recompensas'))return'recompensas';if(txt.includes('ofertas'))return'ofertas';if(txt.includes('pedidos'))return'pedidos';if(txt.includes('entregas'))return'entregas';if(txt.includes('configurar envio'))return'envio';if(txt.includes('relatorios'))return'reportes';if(txt.includes('ajustes'))return'ajustes';return null;
  }

  const sidebar=document.getElementById('uxSidebar');
  if(sidebar)sidebar.addEventListener('click',e=>{const b=e.target.closest('.ux-nav button');if(!b)return;const v=inferView(b);if(v){e.stopImmediatePropagation();e.preventDefault();show(v)}},true);
  mobile.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.more){document.body.classList.add('ux-drawer');return}if(b.dataset.view)show(b.dataset.view)});

  const observer=new MutationObserver(()=>{classify();const current=document.body.dataset.uxView||'resumen';if(current!=='resumen'&&current!=='pedidos'&&current!=='entregas')document.querySelectorAll('.main-container .card').forEach(c=>c.classList.toggle('ux-show',c.dataset.uxGroup===current))});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>show('resumen'),100);
})();
