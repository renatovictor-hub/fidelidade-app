(() => {
  const original=window.submitOrder;
  if(typeof original!=='function')return;
  let sending=false;
  const money=n=>Number(n||0);
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
      const payload={uid:getUid(),name,phone,items,fulfillment,scheduledAt,subtotal,deliveryFee:fee,total,address,references,payment:labelPayment(payment,change),route:deliveryQuote?{distanceKm:deliveryQuote.distanceKm,durationMinutes:deliveryQuote.durationMinutes}:null};
      const r=await fetch('/api/pedidos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'No pudimos registrar el pedido.');
      const order=data.order||{},lines=items.map(i=>`• ${i.qty}x ${i.name} — ${MXN.format(i.unitPrice*i.qty)}${i.details?`\n  ${i.details}`:''}`),mapLink=deliveryLocation?`https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,routeDetails=deliveryQuote?`\nRuta: ${deliveryQuote.distanceKm.toFixed(1)} km · aprox. ${deliveryQuote.durationMinutes} min${quoteExtrasText(deliveryQuote)}`:'',deliveryText=fulfillment==='delivery'?`ENVÍO\nDirección: ${address}\nGoogle Maps: ${mapLink}${routeDetails}\nReferencias: ${references||'Sin referencias'}`:'RECOGER EN UAI SÔ',when=scheduled?formatScheduled(scheduledAt):'Lo antes posible';
      const text=`Hola! Pedido ${order.code||''}\n\n${lines.join('\n')}\n\nSubtotal: ${MXN.format(subtotal)}\n${fulfillment==='delivery'?`Envío: ${MXN.format(fee)}\n`:''}TOTAL: ${MXN.format(total)}\n\n${deliveryText}\nHorario: ${when}\nPago: ${labelPayment(payment,change)}\n\nCliente: ${name}\nTeléfono: ${phone}`;
      localStorage.setItem('uaiso_checkout_profile',JSON.stringify({name,phone}));
      if(typeof showToast==='function')showToast(`Pedido ${order.code||''} creado`);
      if(Array.isArray(window.cart)){window.cart=[];}else try{cart=[];}catch(_){}
      localStorage.setItem('uaiso_video_cart','[]');
      if(typeof renderCartBadge==='function')renderCartBadge();
      if(waWindow)waWindow.location.href='https://api.whatsapp.com/send?phone=5219986023759&text='+encodeURIComponent(text);else location.href='https://api.whatsapp.com/send?phone=5219986023759&text='+encodeURIComponent(text);
    }catch(e){
      if(waWindow)waWindow.close();
      if(typeof checkoutError==='function')checkoutError(e.message||'No pudimos crear el pedido.');
    }finally{sending=false;if(btn){btn.disabled=false;btn.textContent=old;}}
  };
})();
