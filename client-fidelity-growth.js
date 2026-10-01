(() => {
  if(document.getElementById('clientFidelityGrowthStyles')) return;
  const style=document.createElement('style');style.id='clientFidelityGrowthStyles';style.textContent=`
  .cfg-shell{margin:12px 0 14px;display:grid;gap:10px;width:100%}.cfg-card{background:#fff;border:1px solid #ece5ef;border-radius:16px;padding:14px;box-shadow:0 6px 20px rgba(60,25,75,.05)}.cfg-card h3{margin:0 0 5px;font-size:15px;color:#382c3f}.cfg-card p{margin:0;color:#6d6471;font-size:12px;line-height:1.45}.cfg-progress{height:9px;background:#eee8f1;border-radius:999px;overflow:hidden;margin-top:9px}.cfg-progress i{display:block;height:100%;background:linear-gradient(90deg,#6a0dad,#a047dc);border-radius:999px}.cfg-next{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.cfg-next strong{font-size:18px;color:#6a0dad}.cfg-missions{display:grid;gap:8px;margin-top:9px}.cfg-mission{padding:10px;border:1px solid #eee7f1;border-radius:12px;background:#faf8fb}.cfg-mission-head{display:flex;justify-content:space-between;gap:8px}.cfg-badges{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:3px 0}.cfg-badge{min-width:0;padding:12px 8px;border-radius:12px;background:#f7effb;text-align:center}.cfg-badge span{display:block;font-size:24px}.cfg-badge b{font-size:11px}.cfg-surprise{background:linear-gradient(135deg,#6a0dad,#9d3bd0);color:#fff}.cfg-surprise h3,.cfg-surprise p{color:#fff}.cfg-complete{color:#20844e;font-weight:800}.cfg-shell .cfg-card{margin:0!important}.cfg-shell .cfg-card:first-child{margin-top:0!important}
  #screen-home .hello{margin:4px 2px 12px!important;text-align:left!important}
  #screen-home .hello h2{margin:0!important;font-size:22px!important;line-height:1.2!important;color:#6a0dad!important}
  #screen-home .hello p{margin:4px 0 0!important;font-size:13px!important;color:#6d6471!important}
  #screen-home .counter{margin-top:0!important}
  #screen-home .quick{margin-bottom:12px!important}
  #screen-home .points{margin-top:0!important}
  #screen-home .mini-tools-row{margin-top:10px!important}
  .cfg-profile-logros{margin-top:12px}.cfg-profile-logros .cfg-badges{margin-top:8px}.cfg-profile-logros .cfg-badge{background:#faf8fb;border:1px solid #eee7f1}
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

  function render(d){
    const home=document.getElementById('screen-home');if(!home)return;
    let shell=document.getElementById('clientFidGrowth');
    if(!shell){shell=document.createElement('div');shell.id='clientFidGrowth';shell.className='cfg-shell';const anchor=home.querySelector('.points')||home.querySelector('.hello')||home.firstElementChild;if(anchor?.parentNode)anchor.insertAdjacentElement('afterend',shell);else home.appendChild(shell)}
    const next=d.next_reward;
    const nextHtml=next?`<div class="cfg-card"><div class="cfg-next"><div><h3>🎯 Tu próxima recompensa</h3><p>${next.nome||'Recompensa'} · ${next.pontos} pts</p></div><strong>Faltan ${next.faltan}</strong></div><div class="cfg-progress"><i style="width:${Math.min(100,Math.round(((Number(d.client?.pontos||0))/(Number(next.pontos)||1))*100))}%"></i></div><p style="margin-top:7px">Con una compra aproximada de $ ${Number(next.compra_aprox||0).toLocaleString('es-MX')} podrías alcanzarla.</p></div>`:'';
    const missionHtml=(d.missions||[]).length?`<div class="cfg-card"><h3>🎮 Misiones</h3><p>Completa retos y desbloquea beneficios.</p><div class="cfg-missions">${d.missions.slice(0,4).map(m=>`<div class="cfg-mission"><div class="cfg-mission-head"><b>${m.titulo}</b><span class="${m.progress?.completed?'cfg-complete':''}">${m.progress?.completed?'✓ Completa':(m.progress?.value||0)+' / '+(m.progress?.target||0)}</span></div><p>${m.descripcion||''}</p><div class="cfg-progress"><i style="width:${m.progress?.percent||0}%"></i></div>${m.premio_puntos?'<p style="margin-top:6px">🎁 Premio: '+m.premio_puntos+' pts</p>':''}${m.progress?.completed&&!m.claimed?'<button class="btn-primary cfg-claim" data-mission="'+m.id+'" style="margin-top:8px;width:100%">RECLAMAR PREMIO</button>':m.claimed?'<p class="cfg-complete" style="margin-top:7px">✓ Premio reclamado</p>':''}</div>`).join('')}</div></div>`: '';
    const hasSurprise=d.surprise&&(String(d.surprise.titulo||'').trim()||String(d.surprise.texto||'').trim());
    const surprise=hasSurprise?`<div class="cfg-card cfg-surprise"><h3>🎁 ${d.surprise.titulo||'Beneficio especial'}</h3>${d.surprise.texto?`<p>${d.surprise.texto}</p>`:''}</div>`:'';
    const realBenefits=(d.benefits||[]).filter(b=>String(b?.text||'').trim());
    const benefits=realBenefits.length?`<div class="cfg-card"><h3>👑 Tus beneficios</h3><div class="cfg-missions">${realBenefits.map(b=>`<div class="cfg-mission"><div class="cfg-mission-head"><b>${b.icon||'🎁'} ${b.title||'Beneficio'}</b></div><p>${b.text}</p></div>`).join('')}</div></div>`:'';
    shell.innerHTML=nextHtml+surprise+benefits+missionHtml;
    renderProfileAchievements(d.badges||[]);
    alignHome();
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