(() => {
  // Mobile UI hardening: keep the main action buttons fully visible and
  // normalize button rendering across Android/Brave/Chrome and iPhone PWAs.
  const style=document.createElement('style');
  style.id='uaiso-menu-mobile-fixes';
  style.textContent=`
    button{-webkit-appearance:none;appearance:none;-webkit-tap-highlight-color:transparent}
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
    @media(max-width:360px){
      .choice-card span,.location-action{font-size:11px}
      .view-switch{width:min(226px,calc(100vw - 112px))}
      .view-switch button{font-size:11px;padding:0 6px}
    }
  `;
  document.head.appendChild(style);

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
