(() => {
  if(document.getElementById('uaiHelpStyles')) return;

  const HELP=[
    {keys:['nueva misión'],legend:'Crea un reto con una meta, un plazo y un premio para incentivar una conducta específica.',use:'Sirve para motivar al cliente a comprar más veces, gastar más o acumular puntos dentro de un período.',how:'Define qué debe lograr, cuánto tiempo tiene y qué premio recibe al completar la meta.',example:'3 compras en 30 días → +50 puntos.',benefit:'Convierte la fidelidad en un juego con una meta clara y aumenta la frecuencia de compra.'},
    {keys:['nueva automatización'],legend:'Crea una regla que detecta automáticamente qué clientes cumplen una condición y prepara una campaña para ellos.',use:'Sirve para encontrar públicos como inactivos, nuevos, frecuentes o clientes cerca de una recompensa.',how:'Elige la condición, define el umbral y escribe el push. El sistema calcula el público y tú confirmas el envío.',example:'30 días sin comprar → enviar “Te extrañamos”.',benefit:'Reduce trabajo manual y permite actuar sobre clientes en el momento correcto.'},
    {keys:['salud de la base'],legend:'Resume la actividad de tus clientes y ayuda a detectar quién necesita una acción.',use:'Muestra rápidamente clientes activos, inactivos y nuevos.',how:'Úsalo como punto de partida para decidir a quién contactar o incentivar.',example:'Si aumentan los inactivos +30d, puedes crear una campaña de regreso.',benefit:'Ayuda a recuperar clientes antes de perderlos.'},
    {keys:['base de clientes'],legend:'Busca, filtra y analiza tus clientes para entender su valor y frecuencia.',use:'Funciona como tu CRM de clientes.',how:'Busca por nombre o teléfono, filtra y abre el perfil para tomar una acción.',example:'Filtra inactivos y envíales una oferta de regreso.',benefit:'Centraliza la relación con el cliente y facilita la retención.'},
    {keys:['opiniones de clientes'],legend:'Analiza la satisfacción de tus clientes y actúa sobre comentarios que necesitan atención.',use:'Agrupa calificaciones y comentarios recibidos.',how:'Filtra por estrellas, abre el cliente y responde con una acción.',example:'Una opinión de 2★ puede generar contacto por WhatsApp y una recompensa compensatoria.',benefit:'Convierte una mala experiencia en una oportunidad de recuperación.'},
    {keys:['registrar compra'],legend:'Registra compras presenciales y acredita automáticamente los puntos del cliente.',use:'Es la operación principal de fidelidad en caja.',how:'Identifica al cliente, informa el valor de la compra y confirma.',example:'Compra de MX$350 → 35 puntos con la regla MX$10 = 1 punto.',benefit:'Hace que cada compra acerque al cliente a un beneficio.'},
    {keys:['canjear recompensa'],legend:'Permite usar los puntos acumulados para obtener una recompensa disponible.',use:'Valida y descuenta los puntos del cliente.',how:'Selecciona un cliente y elige una recompensa que tenga saldo suficiente para canjear.',example:'Cliente con 600 pts canjea una recompensa de 500 pts y queda con 100 pts.',benefit:'Da valor real a los puntos y motiva nuevas compras.'},
    {keys:['movimientos'],legend:'Consulta entradas y salidas de puntos del cliente seleccionado.',use:'Es el historial de fidelidad del cliente.',how:'Revisa compras, puntos acreditados y canjes para resolver dudas o auditorías.',example:'Puedes confirmar por qué el saldo bajó después de un canje.',benefit:'Reduce errores y da trazabilidad al programa.'},
    {keys:['misiones'],legend:'Crea retos que motivan al cliente a comprar más veces o alcanzar una meta.',use:'Gamifica el programa de fidelidad.',how:'Define la meta, el período y el premio. El cliente ve su progreso en el app.',example:'Haz 3 compras en 30 días y gana 50 puntos.',benefit:'Aumenta frecuencia y crea razones concretas para volver.'},
    {keys:['automatizaciones'],legend:'Activa clientes según su comportamiento sin tener que buscarlos uno por uno.',use:'Segmenta automáticamente y prepara mensajes para públicos específicos.',how:'Elige la regla, configura el mensaje y revisa cuántos clientes entran antes de ejecutar.',example:'Clientes con 30 días sin comprar reciben una invitación para regresar.',benefit:'Reduce trabajo manual y ayuda a recuperar ventas.'},
    {keys:['resultados de fidelidad','resultados'],legend:'Mide ventas, frecuencia, ticket y canjes generados por clientes del programa.',use:'Muestra el impacto comercial de fidelidad.',how:'Compara compras, ticket medio, canjes y segmentos para decidir qué estrategia mantener.',example:'Si sube la frecuencia de clientes activos después de una misión, esa acción está funcionando.',benefit:'Permite demostrar el retorno del programa de fidelidad.'},
    {keys:['segmentos automáticos'],legend:'Agrupa clientes automáticamente según su comportamiento.',use:'Crea públicos listos para campañas y análisis.',how:'Usa segmentos como nuevos, frecuentes, inactivos o alto gasto para acciones específicas.',example:'Envía una campaña exclusiva a clientes de alto gasto.',benefit:'Hace la comunicación más relevante y evita enviar lo mismo para todos.'},
    {keys:['sorpresa / beneficio destacado'],legend:'Configura un beneficio especial que aparece en el app para clientes elegibles.',use:'Crea sensación de exclusividad dentro del programa.',how:'Define el beneficio y el nivel VIP mínimo que debe tener el cliente.',example:'Clientes Oro reciben acceso anticipado a un sabor especial.',benefit:'Aumenta el valor percibido de subir de nivel.'},
    {keys:['configuración de fidelidad'],legend:'Agrupa reglas que normalmente no necesitas cambiar durante la operación diaria.',use:'Centraliza niveles, bonus, referidos y reglas del programa.',how:'Configura una vez y revisa cuando quieras cambiar la estrategia.',example:'Activa puntos dobles los martes o cambia los límites VIP.',benefit:'Mantiene la operación diaria limpia sin perder control del programa.'},
    {keys:['acumulación de puntos'],legend:'Define cuántos pesos debe gastar un cliente para ganar 1 punto base.',use:'Controla la velocidad real de acumulación de puntos del programa.',how:'Configura cuántos MXN equivalen a 1 punto. Las próximas compras usarán la nueva regla.',example:'MX$10 = 1 punto: una compra de MX$300 genera 30 puntos base.',benefit:'Permite adaptar la economía del programa a cada restaurante sin cambiar código.'},
    {keys:['niveles vip'],legend:'Define cuándo un cliente sube de nivel según sus puntos acumulados históricos.',use:'Crea progresión y reconocimiento para clientes frecuentes.',how:'Configura los límites de Plata, Oro y Diamante.',example:'Oro desde 800 puntos acumulados.',benefit:'Da al cliente una meta de largo plazo y premia la recurrencia.'},
    {keys:['puntos bonus'],legend:'Multiplica temporalmente los puntos en días y horarios específicos.',use:'Sirve para incentivar compras en períodos estratégicos.',how:'Elige multiplicador, días y horario y activa la regla.',example:'Martes de 14:00 a 17:00 = puntos x2.',benefit:'Ayuda a mover ventas hacia horarios de menor demanda.'},
    {keys:['invita a un amigo'],legend:'Configura premios para clientes que recomiendan nuevos clientes.',use:'Convierte clientes actuales en promotores del restaurante.',how:'Define puntos para quien invita, para el nuevo cliente y compra mínima.',example:'20 pts para quien invita + 10 pts para el amigo después de una compra de MX$100.',benefit:'Aumenta adquisición usando recomendaciones de clientes reales.'},
    {keys:['recompensas'],legend:'Configura los premios que el cliente puede obtener usando sus puntos.',use:'Es el catálogo de beneficios del programa.',how:'Crea la recompensa, define el costo en puntos y mantenla activa o inactiva.',example:'500 puntos = coxinha gratis.',benefit:'Da una razón concreta para acumular puntos y volver.'},
    {keys:['cumpleaños'],legend:'Configura beneficios y acciones relacionadas con el cumpleaños del cliente.',use:'Permite crear una experiencia personalizada en una fecha relevante.',how:'Define el beneficio y revisa los clientes con cumpleaños próximos.',example:'Regalo válido durante la semana del cumpleaños.',benefit:'Fortalece la relación emocional con el cliente.'},
    {keys:['enviar push','promoción','ofertas'],legend:'Crea mensajes y promociones para activar clientes y generar nuevas compras.',use:'Comunica ofertas directamente a clientes conectados.',how:'Define el mensaje, público y período antes de enviar.',example:'Oferta especial para clientes inactivos durante esta semana.',benefit:'Genera tráfico y permite campañas segmentadas.'},
    {keys:['pedidos'],legend:'Administra los pedidos y su avance desde que llegan hasta que terminan.',use:'Centraliza la operación de pedidos.',how:'Actualiza cada pedido según su etapa de preparación o entrega.',example:'Recibido → aceptado → preparando → listo → entregado.',benefit:'Reduce errores y mantiene al cliente informado.'},
    {keys:['entregas'],legend:'Organiza los pedidos que están listos o en proceso de entrega.',use:'Separa la logística de entrega de la producción.',how:'Revisa dirección, tarifa y estado para despachar cada pedido.',example:'Un pedido listo pasa a esperando repartidor y después a en camino.',benefit:'Da visibilidad a la última etapa del pedido.'},
    {keys:['tarifas por distancia','configurar envío'],legend:'Define cómo se calcula el costo de entrega según distancia y condiciones especiales.',use:'Controla las reglas de cobro de delivery.',how:'Revisa tarifas, recargos y condiciones aplicadas en checkout.',example:'0–2,5 km = MX$40; más de 10 km suma un valor adicional.',benefit:'Evita cobrar de menos y estandariza el envío.'},
    {keys:['reportes','visión del negocio'],legend:'Resume indicadores para entender cómo está funcionando el negocio.',use:'Convierte datos de clientes, pedidos y fidelidad en métricas útiles.',how:'Revisa tendencias y compara indicadores antes de tomar decisiones.',example:'Ticket medio, clientes activos y ventas de fidelidad.',benefit:'Ayuda a decidir con datos en lugar de intuición.'},
    {keys:['ajustes','configuración de google reviews'],legend:'Centraliza configuraciones generales que no necesitas tocar todos los días.',use:'Guarda parámetros del sistema y de la empresa.',how:'Cambia únicamente cuando quieras modificar una regla permanente.',example:'Actualizar el enlace de Google Reviews.',benefit:'Mantiene las funciones operativas separadas de la configuración técnica.'}
  ];

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const findHelp=title=>HELP.find(h=>h.keys.some(k=>norm(title).includes(norm(k))))||null;

  const style=document.createElement('style');
  style.id='uaiHelpStyles';
  style.textContent=`
    .uai-help-ready{position:relative}
    .uai-help-btn{position:absolute!important;right:12px;top:12px;width:30px!important;height:30px!important;min-height:30px!important;padding:0!important;border-radius:50%!important;border:1px solid #dfd3e5!important;background:#f7f1fa!important;color:#6a0dad!important;font-size:14px!important;font-weight:900!important;display:grid!important;place-items:center!important;z-index:5;cursor:pointer}
    .uai-help-ready>h2:first-child,.uai-help-ready>h3:first-child{padding-right:38px}
    .uai-help-legend{font-size:12px!important;color:#665b6b!important;line-height:1.5!important;margin:4px 42px 12px 0!important}
    #uaiHelpPopover{display:none;position:fixed;z-index:12000;width:min(360px,calc(100vw - 24px));background:#fff;border:1px solid #dfd3e5;border-radius:14px;padding:14px;box-shadow:0 18px 50px rgba(44,20,54,.22)}
    #uaiHelpPopover.show{display:block}
    #uaiHelpPopover h4{margin:0 28px 9px 0;font-size:16px;color:#4a3155}
    #uaiHelpPopover .close{position:absolute;right:9px;top:8px;border:0!important;background:transparent!important;width:30px!important;min-height:30px!important;padding:0!important;color:#725e79!important;font-size:18px!important}
    .uai-help-line{margin:7px 0;font-size:12px;line-height:1.45;color:#55495a}.uai-help-line b{color:#6a0dad}
    @media(max-width:780px){.uai-help-btn{right:9px;top:9px}.uai-help-legend{margin-right:34px!important}}
  `;
  document.head.appendChild(style);

  const pop=document.createElement('div');pop.id='uaiHelpPopover';pop.setAttribute('role','dialog');pop.innerHTML='<button class="close" aria-label="Cerrar">×</button><div id="uaiHelpContent"></div>';document.body.appendChild(pop);
  const content=document.getElementById('uaiHelpContent');
  function close(){pop.classList.remove('show')}
  pop.querySelector('.close').onclick=close;
  document.addEventListener('click',e=>{if(pop.classList.contains('show')&&!pop.contains(e.target)&&!e.target.closest('.uai-help-btn'))close()});
  window.addEventListener('resize',close);window.addEventListener('scroll',close,true);

  function open(btn,h,title){
    content.innerHTML='<h4>'+title+'</h4>'+
      '<div class="uai-help-line"><b>Para qué sirve:</b> '+h.use+'</div>'+
      '<div class="uai-help-line"><b>Cómo usar:</b> '+h.how+'</div>'+
      '<div class="uai-help-line"><b>Ejemplo:</b> '+h.example+'</div>'+
      '<div class="uai-help-line"><b>Beneficio:</b> '+h.benefit+'</div>';
    pop.classList.add('show');
    const r=btn.getBoundingClientRect(),w=Math.min(360,innerWidth-24);
    let left=Math.min(innerWidth-w-12,Math.max(12,r.right-w));
    let top=r.bottom+8;if(top+260>innerHeight)top=Math.max(12,r.top-268);
    pop.style.left=left+'px';pop.style.top=top+'px';
  }

  function decorate(root=document){
    root.querySelectorAll('.card,.ux-panel,.fg-card,.ux-client-panel,.reviews-v2').forEach(box=>{
      if(box.classList.contains('uai-help-ready')||box.classList.contains('uai-no-help'))return;
      const heading=box.querySelector(':scope > h2,:scope > h3,:scope > .review-top h3');
      if(!heading)return;
      const title=heading.textContent.trim(),h=findHelp(title);if(!h)return;
      box.classList.add('uai-help-ready');
      const existing=[...box.children].find(el=>el.tagName==='P'||el.classList?.contains('uai-help-legend'));
      if(existing&&existing.tagName==='P'){
        if(!String(existing.textContent||'').trim())existing.textContent=h.legend;
        existing.classList.add('uai-help-legend');
      }else{
        const legend=document.createElement('div');legend.className='uai-help-legend';legend.textContent=h.legend;heading.insertAdjacentElement('afterend',legend);
      }
      const btn=document.createElement('button');btn.type='button';btn.className='uai-help-btn';btn.textContent='?';btn.setAttribute('aria-label','Ayuda sobre '+title);btn.onclick=e=>{e.stopPropagation();open(btn,h,title)};box.appendChild(btn);
    });
  }
  decorate();
  const obs=new MutationObserver(()=>decorate());obs.observe(document.body,{childList:true,subtree:true});
})();