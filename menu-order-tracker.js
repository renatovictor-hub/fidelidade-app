(() => {
  const originalSubmit=window.submitOrder;
  if(typeof originalSubmit!=='function')return;
  let sending=false;

  function getUid(){return String(new URLSearchParams(location.search).get('uid')||'').trim();}
  function labelPayment(value,change){return value==='cash'?(change?`Efectivo · Cambio para $${change}`:'Efectivo · Sin cambio'):'Transferencia';}
  function selectedRequired(p){return (Number(p?.choice?.required)||0)*Math.max(1,Number(detailState?.qty)||1);}

  function injectResidentialFields(){
    if(document.getElementById('residentialDelivery'))return;
    const plaza=document.getElementById('insidePlaza')?.closest('label');
    if(!plaza)return;
    const wrap=document.createElement('div');
    wrap.id='residentialAccessBlock';
    wrap.innerHTML=`<label class="check-row"><input id="residentialDelivery" type="checkbox"><span>La entrega es en un residencial / condominio</span></label><div id="residentialDetails" class="conditional hidden"><label class="check-row"><input id="residentialQr" type="checkbox"><span>El residencial exige QR para entrar</span></label><label class="field"><span>Instrucciones de entrada al residencial</span><textarea id="residentialInstructions" maxlength="220" placeholder="Ej.: Entrada de proveedores por Av. X, caseta 2, dejar nombre al guardia..."></textarea></label></div>`;
    plaza.insertAdjacentElement('afterend',wrap);
    const toggle=()=>document.getElementById('residentialDetails')?.classList.toggle('hidden',!document.getElementById('residentialDelivery')?.checked);
    document.getElementById('residentialDelivery').addEventListener('change',toggle);
    toggle();
  }
  injectResidentialFields();

  if(typeof window.setDeliveryStatus==='function'){
    const nativeSetDeliveryStatus=window.setDeliveryStatus;
    window.setDeliveryStatus=function(text,type=''){
      let clean=String(text??'').replace(/ · aprox\. \d+ min/g,'');
      if(type==='success'){
        const distance=clean.match(/^([0-9.,]+ km)/)?.[1]||'';
        const fee=clean.match(/Envío\s+(\$[0-9.,]+)/i)?.[1]||'';
        let middle=clean.replace(/^([0-9.,]+ km)\s*·\s*/,'').replace(/Envío\s+\$[0-9.,]+\s*/i,'').replace(/^\s*·\s*/,'').replace(/\s*·\s*$/,'').trim();
        clean=[distance,middle,fee?`Total envío ${fee}`:''].filter(Boolean).join(' · ');
      }
      return nativeSetDeliveryStatus(clean,type);
    };
  }

  function normalizeDetailState(){
    if(!detailState)return;
    if(!Number.isFinite(Number(detailState.qty))||Number(detailState.qty)<1)detailState.qty=1;
    if(!detailState.extraQty||typeof detailState.extraQty!=='object')detailState.extraQty={};
  }

  const nativeOpenDetails=window.openDetails;
  window.openDetails=function(id){
    nativeOpenDetails(id);
    if(!detailState)return;
    detailState.qty=1;
    detailState.extraQty={};
    renderDetailOptions();
  };

  window.changeProductQty=function(delta){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),oldQty=detailState.qty;
    detailState.qty=Math.max(1,Math.min(20,oldQty+Number(delta||0)));
    const maxChoices=selectedRequired(p);
    let total=selectedChoiceCount();
    if(total>maxChoices){
      for(const option of [...(p?.choice?.options||[])].reverse()){
        if(total<=maxChoices)break;
        const current=Number(detailState.choices[option.id])||0;
        const remove=Math.min(current,total-maxChoices);
        const next=current-remove;
        if(next)detailState.choices[option.id]=next;else delete detailState.choices[option.id];
        total-=remove;
      }
    }
    Object.keys(detailState.extraQty).forEach(id=>{detailState.extraQty[id]=Math.min(detailState.qty,Number(detailState.extraQty[id])||0);});
    renderDetailOptions();
  };

  window.changeFlavor=function(id,delta){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),required=selectedRequired(p),current=Math.max(0,Number(detailState.choices[id])||0),total=selectedChoiceCount();
    if(delta>0&&total>=required)return;
    const next=Math.max(0,current+delta);
    if(next)detailState.choices[id]=next;else delete detailState.choices[id];
    renderDetailOptions();
  };

  window.changeExtraQty=function(id,delta){
    if(!detailState)return;
    normalizeDetailState();
    const current=Math.max(0,Number(detailState.extraQty[id])||0);
    detailState.extraQty[id]=Math.max(0,Math.min(detailState.qty,current+Number(delta||0)));
    if(!detailState.extraQty[id])delete detailState.extraQty[id];
    renderDetailOptions();
  };

  window.detailTotal=function(){
    if(!detailState)return 0;
    normalizeDetailState();
    const p=product(detailState.productId),qty=Math.max(1,Number(detailState.qty)||1);
    let total=(Number(p?.price)||0)*qty;
    (p?.choice?.options||[]).forEach(x=>total+=(Number(detailState.choices[x.id])||0)*(Number(x.price)||0));
    (p?.extras||[]).forEach(x=>total+=(Number(detailState.extraQty[x.id])||0)*(Number(x.price)||0));
    return total;
  };

  window.updateDetailTotal=function(){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),required=selectedRequired(p),selected=selectedChoiceCount(),complete=!p.choice||selected===required,qty=detailState.qty;
    $('detailPrice').textContent=MXN.format(detailTotal());
    $('detailOrder').disabled=!complete;
    $('detailOrder').textContent=complete?`AGREGAR ${qty} · ${MXN.format(detailTotal())}`:`ELIGE ${required-selected} MÁS`;
  };

  window.renderDetailOptions=function(){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),blocks=[];
    blocks.push(`<div class="option-block"><div class="option-title"><strong>Cantidad</strong><span>${detailState.qty} ${detailState.qty===1?'pieza':'piezas'}</span></div><div class="mini-qty" style="justify-content:flex-end"><button type="button" onclick="changeProductQty(-1)" ${detailState.qty<=1?'disabled':''} aria-label="Quitar una pieza">−</button><b>${detailState.qty}</b><button type="button" onclick="changeProductQty(1)" ${detailState.qty>=20?'disabled':''} aria-label="Agregar una pieza">+</button></div></div>`);
    if(p.choice){
      const count=selectedChoiceCount(),required=selectedRequired(p),complete=count===required;
      blocks.push(`<div class="option-block"><div class="option-title"><strong>Elige ${required} sabores</strong><span class="${complete?'complete':''}">${count} de ${required}</span></div><div class="flavor-list">${p.choice.options.map(x=>{const qty=Number(detailState.choices[x.id])||0,full=count>=required;return`<div class="flavor-row"><div><b>${esc(x.name)}</b><small>${x.price?`+ ${MXN.format(x.price)} por pieza`:'Sin costo extra'}</small></div><div class="mini-qty"><button type="button" onclick="changeFlavor('${esc(x.id)}',-1)" ${qty?'':'disabled'} aria-label="Quitar ${esc(x.name)}">−</button><b>${qty}</b><button type="button" onclick="changeFlavor('${esc(x.id)}',1)" ${full?'disabled':''} aria-label="Agregar ${esc(x.name)}">+</button></div></div>`}).join('')}</div></div>`);
    }
    if(p.extras?.length){
      blocks.push(`<div class="option-block"><div class="option-title"><strong>Extras</strong><span>Hasta ${detailState.qty} por extra</span></div><div class="flavor-list">${p.extras.map(x=>{const qty=Number(detailState.extraQty[x.id])||0;return`<div class="flavor-row"><div><b>${esc(x.name)}</b><small>+ ${MXN.format(x.price)} c/u</small></div><div class="mini-qty"><button type="button" onclick="changeExtraQty('${esc(x.id)}',-1)" ${qty?'':'disabled'} aria-label="Quitar ${esc(x.name)}">−</button><b>${qty}</b><button type="button" onclick="changeExtraQty('${esc(x.id)}',1)" ${qty>=detailState.qty?'disabled':''} aria-label="Agregar ${esc(x.name)}">+</button></div></div>`}).join('')}</div></div>`);
    }
    $('detailOptions').innerHTML=blocks.join('');
    updateDetailTotal();
  };

  window.addConfiguredToCart=function(){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),qty=Math.max(1,Number(detailState.qty)||1),required=selectedRequired(p);
    if(p.choice&&selectedChoiceCount()!==required)return;
    const choices=(p.choice?.options||[]).map(x=>({id:x.id,name:x.name,qty:Number(detailState.choices[x.id])||0,price:Number(x.price)||0})).filter(x=>x.qty);
    const extras=(p.extras||[]).map(x=>({id:x.id,name:x.name,price:Number(x.price)||0,qty:Number(detailState.extraQty[x.id])||0})).filter(x=>x.qty);
    const note=String($('detailNote').value||'').trim(),totalPrice=detailTotal(),unitPrice=totalPrice/qty;
    const signature=JSON.stringify({productId:p.id,qty,choices:choices.map(x=>[x.id,x.qty]),extras:extras.map(x=>[x.id,x.qty]),note});
    const batchChoices=choices.map(x=>({...x})),batchExtras=extras.map(x=>({...x}));
    let line=cart.find(x=>x.signature===signature);
    if(line){
      line.qty+=qty;
      line.choices=(line.choices||[]).map(x=>{const b=batchChoices.find(y=>y.id===x.id);return {...x,qty:(Number(x.qty)||0)+(Number(b?.qty)||0)}});
      batchChoices.filter(b=>!line.choices.some(x=>x.id===b.id)).forEach(b=>line.choices.push({...b}));
      line.extras=(line.extras||[]).map(x=>{const b=batchExtras.find(y=>y.id===x.id);return {...x,qty:(Number(x.qty)||0)+(Number(b?.qty)||0)}});
      batchExtras.filter(b=>!line.extras.some(x=>x.id===b.id)).forEach(b=>line.extras.push({...b}));
    }else{
      cart.push({lineId:`${Date.now()}_${Math.random().toString(36).slice(2,7)}`,signature,productId:p.id,qty,unitPrice,choices,extras,note,batchQty:qty,batchChoices,batchExtras});
    }
    saveCart();closeDetails();showToast(`${qty} ${qty===1?'pieza agregada':'piezas agregadas'}`);
  };

  const nativeChangeQty=window.changeQty;
  window.changeQty=function(lineId,delta){
    const line=cart.find(x=>x.lineId===lineId);
    if(!line||!line.batchQty)return nativeChangeQty(lineId,delta);
    const direction=delta>0?1:-1,batch=Math.max(1,Number(line.batchQty)||1),next=Math.max(0,(Number(line.qty)||0)+direction*batch);
    if(direction>0){
      line.qty=next;
      (line.batchChoices||[]).forEach(b=>{let x=(line.choices||[]).find(y=>y.id===b.id);if(x)x.qty=(Number(x.qty)||0)+(Number(b.qty)||0);else(line.choices||(line.choices=[])).push({...b});});
      (line.batchExtras||[]).forEach(b=>{let x=(line.extras||[]).find(y=>y.id===b.id);if(x)x.qty=(Number(x.qty)||0)+(Number(b.qty)||0);else(line.extras||(line.extras=[])).push({...b});});
    }else{
      line.qty=next;
      (line.batchChoices||[]).forEach(b=>{let x=(line.choices||[]).find(y=>y.id===b.id);if(x)x.qty=Math.max(0,(Number(x.qty)||0)-(Number(b.qty)||0));});
      (line.batchExtras||[]).forEach(b=>{let x=(line.extras||[]).find(y=>y.id===b.id);if(x)x.qty=Math.max(0,(Number(x.qty)||0)-(Number(b.qty)||0));});
      line.choices=(line.choices||[]).filter(x=>Number(x.qty)>0);line.extras=(line.extras||[]).filter(x=>Number(x.qty)>0);
    }
    cart=cart.filter(x=>Number(x.qty)>0);saveCart();renderCart();
  };

  window.lineDetails=function(line){
    const parts=[];
    if(line.choices?.length)parts.push(line.choices.map(x=>`${x.qty} ${x.name}`).join(', '));
    if(line.extras?.length)parts.push(line.extras.map(x=>`${Number(x.qty)||1} ${x.name}`).join(', '));
    if(line.note)parts.push(`Nota: ${line.note}`);
    return parts.join(' · ');
  };

  function whatsappDetails(line){
    const rows=[];
    (line.choices||[]).forEach(x=>{if(Number(x.qty)>0)rows.push(`- ${x.qty} ${x.name}`);});
    (line.extras||[]).forEach(x=>{if(Number(x.qty)>0)rows.push(`- ${x.qty} ${x.name}`);});
    if(line.note)rows.push(`- Nota: ${line.note}`);
    return rows.join('\n');
  }

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
      const items=cartItems().map(x=>({name:x.p.name,qty:x.qty,unitPrice:Number(x.line.unitPrice)||0,details:whatsappDetails(x.line),line:x.line}));
      const address=document.getElementById('deliveryAddress')?.value.trim()||'',baseReferences=document.getElementById('deliveryReference')?.value.trim()||'',scheduledAt=scheduled?(document.getElementById('scheduledAt')?.value||''):'';
      const isResidential=!!document.getElementById('residentialDelivery')?.checked,needsQr=isResidential&&!!document.getElementById('residentialQr')?.checked,residentialInstructions=isResidential?(document.getElementById('residentialInstructions')?.value.trim()||''):'';
      const accessParts=[];
      if(isResidential)accessParts.push('Residencial/condominio');
      if(needsQr)accessParts.push('Requiere QR para entrar');
      if(residentialInstructions)accessParts.push(`Acceso: ${residentialInstructions}`);
      const references=[baseReferences,...accessParts].filter(Boolean).join(' · ');
      const payload={action:'order_create',uid:getUid(),name,phone,items:items.map(({line,...rest})=>rest),fulfillment,scheduledAt,subtotal,deliveryFee:fee,total,address,references,payment:labelPayment(payment,change),route:deliveryQuote?{distanceKm:deliveryQuote.distanceKm,durationMinutes:deliveryQuote.durationMinutes}:null};
      const r=await fetch('/api/cliente',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'No pudimos registrar el pedido.');
      const order=data.order||{},lines=items.map(i=>`• ${i.qty}x ${i.name} — ${MXN.format(i.unitPrice*i.qty)}${i.details?`\n${i.details}`:''}`),mapLink=deliveryLocation?`https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,routeDetails=deliveryQuote?`\nRuta: ${deliveryQuote.distanceKm.toFixed(1)} km${quoteExtrasText(deliveryQuote)} · Total envío ${MXN.format(fee)}`:'',residentialText=isResidential?`\nResidencial: Sí${needsQr?' · Requiere QR':''}${residentialInstructions?`\nInstrucciones de acceso: ${residentialInstructions}`:''}`:'',deliveryText=fulfillment==='delivery'?`ENVÍO\nDirección: ${address}\nGoogle Maps: ${mapLink}${routeDetails}${residentialText}\nReferencias: ${baseReferences||'Sin referencias'}`:'RECOGER EN UAI SÔ',when=scheduled?formatScheduled(scheduledAt):'Lo antes posible';
      const text=`Hola! Pedido ${order.code||''}\n\n${lines.join('\n\n')}\n\nSubtotal: ${MXN.format(subtotal)}\n${fulfillment==='delivery'?`Envío: ${MXN.format(fee)}\n`:''}TOTAL: ${MXN.format(total)}\n\n${deliveryText}\nHorario: ${when}\nPago: ${labelPayment(payment,change)}\n\nCliente: ${name}\nTeléfono: ${phone}`;
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
