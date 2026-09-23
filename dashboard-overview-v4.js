(() => {
  if (document.getElementById('uxOverviewV4Styles')) return;

  const style = document.createElement('style');
  style.id = 'uxOverviewV4Styles';
  style.textContent = `
    body.ux3[data-ux-view="resumen"] #uxOverview{
      display:block!important;max-width:1480px!important;margin:0 auto!important;
    }
    body.ux3[data-ux-view="resumen"] #uxOverview .ux-overview-row{display:none!important}
    #uxOverviewV4{display:grid;gap:14px;margin-top:14px}
    .ov-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
    .ov-kpi{background:#fff;border:1px solid #ece6ef;border-radius:15px;padding:13px 14px;display:flex;gap:10px;align-items:center;min-height:82px;box-shadow:0 6px 18px rgba(63,34,76,.045)}
    .ov-kpi .ico{width:38px;height:38px;flex:0 0 38px;border-radius:12px;display:grid;place-items:center;font-size:18px;background:#f3e9fa}
    .ov-kpi:nth-child(2) .ico{background:#eee9ff}.ov-kpi:nth-child(3) .ico{background:#fff3d1}.ov-kpi:nth-child(4) .ico{background:#e9f2ff}.ov-kpi:nth-child(5) .ico{background:#e9f8ef}.ov-kpi:nth-child(6) .ico{background:#eaf3ff}
    .ov-kpi small{display:block;color:#84788a;font-size:10px;font-weight:750}.ov-kpi b{display:block;color:#2d2232;font-size:20px;line-height:1.05;margin-top:2px}.ov-kpi em{display:block;color:#249a58;font-style:normal;font-size:9px;font-weight:800;margin-top:4px}
    .ov-grid{display:grid;grid-template-columns:1.05fr 1fr 1.05fr;gap:12px}
    .ov-card{background:#fff;border:1px solid #ebe4ee;border-radius:16px;padding:15px;box-shadow:0 7px 20px rgba(55,24,70,.045);min-height:260px}
    .ov-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.ov-head h2{font-size:16px;color:#2e2234;margin:0}.ov-link{border:0;background:transparent;color:#7a1ec2;font-size:10px;font-weight:900;cursor:pointer;width:auto!important;padding:4px!important}
    .ov-vip{background:linear-gradient(135deg,#7a17d3,#5f0fb4);color:#fff;border-radius:14px;padding:14px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:10px}
    .ov-vip strong{font-size:13px}.ov-vip .level{display:block;font-size:20px;font-weight:900;margin-top:3px}.ov-progress{height:6px;background:rgba(255,255,255,.22);border-radius:99px;overflow:hidden;margin-top:10px}.ov-progress i{display:block;height:100%;width:72%;background:#ffd94a;border-radius:99px}.ov-vip .pts{font-size:11px;font-weight:800;text-align:right}
    .ov-list{display:grid;gap:7px}.ov-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border-radius:11px;background:#faf8fb;border:1px solid #f0eaf3;font-size:11px}.ov-row .main{min-width:0}.ov-row b{display:block;font-size:11px;color:#332839}.ov-row small{display:block;color:#8b7f90;font-size:9px;margin-top:2px}.ov-count{min-width:34px;text-align:center;border-radius:9px;padding:5px 7px;font-weight:900;background:#f1e7f8;color:#6a0dad}
    .ov-status.received{background:#eaf8ef;color:#168a4d}.ov-status.accepted{background:#eaf8ef;color:#168a4d}.ov-status.preparing{background:#fff3d6;color:#a26800}.ov-status.waiting_driver{background:#e9f2ff;color:#2365bd}.ov-status.out_for_delivery{background:#eeeaff;color:#5a35c7}.ov-status.delivered{background:#e8f8ee;color:#198b50}
    .ov-campaign{border-radius:13px;padding:14px;background:linear-gradient(135deg,#3d153c,#6c1f72);color:#fff;margin-bottom:10px;min-height:94px;display:flex;flex-direction:column;justify-content:flex-end}.ov-campaign span{font-size:9px;font-weight:900;background:#7b2ee2;border-radius:999px;padding:4px 7px;align-self:flex-start}.ov-campaign b{font-size:18px;line-height:1.05;margin-top:8px}.ov-campaign small{font-size:9px;opacity:.8;margin-top:4px}
    .ov-stats3{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.ov-stat{padding:10px;background:#faf8fb;border:1px solid #f0eaf3;border-radius:11px;text-align:center}.ov-stat b{font-size:16px;display:block}.ov-stat small{font-size:8px;color:#85798b}
    .ov-chart{height:126px;display:flex;align-items:flex-end;gap:8px;padding:12px 6px 4px;border-bottom:1px solid #eee7f1}.ov-bar{flex:1;min-width:10px;background:linear-gradient(#bd91ed,#7b2bd2);border-radius:7px 7px 2px 2px;opacity:.9}.ov-chart-labels{display:grid;grid-template-columns:repeat(7,1fr);font-size:8px;color:#8a7f8f;text-align:center;margin-top:5px}
    .ov-search{display:flex;gap:8px;margin-bottom:9px}.ov-search input{flex:1;padding:9px 10px!important;font-size:11px!important}.ov-empty{padding:20px 8px;text-align:center;color:#968b9b;font-size:11px;border:1px dashed #e8deec;border-radius:12px;background:#fcfbfd}.ov-badge{font-size:8px;font-weight:900;padding:4px 6px;border-radius:999px;background:#f0e6f7;color:#6a0dad;white-space:nowrap}
    .ov-note{font-size:9px;color:#94899a;margin-top:8px;line-height:1.4}
    @media(max-width:1200px){.ov-kpis{grid-template-columns:repeat(3,1fr)}.ov-grid{grid-template-columns:1fr 1fr}.ov-card:last-child{grid-column:1/-1}}
    @media(max-width:780px){
      #uxOverviewV4{gap:10px;margin-top:10px}.ov-kpis{grid-template-columns:1fr 1fr;gap:8px}.ov-kpi{min-height:70px;padding:10px}.ov-kpi b{font-size:18px}.ov-grid{grid-template-columns:1fr;gap:10px}.ov-card{min-height:0;padding:13px}.ov-card:last-child{grid-column:auto}.ov-head h2{font-size:15px}.ov-vip .level{font-size:18px}
    }
    @media(max-width:430px){.ov-kpis{grid-template-columns:1fr 1fr}.ov-kpi .ico{width:34px;height:34px;flex-basis:34px}.ov-kpi small{font-size:8px}.ov-kpi em{display:none}.ov-card{border-radius:14px}}
  `;
  document.head.appendChild(style);

  const old = document.getElementById('uxOverview');
  if (!old) return;

  old.querySelector('.ux-kpis')?.remove();

  const root = document.createElement('div');
  root.id = 'uxOverviewV4';
  root.innerHTML = `
    <div class="ov-kpis">
      <div class="ov-kpi"><div class="ico">👤</div><div><small>Clientes cadastrados</small><b id="ovClients">—</b><em>Base de fidelidad</em></div></div>
      <div class="ov-kpi"><div class="ico">⭐</div><div><small>Pontos disponíveis</small><b id="ovPoints">—</b><em>Saldo conhecido</em></div></div>
      <div class="ov-kpi"><div class="ico">🎁</div><div><small>Recompensas</small><b id="ovRewards">—</b><em>Catálogo disponível</em></div></div>
      <div class="ov-kpi"><div class="ico">🧾</div><div><small>Pedidos ativos</small><b id="ovOrders">—</b><em>Operação atual</em></div></div>
      <div class="ov-kpi"><div class="ico">🔔</div><div><small>Ofertas ativas</small><b id="ovPromos">—</b><em>Campanhas visíveis</em></div></div>
      <div class="ov-kpi"><div class="ico">🛵</div><div><small>Entregues hoje</small><b id="ovDelivered">—</b><em>Delivery</em></div></div>
    </div>

    <div class="ov-grid">
      <section class="ov-card">
        <div class="ov-head"><h2>Programa de fidelidade</h2><button class="ov-link" data-view="fidelidad">Ver tudo →</button></div>
        <div class="ov-vip">
          <div><strong>👑 Cliente VIP</strong><span class="level">Níveis configuráveis</span><div class="ov-progress"><i></i></div></div>
          <div class="pts"><span id="ovPointsVip">—</span><br><small>pontos</small></div>
        </div>
        <div class="ov-head" style="margin:2px 0 7px"><h2 style="font-size:11px">Recompensas mais populares</h2><button class="ov-link" data-view="recompensas">Gerenciar</button></div>
        <div class="ov-list" id="ovRewardList"><div class="ov-empty">Carregando recompensas…</div></div>
      </section>

      <section class="ov-card">
        <div class="ov-head"><h2>Pedidos & Delivery</h2><button class="ov-link" data-view="pedidos">Ver todos →</button></div>
        <div class="ov-list" id="ovOrderStatus"><div class="ov-empty">Carregando pedidos…</div></div>
      </section>

      <section class="ov-card">
        <div class="ov-head"><h2>Campanhas e ofertas</h2><button class="ov-link" data-view="ofertas">Nova campanha +</button></div>
        <div class="ov-campaign" id="ovCampaign"><span>ATIVA</span><b>Sem campanha ativa</b><small>Crie uma promoção para seus clientes</small></div>
        <div class="ov-stats3">
          <div class="ov-stat"><b id="ovCampaigns">0</b><small>Campanhas ativas</small></div>
          <div class="ov-stat"><b>—</b><small>Taxa de abertura</small></div>
          <div class="ov-stat"><b>—</b><small>Cliques</small></div>
        </div>
        <div class="ov-note">As métricas de abertura e clique entram quando conectarmos o relatório de campanhas.</div>
      </section>

      <section class="ov-card">
        <div class="ov-head"><h2>QR / Validação</h2><button class="ov-link" data-view="fidelidad">Ver todos →</button></div>
        <div class="ov-list" id="ovQrList">
          <div class="ov-row"><div class="main"><b>Scanner de cliente</b><small>Validação de pontos e recompensas por QR</small></div><span class="ov-badge">Ativo</span></div>
          <div class="ov-row"><div class="main"><b>Resgates</b><small>Histórico disponível no perfil do cliente</small></div><span class="ov-badge">Fidelidade</span></div>
          <div class="ov-row"><div class="main"><b>Validação rápida</b><small>Acesso pelo módulo de fidelidade</small></div><span class="ov-badge">QR</span></div>
        </div>
      </section>

      <section class="ov-card">
        <div class="ov-head"><h2>Clientes</h2><button class="ov-link" data-view="clientes">Ver todos →</button></div>
        <div class="ov-search"><input id="ovClientSearch" placeholder="Buscar por nome, telefone ou ID…"></div>
        <div class="ov-list" id="ovClientList">
          <div class="ov-empty">Use “Clientes” para buscar e abrir o histórico completo.</div>
        </div>
      </section>

      <section class="ov-card">
        <div class="ov-head"><h2>Relatórios</h2><button class="ov-link" data-view="reportes">Ver relatório completo →</button></div>
        <div class="ov-chart">
          <div class="ov-bar" style="height:32%"></div><div class="ov-bar" style="height:50%"></div><div class="ov-bar" style="height:44%"></div><div class="ov-bar" style="height:62%"></div><div class="ov-bar" style="height:55%"></div><div class="ov-bar" style="height:76%"></div><div class="ov-bar" style="height:68%"></div>
        </div>
        <div class="ov-chart-labels"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div>
        <div class="ov-note">Visual preparado. Os valores reais de vendas/resgates serão conectados quando o módulo de relatórios estiver implementado.</div>
      </section>
    </div>
  `;
  old.prepend(root);

  function num(text) {
    const m = String(text || '').replace(/\./g,'').match(/\d+/);
    return m ? Number(m[0]) : null;
  }
  function textOrDash(v){ return (v === null || v === undefined || Number.isNaN(v)) ? '—' : String(v); }

  function sync() {
    const total = num(document.getElementById('totalClientes')?.textContent);
    document.getElementById('ovClients').textContent = textOrDash(total);

    const rewards = [...document.querySelectorAll('#listaRecompensas > *')].filter(el => el.textContent.trim()).length;
    document.getElementById('ovRewards').textContent = document.getElementById('listaRecompensas') ? String(rewards) : '—';

    const activeOrders = document.querySelectorAll('#ordersAdmin .order-admin.active').length;
    document.getElementById('ovOrders').textContent = document.getElementById('ordersAdmin') ? String(activeOrders) : '—';

    const promos = [...document.querySelectorAll('#listaPromos .promo-item')].filter(el => getComputedStyle(el).display !== 'none');
    document.getElementById('ovPromos').textContent = document.getElementById('listaPromos') ? String(promos.length) : '—';
    document.getElementById('ovCampaigns').textContent = document.getElementById('listaPromos') ? String(promos.length) : '0';
    if (promos[0]) {
      const title = promos[0].querySelector('strong')?.textContent?.trim() || 'Campanha ativa';
      const desc = promos[0].querySelector('small')?.textContent?.trim() || 'Promoção ativa';
      document.getElementById('ovCampaign').innerHTML = '<span>ATIVA</span><b></b><small></small>';
      document.querySelector('#ovCampaign b').textContent = title;
      document.querySelector('#ovCampaign small').textContent = desc;
    }

    const orderCards = [...document.querySelectorAll('#ordersAdmin .order-admin')];
    const statusMap = [
      ['received','Pedido enviado'],['accepted','Pedido aceito'],['preparing','Em preparação'],
      ['waiting_driver','Aguardando repartidor'],['out_for_delivery','Saiu para entrega'],['delivered','Entregue hoje']
    ];
    const statusBox = document.getElementById('ovOrderStatus');
    if (statusBox && document.getElementById('ordersAdmin')) {
      statusBox.innerHTML = statusMap.map(([key,label]) => {
        let count = 0;
        orderCards.forEach(card => {
          const t = (card.querySelector('.order-status')?.textContent || '').toLowerCase();
          const normalized = t.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
          if (
            (key==='received' && normalized.includes('enviado')) ||
            (key==='accepted' && normalized.includes('acept')) ||
            (key==='preparing' && normalized.includes('prepar')) ||
            (key==='waiting_driver' && normalized.includes('repartidor')) ||
            (key==='out_for_delivery' && normalized.includes('entrega') && !normalized.includes('entregado')) ||
            (key==='delivered' && normalized.includes('entregado'))
          ) count++;
        });
        return '<div class="ov-row"><span class="ov-count ov-status '+key+'">'+count+'</span><div class="main" style="flex:1"><b>'+label+'</b><small>'+ (key==='delivered'?'Pedidos finalizados':'Etapa operacional') +'</small></div><span style="color:#aaa">—</span></div>';
      }).join('');
      const delivered = statusMap.length ? orderCards.filter(c => (c.querySelector('.order-status')?.textContent || '').toLowerCase().includes('entregado')).length : 0;
      document.getElementById('ovDelivered').textContent = String(delivered);
    }

    const rewardBox = document.getElementById('ovRewardList');
    const rewardNodes = [...document.querySelectorAll('#listaRecompensas > *')].filter(el => el.textContent.trim()).slice(0,3);
    if (rewardBox) {
      if (rewardNodes.length) {
        rewardBox.innerHTML = rewardNodes.map((el,i) => {
          const lines = el.textContent.split('\n').map(s=>s.trim()).filter(Boolean);
          return '<div class="ov-row"><span class="ov-count">🎁</span><div class="main" style="flex:1"><b>'+ (lines[0] || 'Recompensa '+(i+1)) +'</b><small>'+ (lines[1] || 'Disponível para resgate') +'</small></div><span style="color:#aaa">›</span></div>';
        }).join('');
      } else {
        rewardBox.innerHTML = '<div class="ov-empty">Nenhuma recompensa carregada.</div>';
      }
    }

    let points = null;
    const pointEls = [...document.querySelectorAll('[id*="pontos" i], [id*="saldo" i]')];
    for (const el of pointEls) {
      const n = num(el.textContent);
      if (n !== null && n > 0) { points = n; break; }
    }
    document.getElementById('ovPoints').textContent = textOrDash(points);
    document.getElementById('ovPointsVip').textContent = textOrDash(points);
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-view]');
    if (!b) return;
    const view = b.dataset.view;
    const sidebarButtons = [...document.querySelectorAll('#uxSidebar .ux-nav button')];
    const names = {fidelidad:'Fidelidad',recompensas:'Recompensas',pedidos:'Pedidos',ofertas:'Ofertas / Push',clientes:'Clientes',reportes:'Relatórios'};
    const target = sidebarButtons.find(x => x.textContent.trim().includes(names[view] || ''));
    if (target) target.click();
  });

  document.getElementById('ovClientSearch')?.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = e.currentTarget.value.trim();
    if (!q) return;
    const target = [...document.querySelectorAll('#uxSidebar .ux-nav button')].find(x => x.textContent.includes('Clientes'));
    if (target) target.click();
    setTimeout(() => {
      const input = document.getElementById('clienteUid');
      if (input) { input.value = q; input.focus(); }
    }, 150);
  });

  sync();
  setInterval(sync, 1800);
})();