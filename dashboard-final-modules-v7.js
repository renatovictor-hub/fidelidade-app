(() => {
  if (document.getElementById('uxFinalModulesV7Styles')) return;

  const style=document.createElement('style');
  style.id='uxFinalModulesV7Styles';
  style.textContent=`
    .ux-virtual-view{display:none;max-width:1280px;margin:0 auto}
    body[data-ux-view="fidelidad"] #uxQrView,
    body[data-ux-view="envio"] #uxDeliverySettingsView,
    body[data-ux-view="reportes"] #uxReportsView,
    body[data-ux-view="ajustes"] #uxSettingsView{display:block}
    body[data-ux-view="fidelidad"] #uxEmptyView,
    body[data-ux-view="envio"] #uxEmptyView,
    body[data-ux-view="reportes"] #uxEmptyView,
    body[data-ux-view="ajustes"] #uxEmptyView{display:none!important}

    body[data-ux-view="fidelidad"] .main-container,
    body[data-ux-view="fidelidad"] #ordersAdmin,
    body[data-ux-view="fidelidad"] #uxCoreToolbar,
    body[data-ux-view="envio"] .main-container,
    body[data-ux-view="envio"] #ordersAdmin,
    body[data-ux-view="reportes"] .main-container,
    body[data-ux-view="reportes"] #ordersAdmin,
    body[data-ux-view="ajustes"] .main-container,
    body[data-ux-view="ajustes"] #ordersAdmin{display:none!important}

    .ux-section-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}
    .ux-panel{background:#fff;border:1px solid #ebe4ee;border-radius:16px;padding:16px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-panel h2{margin:0;color:#302438;font-size:19px}.ux-panel p{margin:6px 0 0;color:#625768;font-size:13px;line-height:1.55}
    .ux-span-12{grid-column:span 12}.ux-span-8{grid-column:span 8}.ux-span-7{grid-column:span 7}.ux-span-6{grid-column:span 6}.ux-span-5{grid-column:span 5}.ux-span-4{grid-column:span 4}
    .ux-mini-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
    .ux-mini-kpi{background:#faf8fb;border:1px solid #eee7f1;border-radius:11px;padding:10px}
    .ux-mini-kpi small{display:block;font-size:11px;color:#625768;font-weight:700}.ux-mini-kpi b{display:block;font-size:19px;color:#6a0dad;margin-top:3px}
    .ux-table{display:grid;gap:7px;margin-top:12px}.ux-tr{display:grid;grid-template-columns:1.3fr 1fr .8fr;gap:8px;padding:11px 12px;border:1px solid #eee7f1;border-radius:10px;background:#faf8fb;font-size:13px;align-items:center}.ux-tr b{font-size:13px}
    .ux-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#f1e7f8;color:#6a0dad;font-size:11px;font-weight:900}
    .ux-actions-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.ux-actions-row button{width:auto!important;min-height:42px;padding:10px 12px!important;font-size:13px!important}
    .ux-kanban{display:grid;grid-template-columns:repeat(5,minmax(210px,1fr));gap:10px;overflow-x:auto;padding-bottom:4px}
    .ux-kanban-col{background:#f8f5fa;border:1px solid #eee7f1;border-radius:14px;min-height:240px;padding:9px}
    .ux-kanban-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:13px;font-weight:900;color:#49364f}.ux-kanban-count{background:#fff;border:1px solid #e8dfec;border-radius:999px;padding:3px 6px;color:#6a0dad}
    .ux-kanban-list{display:grid;gap:8px}.ux-kanban-list .order-admin{margin:0!important;padding:10px!important;border-left-width:4px!important}.ux-kanban-list .order-items,.ux-kanban-list .order-delivery{display:none}.ux-kanban-list .order-meta{font-size:12px}.ux-kanban-list .order-actions button{min-width:0!important;font-size:12px!important;padding:9px!important}
    .ux-order-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:0 0 12px}
    .ux-order-summary div{background:#fff;border:1px solid #ebe4ee;border-radius:12px;padding:10px}.ux-order-summary small{display:block;font-size:11px;color:#625768;font-weight:700}.ux-order-summary b{font-size:18px;color:#5d148f}
    .ux-delivery-note{background:#fff8e5;border:1px solid #f0dfaa;border-radius:11px;padding:11px;font-size:13px;color:#66520a;margin-top:10px}
    .ux-report-bars{height:190px;display:flex;align-items:flex-end;gap:10px;padding:15px 8px 6px;border-bottom:1px solid #eee7f1;margin-top:8px}.ux-report-bars i{flex:1;background:linear-gradient(#c69aef,#7a2bd2);border-radius:8px 8px 2px 2px;min-width:18px}.ux-report-days{display:grid;grid-template-columns:repeat(7,1fr);font-size:10px;text-align:center;color:#625768;margin-top:5px}
    .ux-settings-list{display:grid;gap:8px;margin-top:12px}
    #uxSettingsReviewsHost{margin-top:12px}
    #uxSettingsReviewsHost>.card{display:block!important;max-width:none!important;margin:0!important;box-shadow:none!important;padding:0!important;border:0!important}
    #uxSettingsReviewsHost>.card h3{font-size:14px!important;color:#3a2a42!important;margin:0 0 12px!important}.ux-setting{display:flex;justify-content:space-between;gap:10px;padding:11px;border:1px solid #eee7f1;border-radius:11px;background:#faf8fb}.ux-setting b{font-size:13px}.ux-setting small{display:block;color:#625768;font-size:11px;margin-top:2px}
    .ux-toggle{font-size:11px;font-weight:900;padding:5px 8px;border-radius:999px;background:#e9f8ef;color:#188b4f;align-self:center}
    .ux-toggle.off{background:#f3f3f3;color:#888}
    .ux-qr-box{display:grid;place-items:center;min-height:180px;background:linear-gradient(135deg,#faf7fc,#f0e7f7);border:1px dashed #d9c6e5;border-radius:14px;margin-top:12px}.ux-qr-box .icon{font-size:54px}.ux-qr-box b{display:block;text-align:center;font-size:15px}.ux-qr-box small{display:block;text-align:center;color:#625768;font-size:12px;margin-top:5px}
    .ux-caja-search{display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-top:12px}.ux-caja-search input{min-width:0}.ux-caja-search button{width:auto!important}
    .ux-caja-client{display:none;margin-top:12px;padding:14px;border:1px solid #e9ddeb;border-radius:14px;background:#fbf8fd}.ux-caja-client.show{display:block}
    .ux-caja-client-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ux-caja-client-head h3{margin:0;font-size:20px;color:#34253c}.ux-caja-client-head p{margin:3px 0 0;font-size:12px;color:#685d6c}.ux-caja-points{font-size:24px;font-weight:900;color:#6a0dad}
    .ux-caja-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.ux-caja-actions button{font-size:13px!important;min-height:44px!important}
    .ux-caja-purchase{display:grid;grid-template-columns:1fr auto;gap:9px;align-items:end;margin-top:14px}.ux-caja-purchase label{display:block;font-weight:800;font-size:13px;margin-bottom:5px}.ux-caja-purchase input{min-height:44px}.ux-caja-preview{margin-top:8px;padding:10px 12px;background:#fff7d6;border-radius:10px;color:#6b5700;font-weight:800;font-size:13px}
    .ux-caja-rewards{margin-top:12px}.ux-caja-reward{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #eee7f1}.ux-caja-reward:last-child{border-bottom:0}.ux-caja-reward button{width:auto!important;min-width:100px!important}

    .ux-fid-tabs{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-bottom:12px;background:#fff;border:1px solid #ebe4ee;border-radius:16px;padding:9px}
    .ux-fid-tabs button{min-height:44px!important;border:1px solid #e9e1ed!important;background:#fff!important;color:#5c4d62!important;font-size:13px!important;font-weight:850!important}
    .ux-fid-tabs button.active{background:linear-gradient(135deg,#8c2bd2,#6a0dad)!important;color:#fff!important;border-color:transparent!important}
    .ux-fid-pane{display:none}.ux-fid-pane.active{display:block}
    .ux-fid-config-host{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
    .ux-fid-config-host>.card{display:block!important;max-width:none!important;margin:0!important;min-height:100%;box-shadow:none!important}
    .ux-fid-rule{padding:12px;border:1px solid #eee7f1;border-radius:12px;background:#faf8fb;margin-top:12px}
    .ux-fid-rule b{display:block;font-size:14px}.ux-fid-rule small{display:block;font-size:12px;color:#665b6b;margin-top:4px}
    .ux-fid-history{display:grid;gap:8px;margin-top:12px;max-height:520px;overflow:auto}.ux-fid-history .historico-item{margin:0}
    @media(max-width:1000px){.ux-span-8,.ux-span-7,.ux-span-6,.ux-span-5,.ux-span-4{grid-column:span 12}.ux-mini-kpis{grid-template-columns:repeat(2,1fr)}.ux-order-summary{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:780px){.ux-section-grid{display:block}.ux-panel{margin-bottom:9px;padding:13px;border-radius:14px}.ux-mini-kpis{grid-template-columns:1fr 1fr}.ux-kanban{grid-template-columns:repeat(5,82vw)}.ux-order-summary{grid-template-columns:1fr 1fr}.ux-tr{grid-template-columns:1fr}.ux-report-bars{height:140px}.ux-fid-tabs{grid-template-columns:1fr 1fr}.ux-fid-config-host{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const sidebar=document.getElementById('uxSidebar');
  const nav=sidebar?.querySelector('.ux-nav');

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  const TITLES={fidelidad:['Fidelidad','Registra compras, canjea beneficios y administra el programa.'],envio:['Configurar envío','Tarifas, recargos y reglas de entrega.'],reportes:['Reportes','Indicadores de clientes, fidelidad y pedidos.'],ajustes:['Ajustes','Empresa, módulos y configuración general.']};

  function setTitle(view){
    const t=TITLES[view];if(!t)return;
    const h=document.querySelector('#uxTopbar .ux-title h1'),p=document.querySelector('#uxTopbar .ux-title p');
    if(h)h.textContent=t[0];if(p)p.textContent=t[1];
  }
  function setActive(view){
    document.querySelectorAll('#uxSidebar .ux-nav button').forEach(b=>b.classList.remove('active'));
    const map={fidelidad:'Fidelidad',envio:'Configurar envío',reportes:'Reportes',ajustes:'Ajustes'};
    [...document.querySelectorAll('#uxSidebar .ux-nav button')].find(b=>norm(b.textContent)===norm(map[view]))?.classList.add('active');
  }
  function showVirtual(view){
    try{sessionStorage.setItem('uai_admin_view',view)}catch(_){ }
    document.body.dataset.uxView=view;
    document.getElementById('uxEmptyView')?.classList.remove('show');
    setTitle(view);setActive(view);document.body.classList.remove('ux-drawer');window.scrollTo({top:0,behavior:'auto'});syncAll();
  }

  const anchor=document.querySelector('.main-container')||document.body.lastElementChild;
  const qr=document.createElement('section');qr.id='uxQrView';qr.className='ux-virtual-view';qr.innerHTML="\n<div class=\"ux-fid-tabs\" id=\"uxFidTabs\">\n  <button type=\"button\" data-fid-tab=\"register\" class=\"active\">Registrar compra</button>\n  <button type=\"button\" data-fid-tab=\"redeem\">Canjear recompensa</button>\n  <button type=\"button\" data-fid-tab=\"history\">Movimientos</button>\n  <button type=\"button\" data-fid-tab=\"missions\">Misiones</button>\n  <button type=\"button\" data-fid-tab=\"automations\">Automatizaciones</button>\n  <button type=\"button\" data-fid-tab=\"results\">Resultados</button>\n  <button type=\"button\" data-fid-tab=\"config\">Configuración</button>\n</div>\n<div class=\"ux-fid-pane active\" data-fid-pane=\"register\">\n  <div class=\"ux-section-grid\">\n    <div class=\"ux-panel ux-span-12\">\n      <h2>Registrar compra</h2>\n      <p>Identifica al cliente por teléfono, ID o QR y suma sus puntos.</p>\n      <div class=\"ux-caja-search\">\n        <input id=\"uxCajaLookup\" placeholder=\"Teléfono o ID del cliente\">\n        <button class=\"btn-secondary\" id=\"uxCajaScanner\">📷 QR</button>\n        <button class=\"btn-primary\" id=\"uxCajaBuscar\">BUSCAR</button>\n      </div>\n      <div class=\"ux-caja-client\" id=\"uxCajaClient\">\n        <div class=\"ux-caja-client-head\">\n          <div><h3 id=\"uxCajaName\">Cliente</h3><p id=\"uxCajaMeta\">—</p></div>\n          <div class=\"ux-caja-points\"><span id=\"uxCajaPoints\">0</span> pts</div>\n        </div>\n        <div class=\"ux-caja-purchase\">\n          <div><label>Valor de la compra (MXN)</label><input id=\"uxCajaPurchase\" type=\"number\" min=\"1\" step=\"0.01\" placeholder=\"Ej. 350\"></div>\n          <button class=\"btn-primary\" id=\"uxCajaConfirm\">REGISTRAR COMPRA</button>\n        </div>\n        <div class=\"ux-caja-preview\" id=\"uxCajaPreview\">Ingresa el valor de la compra.</div>\n        <div class=\"ux-fid-rule\"><b>Regla actual</b><small id=\"uxCajaRuleText\">Cargando regla de puntos…</small></div>\n        <div class=\"ux-caja-actions\">\n          <button class=\"btn-secondary\" id=\"uxCajaRewards\">🎁 Canjear recompensa</button>\n          <button class=\"btn-secondary\" id=\"uxCajaHistory\">🧾 Ver movimientos</button>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n<div class=\"ux-fid-pane\" data-fid-pane=\"redeem\">\n  <div class=\"ux-panel\">\n    <h2>Canjear recompensa</h2>\n    <p id=\"uxRedeemIntro\">Selecciona primero un cliente en Registrar compra.</p>\n    <div class=\"ux-caja-rewards\" id=\"uxCajaRewardsList\"><div class=\"ux-crm-empty\">Selecciona un cliente para ver las recompensas disponibles.</div></div>\n  </div>\n</div>\n<div class=\"ux-fid-pane\" data-fid-pane=\"history\">\n  <div class=\"ux-panel\">\n    <h2>Movimientos</h2>\n    <p id=\"uxFidHistoryIntro\">Consulta compras, puntos acreditados y canjes del cliente seleccionado.</p>\n    <div class=\"ux-actions-row\"><button class=\"btn-secondary\" id=\"uxFidHistoryRefresh\">ACTUALIZAR</button></div>\n    <div class=\"ux-fid-history\" id=\"uxFidHistoryList\"><div class=\"ux-crm-empty\">Selecciona un cliente en Registrar compra.</div></div>\n  </div>\n</div>\n<div class=\"ux-fid-pane\" data-fid-pane=\"missions\"><div id=\"uxFidMissionsHost\"></div></div>\n<div class=\"ux-fid-pane\" data-fid-pane=\"automations\"><div id=\"uxFidAutomationsHost\"></div></div>\n<div class=\"ux-fid-pane\" data-fid-pane=\"results\"><div id=\"uxFidResultsHost\"></div></div>\n<div class=\"ux-fid-pane\" data-fid-pane=\"config\">\n  <div class=\"ux-panel\">\n    <h2>Configuración de fidelidad</h2>\n    <p>Ajustes que no necesitas modificar durante la operación diaria.</p>\n    <div class=\"ux-fid-rule\"><b>Regla base de puntos</b><small>Actualmente: MX$10 = 1 punto. Los multiplicadores de Puntos Bonus se aplican sobre esta base.</small></div>\n    <div class=\"ux-fid-config-host\" id=\"uxFidelityConfigHost\"></div>\n  </div>\n</div>";
  anchor.parentNode.insertBefore(qr,anchor);

  const envio=document.createElement('section');envio.id='uxDeliverySettingsView';envio.className='ux-virtual-view';envio.innerHTML=`
    <div class="ux-section-grid">
      <div class="ux-panel ux-span-8"><h2>Tarifas por distancia</h2><p>Reglas actuales usadas por el checkout.</p><div class="ux-table"><div class="ux-tr"><b>0 – 2,5 km</b><span>Tarifa base</span><span class="ux-chip">$40</span></div><div class="ux-tr"><b>2,6 – 4 km</b><span>Tarifa 2</span><span class="ux-chip">$50</span></div><div class="ux-tr"><b>4,1 – 5,5 km</b><span>Tarifa 3</span><span class="ux-chip">$60</span></div><div class="ux-tr"><b>5,6 – 7 km</b><span>Tarifa 4</span><span class="ux-chip">$70</span></div><div class="ux-tr"><b>7,1 – 10 km</b><span>Tarifa 5</span><span class="ux-chip">$80</span></div><div class="ux-tr"><b>Más de 10 km</b><span>$10 por km iniciado</span><span class="ux-chip">$80 + extra</span></div></div></div>
      <div class="ux-panel ux-span-4"><h2>Recargos</h2><p>Condiciones especiales de la operación.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Bonfil</b><small>Recargo automático</small></div><span class="ux-toggle">+$20</span></div><div class="ux-setting"><div><b>Plaza comercial</b><small>Marcado en el checkout</small></div><span class="ux-toggle">+$20</span></div><div class="ux-setting"><div><b>Fuera de horario</b><small>08:00–23:00</small></div><span class="ux-toggle">+$20</span></div><div class="ux-setting"><div><b>Chuva</b><small>Controlado por configuración</small></div><span class="ux-toggle">+$10</span></div></div></div>
      <div class="ux-panel ux-span-12"><h2>Residenciales y acceso</h2><p>El checkout ya registra residencial, necesidad de QR e instrucciones de acceso. Esta área queda preparada para guardar reglas recurrentes por residencial.</p></div>
    </div>`;
  anchor.parentNode.insertBefore(envio,anchor);

  const reports=document.createElement('section');reports.id='uxReportsView';reports.className='ux-virtual-view';reports.innerHTML=`
    <div class="ux-section-grid">
      <div class="ux-panel ux-span-12"><h2>Visión del negocio</h2><p>Resumen con datos que ya existen en el sistema. Las métricas financieras avanzadas se activarán cuando haya historial consolidado suficiente.</p><div class="ux-mini-kpis"><div class="ux-mini-kpi"><small>Clientes</small><b id="uxRepClients">—</b></div><div class="ux-mini-kpi"><small>Pedidos activos</small><b id="uxRepActive">—</b></div><div class="ux-mini-kpi"><small>Recompensas</small><b id="uxRepRewards">—</b></div><div class="ux-mini-kpi"><small>Ofertas activas</small><b id="uxRepOffers">—</b></div></div></div>
      <div class="ux-panel ux-span-8"><h2>Actividad semanal</h2><p>Estructura visual preparada para ventas, pedidos y canjes.</p><div class="ux-report-bars"><i style="height:34%"></i><i style="height:48%"></i><i style="height:42%"></i><i style="height:61%"></i><i style="height:54%"></i><i style="height:78%"></i><i style="height:67%"></i></div><div class="ux-report-days"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div></div>
      <div class="ux-panel ux-span-4"><h2>Módulos</h2><p>Indicadores separados según los módulos contratados por cada empresa.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Fidelidad</b><small>Clientes, pontos, recompensas</small></div><span class="ux-toggle">Activo</span></div><div class="ux-setting"><div><b>Delivery</b><small>Pedidos, rotas e entrega</small></div><span class="ux-toggle">Activo</span></div></div></div>
    </div>`;
  anchor.parentNode.insertBefore(reports,anchor);

  const settings=document.createElement('section');settings.id='uxSettingsView';settings.className='ux-virtual-view';settings.innerHTML=`
    <div class="ux-section-grid">
      <div class="ux-panel ux-span-7"><h2>Empresa</h2><p>Base para personalización por empresa en el modelo SaaS.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Uai Sô · Cancún</b><small>Empresa activa</small></div><span class="ux-chip">Tenant</span></div><div class="ux-setting"><div><b>Identidad visual</b><small>Logo, colores y nombre por empresa</small></div><span class="ux-toggle">Preparado</span></div><div class="ux-setting"><div><b>Reglas de fidelidad</b><small>Puntos, níveis e recompensas</small></div><span class="ux-toggle">Activo</span></div><div class="ux-setting"><div><b>Delivery</b><small>Módulo adicional contratado</small></div><span class="ux-toggle">Activo</span></div></div></div>
      <div class="ux-panel ux-span-5"><h2>Seguridad y operación</h2><p>Elementos que deben activarse antes del lanzamiento comercial.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Contraseña del dashboard</b><small>Desactivada solo en Preview</small></div><span class="ux-toggle off">Preview</span></div><div class="ux-setting"><div><b>Producción</b><small>No modificada por estos cambios</small></div><span class="ux-toggle">Protegida</span></div><div class="ux-setting"><div><b>Logs</b><small>Diagnóstico disponible</small></div><span class="ux-toggle">Activo</span></div></div></div>
      <div class="ux-panel ux-span-12"><h2>Opiniones y Google Reviews</h2><p>Configuración de solicitudes de reseña.</p><div id="uxSettingsReviewsHost"></div></div>
    </div>`;
  anchor.parentNode.insertBefore(settings,anchor);

  let orders=null;
  function ensureOrders(){
    orders=document.getElementById('ordersAdmin');
    return orders;
  }

  function getStatus(card){
    const t=norm(card.querySelector('.order-status')?.textContent||'');
    if(t.includes('enviado'))return'received';if(t.includes('acept'))return'accepted';if(t.includes('prepar'))return'preparing';if(t.includes('repartidor'))return'waiting';if(t.includes('salio')||t.includes('salió'))return'out';if(t.includes('entregado'))return'delivered';if(t.includes('cancel'))return'cancelled';return'other';
  }
  let lastOrderSignature='';
  let lastOrderView='';
  function buildKanban(force=false){
    if(!ensureOrders())return;
    const source=orders.querySelector('#ordersAdminList');
    if(!source)return;
    let board=document.getElementById('uxKanbanBoard');
    if(!board){board=document.createElement('div');board.id='uxKanbanBoard';orders.querySelector('.orders-card')?.prepend(board)}
    const cards=[...source.querySelectorAll('.order-admin')];
    const view=document.body.dataset.uxView||'';
    const signature=cards.map(card=>(card.dataset.id||'')+':'+getStatus(card)).join('|');
    if(!force && signature===lastOrderSignature && view===lastOrderView)return;
    lastOrderSignature=signature;lastOrderView=view;
    const defs=[['received','Enviado'],['accepted','Aceptado'],['preparing','Preparación'],['waiting','Repartidor'],['out','En ruta']];
    board.innerHTML='<div class="ux-order-summary">'+defs.map(([k,l])=>'<div><small>'+l+'</small><b data-sum="'+k+'">0</b></div>').join('')+'</div><div class="ux-kanban">'+defs.map(([k,l])=>'<section class="ux-kanban-col"><div class="ux-kanban-head"><span>'+l+'</span><span class="ux-kanban-count" data-count="'+k+'">0</span></div><div class="ux-kanban-list" data-col="'+k+'"></div></section>').join('')+'</div>';
    cards.forEach(card=>{
      const s=getStatus(card),col=board.querySelector('[data-col="'+s+'"]');
      if(!col)return;
      const clone=card.cloneNode(true);clone.classList.add('ux-kanban-clone');
      clone.querySelectorAll('button[data-status]').forEach(btn=>{
        btn.onclick=()=>{
          const original=source.querySelector('.order-admin[data-id="'+CSS.escape(card.dataset.id||'')+'"] button[data-status="'+btn.dataset.status+'"]');
          original?.click();
        };
      });
      col.appendChild(clone);
    });
    defs.forEach(([k])=>{
      const n=board.querySelectorAll('[data-col="'+k+'"] .order-admin').length;
      const a=board.querySelector('[data-count="'+k+'"]'),b=board.querySelector('[data-sum="'+k+'"]');
      if(a)a.textContent=n;if(b)b.textContent=n;
    });
    source.style.display='none';
  }
  function configureOrdersView(force=false){
    if(!ensureOrders())return;
    const view=document.body.dataset.uxView;
    const title=orders.querySelector('.orders-head h3');
    if(view==='pedidos'||view==='entregas'){
      if(title)title.textContent=view==='pedidos'?'🧾 Pedidos':'🛵 Entregas';
      buildKanban(force);
      const cols=document.querySelectorAll('#uxKanbanBoard .ux-kanban-col');
      cols.forEach((col,i)=>{col.style.opacity=view==='entregas'&&i<2?'.55':'1'});
    }
  }

  function numText(id){const t=document.getElementById(id)?.textContent||'';const m=t.replace(/\./g,'').match(/\d+/);return m?m[0]:'—'}
  function moveSettingsCards(){
    const host=document.getElementById('uxSettingsReviewsHost');
    const reviews=document.getElementById('reviewsConfigAdminCard');
    if(host&&reviews&&reviews.parentElement!==host)host.appendChild(reviews);
  }

  function syncAll(){
    moveSettingsCards();
    const clients=numText('totalClientes');
    const rewards=document.querySelectorAll('#listaRecompensas .reward-item').length;
    const offers=document.querySelectorAll('#listaPromos .promo-item').length;
    const active=document.querySelectorAll('#ordersAdminList .order-admin.active').length;
    const current=document.getElementById('clienteNome')?.textContent?.trim()||'—';
    const points=numText('clientePuntos');
    [['uxRepClients',clients],['uxRepRewards',rewards],['uxRepOffers',offers],['uxRepActive',active]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=String(v)});
    configureOrdersView();
  }


  let fidPesosPorPunto=10;
  async function loadFidelityBaseRule(){
    try{
      const r=await fetch('/api/sendpush?config=loyalty_base&t='+Date.now(),{cache:'no-store'});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||'Error');
      fidPesosPorPunto=Math.max(1,Number(d.config?.pesos_por_punto||10));
    }catch(_){fidPesosPorPunto=10}
    const txt=document.getElementById('uxCajaRuleText');
    if(txt)txt.textContent='MX
    const valid=['register','redeem','history','missions','automations','results','config'];
    if(!valid.includes(tab))tab='register';
    document.querySelectorAll('#uxFidTabs [data-fid-tab]').forEach(b=>b.classList.toggle('active',b.dataset.fidTab===tab));
    document.querySelectorAll('#uxQrView [data-fid-pane]').forEach(p=>p.classList.toggle('active',p.dataset.fidPane===tab));
    try{sessionStorage.setItem('uai_fidelity_tab',tab)}catch(_){}
    if(tab==='redeem')cajaLoadRewards();
    if(tab==='history')loadFidelityHistory();
    if(tab==='missions'&&typeof window.loadFidMissions==='function')window.loadFidMissions();
    if(tab==='automations'&&typeof window.loadFidAutomations==='function')window.loadFidAutomations();
    if(tab==='results'&&typeof window.loadFidResults==='function')window.loadFidResults();
    if(tab==='config'){mountFidelityConfig();loadFidelityBaseRule();}
    if(tab==='register')loadFidelityBaseRule();
  }

  function mountFidelityConfig(){
    const host=document.getElementById('uxFidelityConfigHost');
    if(!host)return;
    ['nivelesVipAdminCard','bonusPontosAdminCard','referidosAdminCard'].forEach(id=>{
      const card=document.getElementById(id);
      if(card&&card.parentNode!==host)host.appendChild(card);
    });
  }

  async function loadFidelityHistory(){
    const box=document.getElementById('uxFidHistoryList');
    const intro=document.getElementById('uxFidHistoryIntro');
    if(!box)return;
    let client=null;
    try{client=typeof clienteSelecionado!=='undefined'?clienteSelecionado:null}catch(_){}
    if(!client?.uid){
      box.innerHTML='<div class="ux-crm-empty">Selecciona un cliente en Registrar compra.</div>';
      if(intro)intro.textContent='Consulta compras, puntos acreditados y canjes del cliente seleccionado.';
      return;
    }
    if(intro)intro.textContent=(client.nome||'Cliente')+' · '+(client.telefone||client.uid);
    box.innerHTML='<div class="ux-crm-empty">Cargando movimientos…</div>';
    try{
      const res=await fetch('/api/historico?uid='+encodeURIComponent(client.uid)+'&t='+Date.now(),{cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Error');
      const items=Array.isArray(data.transacoes)?data.transacoes:[];
      box.innerHTML=items.length?items.map(item=>{
        const sign=String(item.tipo||'').toLowerCase()==='debito'?'-':'+';
        const dt=item.data?new Date(item.data).toLocaleString('es-MX'):'';
        return '<div class="historico-item"><div class="historico-top"><strong>'+sign+Number(item.pontos||0)+' puntos</strong><span>'+dt+'</span></div><div>Compra: $'+Number(item.valor_compra||0).toLocaleString('es-MX',{maximumFractionDigits:2})+' MXN</div><div style="font-size:12px;color:#777">Saldo: '+Number(item.saldo_anterior||0)+' → '+Number(item.saldo_novo||0)+'</div></div>';
      }).join(''):'<div class="ux-crm-empty">Sin movimientos.</div>';
    }catch(_){box.innerHTML='<div class="ux-crm-empty">No se pudieron cargar los movimientos.</div>'}
  }

  document.getElementById('uxFidTabs').addEventListener('click',e=>{
    const b=e.target.closest('[data-fid-tab]');
    if(b)showFidTab(b.dataset.fidTab);
  });

  async function cajaSelectClient(value){
    const input=document.getElementById('clienteUid');
    if(!input||typeof buscarCliente!=='function')return false;
    input.value=String(value||'').trim();
    if(!input.value)return false;
    await buscarCliente();
    if(typeof clienteSelecionado==='undefined'||!clienteSelecionado)return false;
    document.getElementById('uxCajaName').textContent=clienteSelecionado.nome||'Sin nombre';
    document.getElementById('uxCajaMeta').textContent=(clienteSelecionado.telefone||'Sin teléfono')+' · '+(clienteSelecionado.uid||'');
    document.getElementById('uxCajaPoints').textContent=String(Number(clienteSelecionado.pontos||0));
    document.getElementById('uxCajaClient').classList.add('show');
    const intro=document.getElementById('uxRedeemIntro');if(intro)intro.textContent=(clienteSelecionado.nome||'Cliente')+' · '+Number(clienteSelecionado.pontos||0)+' puntos disponibles';
    return true;
  }

  async function cajaLoadRewards(){
    const box=document.getElementById('uxCajaRewardsList');
    box.classList.add('show');
    box.innerHTML='<div class="ux-crm-empty">Cargando recompensas…</div>';
    try{
      const res=await fetch('/api/recompensas?t='+Date.now(),{cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Error');
      const items=(Array.isArray(data.recompensas)?data.recompensas:[]).filter(i=>i.ativa!==false);
      box.innerHTML=items.length?items.map(i=>
        '<div class="ux-caja-reward"><div><b>'+String(i.nome||'Recompensa')+'</b><small>'+Number(i.pontos||0)+' pts</small></div>'+
        '<button class="btn-success" data-caja-redeem="'+String(i.id)+'" data-name="'+String(i.nome||'Recompensa').replace(/"/g,'&quot;')+'" data-points="'+Number(i.pontos||0)+'">CANJEAR</button></div>'
      ).join(''):'<div class="ux-crm-empty">No hay recompensas activas.</div>';
      box.querySelectorAll('[data-caja-redeem]').forEach(btn=>{
        btn.onclick=async()=>{
          if(typeof window.resgatarRecompensa!=='function')return alert('No se pudo abrir el canje.');
          await window.resgatarRecompensa(btn.dataset.cajaRedeem,btn.dataset.name,Number(btn.dataset.points),btn);
          if(typeof clienteSelecionado!=='undefined'&&clienteSelecionado){
            document.getElementById('uxCajaPoints').textContent=String(Number(clienteSelecionado.pontos||0));
          }
        };
      });
    }catch(_){box.innerHTML='<div class="ux-crm-empty">No se pudieron cargar las recompensas.</div>'}
  }

  window.openCajaFidelidadForClient=async function(uid){
    showVirtual('fidelidad');
    showFidTab('register');
    document.getElementById('uxCajaLookup').value=uid||'';
    await cajaSelectClient(uid);
    setTimeout(()=>document.getElementById('uxCajaPurchase')?.focus(),50);
  };

  document.getElementById('uxCajaBuscar').onclick=()=>cajaSelectClient(document.getElementById('uxCajaLookup').value);
  document.getElementById('uxCajaLookup').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('uxCajaBuscar').click()});
  document.getElementById('uxCajaScanner').onclick=()=>{if(typeof abrirScannerQr==='function')abrirScannerQr()};
  document.getElementById('uxCajaPurchase').addEventListener('input',e=>{
    const amount=Number(e.target.value||0);
    document.getElementById('uxCajaPreview').textContent=amount>0?'⭐ '+Math.floor(amount/fidPesosPorPunto)+' puntos base':'Ingresa el valor de la compra.';
  });
  document.getElementById('uxCajaConfirm').onclick=async()=>{
    if(typeof clienteSelecionado==='undefined'||!clienteSelecionado)return alert('Primero identifica al cliente.');
    const amount=Number(document.getElementById('uxCajaPurchase').value||0);
    if(!amount||amount<=0)return alert('Ingresa un valor de compra válido.');
    const hidden=document.getElementById('valorCompra');
    if(hidden)hidden.value=String(amount);
    if(typeof calcularPontosCompra==='function')calcularPontosCompra();
    if(typeof creditarPontos!=='function')return alert('No se pudo registrar la compra.');
    await creditarPontos();
    document.getElementById('uxCajaPurchase').value='';
    document.getElementById('uxCajaPreview').textContent='Compra registrada.';
    document.getElementById('uxCajaPoints').textContent=String(Number(clienteSelecionado.pontos||0));
    document.getElementById('uxQrPoints').textContent=String(Number(clienteSelecionado.pontos||0));
  };
  document.getElementById('uxCajaRewards').onclick=()=>showFidTab('redeem');
  document.getElementById('uxCajaHistory').onclick=()=>showFidTab('history');
  document.getElementById('uxFidHistoryRefresh').onclick=loadFidelityHistory;

  document.addEventListener('click',e=>{
    const b=e.target.closest('#uxSidebar .ux-nav button');if(!b)return;
    const txt=norm(b.textContent);
    let view=null;
    if(txt==='fidelidad'||txt==='programa de fidelidad')view='fidelidad';
    else if(txt==='configurar envio')view='envio';
    else if(txt==='reportes')view='reportes';
    else if(txt==='ajustes')view='ajustes';
    if(view){e.preventDefault();e.stopImmediatePropagation();showVirtual(view)}
  },true);

  const attr=new MutationObserver(()=>{
    const v=document.body.dataset.uxView;
    if(v==='pedidos'||v==='entregas'){
      lastOrderView='';
      setTimeout(()=>configureOrdersView(true),30);
    }
  });
  attr.observe(document.body,{attributes:true,attributeFilter:['data-ux-view']});
  setInterval(syncAll,2000);
  setTimeout(syncAll,250);
  setTimeout(loadFidelityBaseRule,320);
  setTimeout(mountFidelityConfig,260);
  setTimeout(()=>{let saved='';try{saved=sessionStorage.getItem('uai_admin_view')||''}catch(_){ }if(['fidelidad','envio','reportes','ajustes'].includes(saved)){showVirtual(saved);if(saved==='fidelidad'){let tab='register';try{tab=sessionStorage.getItem('uai_fidelity_tab')||'register'}catch(_){}showFidTab(tab)}}},180);
})();+fidPesosPorPunto+' de compra = 1 punto base. Los Puntos Bonus pueden multiplicar este valor.';
    const amount=Number(document.getElementById('uxCajaPurchase')?.value||0);
    const prev=document.getElementById('uxCajaPreview');
    if(prev&&amount>0)prev.textContent='⭐ '+Math.floor(amount/fidPesosPorPunto)+' puntos base';
  }

  function showFidTab(tab){
    const valid=['register','redeem','history','missions','automations','results','config'];
    if(!valid.includes(tab))tab='register';
    document.querySelectorAll('#uxFidTabs [data-fid-tab]').forEach(b=>b.classList.toggle('active',b.dataset.fidTab===tab));
    document.querySelectorAll('#uxQrView [data-fid-pane]').forEach(p=>p.classList.toggle('active',p.dataset.fidPane===tab));
    try{sessionStorage.setItem('uai_fidelity_tab',tab)}catch(_){}
    if(tab==='redeem')cajaLoadRewards();
    if(tab==='history')loadFidelityHistory();
    if(tab==='missions'&&typeof window.loadFidMissions==='function')window.loadFidMissions();
    if(tab==='automations'&&typeof window.loadFidAutomations==='function')window.loadFidAutomations();
    if(tab==='results'&&typeof window.loadFidResults==='function')window.loadFidResults();
    if(tab==='config')mountFidelityConfig();
  }

  function mountFidelityConfig(){
    const host=document.getElementById('uxFidelityConfigHost');
    if(!host)return;
    ['nivelesVipAdminCard','bonusPontosAdminCard','referidosAdminCard'].forEach(id=>{
      const card=document.getElementById(id);
      if(card&&card.parentNode!==host)host.appendChild(card);
    });
  }

  async function loadFidelityHistory(){
    const box=document.getElementById('uxFidHistoryList');
    const intro=document.getElementById('uxFidHistoryIntro');
    if(!box)return;
    let client=null;
    try{client=typeof clienteSelecionado!=='undefined'?clienteSelecionado:null}catch(_){}
    if(!client?.uid){
      box.innerHTML='<div class="ux-crm-empty">Selecciona un cliente en Registrar compra.</div>';
      if(intro)intro.textContent='Consulta compras, puntos acreditados y canjes del cliente seleccionado.';
      return;
    }
    if(intro)intro.textContent=(client.nome||'Cliente')+' · '+(client.telefone||client.uid);
    box.innerHTML='<div class="ux-crm-empty">Cargando movimientos…</div>';
    try{
      const res=await fetch('/api/historico?uid='+encodeURIComponent(client.uid)+'&t='+Date.now(),{cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Error');
      const items=Array.isArray(data.transacoes)?data.transacoes:[];
      box.innerHTML=items.length?items.map(item=>{
        const sign=String(item.tipo||'').toLowerCase()==='debito'?'-':'+';
        const dt=item.data?new Date(item.data).toLocaleString('es-MX'):'';
        return '<div class="historico-item"><div class="historico-top"><strong>'+sign+Number(item.pontos||0)+' puntos</strong><span>'+dt+'</span></div><div>Compra: $'+Number(item.valor_compra||0).toLocaleString('es-MX',{maximumFractionDigits:2})+' MXN</div><div style="font-size:12px;color:#777">Saldo: '+Number(item.saldo_anterior||0)+' → '+Number(item.saldo_novo||0)+'</div></div>';
      }).join(''):'<div class="ux-crm-empty">Sin movimientos.</div>';
    }catch(_){box.innerHTML='<div class="ux-crm-empty">No se pudieron cargar los movimientos.</div>'}
  }

  document.getElementById('uxFidTabs').addEventListener('click',e=>{
    const b=e.target.closest('[data-fid-tab]');
    if(b)showFidTab(b.dataset.fidTab);
  });

  async function cajaSelectClient(value){
    const input=document.getElementById('clienteUid');
    if(!input||typeof buscarCliente!=='function')return false;
    input.value=String(value||'').trim();
    if(!input.value)return false;
    await buscarCliente();
    if(typeof clienteSelecionado==='undefined'||!clienteSelecionado)return false;
    document.getElementById('uxCajaName').textContent=clienteSelecionado.nome||'Sin nombre';
    document.getElementById('uxCajaMeta').textContent=(clienteSelecionado.telefone||'Sin teléfono')+' · '+(clienteSelecionado.uid||'');
    document.getElementById('uxCajaPoints').textContent=String(Number(clienteSelecionado.pontos||0));
    document.getElementById('uxCajaClient').classList.add('show');
    const intro=document.getElementById('uxRedeemIntro');if(intro)intro.textContent=(clienteSelecionado.nome||'Cliente')+' · '+Number(clienteSelecionado.pontos||0)+' puntos disponibles';
    return true;
  }

  async function cajaLoadRewards(){
    const box=document.getElementById('uxCajaRewardsList');
    box.classList.add('show');
    box.innerHTML='<div class="ux-crm-empty">Cargando recompensas…</div>';
    try{
      const res=await fetch('/api/recompensas?t='+Date.now(),{cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Error');
      const items=(Array.isArray(data.recompensas)?data.recompensas:[]).filter(i=>i.ativa!==false);
      box.innerHTML=items.length?items.map(i=>
        '<div class="ux-caja-reward"><div><b>'+String(i.nome||'Recompensa')+'</b><small>'+Number(i.pontos||0)+' pts</small></div>'+
        '<button class="btn-success" data-caja-redeem="'+String(i.id)+'" data-name="'+String(i.nome||'Recompensa').replace(/"/g,'&quot;')+'" data-points="'+Number(i.pontos||0)+'">CANJEAR</button></div>'
      ).join(''):'<div class="ux-crm-empty">No hay recompensas activas.</div>';
      box.querySelectorAll('[data-caja-redeem]').forEach(btn=>{
        btn.onclick=async()=>{
          if(typeof window.resgatarRecompensa!=='function')return alert('No se pudo abrir el canje.');
          await window.resgatarRecompensa(btn.dataset.cajaRedeem,btn.dataset.name,Number(btn.dataset.points),btn);
          if(typeof clienteSelecionado!=='undefined'&&clienteSelecionado){
            document.getElementById('uxCajaPoints').textContent=String(Number(clienteSelecionado.pontos||0));
          }
        };
      });
    }catch(_){box.innerHTML='<div class="ux-crm-empty">No se pudieron cargar las recompensas.</div>'}
  }

  window.openCajaFidelidadForClient=async function(uid){
    showVirtual('fidelidad');
    showFidTab('register');
    document.getElementById('uxCajaLookup').value=uid||'';
    await cajaSelectClient(uid);
    setTimeout(()=>document.getElementById('uxCajaPurchase')?.focus(),50);
  };

  document.getElementById('uxCajaBuscar').onclick=()=>cajaSelectClient(document.getElementById('uxCajaLookup').value);
  document.getElementById('uxCajaLookup').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('uxCajaBuscar').click()});
  document.getElementById('uxCajaScanner').onclick=()=>{if(typeof abrirScannerQr==='function')abrirScannerQr()};
  document.getElementById('uxCajaPurchase').addEventListener('input',e=>{
    const amount=Number(e.target.value||0);
    document.getElementById('uxCajaPreview').textContent=amount>0?'⭐ '+Math.floor(amount/10)+' puntos':'Ingresa el valor de la compra.';
  });
  document.getElementById('uxCajaConfirm').onclick=async()=>{
    if(typeof clienteSelecionado==='undefined'||!clienteSelecionado)return alert('Primero identifica al cliente.');
    const amount=Number(document.getElementById('uxCajaPurchase').value||0);
    if(!amount||amount<=0)return alert('Ingresa un valor de compra válido.');
    const hidden=document.getElementById('valorCompra');
    if(hidden)hidden.value=String(amount);
    if(typeof calcularPontosCompra==='function')calcularPontosCompra();
    if(typeof creditarPontos!=='function')return alert('No se pudo registrar la compra.');
    await creditarPontos();
    document.getElementById('uxCajaPurchase').value='';
    document.getElementById('uxCajaPreview').textContent='Compra registrada.';
    document.getElementById('uxCajaPoints').textContent=String(Number(clienteSelecionado.pontos||0));
    document.getElementById('uxQrPoints').textContent=String(Number(clienteSelecionado.pontos||0));
  };
  document.getElementById('uxCajaRewards').onclick=()=>showFidTab('redeem');
  document.getElementById('uxCajaHistory').onclick=()=>showFidTab('history');
  document.getElementById('uxFidHistoryRefresh').onclick=loadFidelityHistory;

  document.addEventListener('click',e=>{
    const b=e.target.closest('#uxSidebar .ux-nav button');if(!b)return;
    const txt=norm(b.textContent);
    let view=null;
    if(txt==='fidelidad'||txt==='programa de fidelidad')view='fidelidad';
    else if(txt==='configurar envio')view='envio';
    else if(txt==='reportes')view='reportes';
    else if(txt==='ajustes')view='ajustes';
    if(view){e.preventDefault();e.stopImmediatePropagation();showVirtual(view)}
  },true);

  const attr=new MutationObserver(()=>{
    const v=document.body.dataset.uxView;
    if(v==='pedidos'||v==='entregas'){
      lastOrderView='';
      setTimeout(()=>configureOrdersView(true),30);
    }
  });
  attr.observe(document.body,{attributes:true,attributeFilter:['data-ux-view']});
  setInterval(syncAll,2000);
  setTimeout(syncAll,250);
  setTimeout(mountFidelityConfig,260);
  setTimeout(()=>{let saved='';try{saved=sessionStorage.getItem('uai_admin_view')||''}catch(_){ }if(['fidelidad','envio','reportes','ajustes'].includes(saved)){showVirtual(saved);if(saved==='fidelidad'){let tab='register';try{tab=sessionStorage.getItem('uai_fidelity_tab')||'register'}catch(_){}showFidTab(tab)}}},180);
})();