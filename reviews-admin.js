(() => {
  if(document.getElementById("reviewsOpinionesAdminCard")) return;
  const aside=document.querySelector("aside"); if(!aside) return;
  const $=id=>document.getElementById(id);
  let feedbackCache=[];

  function esc(v){
    return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  }

  const opinions=document.createElement("div");
  opinions.className="card";
  opinions.id="reviewsOpinionesAdminCard";
  opinions.innerHTML=`
    <h3>⭐ Opiniones de clientes</h3>
    <div style="font-size:13px;color:#666;margin-bottom:12px;">
      Consulta todas las opiniones o solo las del cliente que acabas de buscar.
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
      <button type="button" id="reviewsFiltroTodas" class="btn-primary" style="width:auto;padding:9px 12px;font-size:12px;">TODAS</button>
      <button type="button" id="reviewsFiltroCliente" class="btn-secondary" style="width:auto;padding:9px 12px;font-size:12px;">CLIENTE SELECCIONADO</button>
    </div>
    <div id="reviewsFiltroEstado" style="font-size:12px;color:#777;margin-bottom:10px;">Mostrando todas las opiniones.</div>
    <div id="reviewsLista" style="font-size:12px;color:#666;">Cargando...</div>
  `;
  aside.appendChild(opinions);

  const config=document.createElement("div");
  config.className="card";
  config.id="reviewsConfigAdminCard";
  config.innerHTML=`
    <h3>⚙ Configuración de Google Reviews</h3>
    <div style="font-size:13px;color:#666;margin-bottom:14px;">
      Define cuándo pedir una opinión y qué enlace de Google mostrar al cliente.
    </div>
    <div class="input-group"><label>Link de reseña de Google</label><input id="reviewsGoogleUrl" type="url" placeholder="https://g.page/r/...."></div>
    <div class="input-group"><label>Preguntar hasta X días después de la compra</label><input id="reviewsDias" type="number" min="1" max="30" value="3"></div>
    <label style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;font-weight:700;"><input id="reviewsAtivo" type="checkbox" checked style="width:auto;"> Solicitar opiniones</label>
    <button id="reviewsSalvar" class="btn-primary">GUARDAR CONFIGURACIÓN</button>
    <div id="reviewsEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>
  `;
  aside.appendChild(config);

  function clienteActual(){
    try{return typeof clienteSelecionado!=="undefined" ? clienteSelecionado : null}catch(_){return null}
  }

  function coincideCliente(item,cliente){
    if(!cliente) return false;
    const uid=String(cliente.uid||"").trim();
    const tel=String(cliente.telefone||"").replace(/\D/g,"");
    const itemUid=String(item.uid||item.user_id||item.cliente_uid||"").trim();
    const itemTel=String(item.telefone||item.phone||"").replace(/\D/g,"");
    return (uid && itemUid && uid===itemUid) || (tel && itemTel && tel===itemTel);
  }

  function renderOpiniones(mode="todas"){
    const lista=$("reviewsLista");
    if(!lista)return;
    const cliente=clienteActual();
    let itens=[...feedbackCache];
    if(mode==="cliente"){
      if(!cliente?.uid && !cliente?.telefone){
        $("reviewsFiltroEstado").textContent="Busca un cliente primero para ver sus opiniones.";
        lista.innerHTML='<span style="color:#999;">No hay cliente seleccionado.</span>';
        return;
      }
      itens=itens.filter(x=>coincideCliente(x,cliente));
      $("reviewsFiltroEstado").textContent=`Opiniones de ${cliente.nome||cliente.telefone||"cliente seleccionado"}.`;
    }else{
      $("reviewsFiltroEstado").textContent="Mostrando todas las opiniones.";
    }
    $("reviewsFiltroTodas").className=mode==="todas"?"btn-primary":"btn-secondary";
    $("reviewsFiltroCliente").className=mode==="cliente"?"btn-primary":"btn-secondary";
    lista.innerHTML=itens.length?itens.slice(0,30).map(x=>`
      <div style="padding:10px 0;border-bottom:1px solid #eee;">
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <div><b>${"★".repeat(Number(x.estrelas||0))}</b> — ${esc(x.nome||x.telefone||"Cliente")}</div>
          <small style="color:#999;">${x.data?esc(new Date(x.data).toLocaleDateString("es-MX")):""}</small>
        </div>
        <div style="color:#777;margin-top:3px;">${x.comentario?esc(x.comentario):"Sin comentario"}</div>
      </div>`).join(""):"Todavía no hay opiniones para este filtro.";
  }

  async function cargarConfig(){
    try{
      const rr=await fetch(`/api/sendpush?config=reviews&t=${Date.now()}`,{cache:"no-store"});
      const d=await rr.json(); if(!rr.ok) throw new Error(d.error||"Error");
      const cfg=d.config||{};
      $("reviewsGoogleUrl").value=cfg.google_url||"";
      $("reviewsDias").value=Number(cfg.dias_apos_compra??3);
      $("reviewsAtivo").checked=cfg.ativo!==false;
      $("reviewsEstado").textContent=cfg.ativo===false?"Solicitudes desactivadas":"✅ Solicitudes activas";
    }catch(e){$("reviewsEstado").textContent="No se pudo cargar: "+e.message;}
  }

  async function cargarLista(){
    try{
      const rr=await fetch(`/api/sendpush?feedback=1&t=${Date.now()}`,{cache:"no-store"});
      const d=await rr.json(); if(!rr.ok) throw new Error(d.error||"Error");
      feedbackCache=Array.isArray(d.feedback)?d.feedback:[];
      renderOpiniones(opinions.dataset.mode||"todas");
    }catch(e){$("reviewsLista").textContent="No se pudo cargar."; }
  }

  $("reviewsFiltroTodas").onclick=()=>{opinions.dataset.mode="todas";renderOpiniones("todas")};
  $("reviewsFiltroCliente").onclick=()=>{opinions.dataset.mode="cliente";renderOpiniones("cliente")};

  $("reviewsSalvar").onclick=async()=>{
    const value={
      ativo:$("reviewsAtivo").checked,
      google_url:$("reviewsGoogleUrl").value.trim(),
      dias_apos_compra:Number($("reviewsDias").value||3)
    };
    const rr=await fetch("/api/sendpush",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save_config",config:"reviews",value})});
    const d=await rr.json().catch(()=>({}));
    $("reviewsEstado").textContent=rr.ok?"✅ Configuración guardada":"❌ "+(d.error||"Error al guardar.");
  };

  window.actualizarOpinionesCliente=()=> {
    if(opinions.dataset.mode==="cliente") renderOpiniones("cliente");
  };

  cargarConfig();
  cargarLista();
})();