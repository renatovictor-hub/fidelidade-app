(() => {
  if (!document.querySelector('link[href*="client-readability.css"]')) {
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='/client-readability.css?v=20260927-1';
    document.head.appendChild(link);
  }
})();

(() => {
  const originalSubmit=window.submitOrder;
  if(typeof originalSubmit!=='function')return;
  let sending=false;
  let upsellCocaQty=0;
  let restaurantWhatsApp='5219986023759';
  let checkoutVipBenefits=[],selectedVipBenefit=null,selectedVipRequestId='';
  let COCA_PRICE=35;

  async function loadRestaurantContact(){
    try{
      const r=await fetch('/api/cliente?action=public_config&t='+Date.now(),{cache:'no-store'});
      const d=await r.json();if(r.ok&&d.whatsapp)restaurantWhatsApp=String(d.whatsapp).replace(/\D/g,'');
    }catch(_){}
  }
  loadRestaurantContact();

  async function loadMenuCatalog(){
    try{
      const r=await fetch('/api/cliente?action=menu_catalog&t='+Date.now(),{cache:'no-store'});
      const d=await r.json(); if(!r.ok)throw new Error();
      const cfg=d.catalog||{};
      for(let i=PRODUCTS.length-1;i>=0;i--){
        const p=PRODUCTS[i],cp=cfg[p.id];
        if(!cp||cp.active===false){PRODUCTS.splice(i,1);continue}
        p.name=String(cp.name||p.name);p.price=Number(cp.price??p.price);
        p.extras=Array.isArray(cp.modifiers)?cp.modifiers.filter(x=>x&&x.active!==false).map(x=>({id:String(x.id),name:String(x.name),price:Number(x.price||0)})):[];
      }
      const coca=cfg['coca-600']; if(coca&&coca.active!==false)COCA_PRICE=Number(coca.price||35);
      cart=cart.filter(line=>PRODUCTS.some(p=>p.id===line.productId));
      cart.forEach(line=>{
        const p=PRODUCTS.find(x=>x.id===line.productId); if(!p)return;
        let unit=Number(p.price||0);
        const selected=new Set((line.extras||[]).map(x=>String(x.id)));
        line.extras=(p.extras||[]).filter(x=>selected.has(String(x.id))).map(x=>({id:x.id,name:x.name,price:Number(x.price||0)}));
        unit+=line.extras.reduce((s,x)=>s+Number(x.price||0),0);
        line.unitPrice=unit;
      });
      saveCart();
      if(typeof renderCatalog==='function')renderCatalog();
      if(typeof renderFeed==='function')renderFeed();
      renderUpsell();
    }catch(e){console.warn('Menu catalog sync',e)}
  }
  loadMenuCatalog();

  function getUid(){return String(new URLSearchParams(location.search).get('uid')||'').trim();}
  function labelPayment(value,change){return value==='cash'?(change?`Efectivo · Cambio para $${change}`:'Efectivo · Sin cambio'):'Transferencia';}
  function selectedRequired(p){return (Number(p?.choice?.required)||0)*Math.max(1,Number(detailState?.qty)||1);}
  function extraLimit(p){const qty=Math.max(1,Number(detailState?.qty)||1);return p?.choice?.required?qty*Number(p.choice.required):qty;}
  function selectableExtras(p){return (p?.extras||[]).filter(x=>x.id!=='coca-600');}

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

  function injectUpsell(){
    if(document.getElementById('checkoutUpsell'))return;
    const summary=document.getElementById('checkoutSummary');
    if(!summary)return;
    const box=document.createElement('div');
    box.id='checkoutUpsell';
    box.className='checkout-step';
    box.innerHTML=`<h3>¿Algo más para tu pedido?</h3><div class="flavor-row"><div><b>🥤 Coca-Cola 600 ml</b><small>Se agrega como producto separado · ${MXN.format(COCA_PRICE)} c/u</small></div><div class="mini-qty"><button id="upsellCocaMinus" type="button" aria-label="Quitar Coca-Cola">−</button><b id="upsellCocaQty">0</b><button id="upsellCocaPlus" type="button" aria-label="Agregar Coca-Cola">+</button></div></div><p class="delivery-note" style="margin-top:8px">Aquí también podremos sugerir postres y otros productos antes de finalizar.</p>`;
    summary.insertAdjacentElement('beforebegin',box);
    document.getElementById('upsellCocaMinus').onclick=()=>changeUpsellCoca(-1);
    document.getElementById('upsellCocaPlus').onclick=()=>changeUpsellCoca(1);
    renderUpsell();
  }
  function changeUpsellCoca(delta){upsellCocaQty=Math.max(0,Math.min(20,upsellCocaQty+Number(delta||0)));renderUpsell();updateCheckout();}
  function renderUpsell(){const q=document.getElementById('upsellCocaQty'),m=document.getElementById('upsellCocaMinus');if(q)q.textContent=upsellCocaQty;if(m)m.disabled=upsellCocaQty<=0;}
  injectUpsell();

  function vipAutomaticBenefit(b){
    return b&&b.available&&['free_delivery','percent_discount','fixed_discount'].includes(String(b.type||''));
  }
  function vipPreview(subtotal,fee){
    if(!selectedVipBenefit)return {discount:0,fee,total:subtotal+fee};
    const type=String(selectedVipBenefit.type||''),value=Math.max(0,Number(selectedVipBenefit.value||0));
    let discount=0,nextFee=fee;
    if(type==='free_delivery')nextFee=0;
    else if(type==='percent_discount')discount=Math.min(subtotal,Math.round((subtotal*Math.min(100,value)/100)*100)/100);
    else if(type==='fixed_discount')discount=Math.min(subtotal,value);
    return {discount,fee:nextFee,total:Math.max(0,Math.round((subtotal-discount+nextFee)*100)/100)};
  }
  function injectVipCheckout(){
    if(document.getElementById('checkoutVipBenefits'))return;
    const target=document.getElementById('checkoutUpsell')||document.getElementById('checkoutSummary');
    if(!target)return;
    const box=document.createElement('div');
    box.id='checkoutVipBenefits';box.className='checkout-step hidden';
    box.innerHTML='<h3>👑 Beneficios VIP</h3><p class="delivery-note" style="margin:0 0 8px">Elige un beneficio y se aplicará automáticamente a este pedido.</p><div id="checkoutVipBenefitsList"></div>';
    target.insertAdjacentElement('beforebegin',box);
  }
  async function loadCheckoutVipBenefits(){
    injectVipCheckout();
    const box=document.getElementById('checkoutVipBenefits'),list=document.getElementById('checkoutVipBenefitsList');
    const uid=getUid();
    if(!box||!list||!/^user_\d+$/.test(uid)){if(box)box.classList.add('hidden');return}
    try{
      const r=await fetch('/api/fidelidad-growth?uid='+encodeURIComponent(uid)+'&t='+Date.now(),{cache:'no-store'});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Error');
      checkoutVipBenefits=(d.benefits||[]).filter(vipAutomaticBenefit);
      if(!checkoutVipBenefits.length){box.classList.add('hidden');return}
      box.classList.remove('hidden');
      renderCheckoutVipBenefits();
    }catch(_){box.classList.add('hidden')}
  }
  function renderCheckoutVipBenefits(){
    const list=document.getElementById('checkoutVipBenefitsList');if(!list)return;
    list.innerHTML=checkoutVipBenefits.map(b=>{
      const active=selectedVipBenefit&&String(selectedVipBenefit.id)===String(b.id);
      return '<button type="button" class="choice-card" data-checkout-vip="'+String(b.id)+'" style="width:100%;margin-top:7px;text-align:left;display:block;border:'+(active?'2px solid #7d2dc2':'1px solid #e5dbea')+';background:'+(active?'#f7efff':'#fff')+'"><b>'+String(b.icon||'🎁')+' '+String(b.title||'Beneficio')+'</b><small style="display:block;margin-top:4px;color:#6f6574">'+String(b.text||'')+'</small><span style="display:block;margin-top:5px;font-size:11px;font-weight:900;color:#6a0dad">'+(active?'✓ APLICADO':'APLICAR')+'</span></button>';
    }).join('');
    list.querySelectorAll('[data-checkout-vip]').forEach(btn=>btn.onclick=async()=>{
      const benefit=checkoutVipBenefits.find(b=>String(b.id)===String(btn.dataset.checkoutVip));
      if(!benefit)return;
      if(selectedVipBenefit&&String(selectedVipBenefit.id)===String(benefit.id)){
        selectedVipBenefit=null;selectedVipRequestId='';localStorage.removeItem('vip_benefit_request_id');renderCheckoutVipBenefits();updateCheckout();return;
      }
      btn.disabled=true;
      try{
        const r=await fetch('/api/fidelidad-growth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'request_vip_benefit',uid:getUid(),benefit_id:benefit.id,channel:'delivery'})});
        const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'No se pudo aplicar el beneficio');
        selectedVipBenefit=benefit;selectedVipRequestId=d.request_id||'';localStorage.setItem('vip_benefit_request_id',selectedVipRequestId);
        renderCheckoutVipBenefits();updateCheckout();
        if(typeof showToast==='function')showToast('Beneficio aplicado');
      }catch(e){if(typeof checkoutError==='function')checkoutError(e.message)}
      finally{btn.disabled=false}
    });
  }
  injectVipCheckout();

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

  const nativeOpenCheckout=window.openCheckout;
  window.openCheckout=function(){
    selectedVipBenefit=null;selectedVipRequestId='';localStorage.removeItem('vip_benefit_request_id');
    nativeOpenCheckout();
    loadCheckoutVipBenefits();
  };

  const nativeUpdateCheckout=window.updateCheckout;
  window.updateCheckout=function(){
    nativeUpdateCheckout();
    const delivery=selectedValue('fulfillment')==='delivery',base=cartItems().reduce((n,x)=>n+(Number(x.line.unitPrice)||0)*x.qty,0),subtotal=base+(upsellCocaQty*COCA_PRICE),fee=deliveryFee(),preview=vipPreview(subtotal,delivery?fee:0),feeText=delivery?(fee?MXN.format(preview.fee):'Por calcular'):'Sin costo';
    if(selectedVipBenefit?.type==='free_delivery'&&!delivery){selectedVipBenefit=null;selectedVipRequestId='';localStorage.removeItem('vip_benefit_request_id');renderCheckoutVipBenefits()}
    const summary=document.getElementById('checkoutSummary');
    if(summary)summary.innerHTML=`<div class="summary-line"><span>Subtotal</span><strong>${MXN.format(subtotal)}</strong></div>${upsellCocaQty?`<div class="summary-line"><span>Coca-Cola 600 ml × ${upsellCocaQty}</span><strong>${MXN.format(upsellCocaQty*COCA_PRICE)}</strong></div>`:''}${selectedVipBenefit?`<div class="summary-line"><span>👑 ${selectedVipBenefit.title}</span><strong>${selectedVipBenefit.type==='free_delivery'?'Aplicado':('-'+MXN.format(preview.discount))}</strong></div>`:''}<div class="summary-line"><span>${delivery?'Envío':'Retiro'}</span><strong>${feeText}</strong></div><div class="summary-line final"><span>Total</span><strong>${MXN.format(preview.total)}</strong></div>`;
  };

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
    const maxChoices=selectedRequired(p),maxExtras=extraLimit(p);
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
    Object.keys(detailState.extraQty).forEach(id=>{detailState.extraQty[id]=Math.min(maxExtras,Number(detailState.extraQty[id])||0);});
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
    const p=product(detailState.productId),limit=extraLimit(p),current=Math.max(0,Number(detailState.extraQty[id])||0);
    detailState.extraQty[id]=Math.max(0,Math.min(limit,current+Number(delta||0)));
    if(!detailState.extraQty[id])delete detailState.extraQty[id];
    renderDetailOptions();
  };

  window.detailTotal=function(){
    if(!detailState)return 0;
    normalizeDetailState();
    const p=product(detailState.productId),qty=Math.max(1,Number(detailState.qty)||1);
    let total=(Number(p?.price)||0)*qty;
    (p?.choice?.options||[]).forEach(x=>total+=(Number(detailState.choices[x.id])||0)*(Number(x.price)||0));
    selectableExtras(p).forEach(x=>total+=(Number(detailState.extraQty[x.id])||0)*(Number(x.price)||0));
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
    const p=product(detailState.productId),blocks=[],maxExtras=extraLimit(p),extras=selectableExtras(p);
    blocks.push(`<div class="option-block"><div class="option-title"><strong>Cantidad</strong><span>${detailState.qty} ${detailState.qty===1?'pieza':'piezas'}</span></div><div class="mini-qty" style="justify-content:flex-end"><button type="button" onclick="changeProductQty(-1)" ${detailState.qty<=1?'disabled':''} aria-label="Quitar una pieza">−</button><b>${detailState.qty}</b><button type="button" onclick="changeProductQty(1)" ${detailState.qty>=20?'disabled':''} aria-label="Agregar una pieza">+</button></div></div>`);
    if(p.choice){
      const count=selectedChoiceCount(),required=selectedRequired(p),complete=count===required;
      blocks.push(`<div class="option-block"><div class="option-title"><strong>Elige ${required} sabores</strong><span class="${complete?'complete':''}">${count} de ${required}</span></div><div class="flavor-list">${p.choice.options.map(x=>{const qty=Number(detailState.choices[x.id])||0,full=count>=required;return`<div class="flavor-row"><div><b>${esc(x.name)}</b><small>${x.price?`+ ${MXN.format(x.price)} por pieza`:'Sin costo extra'}</small></div><div class="mini-qty"><button type="button" onclick="changeFlavor('${esc(x.id)}',-1)" ${qty?'':'disabled'} aria-label="Quitar ${esc(x.name)}">−</button><b>${qty}</b><button type="button" onclick="changeFlavor('${esc(x.id)}',1)" ${full?'disabled':''} aria-label="Agregar ${esc(x.name)}">+</button></div></div>`}).join('')}</div></div>`);
    }
    if(extras.length){
      blocks.push(`<div class="option-block"><div class="option-title"><strong>Extras</strong><span>Hasta ${maxExtras} por extra</span></div><div class="flavor-list">${extras.map(x=>{const qty=Number(detailState.extraQty[x.id])||0;return`<div class="flavor-row"><div><b>${esc(x.name)}</b><small>+ ${MXN.format(x.price)} c/u</small></div><div class="mini-qty"><button type="button" onclick="changeExtraQty('${esc(x.id)}',-1)" ${qty?'':'disabled'} aria-label="Quitar ${esc(x.name)}">−</button><b>${qty}</b><button type="button" onclick="changeExtraQty('${esc(x.id)}',1)" ${qty>=maxExtras?'disabled':''} aria-label="Agregar ${esc(x.name)}">+</button></div></div>`}).join('')}</div></div>`);
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
    const extras=selectableExtras(p).map(x=>({id:x.id,name:x.name,price:Number(x.price)||0,qty:Number(detailState.extraQty[x.id])||0})).filter(x=>x.qty);
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
    const fulfillment=selectedValue('fulfillment'),scheduled=selectedValue('orderTime')==='scheduled',payment=selectedValue('payment'),baseSubtotal=cartItems().reduce((n,x)=>n+(Number(x.line.unitPrice)||0)*x.qty,0),subtotal=baseSubtotal+(upsellCocaQty*COCA_PRICE),fee=deliveryFee(),total=subtotal+fee,change=Math.max(0,Number(document.getElementById('cashChange')?.value)||0);
    if(fulfillment==='delivery'&&!fee){if(typeof checkoutError==='function')checkoutError('Calcula el envío o selecciona una tarifa provisional.');return;}
    if(payment==='cash'&&change>0&&change<total){if(typeof checkoutError==='function')checkoutError(`El cambio debe ser para una cantidad igual o mayor a ${MXN.format(total)}.`);return;}
    const btn=form.querySelector('button[type="submit"]'),old=btn?.textContent||'CONFIRMAR POR WHATSAPP';
    sending=true;if(btn){btn.disabled=true;btn.textContent='CREANDO PEDIDO...';}
    const waWindow=window.open('about:blank','_blank');
    try{
      const items=cartItems().map(x=>({productId:x.p.id,name:x.p.name,qty:x.qty,unitPrice:Number(x.line.unitPrice)||0,modifiers:(x.line.extras||[]).map(m=>({id:m.id,qty:1})),details:whatsappDetails(x.line),line:x.line}));
      if(upsellCocaQty>0)items.push({productId:'coca-600',name:'Coca-Cola 600 ml',qty:upsellCocaQty,unitPrice:COCA_PRICE,details:'',line:null});
      const address=document.getElementById('deliveryAddress')?.value.trim()||'',baseReferences=document.getElementById('deliveryReference')?.value.trim()||'',scheduledAt=scheduled?(document.getElementById('scheduledAt')?.value||''):'';
      const isResidential=!!document.getElementById('residentialDelivery')?.checked,needsQr=isResidential&&!!document.getElementById('residentialQr')?.checked,residentialInstructions=isResidential?(document.getElementById('residentialInstructions')?.value.trim()||''):'';
      const accessParts=[];
      if(isResidential)accessParts.push('Residencial/condominio');
      if(needsQr)accessParts.push('Requiere QR para entrar');
      if(residentialInstructions)accessParts.push(`Acceso: ${residentialInstructions}`);
      const references=[baseReferences,...accessParts].filter(Boolean).join(' · ');
      const payload={action:'order_create',uid:getUid(),name,phone,items:items.map(({line,...rest})=>rest),fulfillment,scheduledAt,subtotal,deliveryFee:fee,total,address,references,payment:labelPayment(payment,change),benefit_request_id:selectedVipRequestId||'',deliveryDestination:fulfillment==='delivery'?{...(deliveryLocation||{}),address,placeId:deliveryPlaceId}:null,insidePlaza:!!document.getElementById('insidePlaza')?.checked,deliveryAt:scheduledAt,route:deliveryQuote?{distanceKm:deliveryQuote.distanceKm,durationMinutes:deliveryQuote.durationMinutes}:null};
      const r=await fetch('/api/cliente',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'No pudimos registrar el pedido.');
      const order=data.order||{},serverItems=Array.isArray(order.items)?order.items:items,lines=serverItems.map(i=>`• ${i.qty}x ${i.name} — ${MXN.format((Number(i.unitPrice)||0)*(Number(i.qty)||1))}${i.details?`\n${i.details}`:''}`),serverSubtotal=Number(order.subtotal||0),serverFee=Number(order.deliveryFee||0),serverDiscount=Number(order.discount||0),serverTotal=Number(order.total||0),mapLink=deliveryLocation?`https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,routeDetails=deliveryQuote?`\nRuta: ${deliveryQuote.distanceKm.toFixed(1)} km${quoteExtrasText(deliveryQuote)} · Total envío ${MXN.format(fee)}`:'',residentialText=isResidential?`\nResidencial: Sí${needsQr?' · Requiere QR':''}${residentialInstructions?`\nInstrucciones de acceso: ${residentialInstructions}`:''}`:'',deliveryText=fulfillment==='delivery'?`ENVÍO\nDirección: ${address}\nGoogle Maps: ${mapLink}${routeDetails}${residentialText}\nReferencias: ${baseReferences||'Sin referencias'}`:'RECOGER EN UAI SÔ',when=scheduled?formatScheduled(scheduledAt):'Lo antes posible';
      const text=`Hola! Pedido ${order.code||''}\n\n${lines.join('\n\n')}\n\nSubtotal: ${MXN.format(serverSubtotal)}\n${serverDiscount?`Descuento VIP: -${MXN.format(serverDiscount)}\n`:''}${fulfillment==='delivery'?`Envío: ${MXN.format(serverFee)}\n`:''}TOTAL: ${MXN.format(serverTotal)}\n\n${deliveryText}\nHorario: ${when}\nPago: ${labelPayment(payment,change)}\n\nCliente: ${name}\nTeléfono: ${phone}`;
      localStorage.setItem('uaiso_checkout_profile',JSON.stringify({name,phone}));
      if(typeof showToast==='function')showToast(`Pedido ${order.code||''} creado`);
      try{cart=[];}catch(_){}
      upsellCocaQty=0;selectedVipBenefit=null;selectedVipRequestId='';localStorage.removeItem('vip_benefit_request_id');renderUpsell();
      localStorage.setItem('uaiso_video_cart','[]');
      if(typeof renderCartBadge==='function')renderCartBadge();
      if(waWindow)waWindow.location.href='https://api.whatsapp.com/send?phone='+restaurantWhatsApp+'&text='+encodeURIComponent(text);else location.href='https://api.whatsapp.com/send?phone='+restaurantWhatsApp+'&text='+encodeURIComponent(text);
    }catch(e){
      if(waWindow)waWindow.close();
      if(typeof checkoutError==='function')checkoutError(e.message||'No pudimos crear el pedido.');
    }finally{sending=false;if(btn){btn.disabled=false;btn.textContent=old;}}
  };
})();