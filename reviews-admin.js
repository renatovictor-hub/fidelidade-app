(() => {
  if(document.getElementById("reviewsAdminCard")) return;
  const aside=document.querySelector("aside"); if(!aside) return;
  const card=document.createElement("div");
  card.className="card"; card.id="reviewsAdminCard";
  card.innerHTML=`
    <h3>⭐ Opiniones y Google Reviews</h3>
    <div style="font-size:13px;color:#666;margin-bottom:14px;">Pide una opinión después de una compra y facilita que el cliente comparta una reseña en Google.</div>
    <div class="input-group"><label>Link de reseña de Google</label><input id="reviewsGoogleUrl" type="url" placeholder="https://g.page/r/...."></div>
    <div class="input-group"><label>Preguntar hasta X días después de la compra</label><input id="reviewsDias" type="number" min="1" max="30" value="3"></div>
    <label style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;font-weight:700;"><input id="reviewsAtivo" type="checkbox" checked style="width:auto;"> Solicitar opiniones</label>
    <button id="reviewsSalvar" class="btn-primary">GUARDAR OPINIONES</button>
    <div id="reviewsEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>
    <div style="border-top:1px solid #eee;margin-top:16px;padding-top:14px;">
      <div style="font-weight:800;color:#6a0dad;margin-bottom:8px;">Últimas opiniones</div>
      <div id="reviewsLista" style="font-size:12px;color:#666;">Cargando...</div>
    </div>
  `;
  aside.appendChild(card);
  const $=id=>document.getElementById(id);

  async function cargarConfig(){
    try{
      const r=await fetch(`/api/sendpush?config=reviews&t=${Date.now()}`,{cache:"no-store"});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Error");
      const c=d.config||{};
      $("reviewsGoogleUrl").value=c.google_url||"";
      $("reviewsDias").value=Number(c.dias_apos_compra??3);
      $("reviewsAtivo").checked=c.ativo!==false;
      $("reviewsEstado").textContent=c.ativo===false?"Solicitudes desactivadas":"✅ Solicitudes activas";
    }catch(e){$("reviewsEstado").textContent="No se pudo cargar: "+e.message;}
  }

  async function cargarLista(){
    try{
      const r=await fetch(`/api/sendpush?feedback=1&t=${Date.now()}`,{cache:"no-store"});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Error");
      const itens=(d.feedback||[]).slice(0,8);
      $("reviewsLista").innerHTML=itens.length?itens.map(x=>`
        <div style="padding:8px 0;border-bottom:1px solid #eee;">
          <div><b>${"★".repeat(Number(x.estrelas||0))}</b> — ${x.nome||x.telefone||"Cliente"}</div>
          <div style="color:#777;margin-top:2px;">${x.comentario?String(x.comentario).replace(/[<>]/g,""):"Sin comentario"}</div>
        </div>`).join(""):"Todavía no hay opiniones.";
    }catch(e){$("reviewsLista").textContent="No se pudo cargar."; }
  }

  $("reviewsSalvar").onclick=async()=>{
    const value={
      ativo:$("reviewsAtivo").checked,
      google_url:$("reviewsGoogleUrl").value.trim(),
      dias_apos_compra:Number($("reviewsDias").value||3)
    };
    const r=await fetch("/api/sendpush",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save_config",config:"reviews",value})});
    const d=await r.json().catch(()=>({}));
    $("reviewsEstado").textContent=r.ok?"✅ Configuración guardada":"❌ "+(d.error||"Error al guardar.");
  };

  cargarConfig(); cargarLista();
})();