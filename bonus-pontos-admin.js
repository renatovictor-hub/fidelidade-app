(() => {
  const FB = "https://fidelidade-app-9671c-default-rtdb.firebaseio.com";
  if (document.getElementById("bonusPontosAdminCard")) return;

  const aside = document.querySelector("aside");
  if (!aside) return;

  const dias = [
    [1,"Lun"],[2,"Mar"],[3,"Mié"],[4,"Jue"],[5,"Vie"],[6,"Sáb"],[0,"Dom"]
  ];

  const card = document.createElement("div");
  card.className = "card";
  card.id = "bonusPontosAdminCard";
  card.innerHTML = `
    <h3>⚡ Puntos Bonus</h3>
    <div style="font-size:13px;color:#666;margin-bottom:14px;">
      Multiplica automáticamente los puntos en días y horarios específicos.
    </div>

    <div class="input-group">
      <label>Multiplicador</label>
      <select id="bonusMultiplicador">
        <option value="1.5">x1.5</option>
        <option value="2" selected>x2</option>
        <option value="3">x3</option>
        <option value="4">x4</option>
        <option value="5">x5</option>
      </select>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="input-group">
        <label>Desde</label>
        <input id="bonusInicio" type="time" value="14:00">
      </div>
      <div class="input-group">
        <label>Hasta</label>
        <input id="bonusFim" type="time" value="17:00">
      </div>
    </div>

    <label style="margin-bottom:7px;">Días activos</label>
    <div id="bonusDias" style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:13px;">
      ${dias.map(([v,n])=>`<label style="display:flex;align-items:center;gap:5px;background:#f8f5ff;border:1px solid #e4d8f5;border-radius:8px;padding:8px;font-size:12px;"><input type="checkbox" value="${v}" style="width:auto;">${n}</label>`).join("")}
    </div>

    <label style="display:flex;align-items:center;gap:8px;margin:4px 0 12px;font-weight:700;">
      <input id="bonusAtivo" type="checkbox" style="width:auto;"> Activar puntos bonus
    </label>

    <button id="bonusSalvar" class="btn-primary">GUARDAR BONUS</button>
    <div id="bonusEstado" style="font-size:12px;color:#777;margin-top:9px;"></div>
  `;
  aside.appendChild(card);

  const $ = id => document.getElementById(id);

  async function carregar(){
    try {
      const r=await fetch(`${FB}/config/bonus_pontos.json?t=${Date.now()}`,{cache:"no-store"});
      const c=await r.json()||{};
      $("bonusMultiplicador").value=String(c.multiplicador||2);
      $("bonusInicio").value=c.inicio||"14:00";
      $("bonusFim").value=c.fim||"17:00";
      $("bonusAtivo").checked=c.ativo===true;
      const escolhidos=Array.isArray(c.dias)?c.dias.map(Number):[];
      document.querySelectorAll("#bonusDias input[type=checkbox]").forEach(x=>x.checked=escolhidos.includes(Number(x.value)));
      $("bonusEstado").textContent=c.ativo===true?"✅ Bonus activo":"Bonus desactivado";
    } catch(e) {
      $("bonusEstado").textContent="No se pudo cargar: "+e.message;
    }
  }

  $("bonusSalvar").onclick=async()=>{
    const diasAtivos=[...document.querySelectorAll("#bonusDias input:checked")].map(x=>Number(x.value));
    if(!diasAtivos.length) return alert("Selecciona por lo menos un día.");
    const cfg={
      ativo:$("bonusAtivo").checked,
      multiplicador:Number($("bonusMultiplicador").value||2),
      inicio:$("bonusInicio").value||"00:00",
      fim:$("bonusFim").value||"23:59",
      dias:diasAtivos,
      updated_at:new Date().toISOString()
    };
    const r=await fetch(`${FB}/config/bonus_pontos.json`,{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(cfg)
    });
    $("bonusEstado").textContent=r.ok
      ? (cfg.ativo?"✅ Bonus activo y guardado":"✅ Configuración guardada; bonus desactivado")
      : "❌ Error al guardar.";
  };

  // Atualiza o preview de pontos do dashboard de acordo com a regra salva.
  let cfgAtual=null;
  async function getCfg(){
    if(cfgAtual) return cfgAtual;
    try{
      const r=await fetch(`${FB}/config/bonus_pontos.json?t=${Date.now()}`,{cache:"no-store"});
      cfgAtual=await r.json()||{};
    }catch(_){cfgAtual={};}
    return cfgAtual;
  }

  const calcOriginal=window.calcularPontosCompra;
  window.calcularPontosCompra=async function(){
    const valor=Number(document.getElementById("valorCompra")?.value||0);
    const base=Math.floor(valor/10);
    const cfg=await getCfg();

    const agora=new Date(new Date().toLocaleString("en-US",{timeZone:"America/Cancun"}));
    const dia=agora.getDay();
    const hhmm=`${String(agora.getHours()).padStart(2,"0")}:${String(agora.getMinutes()).padStart(2,"0")}`;
    const diasCfg=Array.isArray(cfg.dias)?cfg.dias.map(Number):[];
    const ini=String(cfg.inicio||"00:00"), fim=String(cfg.fim||"23:59");
    const dentro=ini<=fim?(hhmm>=ini&&hhmm<=fim):(hhmm>=ini||hhmm<=fim);
    const ativo=cfg.ativo===true&&diasCfg.includes(dia)&&dentro;
    const mult=ativo?Number(cfg.multiplicador||1):1;
    const total=Math.floor(base*mult);

    const el=document.getElementById("previewPontos");
    if(el) el.innerText=ativo
      ? `⚡ ${total} puntos (bonus x${mult}; base ${base})`
      : `⭐ ${base} puntos`;
  };

  ["bonusSalvar","bonusAtivo","bonusMultiplicador","bonusInicio","bonusFim"].forEach(id=>{
    const el=$(id); if(el) el.addEventListener("change",()=>{cfgAtual=null;});
  });
  document.querySelectorAll("#bonusDias input").forEach(el=>el.addEventListener("change",()=>{cfgAtual=null;}));

  carregar();
})();