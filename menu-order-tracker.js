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
  let restaurantWhatsApp='';
  let restaurantConfig=null;
  let checkoutVipBenefits=[],selectedVipBenefit=null,selectedVipRequestId='';
  let upsellDrink=null;
  let generalGroups=[];
  const generalStorage='restaurant_general_modifiers:'+ (qs.get('company') || 'uai-so');
  let generalCounts={};
  try { generalCounts=JSON.parse(localStorage.getItem(generalStorage)) || {}; } catch (_) {}


  async function loadRestaurantContact(){
    try{
      const r=await fetch('/api/cliente?action=public_config&t='+Date.now(),{cache:'no-store'});
      const d=await r.json();if(!r.ok)return;
      restaurantConfig=d;
      restaurantWhatsApp=String(d.whatsapp||'').replace(/\D/g,'');
      window.__restaurantWhatsApp=restaurantWhatsApp;
      const shortName=d.short_name||d.name||'Restaurante';
      document.title='Menú · '+shortName;
      document.documentElement.style.setProperty('--purple',d.primary_color||'#6a0dad');
      document.documentElement.style.setProperty('--yellow',d.accent_color||'#ffc400');
      const brand=document.querySelector('.brand b');if(brand)brand.textContent=shortName+' · Menú';
      document.querySelectorAll('.delivery-note').forEach(el=>{el.textContent=el.textContent.replaceAll('el restaurante',shortName)});
      const pickup=document.querySelector('#pickupInfo h3');if(pickup)pickup.textContent='Recoger en '+shortName;
      if(d.modules?.delivery!==true){
        const app=document.querySelector('.app');
        if(app)app.innerHTML='<div style="padding:40px 22px;color:#fff;text-align:center"><h2>Pedidos no disponibles</h2><p>Este restaurante no tiene el módulo Delivery habilitado.</p><button class="icon-btn" style="margin:20px auto" onclick="backToApp()">‹</button></div>';
        return;
      }
    }catch(_){}
  }
  loadRestaurantContact();

  async function loadMenuCatalog(){
    try{
      const r=await fetch('/api/cliente?action=menu_catalog&t='+Date.now(),{cache:'no-store'});
      const d=await r.json(); if(!r.ok)throw new Error();
      const cfg=d.catalog||{};
      generalGroups=d.generalModifierGroups||[];
      const nextCounts={};
      for(const group of generalGroups){
        let remaining=group.max;
        for(const option of group.options){
          const count=Math.max(0,Math.min(remaining,group.repeat===false?1:remaining,Math.floor(Number(generalCounts[option.id])||0)));
          if(count)nextCounts[option.id]=count;
          remaining-=count;
        }
      }
      generalCounts=nextCounts;
      saveGeneralCounts();
      const byId=new Map(PRODUCTS.map(product=>[product.id,product]));
      const labels=new Map((d.categories||[]).map(category=>[category.key,category.label]));
      PRODUCTS=Object.entries(cfg).filter(([,item])=>item?.active!==false).map(([id,item])=>{
        const original=byId.get(id)||{ingredients:[]};
        return {
          ...original,id,name:item.name,categoryKey:item.category,
          category:labels.get(item.category)||item.category||original.category||'OTROS',
          price:Number(item.price)||0,image:item.image==='-'?'':item.image||original.image||'',
          thumb:item.image==='-'?'':item.image||original.thumb||'',description:item.description||original.description||'',
          groups:item.type==='combo'?item.groups:null,
          extras:(item.modifiers||[]).filter(x=>x&&x.active!==false),
          modifierGroups:item.modifierGroups||[]
        };
      });
      const categories=[...new Set([...labels.keys(),'COMBOS','ESFIHAS SALADAS','ESFIHAS DULCES','COXINHAS','BEBIDAS','OTROS'])];
      PRODUCTS.sort((a,b)=>{
        const rank=category=>categories.includes(category)?categories.indexOf(category):categories.length;
        return rank(a.categoryKey)-rank(b.categoryKey);
      });
      if(activeCategory!=='TODOS'&&!PRODUCTS.some(p=>p.category===activeCategory))activeCategory='TODOS';
      const coca=product('coca-600');
      upsellDrink=coca&&!coca.modifierGroups?.some(group=>group.min>0)?coca:null;
      if(!upsellDrink)upsellCocaQty=0;
      const previousCount=cart.length;
      cart=cart.filter(line=>{
        const item=product(line.productId);
        if(!item)return false;
        if(item.groups){
          const current=comboCartSelections(item,line.choices,line.qty);
          const batch=comboCartSelections(item,line.batchChoices,line.batchQty);
          if(!current||!batch)return false;
          line.choices=current;
          line.batchChoices=batch;
        }
        const byExtra=new Map(allExtras(item).map(extra=>[extra.id,extra]));
        const refresh=extras=>(extras||[]).flatMap(extra=>{
          const match=byExtra.get(extra.id);
          return match?[{...match,qty:Number(extra.qty)||line.qty}]:[];
        });
        line.extras=refresh(line.extras);
        line.batchExtras=refresh(line.batchExtras);
        if(!validExtraCounts(item,line.extras,line.qty)||!validExtraCounts(item,line.batchExtras,line.batchQty||line.qty))return false;
        const comboSurcharge=item.groups?line.choices.reduce((sum,choice)=>sum+choice.price*choice.qty,0):0;
        line.unitPrice=item.price+(comboSurcharge+line.extras.reduce((sum,extra)=>sum+Number(extra.price)*extra.qty,0))/line.qty;
        return true;
      });
      saveCart();
      if(cart.length<previousCount)showToast('Quitamos artículos que ya no están disponibles.');
      if(typeof renderCatalog==='function')renderCatalog();
      if(typeof renderFeed==='function')renderFeed();
      renderUpsell();
      if($('cartWrap')?.classList.contains('open'))renderCart();
      if($('checkoutWrap')?.classList.contains('open'))updateCheckout();
    }catch(e){console.warn('Menu catalog sync',e)}
  }
  loadMenuCatalog();

  function comboCartSelections(item,choices,qty){
    if(!Number.isInteger(qty)||qty<1||!Array.isArray(choices))return null;
    const result=[];
    for(const group of item.groups){
      const required=group.quantity*qty;
      const options=group.fixed
        ? [{productId:group.options[0].productId,qty:required}]
        : choices.filter(choice=>choice.groupId===group.id);
      if(options.reduce((sum,choice)=>sum+choice.qty,0)!==required)return null;
      for(const choice of options){
        const option=group.options.find(entry=>entry.productId===choice.productId);
        if(!option||!Number.isInteger(choice.qty)||choice.qty<1)return null;
        result.push({
          id:group.id+'/'+option.productId,groupId:group.id,productId:option.productId,
          fixed:group.fixed,name:option.name,price:option.surcharge,qty:choice.qty
        });
      }
    }
    return result;
  }

  function getUid(){return String(new URLSearchParams(location.search).get('uid')||'').trim();}
  function labelPayment(value,change){return value==='cash'?(change?`Efectivo · Cambio para $${change}`:'Efectivo · Sin cambio'):'Transferencia';}
  function selectedRequired(p){return (Number(p?.choice?.required)||0)*Math.max(1,Number(detailState?.qty)||1);}
  function extraLimit(p){const qty=Math.max(1,Number(detailState?.qty)||1);return p?.choice?.required?qty*Number(p.choice.required):qty;}
  function selectableExtras(p){return (p?.extras||[]).filter(x=>x.id!=='coca-600');}
  function allExtras(p){return [...selectableExtras(p),...(p?.modifierGroups||[]).flatMap(group=>group.options)];}
  function selectedInGroup(group, counts) {
    return group.options.reduce((sum, option) => sum+(Number(counts[option.id])||0),0);
  }
  function validExtraCounts(p, extras, qty) {
    const counts=Object.fromEntries(extras.map(extra=>[extra.id,Number(extra.qty)||0]));
    return (p.modifierGroups||[]).every(group=>{
      const total=selectedInGroup(group,counts);
      return total>=group.min*qty&&total<=group.max*qty&&
        (group.repeat!==false||group.options.every(option=>(counts[option.id]||0)<=qty));
    });
  }

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
    box.innerHTML=`<h3>¿Algo más para tu pedido?</h3><div class="flavor-row"><div><b id="upsellDrinkName"></b><small id="upsellDrinkPrice"></small></div><div class="mini-qty"><button id="upsellCocaMinus" type="button" aria-label="Quitar Coca-Cola">−</button><b id="upsellCocaQty">0</b><button id="upsellCocaPlus" type="button" aria-label="Agregar Coca-Cola">+</button></div></div>`;
    summary.insertAdjacentElement('beforebegin',box);
    document.getElementById('upsellCocaMinus').onclick=()=>changeUpsellCoca(-1);
    document.getElementById('upsellCocaPlus').onclick=()=>changeUpsellCoca(1);
    renderUpsell();
  }
  function changeUpsellCoca(delta){
    if(!upsellDrink)return;
    upsellCocaQty=Math.max(0,Math.min(20,upsellCocaQty+delta));
    renderUpsell();
    updateCheckout();
  }
  function renderUpsell(){
    const box=$('checkoutUpsell');
    if(!box)return;
    box.classList.toggle('hidden',!upsellDrink);
    if(!upsellDrink)return;
    $('upsellDrinkName').textContent=upsellDrink.name;
    $('upsellDrinkPrice').textContent=MXN.format(upsellDrink.price)+' c/u';
    $('upsellCocaQty').textContent=upsellCocaQty;
    $('upsellCocaMinus').disabled=upsellCocaQty<=0;
  }
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
    renderGeneralModifiers($('checkoutGeneralModifiers'),true);
    const delivery=selectedValue('fulfillment')==='delivery',base=cartItems().reduce((n,x)=>n+(Number(x.line.unitPrice)||0)*x.qty,0),subtotal=base+(upsellCocaQty*(upsellDrink?.price||0))+generalSelection(true).total,fee=deliveryFee(),preview=vipPreview(subtotal,delivery?fee:0),feeText=delivery?(fee?MXN.format(preview.fee):'Por calcular'):'Sin costo';
    if(selectedVipBenefit?.type==='free_delivery'&&!delivery){selectedVipBenefit=null;selectedVipRequestId='';localStorage.removeItem('vip_benefit_request_id');renderCheckoutVipBenefits()}
    const summary=document.getElementById('checkoutSummary');
    if(summary)summary.innerHTML=`<div class="summary-line"><span>Subtotal</span><strong>${MXN.format(subtotal)}</strong></div>${upsellCocaQty?`<div class="summary-line"><span>${esc(upsellDrink?.name)} × ${upsellCocaQty}</span><strong>${MXN.format(upsellCocaQty*(upsellDrink?.price||0))}</strong></div>`:''}${selectedVipBenefit?`<div class="summary-line"><span>👑 ${selectedVipBenefit.title}</span><strong>${selectedVipBenefit.type==='free_delivery'?'Aplicado':('-'+MXN.format(preview.discount))}</strong></div>`:''}<div class="summary-line"><span>${delivery?'Envío':'Retiro'}</span><strong>${feeText}</strong></div><div class="summary-line final"><span>Total</span><strong>${MXN.format(preview.total)}</strong></div>`;
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
    for(const extra of selectableExtras(p)){
      detailState.extraQty[extra.id]=Math.min(maxExtras,Number(detailState.extraQty[extra.id])||0);
    }
    for(const group of p.modifierGroups||[]){
      if(group.repeat===false){
        for(const option of group.options){
          detailState.extraQty[option.id]=Math.min(detailState.qty,Number(detailState.extraQty[option.id])||0);
        }
      }
      let over=selectedInGroup(group,detailState.extraQty)-group.max*detailState.qty;
      for(const option of [...group.options].reverse()){
        if(over<=0)break;
        const count=Number(detailState.extraQty[option.id])||0;
        const removed=Math.min(count,over);
        detailState.extraQty[option.id]=count-removed;
        over-=removed;
      }
    }
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
    const p=product(detailState.productId);
    const group=p.modifierGroups?.find(group=>group.options.some(option=>option.id===id));
    const current=Math.max(0,Number(detailState.extraQty[id])||0);
    const limit=group?(group.repeat===false?1:group.max)*detailState.qty:extraLimit(p);
    if(delta>0&&group&&selectedInGroup(group,detailState.extraQty)>=group.max*detailState.qty)return;
    detailState.extraQty[id]=Math.max(0,Math.min(limit,current+Number(delta||0)));
    if(!detailState.extraQty[id])delete detailState.extraQty[id];
    renderDetailOptions();
  };

  function comboChoices(item){
    return item.groups.flatMap(group=>group.options.flatMap(option=>{
      const id=group.id+'/'+option.productId;
      const qty=group.fixed?group.quantity:Number(detailState.choices[id])||0;
      return qty?[{id,groupId:group.id,productId:option.productId,
        fixed:group.fixed,name:option.name,price:option.surcharge,qty}]:[];
    }));
  }

  function changeComboChoice(group,option,delta){
    const total=group.options.reduce((sum,item)=>sum+(detailState.choices[group.id+'/'+item.productId]||0),0);
    if(delta>0&&total>=group.quantity)return;
    const id=group.id+'/'+option.productId;
    detailState.choices[id]=Math.max(0,(detailState.choices[id]||0)+delta);
    renderDetailOptions();
  }

  function comboOptionBlocks(item){
    return item.groups.map((group,index)=>{
      const total=group.options.reduce((sum,option)=>sum+(detailState.choices[group.id+'/'+option.productId]||0),0);
      return `<div class="option-block"><div class="option-title"><strong>${esc(group.name)}</strong>
        <span>${group.fixed?'Incluido':`${total} de ${group.quantity}`}</span></div>
        <div class="flavor-list">${group.options.map((option,optionIndex)=>{
          const qty=group.fixed?group.quantity:detailState.choices[group.id+'/'+option.productId]||0;
          return `<div class="flavor-row"><div><b>${esc(option.name)}</b><small>${option.surcharge?'+ '+MXN.format(option.surcharge)+' c/u':'Incluido en el precio'}</small></div>
            ${group.fixed?`<strong>× ${qty}</strong>`:`<div class="mini-qty">
              <button type="button" data-combo-choice="${index}:${optionIndex}:-1" ${qty?'':'disabled'} aria-label="Quitar ${esc(option.name)}">−</button>
              <b>${qty}</b>
              <button type="button" data-combo-choice="${index}:${optionIndex}:1" ${total>=group.quantity?'disabled':''} aria-label="Agregar ${esc(option.name)}">+</button>
            </div>`}</div>`;
        }).join('')}</div></div>`;
    });
  }

  window.detailTotal=function(){
    if(!detailState)return 0;
    normalizeDetailState();
    const p=product(detailState.productId),qty=Math.max(1,Number(detailState.qty)||1);
    let total=p.price*qty;
    if(p.groups)total+=comboChoices(p).reduce((sum,choice)=>sum+choice.price*choice.qty,0);
    (p?.choice?.options||[]).forEach(x=>total+=(Number(detailState.choices[x.id])||0)*(Number(x.price)||0));
    allExtras(p).forEach(x=>total+=(Number(detailState.extraQty[x.id])||0)*(Number(x.price)||0));
    return total;
  };

  window.updateDetailTotal=function(){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),required=selectedRequired(p),selected=selectedChoiceCount(),qty=detailState.qty;
    const groupsComplete=(p.modifierGroups||[]).every(group=>selectedInGroup(group,detailState.extraQty)>=group.min*qty);
    const complete=(!p.choice||selected===required)&&groupsComplete;
    if(p.groups){
      const valid=groupsComplete&&!!comboCartSelections(p,comboChoices(p),1);
      $('detailPrice').textContent=MXN.format(detailTotal());
      $('detailOrder').disabled=!valid;
      $('detailOrder').textContent=valid?`AGREGAR COMBO · ${MXN.format(detailTotal())}`:'COMPLETA TUS OPCIONES';
      return;
    }
    $('detailPrice').textContent=MXN.format(detailTotal());
    $('detailOrder').disabled=!complete;
    $('detailOrder').textContent=complete?`AGREGAR ${qty} · ${MXN.format(detailTotal())}` : 'COMPLETA TUS OPCIONES';
  };

  function modifierOptionBlocks(groups,counts,units,attribute){
    const blocks=[];
    for(const [groupIndex,group] of groups.entries()){
      if(!group.options.length)continue;
      const count=selectedInGroup(group,counts);
      const max=group.max*units;
      blocks.push(`<div class="option-block"><div class="option-title"><strong>${esc(group.name)}</strong>
        <span>${group.min?`Elige al menos ${group.min*units}`:'Opcional'} · ${count}/${max}</span></div>
        <div class="flavor-list">${group.options.map((option,index)=>{
          const qty=Number(counts[option.id])||0;
          return `<div class="flavor-row"><div><b>${esc(option.name)}</b><small>${option.price?'+ '+MXN.format(option.price)+' c/u':'Incluido'}</small></div>
            <div class="mini-qty"><button type="button" ${attribute}="${groupIndex}:${index}:-1" ${qty?'':'disabled'} aria-label="Quitar ${esc(option.name)}">−</button>
            <b>${qty}</b><button type="button" ${attribute}="${groupIndex}:${index}:1" ${count>=max||(group.repeat===false&&qty>=units)?'disabled':''} aria-label="Agregar ${esc(option.name)}">+</button></div></div>`;
        }).join('')}</div></div>`);
    }
    return blocks;
  }

  function generalSelection(includeUpsell){
    const eligible=cartItems().some(({p})=>!p.groups)||(includeUpsell&&upsellDrink&&upsellCocaQty>0);
    const groups=eligible?generalGroups:[];
    const options=groups.flatMap(group=>group.options.flatMap(option=>{
      const qty=Number(generalCounts[option.id]);
      return Number.isInteger(qty)&&qty>0?[{id:option.id,qty,price:option.price}]:[];
    }));
    return {
      groups,options,
      total:options.reduce((sum,option)=>sum+option.price*option.qty,0),
      valid:validExtraCounts({modifierGroups:groups},options,1)
    };
  }

  function saveGeneralCounts(){
    localStorage.setItem(generalStorage,JSON.stringify(generalCounts));
  }

  function renderGeneralModifiers(target,checkout){
    if(!target)return;
    const {groups}=generalSelection(checkout);
    target.hidden=!groups.length;
    if(!groups.length){target.replaceChildren();return;}
    target.innerHTML='<h3>Adicionales</h3>'+
      modifierOptionBlocks(groups,generalCounts,1,'data-general-choice').join('');
    target.querySelectorAll('[data-general-choice]').forEach(button=>{
      button.onclick=()=>{
        const key=button.dataset.generalChoice;
        const [groupIndex,optionIndex,delta]=key.split(':').map(Number);
        const group=groups[groupIndex], option=group.options[optionIndex];
        const qty=Number(generalCounts[option.id])||0;
        if(delta>0&&selectedInGroup(group,generalCounts)>=group.max)return;
        generalCounts[option.id]=Math.max(0,qty+delta);
        saveGeneralCounts();
        if(checkout)updateCheckout();else renderCart();
        const next=target.querySelector(`[data-general-choice="${key}"]`);
        if(next?.disabled)next.parentElement.querySelector('button:not(:disabled)')?.focus();
        else next?.focus();
      };
    });
  }

  const nativeRenderCart=window.renderCart;
  window.renderCart=function(){
    nativeRenderCart();
    if(!cart.length){generalCounts={};saveGeneralCounts();}
    renderGeneralModifiers($('cartGeneralModifiers'),false);
    const {total,groups}=generalSelection(false);
    if(groups.length)$('cartTotal').querySelector('strong').textContent=MXN.format(cartSubtotal()+total);
  };

  window.renderDetailOptions=function(){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),blocks=[],maxExtras=extraLimit(p),extras=selectableExtras(p);
    if(p.groups)blocks.push(...comboOptionBlocks(p));
    else blocks.push(`<div class="option-block"><div class="option-title"><strong>Cantidad</strong><span>${detailState.qty} ${detailState.qty===1?'pieza':'piezas'}</span></div><div class="mini-qty" style="justify-content:flex-end"><button type="button" onclick="changeProductQty(-1)" ${detailState.qty<=1?'disabled':''} aria-label="Quitar una pieza">−</button><b>${detailState.qty}</b><button type="button" onclick="changeProductQty(1)" ${detailState.qty>=20?'disabled':''} aria-label="Agregar una pieza">+</button></div></div>`);
    if(p.choice){
      const count=selectedChoiceCount(),required=selectedRequired(p),complete=count===required;
      blocks.push(`<div class="option-block"><div class="option-title"><strong>Elige ${required} sabores</strong><span class="${complete?'complete':''}">${count} de ${required}</span></div><div class="flavor-list">${p.choice.options.map(x=>{const qty=Number(detailState.choices[x.id])||0,full=count>=required;return`<div class="flavor-row"><div><b>${esc(x.name)}</b><small>${x.price?`+ ${MXN.format(x.price)} por pieza`:'Sin costo extra'}</small></div><div class="mini-qty"><button type="button" onclick="changeFlavor('${esc(x.id)}',-1)" ${qty?'':'disabled'} aria-label="Quitar ${esc(x.name)}">−</button><b>${qty}</b><button type="button" onclick="changeFlavor('${esc(x.id)}',1)" ${full?'disabled':''} aria-label="Agregar ${esc(x.name)}">+</button></div></div>`}).join('')}</div></div>`);
    }
    if(extras.length){
      blocks.push(`<div class="option-block"><div class="option-title"><strong>Extras</strong><span>Hasta ${maxExtras} por extra</span></div><div class="flavor-list">${extras.map(x=>{const qty=Number(detailState.extraQty[x.id])||0;return`<div class="flavor-row"><div><b>${esc(x.name)}</b><small>+ ${MXN.format(x.price)} c/u</small></div><div class="mini-qty"><button type="button" onclick="changeExtraQty('${esc(x.id)}',-1)" ${qty?'':'disabled'} aria-label="Quitar ${esc(x.name)}">−</button><b>${qty}</b><button type="button" onclick="changeExtraQty('${esc(x.id)}',1)" ${qty>=maxExtras?'disabled':''} aria-label="Agregar ${esc(x.name)}">+</button></div></div>`}).join('')}</div></div>`);
    }
    blocks.push(...modifierOptionBlocks(p.modifierGroups||[],detailState.extraQty,detailState.qty,'data-mod-choice'));
    $('detailOptions').innerHTML=blocks.join('');
    $('detailOptions').querySelectorAll('[data-combo-choice]').forEach(button=>{
      const [groupIndex,optionIndex,delta]=button.dataset.comboChoice.split(':').map(Number);
      const group=p.groups[groupIndex];
      button.onclick=()=>changeComboChoice(group,group.options[optionIndex],delta);
    });
    $('detailOptions').querySelectorAll('[data-mod-choice]').forEach(button=>{
      const [groupIndex,index,delta]=button.dataset.modChoice.split(':').map(Number);
      button.onclick=()=>changeExtraQty(p.modifierGroups[groupIndex].options[index].id,delta);
    });
    updateDetailTotal();
  };

  window.addConfiguredToCart=function(){
    if(!detailState)return;
    normalizeDetailState();
    const p=product(detailState.productId),qty=Math.max(1,Number(detailState.qty)||1),required=selectedRequired(p);
    if(p.groups&&!comboCartSelections(p,comboChoices(p),1))return;
    if(p.choice&&selectedChoiceCount()!==required)return;
    const choices=p.groups?comboChoices(p):(p.choice?.options||[]).map(x=>({id:x.id,name:x.name,qty:Number(detailState.choices[x.id])||0,price:Number(x.price)||0})).filter(x=>x.qty);
    const extras=allExtras(p).map(x=>({id:x.id,name:x.name,price:Number(x.price)||0,qty:Number(detailState.extraQty[x.id])||0})).filter(x=>x.qty);
    if(!validExtraCounts(p,extras,qty))return;
    const note=String($('detailNote').value||'').trim(),totalPrice=detailTotal(),unitPrice=totalPrice/qty;
    const signature=JSON.stringify({productId:p.id,qty,choices:choices.map(x=>[x.id,x.qty]),extras:extras.map(x=>[x.id,x.qty]),note});
    const batchChoices=choices.map(x=>({...x})),batchExtras=extras.map(x=>({...x}));
    const line=cart.find(x=>x.signature===signature);
    if(line){
      const next=Number(line.qty)+qty;
      if(next>99){showToast('El máximo por artículo es de 99 unidades.');return;}
      resizeCartLine(line,p,next);
    }else{
      cart.push({lineId:`${Date.now()}_${Math.random().toString(36).slice(2,7)}`,signature,productId:p.id,qty,unitPrice,choices,extras,note,batchQty:qty,batchChoices,batchExtras});
    }
    saveCart();closeDetails();showToast(`${qty} ${qty===1?'pieza agregada':'piezas agregadas'}`);
  };

  function scaleCartOptions(options,qty,batchQty,groupFor){
    const positions=new Map();
    const batches=Math.floor(qty/batchQty);
    const remainder=qty%batchQty;
    return (options||[]).flatMap(option=>{
      const group=groupFor(option);
      const start=positions.get(group)||0;
      const count=Number(option.qty);
      // Distribute each group's selections across units without losing uneven quantities.
      let selected=count*batches+Math.floor(count/batchQty)*remainder;
      const rest=count%batchQty;
      for(let i=0;i<rest;i++){
        if((start+i)%batchQty<remainder)selected++;
      }
      positions.set(group,(start+rest)%batchQty);
      return selected?[{...option,qty:selected}]:[];
    });
  }

  function resizeCartLine(line,item,qty){
    const batchQty=Number(line.batchQty);
    const groupByOption=new Map((item.modifierGroups||[]).flatMap(group=>group.options.map(option=>[option.id,group])));
    line.choices=scaleCartOptions(line.batchChoices,qty,batchQty,option=>option.groupId||'flavors');
    line.extras=scaleCartOptions(line.batchExtras,qty,batchQty,option=>groupByOption.get(option.id)||option.id);
    const extrasCost=[...line.choices,...line.extras].reduce((sum,option)=>sum+(Number(option.price)||0)*option.qty,0);
    line.qty=qty;
    line.unitPrice=item.price+extrasCost/qty;
  }

  const nativeChangeQty=window.changeQty;
  window.changeQty=function(lineId,delta){
    const line=cart.find(item=>item.lineId===lineId);
    if(!line)return;
    const qty=Number(line.qty)+Math.sign(delta);
    if(qty>99){showToast('El máximo por artículo es de 99 unidades.');return;}
    const item=product(line.productId);
    if(!line.batchQty||!item||qty<=0){
      nativeChangeQty(lineId,Math.sign(delta));
      return;
    }
    resizeCartLine(line,item,qty);
    saveCart();renderCart();
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
    const general=generalSelection(true);
    if(!general.valid){
      checkoutError('Completa la selección de complementos generales.');
      $('checkoutGeneralModifiers')?.scrollIntoView({block:'nearest'});
      return;
    }
    const fulfillment=selectedValue('fulfillment'),scheduled=selectedValue('orderTime')==='scheduled',payment=selectedValue('payment'),baseSubtotal=cartItems().reduce((n,x)=>n+(Number(x.line.unitPrice)||0)*x.qty,0),subtotal=baseSubtotal+(upsellCocaQty*(upsellDrink?.price||0))+general.total,fee=deliveryFee(),total=subtotal+fee,change=Math.max(0,Number(document.getElementById('cashChange')?.value)||0);
    if(fulfillment==='delivery'&&!fee){if(typeof checkoutError==='function')checkoutError('Calcula el envío o selecciona una tarifa provisional.');return;}
    if(payment==='cash'&&change>0&&change<total){if(typeof checkoutError==='function')checkoutError(`El cambio debe ser para una cantidad igual o mayor a ${MXN.format(total)}.`);return;}
    const btn=form.querySelector('button[type="submit"]'),old=btn?.textContent||'CONFIRMAR POR WHATSAPP';
    sending=true;if(btn){btn.disabled=true;btn.textContent='CREANDO PEDIDO...';}
    const waWindow=window.open('about:blank','_blank');
    try{
      const items=cartItems().map(x=>({productId:x.p.id,name:x.p.name,qty:x.qty,unitPrice:Number(x.line.unitPrice)||0,modifiers:(x.line.extras||[]).map(m=>({id:m.id,qty:Math.max(1,Number(m.qty)||x.qty)})),comboSelections:x.p.groups?(x.line.choices||[]).filter(choice=>!choice.fixed).map(({groupId,productId,qty})=>({groupId,productId,qty})):undefined,note:x.line.note,details:whatsappDetails(x.line),line:x.line}));
      if(upsellDrink&&upsellCocaQty>0)items.push({productId:upsellDrink.id,name:upsellDrink.name,qty:upsellCocaQty,unitPrice:upsellDrink.price,details:'',line:null});
      if(!items.length)throw new Error('Agrega un artículo antes de confirmar el pedido.');
      const address=document.getElementById('deliveryAddress')?.value.trim()||'',baseReferences=document.getElementById('deliveryReference')?.value.trim()||'',scheduledAt=scheduled?(document.getElementById('scheduledAt')?.value||''):'';
      const isResidential=!!document.getElementById('residentialDelivery')?.checked,needsQr=isResidential&&!!document.getElementById('residentialQr')?.checked,residentialInstructions=isResidential?(document.getElementById('residentialInstructions')?.value.trim()||''):'';
      const accessParts=[];
      if(isResidential)accessParts.push('Residencial/condominio');
      if(needsQr)accessParts.push('Requiere QR para entrar');
      if(residentialInstructions)accessParts.push(`Acceso: ${residentialInstructions}`);
      const references=[baseReferences,...accessParts].filter(Boolean).join(' · ');
      const payload={action:'order_create',uid:getUid(),name,phone,items:items.map(({line,...rest})=>rest),generalModifiers:general.options.map(({id,qty})=>({id,qty})),fulfillment,scheduledAt,subtotal,deliveryFee:fee,total,address,references,payment:labelPayment(payment,change),benefit_request_id:selectedVipRequestId||'',deliveryDestination:fulfillment==='delivery'?{...(deliveryLocation||{}),address,placeId:deliveryPlaceId}:null,insidePlaza:!!document.getElementById('insidePlaza')?.checked,deliveryAt:scheduledAt,route:deliveryQuote?{distanceKm:deliveryQuote.distanceKm,durationMinutes:deliveryQuote.durationMinutes}:null};
      const r=await fetch('/api/cliente',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'No pudimos registrar el pedido.');
      const order=data.order||{},serverItems=Array.isArray(order.items)?order.items:items,lines=serverItems.map(i=>`• ${i.qty}x ${i.name} — ${MXN.format((Number(i.unitPrice)||0)*(Number(i.qty)||1))}${i.details?`\n${i.details}`:''}`),serverSubtotal=Number(order.subtotal||0),serverFee=Number(order.deliveryFee||0),serverDiscount=Number(order.discount||0),serverTotal=Number(order.total||0),mapLink=deliveryLocation?`https://www.google.com/maps?q=${deliveryLocation.latitude},${deliveryLocation.longitude}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,routeDetails=deliveryQuote?`\nRuta: ${deliveryQuote.distanceKm.toFixed(1)} km${quoteExtrasText(deliveryQuote)} · Total envío ${MXN.format(fee)}`:'',residentialText=isResidential?`\nResidencial: Sí${needsQr?' · Requiere QR':''}${residentialInstructions?`\nInstrucciones de acceso: ${residentialInstructions}`:''}`:'',deliveryText=fulfillment==='delivery'?`ENVÍO\nDirección: ${address}\nGoogle Maps: ${mapLink}${routeDetails}${residentialText}\nReferencias: ${baseReferences||'Sin referencias'}`:'RECOGER EN UAI SÔ',when=scheduled?formatScheduled(scheduledAt):'Lo antes posible';
      if(order.generalModifiers?.details)lines.push(`• Adicionales — ${MXN.format(order.generalModifiers.total)}\n${order.generalModifiers.details}`);
      const text=`Hola! Pedido ${order.code||''}\n\n${lines.join('\n\n')}\n\nSubtotal: ${MXN.format(serverSubtotal)}\n${serverDiscount?`Descuento VIP: -${MXN.format(serverDiscount)}\n`:''}${fulfillment==='delivery'?`Envío: ${MXN.format(serverFee)}\n`:''}TOTAL: ${MXN.format(serverTotal)}\n\n${deliveryText}\nHorario: ${when}\nPago: ${labelPayment(payment,change)}\n\nCliente: ${name}\nTeléfono: ${phone}`;
      localStorage.setItem('restaurant_checkout_profile',JSON.stringify({name,phone}));
      if(typeof showToast==='function')showToast(`Pedido ${order.code||''} creado`);
      try{cart=[];}catch(_){}
      generalCounts={};saveGeneralCounts();
      upsellCocaQty=0;selectedVipBenefit=null;selectedVipRequestId='';localStorage.removeItem('vip_benefit_request_id');renderUpsell();
      localStorage.setItem('restaurant_video_cart','[]');
      if(typeof renderCartBadge==='function')renderCartBadge();
      if(waWindow)waWindow.location.href='https://api.whatsapp.com/send?phone='+restaurantWhatsApp+'&text='+encodeURIComponent(text);else location.href='https://api.whatsapp.com/send?phone='+restaurantWhatsApp+'&text='+encodeURIComponent(text);
    }catch(e){
      if(waWindow)waWindow.close();
      if(typeof checkoutError==='function')checkoutError(e.message||'No pudimos crear el pedido.');
    }finally{sending=false;if(btn){btn.disabled=false;btn.textContent=old;}}
  };
})();