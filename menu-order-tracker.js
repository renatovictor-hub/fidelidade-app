(() => {
  // Mobile UI hardening: keep the main action buttons fully visible and
  // normalize button rendering across Android/Brave/Chrome and iPhone PWAs.
  const style=document.createElement('style');
  style.id='uaiso-menu-mobile-fixes';
  style.textContent=`
    button{-webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent}
    html,body{height:100%;min-height:100%;overflow:hidden}
    .app{height:var(--uaiso-app-height,100dvh)!important;min-height:var(--uaiso-app-height,100dvh)!important;max-height:var(--uaiso-app-height,100dvh)!important}
    .feed,.catalog{height:100%!important;max-height:100%!important}
    .dish{height:var(--uaiso-app-height,100dvh)!important;min-height:var(--uaiso-app-height,100dvh)!important;max-height:var(--uaiso-app-height,100dvh)!important}
    .content{bottom:0!important;padding-bottom:calc(20px + var(--safe-bottom))!important}
    .view-switch button,.choice-card span,.location-action,.primary,.add-small,.qty button,.mini-qty button,.close,.icon-btn{
      font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
      line-height:1.15;
      text-rendering:optimizeLegibility;
    }
    .view-switch button{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;padding:0 10px}
    .choice-card span{display:flex;align-items:center;justify-content:center;gap:7px;min-height:52px;padding:9px 10px;white-space:normal}
    .location-action{display:flex;align-items:center;justify-content:center;gap:7px;min-height:50px;padding:9px 10px;line-height:1.2;white-space:normal}
    .add-small,.qty button,.mini-qty button,.close,.icon-btn{display:flex;align-items:center;justify-content:center;padding:0}
    .sheet{padding-bottom:calc(96px + var(--safe-bottom));scroll-padding-bottom:calc(110px + var(--safe-bottom));overscroll-behavior:contain}
    #cartWrap .sheet{padding-bottom:calc(18px + var(--safe-bottom))}
    #sendOrder{position:sticky;bottom:calc(10px + var(--safe-bottom));z-index:8;display:flex;align-items:center;justify-content:center;margin-top:8px;box-shadow:0 10px 28px rgba(106,13,173,.30)}
    #checkoutForm>button[type="submit"]{position:sticky;bottom:calc(10px + var(--safe-bottom));z-index:8;display:flex;align-items:center;justify-content:center;margin-top:12px;box-shadow:0 10px 28px rgba(37,211,102,.28)}
    .primary{min-height:54px;padding:12px 16px;font-size:14px;letter-spacing:.01em}
    @media(max-height:760px){
      .content{gap:8px!important;padding-top:16px!important;padding-bottom:calc(14px + var(--safe-bottom))!important}
      .dish h1{font-size:27px!important}.desc{font-size:13px!important;line-height:1.3!important}.actions button{min-height:48px!important}.chip{padding:5px 8px!important}
    }
    @media(max-width:360px){
      .choice-card span,.location-action{font-size:11px}
      .view-switch{width:min(226px,calc(100vw - 112px))}
      .view-switch button{font-size:11px;padding:0 6px}
    }
  `;
  document.head.appendChild(style);

  // Android PWAs can report an incorrect 100dvh for the first render and only
  // correct it after the app is backgrounded/resumed. Use the real visual
  // viewport and refresh it several times during startup/resume instead.
  let lastViewportHeight=0;
  function syncViewportHeight(){
    const vv=window.visualViewport;
    const inner=Number(window.innerHeight)||0;
    const visual=Number(vv?.height)||0;
    let height=visual>0?visual:inner;
    if(inner>0&&height>0)height=Math.min(inner,height);
    if(!height)return;
    height=Math.round(height);
    if(Math.abs(height-lastViewportHeight)<1)return;
    lastViewportHeight=height;
    document.documentElement.style.setProperty('--uaiso-app-height',height+'px');
  }
  function burstViewportSync(){[0,40,120,300,700,1400,2600].forEach(ms=>setTimeout(syncViewportHeight,ms));}
  syncViewportHeight();
  burstViewportSync();
  window.addEventListener('resize',syncViewportHeight,{passive:true});
  window.addEventListener('orientationchange',burstViewportSync,{passive:true});
  window.addEventListener('pageshow',burstViewportSync,{passive:true});
  window.visualViewport?.addEventListener('resize',syncViewportHeight,{passive:true});
  window.visualViewport?.addEventListener('scroll',syncViewportHeight,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')burstViewportSync()});

  const original=window.submitOrder;
  if(typeof original!=='function')return;
  let sending=false;
  function getUid(){return String(new URLSearchParams(location.search).get('uid')||'').trim();}
  function labelPayment(value,change){return value==='cash'?(change?`Efectivo · Cambio para $${change}`:'Efectivo · Sin cambio'):'Transferencia';}
  window.submitOrder=async function(){
    if(sending)return;
    const form=document.getElementById('checkoutForm');
    document.getElementById('checkoutError')?.classList.remove('show');
    if(!form?.reportValidity())return;
    const name=document.getElementById('customerName')?.value.trim()||'',phone=document.getElementById('customerPhone')?.value.trim()||'',digits=phone.replace(/\D/g,'');
    if(digits.length<10){if(typeof checkoutError==='function')checkoutError('Revisa el número de teléfono.');return;}
    const fulfillment=selectedValue('fulfillment'),scheduled=selectedValue('orderTime')==='scheduled',payment=selectedValue('payment'),subtotal=cartSubtotal(),fee=deliveryFee(),total=subtotal+fee,change=Math.max(0,Number(document.getElementById('cashChange')?.value)||0);
    if(fulfillment==='delivery'&&!fee){if(typeof checkoutError==='function')checkoutError('Calcula el envío o selecciona una tarifa provisional.');return;}
    if(payment==='cash'&&change>0&&change<total){if(typeof checkoutError==='function')checkoutError(`El cambio debe ser para una cantidad igual o mayor a ${MXN.format(total)}.`);return;}
    const btn=form.querySelector('button[type="submit"]'),old=btn?.textContent||'CONFIRMAR POR WHATSAPP';
    sending=true;if(btn){btn.disabled=true;btn.textContent='CREANDO PEDIDO...';}
    const waWindow=window.open('about:blank','_blank');
    try{
      const items=cartItems().map(x=>({name:x.p.name,qty:x.qty,unitPrice:Number(x.line.unitPrice)||0,details:lineDetails(x.line)}));
      const address=document.getElementById('deliveryAddress')?.value.trim()||'',references=document.getElementById('deliveryReference')?.value.trim()||'',scheduledAt=scheduled?(document.getElementById('scheduledAt')?.value||''):'';
      const payload={action:'order_create',uid:getUid(),name,phone,items,fulfillment,scheduledAt,subtotal,deliveryFee:fee,total,address,references,payment:labelPayment(payment,change),route:deliveryQuote?{distanceKm:deliveryQuote.distanceKm,durationMinutes:deliveryQuote.durationMinutes}:null};
      const r=await fetch('/api/cliente',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'No pudimos registrar el pedido.');
      const order=data.order||{},lines=items.map(i=>`• ${i.qty}x ${i.name} — ${MXN.format(i.unitPrice*i.qty)}${i.details?`\n  ${i.details}`:''}`),mapLink=deliveryLocation?`https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,routeDetails=deliveryQuote?`\nRuta: ${deliveryQuote.distanceKm.toFixed(1)} km · aprox. ${deliveryQuote.durationMinutes} min${quoteExtrasText(deliveryQuote)}`:'',deliveryText=fulfillment==='delivery'?`ENVÍO\nDirección: ${address}\nGoogle Maps: ${mapLink}${routeDetails}\nReferencias: ${references||'Sin referencias'}`:'RECOGER EN UAI SÔ',when=scheduled?formatScheduled(scheduledAt):'Lo antes posible';
      const text=`Hola! Pedido ${order.code||''}\n\n${lines.join('\n')}\n\nSubtotal: ${MXN.format(subtotal)}\n${fulfillment==='delivery'?`Envío: ${MXN.format(fee)}\n`:''}TOTAL: ${MXN.format(total)}\n\n${deliveryText}\nHorario: ${when}\nPago: ${labelPayment(payment,change)}\n\nCliente: ${name}\nTeléfono: ${phone}`;
      localStorage.setItem('uaiso_checkout_profile',JSON.stringify({name,phone}));
      if(typeof showToast==='function')showToast(`Pedido ${order.code||''} creado`);
      try{cart=[];}catch(_){}
      localStorage.setItem('uaiso_video_cart','[]');
      if(typeof renderCartBadge==='function')renderCartBadge();
      if(waWindow)waWindow.location.href='https://api.whatsapp.com/send?phone=5219986023759&text='+encodeURIComponent(text);else location.href='https://api.whatsapp.com/send?phone=5219986023759&text='+encodeURIComponent(text);
    }catch(e){
      if(waWindow)waWindow.close();
      if(typeof checkoutError==='function')checkoutError(e.message||'No pudimos crear el pedido.');
    }finally{sending=false;if(btn){btn.disabled=false;btn.textContent=old;}}
  };
})();
