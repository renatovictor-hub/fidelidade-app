(() => {
  if(document.getElementById('clientFidelityGrowthStyles')) return;
  const style=document.createElement('style');style.id='clientFidelityGrowthStyles';style.textContent=`
  .cfg-shell{margin:12px 0 14px;display:grid;gap:10px;width:100%}.cfg-card{background:#fff;border:1px solid #ece5ef;border-radius:16px;padding:14px;box-shadow:0 6px 20px rgba(60,25,75,.05)}.cfg-card h3{margin:0 0 5px;font-size:15px;color:#382c3f}.cfg-card p{margin:0;color:#6d6471;font-size:12px;line-height:1.45}.cfg-progress{height:9px;background:#eee8f1;border-radius:999px;overflow:hidden;margin-top:9px}.cfg-progress i{display:block;height:100%;background:linear-gradient(90deg,#6a0dad,#a047dc);border-radius:999px}.cfg-next{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.cfg-next strong{font-size:18px;color:#6a0dad}.cfg-missions{display:grid;gap:8px;margin-top:9px}.cfg-mission{padding:10px;border:1px solid #eee7f1;border-radius:12px;background:#faf8fb}.cfg-mission-head{display:flex;justify-content:space-between;gap:8px}.cfg-badges{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:3px 0}.cfg-badge{min-width:0;padding:12px 8px;border-radius:12px;background:#f7effb;text-align:center}.cfg-badge span{display:block;font-size:24px}.cfg-badge b{font-size:11px}.cfg-complete{color:#20844e;font-weight:800}.cfg-shell .cfg-card{margin:0!important}.cfg-shell .cfg-card:first-child{margin-top:0!important}
  #screen-home .hello{margin:4px 2px 12px!important;text-align:left!important}
  #screen-home .hello h2{margin:0!important;font-size:22px!important;line-height:1.2!important;color:#6a0dad!important}
  #screen-home .hello p{margin:4px 0 0!important;font-size:13px!important;color:#6d6471!important}
  #screen-home .counter{margin-top:0!important}
  #screen-home .quick{margin-bottom:12px!important}
  #screen-home .points{margin-top:0!important}
  #screen-home .mini-tools-row{margin-top:10px!important}
  .cfg-profile-logros{margin-top:12px}.cfg-profile-logros .cfg-badges{margin-top:8px}.cfg-profile-logros .cfg-badge{background:#faf8fb;border:1px solid #eee7f1}
  .cfg-collapsible{cursor:pointer}
  .cfg-collapsible-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .cfg-collapsible-title{min-width:0}
  .cfg-collapsible-title h3{margin:0}
  .cfg-collapsible-summary{font-size:12px;color:#6f6673;margin:4px 0 0}
  .cfg-collapsible-toggle{font-size:18px;font-weight:900;color:#7b32c5;transition:transform .2s ease}
  .cfg-collapsible.is-open .cfg-collapsible-toggle{transform:rotate(180deg)}
  .cfg-collapsible-body{display:none;margin-top:12px}
  .cfg-collapsible.is-open .cfg-collapsible-body{display:block}
  .vip-benefits-inline{margin-top:12px;padding-top:10px;border-top:1px solid #eee7f4}
  .vip-benefits-inline-title{font-size:11px;font-weight:900;color:#5e4c70;margin-bottom:7px}
  .vip-benefit-inline{padding:9px;border:1px solid #eee7f1;border-radius:11px;background:#faf8fb;margin-top:7px}
  .vip-benefit-inline-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
  .vip-benefit-inline-head b{font-size:11px;color:#3f3345}
  .vip-benefit-inline-head span{font-size:10px;color:#6f6278;text-align:right}
  .vip-benefit-inline p{font-size:10px!important;margin:4px 0 0!important;color:#756d79!important}
  .vip-benefit-inline button{width:100%;margin-top:7px;border:0;border-radius:9px;background:#6a0dad;color:#fff;padding:8px;font-size:10px;font-weight:900}
  .vip-benefit-inline .used{color:#20844e;font-weight:800;margin-top:6px;font-size:10px}
  @media(max-width:370px){.cfg-badges{grid-template-columns:1fr 1fr}.cfg-badge{padding:10px 6px}}
  `;document.head.appendChild(style);

  function alignHome(){
    const home=document.getElementById('screen-home');if(!home)return;
    const hello=home.querySelector('.hello'),counter=document.getElementById('counter'),quick=home.querySelector('.quick'),points=home.querySelector('.points');
    if(hello&&counter&&hello.nextElementSibling!==counter)home.insertBefore(hello,counter);
    if(points){
      const shell=document.getElementById('clientFidGrowth');
      if(shell&&points.nextElementSibling!==shell)points.insertAdjacentElement('afterend',shell);
    }
    if(quick&&counter&&counter.nextElementSibling!==quick)counter.insertAdjacentElement('afterend',quick);
  }
  const uid=new URLSearchParams(location.search).get('uid')||'';
  if(!/^user_\d+$/.test(uid))return;
  async function load(){
    try{
      const r=await fetch('/api/fidelidad-growth?uid='+encodeURIComponent(uid)+'&t='+Date.now(),{cache:'no-store'});
      const d=await r.json();if(!r.ok)return;
      render(d);
    }catch(_){}
  }
  function renderProfileAchievements(items){
    const profile=document.getElementById('screen-profile');if(!profile)return;
    let card=document.getElementById('cfgProfileAchievements');
    if(!card){
      card=document.createElement('div');
      card.id='cfgProfileAchievements';
      card.className='card cfg-profile-logros';
      const moves=[...profile.querySelectorAll('.card')].find(x=>x.querySelector('h3')?.textContent.includes('Movimientos'));
      if(moves)moves.insertAdjacentElement('beforebegin',card);else profile.appendChild(card);
    }
    const list=Array.isArray(items)?items:[];
    card.innerHTML=`<h3>🏅 Mis logros</h3><p style="margin:0;color:#6d6471;font-size:12px;line-height:1.45">Marcos de tu historia con el programa. No son puntos ni beneficios adicionales.</p>${list.length?`<div class="cfg-badges">${list.map(b=>`<div class="cfg-badge" title="${String(b.text||'')}"><span>${b.icon||'🏅'}</span><b>${b.name||'Logro'}</b></div>`).join('')}</div>`:'<div class="empty" style="padding:14px 4px">Todavía no tienes logros desbloqueados.</div>'}`;
  }

  function renderVipBenefits(items){
    const vipCard=document.getElementById('vipCard');
    const details=vipCard?.querySelector('.mini-details');
    const row=document.getElementById('miniToolsRow');
    if(!vipCard||!details)return;
    let box=document.getElementById('vipBenefitsInline');
    if(!box){
      box=document.createElement('div');
      box.id='vipBenefitsInline';
      box.className='vip-benefits-inline';
      details.appendChild(box);
    }
    const list=Array.isArray(items)?items:[];
    const available=list.filter(b=>b.available).length;
    const kicker=vipCard.querySelector('.mini-kicker');
    if(kicker)kicker.textContent='TU NIVEL VIP';
    let summary=document.getElementById('vipBenefitSummary');
    if(!summary){
      summary=document.createElement('div');
      summary.id='vipBenefitSummary';
      summary.style.cssText='font-size:10px;color:#7b6b86;margin-top:2px';
      vipCard.querySelector('.mini-main')?.appendChild(summary);
    }
    summary.textContent=list.length?(available+' beneficio'+(available===1?'':'s')+' disponible'+(available===1?'':'s')):'Sin beneficios activos';
    box.innerHTML=list.length?`<div class="vip-benefits-inline-title">Beneficios de tu nivel</div>${list.map(b=>`
      <div class="vip-benefit-inline">
        <div class="vip-benefit-inline-head"><b>${b.icon||'🎁'} ${b.title||'Beneficio'}</b><span>${b.remaining} de ${b.limit} disponible${b.limit===1?'':'s'}</span></div>
        <p>${b.text}</p>
        <p>${b.period==='monthly'?'Se renueva cada mes':'Disponible una vez mientras mantengas este nivel'}</p>
        ${b.available?'<button type="button" class="cfg-vip-redeem" data-benefit="'+b.id+'">USAR BENEFICIO</button>':'<div class="used">✓ Usos agotados</div>'}
      </div>`).join('')}`:'<div class="vip-benefits-inline-title">Beneficios de tu nivel</div><p style="font-size:10px;color:#756d79;margin:0">Este nivel no tiene beneficios activos.</p>';
    if(!vipCard.dataset.growthHeightBound){
      vipCard.dataset.growthHeightBound='1';
      vipCard.addEventListener('click',()=>setTimeout(()=>{
        if(!row)return;
        row.style.minHeight=vipCard.classList.contains('expanded')?(vipCard.scrollHeight+'px'):'';
      },0));
    }
    if(vipCard.classList.contains('expanded')&&row)row.style.minHeight=vipCard.scrollHeight+'px';
  }

  function render(d){
    const home=document.getElementById('screen-home');if(!home)return;
    let shell=document.getElementById('clientFidGrowth');
    if(!shell){shell=document.createElement('div');shell.id='clientFidGrowth';shell.className='cfg-shell';const anchor=home.querySelector('.points')||home.querySelector('.hello')||home.firstElementChild;if(anchor?.parentNode)anchor.insertAdjacentElement('afterend',shell);else home.appendChild(shell)}
    const next=d.next_reward;
    const nextHtml=next?`<div class="cfg-card"><div class="cfg-next"><div><h3>🎯 Tu próxima recompensa</h3><p>${next.nome||'Recompensa'} · ${next.pontos} pts</p></div><strong>Faltan ${next.faltan}</strong></div><div class="cfg-progress"><i style="width:${Math.min(100,Math.round(((Number(d.client?.pontos||0))/(Number(next.pontos)||1))*100))}%"></i></div><p style="margin-top:7px">Con una compra aproximada de $ ${Number(next.compra_aprox||0).toLocaleString('es-MX')} podrías alcanzarla.</p></div>`:'';
    const missionList=(d.missions||[]).filter(m=>!m.claimed).slice(0,4);
    const missionHtml=missionList.length?`<div class="cfg-card cfg-collapsible" id="cfgMissionsCard" role="button" tabindex="0" aria-expanded="false">
      <div class="cfg-collapsible-head">
        <div class="cfg-collapsible-title"><h3>🎮 Misiones</h3><p class="cfg-collapsible-summary">${missionList.length} misión${missionList.length===1?'':'es'} disponible${missionList.length===1?'':'s'} · toca para ver</p></div>
        <span class="cfg-collapsible-toggle">⌄</span>
      </div>
      <div class="cfg-collapsible-body"><div class="cfg-missions">${missionList.map(m=>`<div class="cfg-mission"><div class="cfg-mission-head"><b>${m.titulo}</b><span class="${m.progress?.completed?'cfg-complete':''}">${m.progress?.completed?'✓ Completa':(m.progress?.value||0)+' / '+(m.progress?.target||0)}</span></div><p>${m.descripcion||''}</p><div class="cfg-progress"><i style="width:${m.progress?.percent||0}%"></i></div>${m.premio_puntos?'<p style="margin-top:6px">🎁 Premio: '+m.premio_puntos+' pts</p>':''}${m.progress?.completed?'<button class="btn-primary cfg-claim" data-mission="'+m.id+'" style="margin-top:8px;width:100%">RECLAMAR PREMIO</button>':''}</div>`).join('')}</div></div>
    </div>`: '';
    const realBenefits=(d.benefits||[]).filter(b=>String(b?.text||'').trim());
    shell.innerHTML=nextHtml+missionHtml;
    renderVipBenefits(realBenefits);
    renderProfileAchievements(d.badges||[]);
    shell.querySelectorAll('.cfg-collapsible').forEach(card=>{
      const toggle=()=>{const open=card.classList.toggle('is-open');card.setAttribute('aria-expanded',open?'true':'false')};
      card.addEventListener('click',e=>{if(e.target.closest('button'))return;toggle()});
      card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('button')){e.preventDefault();toggle()}});
    });
    alignHome();
    document.querySelectorAll('.cfg-vip-redeem').forEach(btn=>btn.onclick=async(e)=>{e?.stopPropagation?.();
      const benefit=realBenefits.find(x=>String(x.id)===String(btn.dataset.benefit));
      if(!benefit)return;
      if(!confirm('¿Usar ahora este beneficio?\n\n'+benefit.title+'\n'+benefit.text+'\n\nEste uso quedará registrado.'))return;
      btn.disabled=true;btn.textContent='REGISTRANDO...';
      try{
        const r=await fetch('/api/fidelidad-growth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'redeem_vip_benefit',uid,benefit_id:benefit.id})});
        const out=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(out.error||'No se pudo usar el beneficio');
        alert('✅ Beneficio registrado\n\n'+out.title+'\nCódigo: '+out.code+'\nUsos restantes: '+out.remaining);
        await load();
      }catch(e){alert(e.message)}finally{btn.disabled=false}
    });
    shell.querySelectorAll('.cfg-claim').forEach(btn=>btn.onclick=async()=>{
      btn.disabled=true;btn.textContent='RECLAMANDO...';
      try{
        const r=await fetch('/api/fidelidad-growth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_mission',uid,id:btn.dataset.mission})});
        const out=await r.json().catch(()=>({}));
        if(!r.ok)throw new Error(out.error||'No se pudo reclamar');
        alert('🎉 Premio reclamado: +'+Number(out.puntos||0)+' puntos');
        await load();
      }catch(e){alert(e.message)}finally{btn.disabled=false}
    });
  }
  alignHome();load();setInterval(load,30000);window.addEventListener('focus',()=>{alignHome();load()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){alignHome();load()}});
})();