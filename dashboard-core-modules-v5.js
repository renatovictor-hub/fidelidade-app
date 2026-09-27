(() => {
  if (document.getElementById('uxCoreModulesV5Styles')) return;

  const style = document.createElement('style');
  style.id = 'uxCoreModulesV5Styles';
  style.textContent = `
    #uxCoreToolbar{display:none;max-width:1180px;margin:0 auto 12px;background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:10px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-core-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.ux-core-tabs button{width:100%!important;border:1px solid #e9e1ed!important;background:#fff!important;color:#56465d!important;padding:13px 14px!important;border-radius:13px!important;font-size:14px!important;font-weight:850!important;text-align:left!important;box-shadow:0 4px 12px rgba(55,24,70,.035);transition:.18s ease}
    .ux-core-tabs button:hover{transform:translateY(-1px);border-color:#d8c1e8!important}
    .ux-core-tabs button.active{background:linear-gradient(135deg,#6a0dad,#8a35cf)!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 18px rgba(106,13,173,.18)}
    .ux-core-tabs button::after{content:'›';float:right;font-size:16px;line-height:10px;opacity:.65}.ux-core-tabs button.active::after{content:'⌄'}
    .ux-core-summary{display:none!important}
    body.ux3[data-ux-view="clientes"] #uxCoreToolbar,body.ux3[data-ux-view="fidelidad"] #uxCoreToolbar{display:block}
    body.ux3[data-ux-view="clientes"] .main-container,body.ux3[data-ux-view="fidelidad"] .main-container{max-width:1180px!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start!important;gap:12px!important}
    body.ux3[data-ux-view="clientes"] .main-container .card.ux-show,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-show{display:none!important;max-width:none!important;margin:0!important;min-height:100%}
    body.ux3[data-ux-view="clientes"] .main-container .card.ux-show.ux-mobile-active,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-show.ux-mobile-active{display:block!important}
    body.ux3[data-ux-view="clientes"] .main-container .card.ux-featured,body.ux3[data-ux-view="fidelidad"] .main-container .card.ux-featured{grid-column:1/-1}
    body.ux3 .card .ux-card-kicker{display:block;color:#8d8093;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;margin:-4px 0 10px}
    body.ux3 .card.ux-hide-subsection{display:none!important}
    .ux-client-hero{display:none;max-width:1180px;margin:0 auto 12px;grid-template-columns:1fr;gap:12px}
    body.ux3[data-ux-view="clientes"][data-client-sub="base"] .ux-client-hero{display:grid}
    .ux-client-panel{background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:17px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-client-panel h2{margin:0 0 6px;font-size:20px;color:#302337}.ux-client-panel p{margin:0 0 14px;font-size:13px;color:#675c6b;line-height:1.55}
    .ux-client-searchline{display:grid;grid-template-columns:1fr auto auto;gap:7px}.ux-client-searchline input{min-width:0}.ux-client-searchline button{width:auto!important;min-height:44px;padding:11px 14px!important;font-size:13px!important}
    .ux-client-summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
    .ux-client-summary-grid>div{background:#faf8fb;border:1px solid #eee7f1;border-radius:11px;padding:9px}
    .ux-client-summary-grid small{display:block;font-size:12px;color:#655b69;font-weight:700}.ux-client-summary-grid b{display:block;font-size:24px;color:#6a0dad;margin-top:2px}
    .ux-crm{margin-top:12px}.ux-crm-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
    .ux-crm-search{flex:1;min-width:180px;min-height:44px;padding:10px 12px!important;font-size:14px!important}
    .ux-crm-sort{width:auto!important;min-height:44px;padding:10px 34px 10px 12px!important;font-size:13px!important}
    .ux-crm-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
    .ux-crm-filters button{width:auto!important;min-height:38px;padding:8px 12px!important;font-size:12px!important;border:1px solid #e7dced!important;background:#faf8fb!important;color:#6b5b72!important;border-radius:999px!important}
    .ux-crm-filters button.active{background:#6a0dad!important;color:#fff!important;border-color:#6a0dad!important}
    .ux-crm-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:11px;align-items:start}
    .ux-crm-list{border:1px solid #eee7f1;border-radius:13px;overflow:hidden;background:#fff}
    .ux-crm-head,.ux-crm-row{display:grid;grid-template-columns:minmax(160px,1.4fr) .65fr .65fr .8fr .9fr;gap:8px;align-items:center}
    .ux-crm-head{padding:10px 12px;background:#f7f3f9;color:#5f5364;font-size:11px;font-weight:900;text-transform:uppercase}
    .ux-crm-rows{max-height:470px;overflow:auto;scrollbar-width:thin}
    .ux-crm-row{padding:12px;border-top:1px solid #f0eaf2;cursor:pointer;transition:.14s ease;font-size:13px;min-height:64px}
    .ux-crm-row:hover,.ux-crm-row.selected{background:#f7effb}.ux-crm-row b{display:block;color:#2f2434;font-size:13px;line-height:1.35}.ux-crm-row small{display:block;color:#6e6373;font-size:11px;line-height:1.4;margin-top:3px}
    .ux-crm-money{font-weight:900;color:#2d8a53}.ux-crm-status{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:900}.ux-crm-status.active{background:#e9f8ef;color:#198a4f}.ux-crm-status.inactive{background:#fff2df;color:#a86400}.ux-crm-status.none{background:#f0eef2;color:#807683}
    .ux-crm-empty{padding:26px;text-align:center;color:#6e6373;font-size:13px;line-height:1.5}
    .ux-crm-detail{display:none;background:linear-gradient(180deg,#fff,#fbf8fd);border:1px solid #e7dceb;border-radius:14px;padding:14px;position:sticky;top:90px}
    .ux-crm-detail.show{display:block}.ux-crm-detail h4{margin:0;color:#322439;font-size:21px}.ux-crm-detail .meta{font-size:12px;color:#665b6b;line-height:1.45;margin:4px 0 12px}
    .ux-crm-stats{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ux-crm-stat{padding:9px;background:#fff;border:1px solid #eee7f1;border-radius:10px}.ux-crm-stat small{display:block;font-size:11px;color:#655b69;font-weight:700}.ux-crm-stat b{display:block;font-size:19px;color:#5f178f;margin-top:2px}
    .ux-crm-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.ux-crm-actions button{min-height:42px;font-size:12px!important;padding:10px 11px!important}.ux-crm-actions .wide{grid-column:1/-1}
    .ux-crm-insight{margin-top:11px;padding:11px;border-radius:10px;background:#f4ecf9;color:#51365a;font-size:12px;line-height:1.55}
    .ux-client-result{display:none;grid-column:1/-1;background:#fff;border:1px solid #ebe3ef;border-radius:16px;padding:16px;box-shadow:0 7px 20px rgba(55,24,70,.045)}
    .ux-client-result.show{display:block}.ux-client-result-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ux-client-result h3{margin:0!important;color:#35273c!important;font-size:17px!important}
    .ux-client-result-meta{font-size:13px;color:#655b69;margin-top:4px}.ux-client-result-points{background:#f2e8f7;color:#6a0dad;font-weight:900;border-radius:12px;padding:9px 11px;white-space:nowrap}
    .ux-history-overlay{display:none;position:fixed;inset:0;z-index:9999;background:rgba(30,18,36,.55);backdrop-filter:blur(3px);padding:24px;align-items:center;justify-content:center}
    .ux-history-overlay.show{display:flex}.ux-history-modal{width:min(820px,96vw);max-height:82vh;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden}
    .ux-history-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid #eee7f1}
    .ux-history-head h3{margin:0;font-size:20px!important}.ux-history-close{width:42px!important;height:42px!important;min-height:42px!important;border:0!important;border-radius:12px!important;background:#f2edf5!important;color:#5f4c67!important;font-size:20px!important;cursor:pointer}
    .ux-history-body{padding:16px 18px;overflow:auto;font-size:13px;line-height:1.5}
    .ux-history-body .movimiento{font-size:13px!important}
    @media(max-width:900px){
      body.ux3[data-ux-view="clientes"] .main-container,body.ux3[data-ux-view="fidelidad"] .main-container{grid-template-columns:1fr!important}
      .ux-client-hero{grid-template-columns:1fr}.ux-crm-layout{grid-template-columns:1fr}.ux-crm-detail{position:static}.ux-crm-head,.ux-crm-row{grid-template-columns:minmax(130px,1.4fr) .6fr .7fr .8fr}.ux-crm-head span:nth-child(5),.ux-crm-row>div:nth-child(5){display:none}
    }
    @media(max-width:780px){
      #uxCoreToolbar{margin:0 0 8px;padding:8px;border-radius:14px}.ux-core-tabs{grid-template-columns:1fr 1fr;min-width:0}.ux-core-tabs button{min-height:48px;padding:12px 11px!important;font-size:13px!important}.ux-core-summary{display:none}
      .ux-client-hero{margin:0 0 8px}.ux-client-searchline{grid-template-columns:1fr 48px}.ux-client-searchline button span.label{display:none}.ux-client-searchline .ux-client-search-btn{grid-column:1/-1}
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
      <h2>Salud de la base</h2>
      <p>Quién está comprando y quién necesita una acción.</p>
      <div class="ux-client-summary-grid">
        <div><small>Total</small><b id="uxClientTotal">—</b></div>
        <div><small>Activos 30d</small><b id="uxClientActive30">—</b></div>
        <div><small>Inactivos +30d</small><b id="uxClientInactive30">—</b></div>
        <div><small>Nuevos 30d</small><b id="uxClientNew30">—</b></div>
      </div>
    </div>
  `;
  main.parentNode.insertBefore(clientHero, main);

  const historyOverlay=document.createElement('div');
  historyOverlay.className='ux-history-overlay';
  historyOverlay.id='uxHistoryOverlay';
  historyOverlay.innerHTML='<div class="ux-history-modal" role="dialog" aria-modal="true" aria-labelledby="uxHistoryTitle"><div class="ux-history-head"><h3 id="uxHistoryTitle">Historial del cliente</h3><button class="ux-history-close" type="button" aria-label="Cerrar">×</button></div><div class="ux-history-body" id="uxHistoryBody">Cargando…</div></div>';
  document.body.appendChild(historyOverlay);
  historyOverlay.addEventListener('click',e=>{if(e.target===historyOverlay||e.target.closest('.ux-history-close'))historyOverlay.classList.remove('show')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')historyOverlay.classList.remove('show')});

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
    const selected=sections.find(s=>s.key===currentSection[view]);
    sections.forEach(s=>s.card.classList.toggle('ux-mobile-active',s.key===currentSection[view]));
    toolbar.querySelectorAll('.ux-core-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.section===currentSection[view]));
    if(view==='clientes'){
      document.body.dataset.clientSub=selected && norm(selected.label).includes('opiniones') ? 'opiniones' : 'base';
    }else{
      delete document.body.dataset.clientSub;
    }
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

let crmData={customers:[],summary:{}};
  let crmFilter='all';
  let crmSelected='';
  let crmLoadedAt=0;

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  }
  function money(v){
    return '$'+Number(v||0).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function agoLabel(days){
    if(days==null)return 'Sin compras';
    if(days===0)return 'Hoy';
    if(days===1)return 'Ayer';
    return 'Hace '+days+' días';
  }

  function prepareCRM(){
    const card=visibleCards('clientes').find(x=>norm(cardTitle(x)).includes('base de clientes'));
    if(!card||card.dataset.crmPrepared)return;
    card.dataset.crmPrepared='1';
    card.classList.add('ux-featured');
    const total=document.getElementById('totalClientes');
    if(total)total.style.display='none';

    const host=document.createElement('div');
    host.className='ux-crm';
    host.innerHTML=
      '<div class="ux-crm-tools">'+
        '<input class="ux-crm-search" id="uxCrmSearch" placeholder="Buscar cliente por nombre, teléfono o ID…">'+
        '<select class="ux-crm-sort" id="uxCrmSort">'+
          '<option value="spend">Mayor gasto</option>'+
          '<option value="purchases">Más compras</option>'+
          '<option value="recent">Compra más reciente</option>'+
          '<option value="points">Más puntos</option>'+
        '</select>'+
      '</div>'+
      '<div class="ux-crm-filters" id="uxCrmFilters">'+
        '<button data-filter="all" class="active">Todos</button>'+
        '<button data-filter="active">Activos 30d</button>'+
        '<button data-filter="inactive">Inactivos +30d</button>'+
        '<button data-filter="frequent">Frecuentes</button>'+
        '<button data-filter="new">Nuevos 30d</button>'+
        '<button data-filter="birthday">Cumpleaños 30d</button>'+
      '</div>'+
      '<div class="ux-crm-layout">'+
        '<div class="ux-crm-list">'+
          '<div class="ux-crm-head"><span>Cliente</span><span>Puntos</span><span>Compras</span><span>Gasto</span><span>Última compra</span></div>'+
          '<div class="ux-crm-rows" id="uxCrmRows"><div class="ux-crm-empty">Cargando clientes…</div></div>'+
        '</div>'+
        '<aside class="ux-crm-detail" id="uxCrmDetail"></aside>'+
      '</div>';

    card.appendChild(host);

    document.getElementById('uxCrmFilters').addEventListener('click',e=>{
      const b=e.target.closest('button[data-filter]');
      if(!b)return;
      crmFilter=b.dataset.filter;
      document.querySelectorAll('#uxCrmFilters button').forEach(x=>x.classList.toggle('active',x===b));
      renderCRM();
    });
    document.getElementById('uxCrmSearch').addEventListener('input',renderCRM);
    document.getElementById('uxCrmSort').addEventListener('change',renderCRM);
    document.getElementById('uxCrmRows').addEventListener('click',e=>{
      const row=e.target.closest('[data-uid]');
      if(!row)return;
      crmSelected=row.dataset.uid;
      renderCRM();
      renderCRMDetail(crmSelected);
    });
    document.getElementById('uxCrmDetail').addEventListener('click',handleCRMAction);
  }

  function filteredCRM(){
    let arr=[...crmData.customers];
    const search=document.getElementById('uxCrmSearch');
    const q=norm(search?.value||'');
    if(q)arr=arr.filter(x=>norm(x.nome).includes(q)||String(x.telefone||'').includes(q)||norm(x.uid).includes(q));

    if(crmFilter==='active')arr=arr.filter(x=>x.status==='activo');
    if(crmFilter==='inactive')arr=arr.filter(x=>x.status==='inactivo');
    if(crmFilter==='frequent')arr=arr.filter(x=>Number(x.compras||0)>=3);
    if(crmFilter==='new')arr=arr.filter(x=>x.nuevo_30d);
    if(crmFilter==='birthday')arr=arr.filter(x=>x.aniversario_em_dias!=null&&x.aniversario_em_dias<=30);

    const sort=document.getElementById('uxCrmSort')?.value||'spend';
    if(sort==='spend')arr.sort((a,b)=>b.gasto_total-a.gasto_total);
    if(sort==='purchases')arr.sort((a,b)=>b.compras-a.compras);
    if(sort==='points')arr.sort((a,b)=>b.pontos-a.pontos);
    if(sort==='recent')arr.sort((a,b)=>(a.dias_sem_comprar??99999)-(b.dias_sem_comprar??99999));
    return arr;
  }

  function renderCRM(){
    const box=document.getElementById('uxCrmRows');
    if(!box)return;
    const arr=filteredCRM();
    if(!arr.length){
      box.innerHTML='<div class="ux-crm-empty">No hay clientes para este filtro.</div>';
      return;
    }

    box.innerHTML=arr.map(x=>{
      const cls=x.status==='activo'?'active':x.status==='inactivo'?'inactive':'none';
      const label=x.status==='activo'?'Activo':x.status==='inactivo'?'Inactivo':'Sin compras';
      return '<div class="ux-crm-row '+(crmSelected===x.uid?'selected':'')+'" data-uid="'+esc(x.uid)+'">'+
        '<div><b>'+esc(x.nome||'Sin nombre')+'</b><small>'+esc(x.telefone||x.uid)+'</small></div>'+
        '<div><b>'+Number(x.pontos||0)+'</b><small>pts</small></div>'+
        '<div><b>'+Number(x.compras||0)+'</b><small>'+(x.ticket_medio?money(x.ticket_medio)+' ticket':'sin ticket')+'</small></div>'+
        '<div class="ux-crm-money">'+money(x.gasto_total)+'</div>'+
        '<div><span class="ux-crm-status '+cls+'">'+label+'</span><small>'+agoLabel(x.dias_sem_comprar)+'</small></div>'+
      '</div>';
    }).join('');
  }

  function insightFor(x){
    if(x.status==='inactivo')return 'Este cliente lleva '+(x.dias_sem_comprar||30)+' días sin comprar. Buen candidato para una campaña de recuperación.';
    if(x.aniversario_em_dias!=null&&x.aniversario_em_dias<=30)return 'Cumpleaños en '+x.aniversario_em_dias+' día(s). Puedes preparar un beneficio especial.';
    if(Number(x.compras||0)>=3)return 'Cliente frecuente: '+x.compras+' compras registradas. Conviene mantenerlo activo con fidelidad.';
    if(x.nuevo_30d)return 'Cliente nuevo. Una segunda compra temprana aumenta la posibilidad de recurrencia.';
    return 'Revisa su historial antes de enviar una promoción para mantener el contacto relevante.';
  }

  function renderCRMDetail(uid){
    const box=document.getElementById('uxCrmDetail');
    if(!box)return;
    const x=crmData.customers.find(c=>c.uid===uid);
    if(!x){box.classList.remove('show');return}

    box.classList.add('show');
    const bday=x.aniversario_em_dias==null?'—':x.aniversario_em_dias===0?'Hoy':x.aniversario_em_dias+' días';
    box.innerHTML=
      '<h4>'+esc(x.nome||'Sin nombre')+'</h4>'+
      '<div class="meta">'+esc(x.telefone||'Sin teléfono')+' · '+esc(x.uid)+'</div>'+
      '<div class="ux-crm-stats">'+
        '<div class="ux-crm-stat"><small>Puntos</small><b>'+Number(x.pontos||0)+'</b></div>'+
        '<div class="ux-crm-stat"><small>Compras</small><b>'+Number(x.compras||0)+'</b></div>'+
        '<div class="ux-crm-stat"><small>Gasto total</small><b>'+money(x.gasto_total)+'</b></div>'+
        '<div class="ux-crm-stat"><small>Ticket medio</small><b>'+money(x.ticket_medio)+'</b></div>'+
        '<div class="ux-crm-stat"><small>Última compra</small><b style="font-size:11px">'+agoLabel(x.dias_sem_comprar)+'</b></div>'+
        '<div class="ux-crm-stat"><small>Cumpleaños</small><b style="font-size:11px">'+bday+'</b></div>'+
      '</div>'+
      '<div class="ux-crm-insight">💡 '+esc(insightFor(x))+'</div>'+
      '<div class="ux-crm-actions">'+
        '<button class="btn-primary" data-crm-action="points" data-uid="'+esc(x.uid)+'">+ Puntos</button>'+
        '<button class="btn-secondary" data-crm-action="reward" data-uid="'+esc(x.uid)+'">Recompensa</button>'+
        '<button class="btn-secondary" data-crm-action="offer" data-uid="'+esc(x.uid)+'">Enviar oferta</button>'+
        '<button class="btn-secondary" data-crm-action="opinions" data-uid="'+esc(x.uid)+'">Opiniones</button>'+
        '<button class="btn-secondary" data-crm-action="history" data-uid="'+esc(x.uid)+'">Ver historial</button>'+
        '<button class="btn-success" data-crm-action="whatsapp" data-uid="'+esc(x.uid)+'">WhatsApp</button>'+
      '</div>';
  }

  async function selectUnderlyingClient(uid){
    const input=document.getElementById('clienteUid');
    if(!input||typeof buscarCliente!=='function')return false;
    input.value=uid;
    await buscarCliente();
    return true;
  }

  async function handleCRMAction(e){
    const b=e.target.closest('[data-crm-action]');
    if(!b)return;
    const x=crmData.customers.find(c=>c.uid===b.dataset.uid);
    if(!x)return;

    const action=b.dataset.crmAction;
    if(action==='whatsapp'){
      const digits=String(x.telefone||'').replace(/\D/g,'');
      if(!digits){alert('Este cliente no tiene teléfono.');return}
      const phone=digits.length===10?'52'+digits:digits;
      window.open('https://wa.me/'+phone,'_blank','noopener');
      return;
    }

    await selectUnderlyingClient(x.uid);

    if(action==='points'){
      [...document.querySelectorAll('#uxSidebar .ux-nav button')].find(n=>norm(n.textContent)==='fidelidad')?.click();
      setTimeout(()=>{
        const sections=sectionLabels('fidelidad');
        const target=sections.find(s=>norm(s.label).includes('agregar puntos'));
        if(target){
          currentSection.fidelidad=target.key;
          renderToolbar('fidelidad');
          applyMobileSection('fidelidad',target.key);
        }
      },100);
      return;
    }

    if(action==='reward'){
      [...document.querySelectorAll('#uxSidebar .ux-nav button')].find(n=>norm(n.textContent)==='recompensas')?.click();
      return;
    }

    if(action==='offer'){
      [...document.querySelectorAll('#uxSidebar .ux-nav button')].find(n=>norm(n.textContent).includes('ofertas'))?.click();
      setTimeout(()=>{
        const seg=document.getElementById('pushSegmento');
        if(seg){
          seg.value='cliente';
          seg.dispatchEvent(new Event('change'));
        }
        const val=document.getElementById('pushValorSegmento');
        if(val)val.value=x.telefone||x.uid;
      },250);
      return;
    }

    if(action==='history'){
      await selectUnderlyingClient(x.uid);
      const body=document.getElementById('uxHistoryBody');
      const src=document.getElementById('clienteHistorico');
      document.getElementById('uxHistoryTitle').textContent='Historial · '+(x.nome||x.telefone||'Cliente');
      body.innerHTML=src?.innerHTML||'<div class="ux-crm-empty">Sin movimientos.</div>';
      document.getElementById('uxHistoryOverlay').classList.add('show');
      return;
    }

    if(action==='opinions'){
      const sections=sectionLabels('clientes');
      const target=sections.find(s=>norm(s.label).includes('opiniones'));
      if(target){
        currentSection.clientes=target.key;
        renderToolbar('clientes');
        applyMobileSection('clientes',target.key);
      }
      setTimeout(()=>document.getElementById('reviewsFiltroCliente')?.click(),150);
    }
  }

  async function loadCRM(force=false){
    if(!force&&Date.now()-crmLoadedAt<60000&&crmData.customers.length)return;
    prepareCRM();
    try{
      const res=await fetch('/api/cliente?action=customers&admin=1&t='+Date.now(),{cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Error');

      crmData={
        customers:Array.isArray(data.customers)?data.customers:[],
        summary:data.summary||{}
      };
      window.uaiCrmData=crmData;
      crmLoadedAt=Date.now();

      const s=crmData.summary;
      const vals={
        uxClientTotal:s.total,
        uxClientActive30:s.activos_30d,
        uxClientInactive30:s.inactivos_30d,
        uxClientNew30:s.nuevos_30d
      };
      Object.entries(vals).forEach(([id,v])=>{
        const el=document.getElementById(id);
        if(el)el.textContent=v??'—';
      });

      renderCRM();
      if(crmSelected)renderCRMDetail(crmSelected);
    }catch(err){
      const box=document.getElementById('uxCrmRows');
      if(box)box.innerHTML='<div class="ux-crm-empty">No se pudo cargar la base de clientes.</div>';
    }
  }

  function syncClientTotal(){
    const raw=document.getElementById('totalClientes')?.textContent||'';
    const m=raw.replace(/\./g,'').match(/\d+/);
    const el=document.getElementById('uxClientTotal');
    if(el&&!crmData.customers.length)el.textContent=m?m[0]:'—';
  }

  function refreshCore(){
    syncClientTotal();
    prepareCRM();
    const view=document.body.dataset.uxView;
    if(view==='clientes')loadCRM();
    if(!['clientes','fidelidad'].includes(view))return;

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
      if(['clientes','fidelidad'].includes(view))setTimeout(refreshCore,20);
    }
  });
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['data-ux-view']});

  if(document.body.dataset.uxView==='clientes')document.body.dataset.clientSub='base';
  setTimeout(refreshCore,120);
  setTimeout(()=>loadCRM(),500);
})();