(() => {
  if (document.getElementById('uxFinalModulesV7Styles')) return;

  const style=document.createElement('style');
  style.id='uxFinalModulesV7Styles';
  style.textContent=`
    .ux-virtual-view{display:none;max-width:1280px;margin:0 auto}
    body[data-ux-view="qr"] #uxQrView,
    body[data-ux-view="envio"] #uxDeliverySettingsView,
    body[data-ux-view="reportes"] #uxReportsView,
    body[data-ux-view="ajustes"] #uxSettingsView{display:block}

    body[data-ux-view="qr"] .main-container,
    body[data-ux-view="qr"] #ordersAdmin,
    body[data-ux-view="envio"] .main-container,
    body[data-ux-view="envio"] #ordersAdmin,
    body[data-ux-view="reportes"] .main-container,
    body[data-ux-view="reportes"] #ordersAdmin,
    body[data-ux-view="ajustes"] .main-container,
    body[data-ux-view="ajustes"] #ordersAdmin{display:none!important}

    .ux-section-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}
    .ux-panel{background:#fff;border:1px solid #ebe4ee;border-radius:16px;padding:16px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-panel h2{margin:0;color:#302438;font-size:16px}.ux-panel p{margin:5px 0 0;color:#897d8f;font-size:10px;line-height:1.45}
    .ux-span-12{grid-column:span 12}.ux-span-8{grid-column:span 8}.ux-span-7{grid-column:span 7}.ux-span-6{grid-column:span 6}.ux-span-5{grid-column:span 5}.ux-span-4{grid-column:span 4}
    .ux-mini-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
    .ux-mini-kpi{background:#faf8fb;border:1px solid #eee7f1;border-radius:11px;padding:10px}
    .ux-mini-kpi small{display:block;font-size:8px;color:#897d8f}.ux-mini-kpi b{display:block;font-size:19px;color:#6a0dad;margin-top:3px}
    .ux-table{display:grid;gap:7px;margin-top:12px}.ux-tr{display:grid;grid-template-columns:1.3fr 1fr .8fr;gap:8px;padding:9px 10px;border:1px solid #eee7f1;border-radius:10px;background:#faf8fb;font-size:10px;align-items:center}.ux-tr b{font-size:10px}
    .ux-chip{display:inline-flex;padding:4px 7px;border-radius:999px;background:#f1e7f8;color:#6a0dad;font-size:8px;font-weight:900}
    .ux-actions-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.ux-actions-row button{width:auto!important;padding:9px 11px!important;font-size:10px!important}
    .ux-kanban{display:grid;grid-template-columns:repeat(5,minmax(210px,1fr));gap:10px;overflow-x:auto;padding-bottom:4px}
    .ux-kanban-col{background:#f8f5fa;border:1px solid #eee7f1;border-radius:14px;min-height:240px;padding:9px}
    .ux-kanban-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:10px;font-weight:900;color:#49364f}.ux-kanban-count{background:#fff;border:1px solid #e8dfec;border-radius:999px;padding:3px 6px;color:#6a0dad}
    .ux-kanban-list{display:grid;gap:8px}.ux-kanban-list .order-admin{margin:0!important;padding:10px!important;border-left-width:4px!important}.ux-kanban-list .order-items,.ux-kanban-list .order-delivery{display:none}.ux-kanban-list .order-meta{font-size:10px}.ux-kanban-list .order-actions button{min-width:0!important;font-size:9px!important;padding:8px!important}
    .ux-order-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:0 0 12px}
    .ux-order-summary div{background:#fff;border:1px solid #ebe4ee;border-radius:12px;padding:10px}.ux-order-summary small{display:block;font-size:8px;color:#8b7f91}.ux-order-summary b{font-size:18px;color:#5d148f}
    .ux-delivery-note{background:#fff8e5;border:1px solid #f0dfaa;border-radius:11px;padding:10px;font-size:10px;color:#66520a;margin-top:10px}
    .ux-report-bars{height:190px;display:flex;align-items:flex-end;gap:10px;padding:15px 8px 6px;border-bottom:1px solid #eee7f1;margin-top:8px}.ux-report-bars i{flex:1;background:linear-gradient(#c69aef,#7a2bd2);border-radius:8px 8px 2px 2px;min-width:18px}.ux-report-days{display:grid;grid-template-columns:repeat(7,1fr);font-size:8px;text-align:center;color:#887c8e;margin-top:5px}
    .ux-settings-list{display:grid;gap:8px;margin-top:12px}.ux-setting{display:flex;justify-content:space-between;gap:10px;padding:11px;border:1px solid #eee7f1;border-radius:11px;background:#faf8fb}.ux-setting b{font-size:10px}.ux-setting small{display:block;color:#887c8e;font-size:8px;margin-top:2px}
    .ux-toggle{font-size:8px;font-weight:900;padding:5px 8px;border-radius:999px;background:#e9f8ef;color:#188b4f;align-self:center}
    .ux-toggle.off{background:#f3f3f3;color:#888}
    .ux-qr-box{display:grid;place-items:center;min-height:210px;background:linear-gradient(135deg,#faf7fc,#f0e7f7);border:1px dashed #d9c6e5;border-radius:14px;margin-top:12px}.ux-qr-box .icon{font-size:64px}.ux-qr-box b{display:block;text-align:center;font-size:13px}.ux-qr-box small{display:block;text-align:center;color:#887c8e;font-size:9px;margin-top:5px}

    @media(max-width:1000px){.ux-span-8,.ux-span-7,.ux-span-6,.ux-span-5,.ux-span-4{grid-column:span 12}.ux-mini-kpis{grid-template-columns:repeat(2,1fr)}.ux-order-summary{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:780px){.ux-section-grid{display:block}.ux-panel{margin-bottom:9px;padding:13px;border-radius:14px}.ux-mini-kpis{grid-template-columns:1fr 1fr}.ux-kanban{grid-template-columns:repeat(5,82vw)}.ux-order-summary{grid-template-columns:1fr 1fr}.ux-tr{grid-template-columns:1fr}.ux-report-bars{height:140px}}
  `;
  document.head.appendChild(style);

  const sidebar=document.getElementById('uxSidebar');
  const nav=sidebar?.querySelector('.ux-nav');
  if(nav && ![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('QR / Validación'))){
    const fidelidadBtn=[...nav.querySelectorAll('button')].find(b=>b.textContent.includes('Fidelidad'));
    if(fidelidadBtn){
      const qr=document.createElement('button');
      qr.innerHTML='<span>▦</span>QR / Validación';
      qr.dataset.uxCustom='qr';
      fidelidadBtn.insertAdjacentElement('afterend',qr);
    }
  }

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  const TITLES={qr:['QR / Validación','Escanea, valida y consulta movimientos de fidelidad.'],envio:['Configurar envío','Tarifas, recargos y reglas de entrega.'],reportes:['Relatórios','Indicadores de clientes, fidelidad y pedidos.'],ajustes:['Ajustes','Empresa, módulos y configuración general.']};

  function setTitle(view){
    const t=TITLES[view];if(!t)return;
    const h=document.querySelector('#uxTopbar .ux-title h1'),p=document.querySelector('#uxTopbar .ux-title p');
    if(h)h.textContent=t[0];if(p)p.textContent=t[1];
  }
  function setActive(view){
    document.querySelectorAll('#uxSidebar .ux-nav button').forEach(b=>b.classList.remove('active'));
    const map={qr:'QR / Validación',envio:'Configurar envío',reportes:'Relatórios',ajustes:'Ajustes'};
    [...document.querySelectorAll('#uxSidebar .ux-nav button')].find(b=>norm(b.textContent)===norm(map[view]))?.classList.add('active');
  }
  function showVirtual(view){
    document.body.dataset.uxView=view;setTitle(view);setActive(view);document.body.classList.remove('ux-drawer');window.scrollTo({top:0,behavior:'auto'});syncAll();
  }

  const anchor=document.querySelector('.main-container')||document.body.lastElementChild;
  const qr=document.createElement('section');qr.id='uxQrView';qr.className='ux-virtual-view';qr.innerHTML=`
    <div class="ux-section-grid">
      <div class="ux-panel ux-span-7"><h2>Validação rápida</h2><p>Escaneie o QR do cliente para abrir seu cadastro, saldo e histórico.</p><div class="ux-qr-box"><div><div class="icon">▦</div><b>Scanner QR</b><small>Usa a câmera do dispositivo</small></div></div><div class="ux-actions-row"><button class="btn-primary" id="uxOpenScanner">📷 ABRIR SCANNER</button><button class="btn-secondary" id="uxGoClient">Buscar cliente</button></div></div>
      <div class="ux-panel ux-span-5"><h2>Resumo de fidelidade</h2><p>Acesso rápido às principais ações do balcão.</p><div class="ux-mini-kpis"><div class="ux-mini-kpi"><small>Clientes</small><b id="uxQrClients">—</b></div><div class="ux-mini-kpi"><small>Recompensas</small><b id="uxQrRewards">—</b></div><div class="ux-mini-kpi"><small>Cliente atual</small><b id="uxQrCurrent">—</b></div><div class="ux-mini-kpi"><small>Saldo atual</small><b id="uxQrPoints">—</b></div></div><div class="ux-delivery-note">A validação continua usando as funções atuais do sistema; esta tela só organiza melhor a operação.</div></div>
    </div>`;
  anchor.parentNode.insertBefore(qr,anchor);

  const envio=document.createElement('section');envio.id='uxDeliverySettingsView';envio.className='ux-virtual-view';envio.innerHTML=`
    <div class="ux-section-grid">
      <div class="ux-panel ux-span-8"><h2>Tarifas por distância</h2><p>Regras atuais usadas pelo checkout.</p><div class="ux-table"><div class="ux-tr"><b>0 – 2,5 km</b><span>Faixa base</span><span class="ux-chip">$40</span></div><div class="ux-tr"><b>2,6 – 4 km</b><span>Faixa 2</span><span class="ux-chip">$50</span></div><div class="ux-tr"><b>4,1 – 5,5 km</b><span>Faixa 3</span><span class="ux-chip">$60</span></div><div class="ux-tr"><b>5,6 – 7 km</b><span>Faixa 4</span><span class="ux-chip">$70</span></div><div class="ux-tr"><b>7,1 – 10 km</b><span>Faixa 5</span><span class="ux-chip">$80</span></div><div class="ux-tr"><b>Acima de 10 km</b><span>$10 por km iniciado</span><span class="ux-chip">$80 + extra</span></div></div></div>
      <div class="ux-panel ux-span-4"><h2>Recargos</h2><p>Condições especiais da operação.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Bonfil</b><small>Recargo automático</small></div><span class="ux-toggle">+$20</span></div><div class="ux-setting"><div><b>Plaza comercial</b><small>Marcado no checkout</small></div><span class="ux-toggle">+$20</span></div><div class="ux-setting"><div><b>Fora do horário</b><small>08:00–23:00</small></div><span class="ux-toggle">+$20</span></div><div class="ux-setting"><div><b>Chuva</b><small>Controlado por configuração</small></div><span class="ux-toggle">+$10</span></div></div></div>
      <div class="ux-panel ux-span-12"><h2>Residenciais e acesso</h2><p>O checkout já registra residencial, necessidade de QR e instruções de acesso. Esta área fica preparada para futuramente salvar regras recorrentes por residencial.</p></div>
    </div>`;
  anchor.parentNode.insertBefore(envio,anchor);

  const reports=document.createElement('section');reports.id='uxReportsView';reports.className='ux-virtual-view';reports.innerHTML=`
    <div class="ux-section-grid">
      <div class="ux-panel ux-span-12"><h2>Visão do negócio</h2><p>Resumo com dados que já existem no sistema. Métricas financeiras avançadas entram quando houver histórico consolidado suficiente.</p><div class="ux-mini-kpis"><div class="ux-mini-kpi"><small>Clientes</small><b id="uxRepClients">—</b></div><div class="ux-mini-kpi"><small>Pedidos ativos</small><b id="uxRepActive">—</b></div><div class="ux-mini-kpi"><small>Recompensas</small><b id="uxRepRewards">—</b></div><div class="ux-mini-kpi"><small>Ofertas ativas</small><b id="uxRepOffers">—</b></div></div></div>
      <div class="ux-panel ux-span-8"><h2>Atividade semanal</h2><p>Estrutura visual preparada para vendas, pedidos e resgates.</p><div class="ux-report-bars"><i style="height:34%"></i><i style="height:48%"></i><i style="height:42%"></i><i style="height:61%"></i><i style="height:54%"></i><i style="height:78%"></i><i style="height:67%"></i></div><div class="ux-report-days"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div></div>
      <div class="ux-panel ux-span-4"><h2>Módulos</h2><p>Indicadores separados conforme o que cada empresa contratar.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Fidelidade</b><small>Clientes, pontos, recompensas</small></div><span class="ux-toggle">Ativo</span></div><div class="ux-setting"><div><b>Delivery</b><small>Pedidos, rotas e entrega</small></div><span class="ux-toggle">Ativo</span></div></div></div>
    </div>`;
  anchor.parentNode.insertBefore(reports,anchor);

  const settings=document.createElement('section');settings.id='uxSettingsView';settings.className='ux-virtual-view';settings.innerHTML=`
    <div class="ux-section-grid">
      <div class="ux-panel ux-span-7"><h2>Empresa</h2><p>Base para personalização por tenant no modelo SaaS.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Uai Sô · Cancún</b><small>Empresa ativa</small></div><span class="ux-chip">Tenant</span></div><div class="ux-setting"><div><b>Identidade visual</b><small>Logo, cores e nome por empresa</small></div><span class="ux-toggle">Preparado</span></div><div class="ux-setting"><div><b>Regras de fidelidade</b><small>Pontos, níveis e recompensas</small></div><span class="ux-toggle">Ativo</span></div><div class="ux-setting"><div><b>Delivery</b><small>Módulo adicional contratado</small></div><span class="ux-toggle">Ativo</span></div></div></div>
      <div class="ux-panel ux-span-5"><h2>Segurança e operação</h2><p>Itens que devem ser ativados antes do lançamento comercial.</p><div class="ux-settings-list"><div class="ux-setting"><div><b>Senha do dashboard</b><small>Desativada apenas no Preview</small></div><span class="ux-toggle off">Preview</span></div><div class="ux-setting"><div><b>Produção</b><small>Não alterada por estas mudanças</small></div><span class="ux-toggle">Protegida</span></div><div class="ux-setting"><div><b>Logs</b><small>Diagnóstico disponível</small></div><span class="ux-toggle">Ativo</span></div></div></div>
    </div>`;
  anchor.parentNode.insertBefore(settings,anchor);

  const orders=document.getElementById('ordersAdmin');
  if(orders){
    const shell=document.createElement('div');shell.id='uxOrdersOps';
    orders.insertAdjacentElement('beforebegin',shell);
  }

  function getStatus(card){
    const t=norm(card.querySelector('.order-status')?.textContent||'');
    if(t.includes('enviado'))return'received';if(t.includes('acept'))return'accepted';if(t.includes('prepar'))return'preparing';if(t.includes('repartidor'))return'waiting';if(t.includes('salio')||t.includes('salió'))return'out';if(t.includes('entregado'))return'delivered';if(t.includes('cancel'))return'cancelled';return'other';
  }
  function buildKanban(){
    if(!orders)return;
    let board=document.getElementById('uxKanbanBoard');
    if(!board){board=document.createElement('div');board.id='uxKanbanBoard';orders.querySelector('.orders-card')?.prepend(board)}
    const cards=[...orders.querySelectorAll('#ordersAdminList .order-admin')];
    const defs=[['received','Enviado'],['accepted','Aceptado'],['preparing','Preparación'],['waiting','Repartidor'],['out','En ruta']];
    board.innerHTML='<div class="ux-order-summary">'+defs.map(([k,l])=>'<div><small>'+l+'</small><b data-sum="'+k+'">0</b></div>').join('')+'</div><div class="ux-kanban">'+defs.map(([k,l])=>'<section class="ux-kanban-col"><div class="ux-kanban-head"><span>'+l+'</span><span class="ux-kanban-count" data-count="'+k+'">0</span></div><div class="ux-kanban-list" data-col="'+k+'"></div></section>').join('')+'</div>';
    cards.forEach(card=>{const s=getStatus(card);const col=board.querySelector('[data-col="'+s+'"]');if(col)col.appendChild(card)});
    defs.forEach(([k])=>{const n=board.querySelectorAll('[data-col="'+k+'"] .order-admin').length;board.querySelector('[data-count="'+k+'"]').textContent=n;board.querySelector('[data-sum="'+k+'"]').textContent=n});
    const list=orders.querySelector('#ordersAdminList');if(list)list.style.display='none';
  }
  function configureOrdersView(){
    if(!orders)return;
    const view=document.body.dataset.uxView;
    const title=orders.querySelector('.orders-head h3');
    if(view==='pedidos'){if(title)title.textContent='🧾 Pedidos';buildKanban()}
    if(view==='entregas'){if(title)title.textContent='🛵 Entregas';buildKanban();const cols=document.querySelectorAll('#uxKanbanBoard .ux-kanban-col');cols.forEach((c,i)=>{if(i<2)c.style.opacity='.55';else c.style.opacity='1'})}
  }

  function numText(id){const t=document.getElementById(id)?.textContent||'';const m=t.replace(/\./g,'').match(/\d+/);return m?m[0]:'—'}
  function syncAll(){
    const clients=numText('totalClientes');
    const rewards=document.querySelectorAll('#listaRecompensas .reward-item').length;
    const offers=document.querySelectorAll('#listaPromos .promo-item').length;
    const active=document.querySelectorAll('#ordersAdmin .order-admin.active').length;
    const current=document.getElementById('clienteNome')?.textContent?.trim()||'—';
    const points=numText('clientePontos');
    [['uxQrClients',clients],['uxQrRewards',rewards],['uxQrCurrent',current],['uxQrPoints',points],['uxRepClients',clients],['uxRepRewards',rewards],['uxRepOffers',offers],['uxRepActive',active]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=String(v)});
    configureOrdersView();
  }

  document.getElementById('uxOpenScanner').onclick=()=>{if(typeof abrirScannerQr==='function')abrirScannerQr()};
  document.getElementById('uxGoClient').onclick=()=>{[...document.querySelectorAll('#uxSidebar .ux-nav button')].find(b=>norm(b.textContent)==='clientes')?.click()};

  document.addEventListener('click',e=>{
    const b=e.target.closest('#uxSidebar .ux-nav button');if(!b)return;
    const txt=norm(b.textContent);
    let view=null;
    if(b.dataset.uxCustom==='qr'||txt==='qr / validacion')view='qr';
    else if(txt==='configurar envio')view='envio';
    else if(txt==='relatorios')view='reportes';
    else if(txt==='ajustes')view='ajustes';
    if(view){e.preventDefault();e.stopImmediatePropagation();showVirtual(view)}
  },true);

  const obs=new MutationObserver(()=>{syncAll()});
  obs.observe(document.body,{childList:true,subtree:true});
  const attr=new MutationObserver(()=>{const v=document.body.dataset.uxView;if(v==='pedidos'||v==='entregas')setTimeout(configureOrdersView,30)});
  attr.observe(document.body,{attributes:true,attributeFilter:['data-ux-view']});
  setInterval(syncAll,2000);syncAll();
})();