(() => {
  const $ = id => document.getElementById(id);
  const titulo = $("titulo");
  if (!titulo || $("segmentacaoPushBox")) return;

  const card = titulo.closest(".card");
  const botao = card?.querySelector('button[onclick="enviarPush()"]');
  if (!card || !botao) return;

  const box = document.createElement("div");
  box.id = "segmentacaoPushBox";
  box.innerHTML = `
    <div style="margin:18px 0 8px;padding-top:16px;border-top:1px solid #eee;">
      <label style="display:block;margin-bottom:7px;font-size:14px;font-weight:bold;">Público de la notificación</label>
      <select id="pushSegmento" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:15px;">
        <option value="todos">👥 Todos los clientes</option>
        <option value="cliente">👤 Un cliente específico</option>
        <option value="pontos_min">⭐ Clientes con X puntos o más</option>
        <option value="inativos_dias">🕒 Sin comprar hace X días</option>
        <option value="perto_recompensa">🎁 Cerca de una recompensa</option>
      </select>
      <div id="pushValorWrap" style="display:none;margin-top:10px;">
        <label id="pushValorLabel" style="display:block;margin-bottom:6px;font-size:13px;font-weight:bold;"></label>
        <input id="pushValorSegmento" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:15px;" />
        <small id="pushValorAjuda" style="display:block;margin-top:5px;color:#777;"></small>
      </div>
      <div id="pushSegmentoResumo" style="margin-top:10px;padding:10px 12px;border-radius:8px;background:#f8f5ff;color:#6a0dad;font-size:13px;font-weight:700;">Se enviará a todos los clientes con notificaciones activas.</div>
      <button type="button" id="pushPreviewBtn" class="btn-secondary" style="margin-top:10px;width:100%;">CALCULAR PÚBLICO</button>
    </div>`;
  botao.parentNode.insertBefore(box, botao);

  const duracionInput = $("duracion");
  if (duracionInput && !duracionInput.dataset.uxDurationReady) {
    duracionInput.dataset.uxDurationReady = "1";
    const group = duracionInput.closest(".input-group");
    const durationLabel = group?.querySelector("label");
    const durationHelp = group?.querySelector("small");
    if (durationLabel) durationLabel.textContent = "Duración de la oferta";
    const preset = document.createElement("select");
    preset.id = "pushDuracionPreset";
    preset.innerHTML = '<option value="3600">1 hora</option><option value="10800">3 horas</option><option value="21600">6 horas</option><option value="86400">24 horas</option><option value="259200">3 días</option><option value="604800">7 días</option><option value="custom">Personalizada</option>';
    preset.style.cssText = "width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:15px;";
    duracionInput.insertAdjacentElement("beforebegin", preset);
    duracionInput.style.display = "none";
    duracionInput.value = "3600";
    if (durationHelp) durationHelp.textContent = "Define cuánto tiempo aparecerá la promoción como activa en el app.";
    preset.addEventListener("change",()=>{
      const custom=preset.value==="custom";
      duracionInput.style.display=custom?"block":"none";
      if(!custom)duracionInput.value=preset.value;
      if(custom){duracionInput.type="number";duracionInput.min="60";duracionInput.placeholder="Duración en segundos";duracionInput.focus();}
    });
  }

  const segmento = $("pushSegmento"), wrap = $("pushValorWrap"), valor = $("pushValorSegmento"), label = $("pushValorLabel"), ajuda = $("pushValorAjuda"), resumo = $("pushSegmentoResumo"), previewBtn = $("pushPreviewBtn");
  let audiencePreview = null;
  function atualizarSegmento() {
    const tipo = segmento.value;
    wrap.style.display = tipo === "todos" ? "none" : "block";
    valor.type = "text"; valor.value = "";
    audiencePreview = null;
    if (tipo === "todos") resumo.textContent = "Se enviará a todos los clientes con notificaciones activas.";
    if (tipo === "cliente") { label.textContent = "Teléfono o ID del cliente"; valor.placeholder = "Ej: 9981234567 o user_123"; ajuda.textContent = "La notificación se enviará solamente a ese cliente."; resumo.textContent = "Envío individual."; }
    if (tipo === "pontos_min") { label.textContent = "Puntos mínimos"; valor.type = "number"; valor.min = "0"; valor.placeholder = "Ej: 100"; ajuda.textContent = "Solo clientes con ese saldo o superior."; resumo.textContent = "Segmentación por saldo de puntos."; }
    if (tipo === "inativos_dias") { label.textContent = "Días sin comprar"; valor.type = "number"; valor.min = "1"; valor.placeholder = "Ej: 30"; ajuda.textContent = "Usa la última compra registrada del cliente."; resumo.textContent = "Campaña para recuperar clientes inactivos."; }
    if (tipo === "perto_recompensa") { label.textContent = "Máximo de puntos que pueden faltar"; valor.type = "number"; valor.min = "1"; valor.placeholder = "Ej: 20"; ajuda.textContent = "Ej.: 20 = clientes a 20 puntos o menos de una recompensa activa."; resumo.textContent = "Clientes próximos de alcanzar una recompensa."; }
  }
  segmento.addEventListener("change", atualizarSegmento);
  valor.addEventListener("input",()=>{ audiencePreview=null; resumo.textContent = "Cambiaste el criterio. Calcula el público nuevamente antes de enviar."; });
  atualizarSegmento();

  async function calcularPublico(){
    const tipo=segmento.value, valorSeg=valor.value.trim();
    if(tipo!=="todos"&&!valorSeg) return alert("Completa el dato de segmentación.");
    previewBtn.disabled=true; previewBtn.textContent="CALCULANDO...";
    try{
      const res=await fetch("/api/sendpush",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"preview_segment",segmento:tipo,valorSegmento:valorSeg})});
      const data=await res.json(); if(!res.ok||!data.success) throw new Error(data.error||"No se pudo calcular el público.");
      audiencePreview={segmento:tipo,valor:valorSeg,...data};
      if(data.todos) resumo.textContent="👥 Público: todos los clientes con notificaciones activas.";
      else resumo.textContent=`🎯 ${data.publico} · ${Number(data.destinatarios_estimados||0)} cliente(s) disponibles`;
      return audiencePreview;
    }catch(e){audiencePreview=null;resumo.textContent="No se pudo calcular el público.";alert(e.message)}
    finally{previewBtn.disabled=false;previewBtn.textContent="CALCULAR PÚBLICO"}
  }
  previewBtn.addEventListener("click",calcularPublico);

  const historicoCard = document.createElement("div");
  historicoCard.className = "card";
  historicoCard.innerHTML = `<h3>🔔 Historial de Notificaciones</h3><div id="pushHistoricoLista"><span style="color:#999;">Cargando...</span></div>`;
  card.parentNode.insertBefore(historicoCard, card.nextSibling);

  function escapeHtml(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }
  async function carregarHistoricoPush() {
    const lista = $("pushHistoricoLista");
    try {
      const res = await fetch(`/api/sendpush?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Error");
      const itens = data.historico || [];
      if (!itens.length) { lista.innerHTML = '<span style="color:#999;">Aún no hay notificaciones registradas.</span>'; return; }
      lista.innerHTML = itens.map(item => {
        const dataFmt = item.data ? new Date(item.data).toLocaleString("es-MX") : "";
        const destino = item.destinatarios_estimados == null ? item.publico : `${item.publico} · ${item.destinatarios_estimados} cliente(s)`;
        const pushState=item.delivery_status==="accepted_by_provider"?"✅ Aceptado por OneSignal":"Envío registrado";
        return `<div style="border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:9px;background:#fafafa;"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;"><strong style="color:#6a0dad;">${escapeHtml(item.titulo || "")}</strong><small style="color:#999;white-space:nowrap;">${escapeHtml(dataFmt)}</small></div><div style="font-size:13px;color:#666;margin-top:5px;">${escapeHtml(item.mensagem || "")}</div><div style="font-size:12px;color:#856404;background:#fff9e6;padding:6px 8px;border-radius:7px;margin-top:8px;">🎯 ${escapeHtml(destino || "")}</div><div style="font-size:11px;color:#666;margin-top:6px;">${escapeHtml(pushState)} · La entrega al dispositivo no se marca como confirmada sin recibo del proveedor.</div></div>`;
      }).join("");
    } catch (e) { lista.innerHTML = `<span style="color:#c0392b;">No se pudo cargar el historial: ${escapeHtml(e.message)}</span>`; }
  }

  window.enviarPush = async function() {
    const tituloVal = $("titulo")?.value.trim(), desc = $("desc")?.value.trim(), imagem = $("imagem")?.value.trim() || "", segundos = parseInt($("duracion")?.value || "0",10), tipo = segmento.value, valorSeg = valor.value.trim();
    if (!tituloVal || !desc) return alert("¡Por favor, completa título y mensaje!");
    if (!segundos || segundos <= 0) return alert("Ingresa una duración válida.");
    if (tipo !== "todos" && !valorSeg) return alert("Completa el dato de segmentación.");
    const exp = Date.now() + segundos * 1000;
    const link = `https://fidelidad-uai-so.vercel.app/?promo=${encodeURIComponent(tituloVal)}&desc=${encodeURIComponent(desc)}&exp=${exp}`;
    const btn = card.querySelector('button[onclick="enviarPush()"]');

    if(!audiencePreview || audiencePreview.segmento!==tipo || audiencePreview.valor!==valorSeg){
      const p=await calcularPublico();
      if(!p)return;
    }
    const qty=audiencePreview?.todos?"todos los clientes con notificaciones activas":`${Number(audiencePreview?.destinatarios_estimados||0)} cliente(s)`;
    if(!confirm(`¿Enviar esta campaña ahora?\n\nTítulo: ${tituloVal}\nPúblico: ${audiencePreview?.publico||"Todos"}\nDestinatarios: ${qty}\n\nLa notificación se enviará inmediatamente.`)) return;
    try {
      btn.disabled = true; btn.textContent = "ENVIANDO...";
      const res = await fetch("/api/sendpush", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ titulo:tituloVal, desc, link, imagem, exp, segmento:tipo, valorSegmento:valorSeg }) });
      const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error || JSON.stringify(data.details || data));
      const destino = data.destinatarios_estimados == null ? data.publico : `${data.publico} (${data.destinatarios_estimados} cliente(s))`;
      alert(`✅ Notificación enviada.\n\nPúblico: ${destino}`);
      $("titulo").value = ""; $("desc").value = ""; $("imagem").value = ""; if ($("previewImagemBox")) $("previewImagemBox").style.display = "none";
      audiencePreview=null;
      atualizarSegmento();
      await carregarHistoricoPush();
    } catch (e) { alert("No se pudo enviar la notificación.\n\n" + e.message); }
    finally { btn.disabled = false; btn.textContent = "ENVIAR PUSH AHORA"; }
  };
  carregarHistoricoPush();
})();

(() => {
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  window.salvarPromoNoFirebase=async()=>true;
  window.carregarPromos=async function(){
    const active=document.getElementById('listaPromos'),expired=document.getElementById('listaExpiradas');
    if(!active||!expired)return;
    try{
      const r=await fetch('/api/sendpush?promos=1&t='+Date.now(),{cache:'no-store'});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');
      const now=Date.now(),items=Array.isArray(d.promos)?d.promos:[];
      const render=(p,isExpired)=>'<div class="promo-item '+(isExpired?'expired-dashboard':'')+'"><strong>'+esc(p.titulo||'')+'</strong><br><small>'+esc(p.desc||'')+'</small><br><small style="color:#765b7c">🎯 '+esc(p.publico||'Todos los clientes')+'</small><div style="display:flex;gap:8px;margin-top:9px">'+(isExpired?'<button class="btn-success" data-reactivate="'+esc(p.id)+'">REACTIVAR</button>':'')+'<button class="btn-danger" data-delete="'+esc(p.id)+'">ELIMINAR</button></div></div>';
      const a=items.filter(p=>Number(p.exp||0)>now&&p.ativa!==false),e=items.filter(p=>Number(p.exp||0)<=now||p.ativa===false);
      active.innerHTML=a.length?a.map(p=>render(p,false)).join(''):'<i>No hay promociones activas.</i>';
      expired.innerHTML=e.length?e.map(p=>render(p,true)).join(''):'<i>No hay promociones expiradas.</i>';
      document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Eliminar esta promoción?'))return;await promoAction('delete_promo',b.dataset.delete);});
      document.querySelectorAll('[data-reactivate]').forEach(b=>b.onclick=async()=>{await promoAction('reactivate_promo',b.dataset.reactivate);});
    }catch(err){active.innerHTML='<i>No se pudieron cargar las promociones.</i>';expired.innerHTML='';}
  };
  async function promoAction(action,id){
    const r=await fetch('/api/sendpush',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id,seconds:86400})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Error');
    await window.carregarPromos();
  }
  window.eliminarPromo=id=>promoAction('delete_promo',id);
  window.reativarPromo=id=>promoAction('reactivate_promo',id);
  setTimeout(()=>window.carregarPromos?.(),500);
})();