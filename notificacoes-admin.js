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
    </div>`;
  botao.parentNode.insertBefore(box, botao);

  const segmento = $("pushSegmento"), wrap = $("pushValorWrap"), valor = $("pushValorSegmento"), label = $("pushValorLabel"), ajuda = $("pushValorAjuda"), resumo = $("pushSegmentoResumo");
  function atualizarSegmento() {
    const tipo = segmento.value;
    wrap.style.display = tipo === "todos" ? "none" : "block";
    valor.type = "text"; valor.value = "";
    if (tipo === "todos") resumo.textContent = "Se enviará a todos los clientes con notificaciones activas.";
    if (tipo === "cliente") { label.textContent = "Teléfono o ID del cliente"; valor.placeholder = "Ej: 9981234567 o user_123"; ajuda.textContent = "La notificación se enviará solamente a ese cliente."; resumo.textContent = "Envío individual."; }
    if (tipo === "pontos_min") { label.textContent = "Puntos mínimos"; valor.type = "number"; valor.min = "0"; valor.placeholder = "Ej: 100"; ajuda.textContent = "Solo clientes con ese saldo o superior."; resumo.textContent = "Segmentación por saldo de puntos."; }
    if (tipo === "inativos_dias") { label.textContent = "Días sin comprar"; valor.type = "number"; valor.min = "1"; valor.placeholder = "Ej: 30"; ajuda.textContent = "Usa la última compra registrada del cliente."; resumo.textContent = "Campaña para recuperar clientes inactivos."; }
    if (tipo === "perto_recompensa") { label.textContent = "Máximo de puntos que pueden faltar"; valor.type = "number"; valor.min = "1"; valor.placeholder = "Ej: 20"; ajuda.textContent = "Ej.: 20 = clientes a 20 puntos o menos de una recompensa activa."; resumo.textContent = "Clientes próximos de alcanzar una recompensa."; }
  }
  segmento.addEventListener("change", atualizarSegmento); atualizarSegmento();

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
      lista.innerHTML = itens.slice(0,15).map(item => {
        const dataFmt = item.data ? new Date(item.data).toLocaleString("es-MX") : "";
        const destino = item.destinatarios_estimados == null ? item.publico : `${item.publico} · ${item.destinatarios_estimados} cliente(s)`;
        return `<div style="border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:9px;background:#fafafa;"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;"><strong style="color:#6a0dad;">${escapeHtml(item.titulo || "")}</strong><small style="color:#999;white-space:nowrap;">${escapeHtml(dataFmt)}</small></div><div style="font-size:13px;color:#666;margin-top:5px;">${escapeHtml(item.mensagem || "")}</div><div style="font-size:12px;color:#856404;background:#fff9e6;padding:6px 8px;border-radius:7px;margin-top:8px;">🎯 ${escapeHtml(destino || "")}</div></div>`;
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
    try {
      btn.disabled = true; btn.textContent = "ENVIANDO...";
      const res = await fetch("/api/sendpush", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ titulo:tituloVal, desc, link, imagem, segmento:tipo, valorSegmento:valorSeg }) });
      const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error || JSON.stringify(data.details || data));
      if (typeof window.salvarPromoNoFirebase === "function") await window.salvarPromoNoFirebase(tituloVal, desc, exp, imagem);
      const destino = data.destinatarios_estimados == null ? data.publico : `${data.publico} (${data.destinatarios_estimados} cliente(s))`;
      alert(`✅ Notificación enviada.\n\nPúblico: ${destino}`);
      $("titulo").value = ""; $("desc").value = ""; $("imagem").value = ""; if ($("previewImagemBox")) $("previewImagemBox").style.display = "none";
      await carregarHistoricoPush();
    } catch (e) { alert("No se pudo enviar la notificación.\n\n" + e.message); }
    finally { btn.disabled = false; btn.textContent = "ENVIAR PUSH AHORA"; }
  };
  carregarHistoricoPush();
})();
