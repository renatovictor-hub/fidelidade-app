(() => {
  if (document.getElementById("cumpleanosAdminCard")) return;

  const aside = document.querySelector("aside");
  if (!aside) return;

  const card = document.createElement("div");
  card.className = "card";
  card.id = "cumpleanosAdminCard";
  card.innerHTML = `
    <h3>🎂 Cumpleaños</h3>
    <div class="input-group">
      <label>Regalo de cumpleaños</label>
      <input id="cumpleRegalo" placeholder="Ej: Churro gratis">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="input-group">
        <label>Avisar antes</label>
        <input id="cumpleAntes" type="number" min="0" max="30" value="3">
      </div>
      <div class="input-group">
        <label>Validez después</label>
        <input id="cumpleDepois" type="number" min="0" max="30" value="7">
      </div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;margin:3px 0 12px;font-weight:700;">
      <input id="cumpleAtivo" type="checkbox" checked style="width:auto;"> Programa activo
    </label>
    <button id="cumpleSalvar" class="btn-primary">GUARDAR CONFIGURACIÓN</button>
    <div id="cumpleEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>

    <div style="border-top:1px solid #eee;margin-top:16px;padding-top:14px;">
      <div style="font-weight:800;color:#6a0dad;margin-bottom:8px;">Cliente seleccionado</div>
      <div id="cumpleClienteInfo" style="font-size:13px;color:#666;">Busca un cliente en “Agregar Puntos”.</div>
      <button id="cumpleCanjear" class="btn-success" style="display:none;margin-top:10px;">🎁 MARCAR REGALO COMO CANJEADO</button>
    </div>
  `;
  aside.appendChild(card);

  const $ = id => document.getElementById(id);

  async function cargarConfig(){
    try{
      const r=await fetch(`/api/sendpush?config=cumpleanos&t=${Date.now()}`,{cache:"no-store"});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Error al cargar");
      const c=data.config||{};
      $("cumpleRegalo").value=c.regalo||"";
      $("cumpleAntes").value=Number(c.dias_antes??3);
      $("cumpleDepois").value=Number(c.dias_depois??7);
      $("cumpleAtivo").checked=c.ativo!==false;
      $("cumpleEstado").textContent="Configuración cargada.";
    }catch(e){$("cumpleEstado").textContent="No se pudo cargar: "+e.message;}
  }

  $("cumpleSalvar").onclick=async()=>{
    const cfg={
      regalo:$("cumpleRegalo").value.trim()||"Regalo especial de cumpleaños",
      dias_antes:Math.max(0,Number($("cumpleAntes").value||0)),
      dias_depois:Math.max(0,Number($("cumpleDepois").value||0)),
      ativo:$("cumpleAtivo").checked,
      updated_at:new Date().toISOString()
    };
    const r=await fetch("/api/sendpush",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save_config",config:"cumpleanos",value:cfg})});
    const data=await r.json().catch(()=>({}));
    $("cumpleEstado").textContent=r.ok?"✅ Configuración guardada.":"❌ "+(data.error||"Error al guardar.");
  };

  function actualizarCliente(){
    try{
      if(typeof clienteSelecionado==="undefined"||!clienteSelecionado){
        $("cumpleClienteInfo").textContent='Busca un cliente en “Agregar Puntos”.';
        $("cumpleCanjear").style.display="none";
        return;
      }
      const n=clienteSelecionado.nascimento||"No registrada";
      const ano=new Date().getFullYear();
      const canjeado=clienteSelecionado.cumpleanos_canjes?.[String(ano)]===true;
      $("cumpleClienteInfo").innerHTML=`🎂 Nacimiento: <b>${n}</b><br>Regalo ${ano}: <b>${canjeado?"YA CANJEADO":"disponible si está dentro de la ventana"}</b>`;
      $("cumpleCanjear").style.display=canjeado?"none":"block";
    }catch(_){}
  }

  $("cumpleCanjear").onclick=async()=>{
    if(typeof clienteSelecionado==="undefined"||!clienteSelecionado?.uid) return alert("Busca un cliente primero.");
    const ano=new Date().getFullYear();
    if(!confirm("¿Marcar el regalo de cumpleaños como canjeado?")) return;
    const r=await fetch("/api/sendpush",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"birthday_redeem",uid:clienteSelecionado.uid})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) return alert(data.error||"No se pudo registrar el canje.");
    clienteSelecionado.cumpleanos_canjes={...(clienteSelecionado.cumpleanos_canjes||{}),[ano]:true};
    actualizarCliente();
    alert("✅ Regalo de cumpleaños marcado como canjeado.");
  };

  const alvo=document.getElementById("clienteEncontrado");
  if(alvo) new MutationObserver(actualizarCliente).observe(alvo,{attributes:true,childList:true,subtree:true});
  setInterval(actualizarCliente,1500);
  cargarConfig();
})();