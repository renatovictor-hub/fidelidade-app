(() => {
  if (document.getElementById("referidosAdminCard")) return;
  const aside=document.querySelector("aside");
  if(!aside) return;

  const card=document.createElement("div");
  card.className="card";
  card.id="referidosAdminCard";
  card.innerHTML=`
    <h3>🤝 Invita a un amigo</h3>
    <div style="font-size:13px;color:#666;margin-bottom:14px;">
      Define la recompensa cuando un cliente invitado realiza su primera compra válida.
    </div>
    <div class="input-group">
      <label>Puntos para quien invita</label>
      <input id="refPuntosIndicador" type="number" min="0" value="20">
    </div>
    <div class="input-group">
      <label>Puntos para el nuevo cliente</label>
      <input id="refPuntosAmigo" type="number" min="0" value="10">
    </div>
    <div class="input-group">
      <label>Compra mínima para activar (MXN)</label>
      <input id="refCompraMinima" type="number" min="0" step="1" value="100">
    </div>
    <label style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;font-weight:700;">
      <input id="refAtivo" type="checkbox" checked style="width:auto;"> Programa activo
    </label>
    <button id="refSalvar" class="btn-primary">GUARDAR INDICACIONES</button>
    <div id="refEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>
  `;
  aside.appendChild(card);

  const $=id=>document.getElementById(id);

  async function carregar(){
    try{
      const r=await fetch(`/api/sendpush?config=referidos&t=${Date.now()}`,{cache:"no-store"});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Error al cargar");
      const c=data.config||{};
      $("refPuntosIndicador").value=Number(c.pontos_indicador??20);
      $("refPuntosAmigo").value=Number(c.pontos_amigo??10);
      $("refCompraMinima").value=Number(c.compra_minima??100);
      $("refAtivo").checked=c.ativo!==false;
      $("refEstado").textContent=c.ativo===false?"Programa desactivado":"✅ Programa activo";
    }catch(e){
      $("refEstado").textContent="No se pudo cargar: "+e.message;
    }
  }

  $("refSalvar").onclick=async()=>{
    const value={
      ativo:$("refAtivo").checked,
      pontos_indicador:Number($("refPuntosIndicador").value||0),
      pontos_amigo:Number($("refPuntosAmigo").value||0),
      compra_minima:Number($("refCompraMinima").value||0)
    };
    const r=await fetch("/api/sendpush",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"save_config",config:"referidos",value})
    });
    const data=await r.json().catch(()=>({}));
    $("refEstado").textContent=r.ok
      ? (value.ativo?"✅ Programa guardado y activo":"✅ Guardado; programa desactivado")
      : "❌ "+(data.error||"Error al guardar.");
  };

  carregar();
})();