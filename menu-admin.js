(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
  const money = new Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN', minimumFractionDigits:0});
  const idFor = prefix => prefix + '_' + crypto.randomUUID();
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-MX');
  const number = (value,min,max) => value !== '' && Number.isFinite(Number(value)) && Number(value)>=min && Number(value)<=max;
  const tabs = {
    products:{name:'Productos', add:'Nuevo producto'},
    combos:{name:'Combos', add:'Crear combo'},
    categories:{name:'Categorías', add:'Nueva categoría'},
    groups:{name:'Complementos', add:'Nuevo grupo'}
  };
  const uaiCategories = [
    {key:'COMBOS',label:'Combos'}, {key:'ESFIHAS SALADAS',label:'Esfihas saladas'},
    {key:'ESFIHAS DULCES',label:'Esfihas dulces'}, {key:'COXINHAS',label:'Coxinhas'},
    {key:'BEBIDAS',label:'Bebidas'}, {key:'OTROS',label:'Otros'}
  ];
  let catalog = {}, settings = {categories:[],groups:[],generalRules:[]};
  let host, tab = 'products', categoryFilter = '', statusFilter = '', search = '';
  let editor = null, busy = false, loading = false;
  const $ = selector => host.querySelector(selector);
  const company = new URLSearchParams(location.search).get('company') || 'uai-so';
  const hasLegacyMedia = company === 'uai-so';
  const menuLink = '/menu-videos.html?company=' + encodeURIComponent(company);

  function categories() {
    const fallback = hasLegacyMedia ? uaiCategories : [{key:'COMBOS',label:'Combos'},{key:'OTROS',label:'Otros'}];
    const overflow = [...new Set(Object.values(catalog).map(item=>item.category))]
      .filter(Boolean).map(key=>({key,label:key}));
    const byKey = new Map();
    const base = settings.categories.length ? settings.categories : fallback;
    for (const entry of [...base,...overflow]) {
      if (!byKey.has(entry.key)) byKey.set(entry.key,entry);
    }
    return [...byKey.values()];
  }

  function itemPhoto(id,item) {
    if (/^(https?:\/\/|\/(?!\/))/i.test(item.image || '')) return item.image;
    if (hasLegacyMedia && item.image !== '-') {
      return window.uaiSoMenuMedia?.find(product=>product.id===id)?.thumb || '';
    }
    return '';
  }

  function categoryName(key) {
    return categories().find(category=>category.key===key)?.label || key || 'Otros';
  }

  async function request(payload) {
    const response = await fetch(payload ? '/api/cliente' : '/api/cliente?action=admin_catalog', payload ? {
      method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
    } : {cache:'no-store'});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || 'No se pudo conectar con el menú.');
    return data;
  }

  function message(text,isError=false) {
    const status=$('[data-menu-status]');
    status.textContent=text;
    status.classList.toggle('menu-error',isError);
    $('[data-menu-retry]').hidden=!isError;
    status.parentElement.hidden=!text;
  }

  async function load() {
    if (busy || loading) return;
    loading = true;
    $('[data-menu-add]').disabled=true;
    message('Cargando menú…');
    try {
      const data = await request();
      catalog = data.catalog || {};
      settings = data.settings || {categories:[],groups:[],generalRules:[]};
      renderList();
      $('[data-menu-add]').disabled=false;
      message('');
    } catch(error) {
      message(error.message,true);
    } finally {
      loading=false;
    }
  }

  function modifierRules(item) {
    return item.modifierGroupRules ?? (item.modifierGroupIds || []).flatMap(id=>{
      const group=settings.groups.find(entry=>entry.id===id);
      return group?[{id,min:group.min??0,max:group.max??1,repeat:false}]:[];
    });
  }

  function availability(item) {
    if (!item.active) return 'Pausado';
    if (modifierRules(item).some(rule=>{
      const active=settings.groups.find(entry=>entry.id===rule.id)?.options.filter(option=>option.active).length || 0;
      return rule.min>0 && (!active || (rule.repeat===false && active<rule.min));
    })) return 'Sin disponibilidad';
    if (item.type==='combo') {
      const unavailable=!item.groups?.length || item.groups.some(group=>!group.options.some(option=>{
        const component=catalog[option.productId];
        return component?.type!=='combo'&&component&&availability(component)==='Disponible';
      }));
      if (unavailable) return 'Sin disponibilidad';
    }
    return 'Disponible';
  }

  function photoMarkup(url,name) {
    return url ? `<img src="${escape(url)}" alt="" loading="lazy">` : `<span aria-hidden="true">${escape(name?.slice(0,1)?.toUpperCase()||'✦')}</span>`;
  }

  function matches(item,key='') {
    const typeMatches=(item.type==='combo')===(tab==='combos');
    return typeMatches && (!key || item.category===key) && (!statusFilter || availability(item)===statusFilter) &&
      normalize(item.name+' '+categoryName(item.category)).includes(normalize(search));
  }

  function renderList() {
    const active = tabs[tab];
    $('[data-menu-add]').textContent='+ '+active.add;
    host.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tab===tab)));
    const body=$('[data-menu-content]');
    const filters=$('[data-menu-filters]');
    filters.hidden=tab==='categories'||tab==='groups';
    if (tab==='categories') {
      const cards=categories();
      body.innerHTML=`<section class="menu-list-card menu-manage">
        <div class="menu-list-heading"><h3>Orden de categorías</h3><p>Este orden también se aplica al menú del cliente.</p></div>
        ${cards.map((category,index)=>{
          const count=Object.values(catalog).filter(item=>item.category===category.key).length;
          return `<article class="menu-manage-row"><div class="menu-photo menu-icon-tile" aria-hidden="true">▤</div>
            <div class="menu-item"><strong>${escape(category.label)}</strong><small>${count} ${count===1?'artículo':'artículos'}</small></div>
            <div class="menu-actions"><button type="button" class="menu-button menu-icon" data-category-move="${index}:-1" ${index===0?'disabled':''} aria-label="Subir ${escape(category.label)}">↑</button>
            <button type="button" class="menu-button menu-icon" data-category-move="${index}:1" ${index===cards.length-1?'disabled':''} aria-label="Bajar ${escape(category.label)}">↓</button>
            <button type="button" class="menu-button" data-category-edit="${escape(category.key)}">Editar</button></div></article>`;
        }).join('')}
      </section>`;
      return;
    }

    if (tab==='groups') {
      const generalCount=settings.generalRules?.length || 0;
      const general=`<section class="menu-list-card menu-general-settings"><div class="menu-card-head">
        <div><h3>Complementos generales del pedido</h3><p>Se ofrecen una sola vez si hay productos sueltos en el carrito.</p></div>
        <button type="button" class="menu-button" data-general-edit>Configurar generales${generalCount?' ('+generalCount+')':''}</button>
      </div></section>`;
      const groups=settings.groups.length ? `<section class="menu-list-card menu-manage">
        <div class="menu-list-heading"><h3>Grupos de complementos</h3><p>Úsalos en varios productos. Al editar un grupo se actualizan todos los artículos vinculados.</p></div>
        ${settings.groups.map(group=>{
          const count=Object.values(catalog).filter(item=>modifierRules(item).some(rule=>rule.id===group.id)).length;
          return `<article class="menu-manage-row"><div class="menu-photo menu-icon-tile" aria-hidden="true">＋</div>
            <div class="menu-item"><strong>${escape(group.name)}</strong><small>${group.options.length} opciones · ${count} artículos vinculados</small></div>
            <button type="button" class="menu-button" data-group-edit="${escape(group.id)}">Editar</button></article>`;
        }).join('')}
      </section>` : '<div class="menu-empty"><h3>Aún no hay grupos de complementos</h3><p>Crea un grupo como Salsas extra y aplícalo a los productos que quieras personalizar.</p></div>';
      body.innerHTML=general+groups;
      return;
    }

    const items=Object.entries(catalog);
    const current=items.filter(([,item])=>matches(item,tab==='products'?categoryFilter:''));
    const categoryList=categories();
    const renderRows=rows=>rows.map(([id,item])=>{
      const state=availability(item);
      const details=item.type==='combo' ? `${item.groups?.length||0} grupos` : item.description;
      return `<article class="menu-row">
        <div class="menu-photo">${photoMarkup(itemPhoto(id,item),item.name)}</div>
        <div class="menu-item"><strong>${escape(item.name)}</strong>
          ${details?`<small>${escape(details)}</small>`:''}</div>
        <strong class="menu-price">${money.format(item.price)}</strong>
        <div class="menu-row-actions"><button type="button" class="menu-state" data-toggle="${escape(id)}" data-state="${state==='Disponible'?'on':state==='Pausado'?'off':'blocked'}"
          title="${item.active?'Pausar':'Activar'} ${escape(item.name)}" aria-label="${item.active?'Pausar':'Activar'} ${escape(item.name)}"><i aria-hidden="true"></i>${state}</button>
        <button class="menu-button menu-link" type="button" data-edit="${escape(id)}" aria-label="Editar ${escape(item.name)}">Editar</button></div>
      </article>`;
    }).join('');
    const empty=`<div class="menu-empty"><h3>${search||statusFilter?'No encontramos artículos':'Todavía no hay artículos aquí'}</h3>
      <p>${search||statusFilter?'Prueba con otro nombre o filtro.':'Puedes agregar uno desde esta pantalla.'}</p></div>`;
    if (tab==='combos') {
      body.innerHTML=current.length?`<section class="menu-list-card"><div class="menu-list-heading"><h3>Combos</h3><span>${current.length}</span></div>${renderRows(current)}</section>`:empty;
      return;
    }

    body.innerHTML=`<div class="menu-catalog-layout">
      <aside class="menu-category-rail" aria-label="Categorías de productos">
        <h3>Categorías</h3>
        <button type="button" data-category="" aria-pressed="${!categoryFilter}"><span>Todos los productos</span><small>${items.filter(([,item])=>item.type!=='combo').length}</small></button>
        ${categoryList.map(category=>`<button type="button" data-category="${escape(category.key)}" aria-pressed="${categoryFilter===category.key}">
          <span>${escape(category.label)}</span><small>${items.filter(([,item])=>item.type!=='combo'&&item.category===category.key).length}</small></button>`).join('')}
        <button class="menu-rail-link" type="button" data-manage-categories>Administrar categorías <span aria-hidden="true">↗</span></button>
      </aside>
      <div class="menu-category-lists">${current.length ? categoryList.filter(category=>
        current.some(([,item])=>item.category===category.key)).map(category=>{
          const rows=current.filter(([,item])=>item.category===category.key);
          return `<section class="menu-list-card"><div class="menu-list-heading"><div><h3>${escape(category.label)}</h3><span>${rows.length} ${rows.length===1?'producto':'productos'}</span></div>
            <button class="menu-button menu-link" data-add-category="${escape(category.key)}" type="button">+ Producto</button></div>${renderRows(rows)}</section>`;
        }).join('') : empty}</div></div>`;
  }

  function changeTab(next) {
    if (!tabs[next]) return;
    tab=next;
    search='';
    statusFilter='';
    $('[data-menu-search]').value='';
    $('[data-menu-status-filter]').value='';
    renderList();
  }

  function openItem(id,category='') {
    const previous=id?catalog[id]:null;
    const combo=previous?.type==='combo' || (!previous&&tab==='combos');
    const item=previous?structuredClone(previous):{
      name:'',price:'',description:'',image:'',active:false,modifiers:[],modifierGroupRules:[],
      category:combo?(categories().find(entry=>entry.key==='COMBOS')?.key||categories()[0]?.key||'COMBOS'):
        category||categoryFilter||categories().find(entry=>entry.key!=='COMBOS')?.key||'OTROS',
      ...(combo?{type:'combo',groups:[]}:{}),
    };
    item.modifiers ||= [];
    item.modifierGroupRules=modifierRules(item);
    delete item.modifierGroupIds;
    if (combo) item.groups ||= [];
    editor={kind:'item',id:id||idFor(combo?'combo':'producto'),previous,item,step:'details',groupIndex:0};
    showEditor();
  }

  function openCategory(key) {
    const original=categories().find(category=>category.key===key);
    editor={kind:'category',original,item:original?{...original}:{key:idFor('categoria'),label:''}};
    showEditor();
  }

  function openGroup(id) {
    const original=settings.groups.find(group=>group.id===id);
    editor={kind:'group',original,item:original?structuredClone(original):{id:idFor('grupo'),name:'',options:[]}};
    showEditor();
  }

  function openGeneral() {
    editor={kind:'general',item:{modifierGroupRules:structuredClone(settings.generalRules || [])}};
    showEditor();
  }

  const chrome = () => $('[data-menu-workspace]');
  const editorHost = () => $('[data-menu-editor]');
  function showEditor() {
    chrome().hidden=true;
    editorHost().hidden=false;
    renderEditor();
    $('[data-editor-title]').focus();
    window.scrollTo(0,0);
  }

  function closeEditor() {
    if (busy) return;
    editor=null;
    editorHost().hidden=true;
    editorHost().replaceChildren();
    chrome().hidden=false;
    $('[data-menu-add]').focus();
  }

  function input(label,key,value,options='') {
    return `<label>${label}<input data-edit-field="${key}" value="${escape(value)}" ${options}></label>`;
  }

  function optionRows(options,shared=false) {
    return options.map((option,index)=>`<div class="menu-option-row" data-option-index="${index}">
      ${input('Opción','name',option.name,'maxlength="100" placeholder="Ej. Salsa de habanero"')}
      ${input('Precio adicional (MXN)','price',option.price,'type="number" min="0" max="100000" step="0.01"')}
      <label class="menu-check"><input data-edit-field="active" type="checkbox" ${option.active!==false?'checked':''}> Disponible</label>
      <button type="button" class="menu-button menu-icon" data-editor-action="${shared?'remove-shared-option':'remove-extra'}" aria-label="Quitar opción">×</button>
    </div>`).join('');
  }

  function renderDetails(item) {
    const photo=editor.photoPreview||itemPhoto(editor.id,item);
    return `<section class="menu-editor-card"><h3>Información</h3>
      ${input('Nombre','name',item.name,'maxlength="120" placeholder="Ej. Coxinha de pollo"')}
      <label>Descripción<textarea data-edit-field="description" rows="4" maxlength="240" placeholder="Ingredientes, tamaño o detalles del producto">${escape(item.description)}</textarea></label>
      <label>Categoría<select data-edit-field="category" aria-label="Categoría">
        ${categories().map(category=>`<option value="${escape(category.key)}" ${category.key===item.category?'selected':''}>${escape(category.label)}</option>`).join('')}
      </select></label>
    </section>
    <section class="menu-editor-card"><h3>Precio y disponibilidad</h3>
      <div class="menu-fields">
        ${input('Precio de venta (MXN)','price',item.price,'type="number" min="0" max="100000" step="0.01" placeholder="0.00"')}
        <label class="menu-check"><input type="checkbox" data-edit-field="active" ${item.active?'checked':''}> Disponible para pedidos</label>
      </div>
    </section>
    <section class="menu-editor-card"><h3>Foto principal</h3>
      <div class="menu-image-control">
        <div class="menu-photo">${photoMarkup(photo,item.name)}</div>
        <div><label class="menu-button menu-file">Subir foto<input type="file" data-photo-file accept="image/jpeg,image/png,image/webp" aria-label="Subir foto"></label>
          <p>JPG, PNG o WebP. Hasta 8 MB.</p></div>
      </div>
      ${input('O pega el enlace de una imagen','image',item.image==='-'?'':item.image,'maxlength="800" placeholder="https://…" inputmode="url"')}
      ${photo?`<button type="button" class="menu-button menu-link" data-editor-action="remove-photo">Quitar foto</button>`:''}
    </section>`;
  }

  function renderExtras(item,general=false) {
    const scope=general?'pedido con productos sueltos':item.type==='combo'?'combo':'producto';
    const shared=`<section class="menu-editor-card"><h3>Grupos reutilizables</h3>
      <p>Define cuántos complementos se pueden pedir por cada ${scope}. Un mínimo de 0 deja la selección opcional.</p>
      ${settings.groups.length?settings.groups.map(group=>{
        const rule=item.modifierGroupRules.find(entry=>entry.id===group.id);
        return `<div class="menu-modifier-link" data-modifier-link="${escape(group.id)}">
          <label class="menu-group-choice">
            <input type="checkbox" data-attach-group="${escape(group.id)}" ${rule?'checked':''}>
            <span><strong>${escape(group.name)}</strong><small>${group.options.length} opciones</small></span>
          </label>
          ${rule?`<div class="menu-fields">
            ${input('Mínimo','min',rule.min,'type="number" min="0" max="20"')}
            ${input('Máximo','max',rule.max,'type="number" min="1" max="20"')}
          </div>`:''}
        </div>`;
      }).join(''):'<p>Crea un grupo en Menú → Complementos para vincularlo a este artículo.</p>'}
    </section>`;
    if (general || item.type==='combo') return shared;
    return `${shared}
    <section class="menu-editor-card"><h3>Extras de este producto</h3>
      ${item.modifiers.length?optionRows(item.modifiers):'<p>Agrega extras que solo se ofrecen en este artículo.</p>'}
      <button type="button" class="menu-button" data-editor-action="add-extra">+ Agregar extra</button>
    </section>`;
  }

  function renderCombo(item) {
    const products=Object.entries(catalog).filter(([,product])=>product.type!=='combo');
    const group=item.groups[editor.groupIndex];
    const renderProducts=(selected,group)=>categories().map(category=>{
      const entries=products.filter(([,product])=>product.category===category.key);
      return entries.length?`<optgroup label="${escape(category.label)}">${entries.map(([id,product])=>
        `<option value="${escape(id)}" ${selected===id?'selected':''} ${selected!==id&&group.options.some(option=>option.productId===id)?'disabled':''}>${escape(product.name)}${product.active?'':' (Pausado)'}</option>`).join('')}</optgroup>`:'';
    }).join('');
    return `<section class="menu-editor-card"><div class="menu-card-head"><h3>Grupos del combo</h3>
      <button class="menu-button" type="button" data-editor-action="add-combo-group" ${item.groups.length>=10?'disabled':''}>+ Agregar grupo</button></div>
      ${item.groups.length?`<div class="menu-group-tabs" aria-label="Grupos del combo">${item.groups.map((entry,index)=>
        `<button type="button" data-combo-index="${index}" aria-pressed="${index===editor.groupIndex}">${escape(entry.name||'Grupo '+(index+1))}</button>`).join('')}</div>`:
        '<p>Agrega un grupo fijo, como una coxinha incluida, o uno de elección, como una bebida.</p>'}
    </section>
    ${group?`<section class="menu-editor-card"><h3>Editar grupo</h3><div data-combo-group>
      ${input('Nombre del grupo','name',group.name,'maxlength="80" placeholder="Ej. Elige tu bebida"')}
      <div class="menu-fields">
        <label>Tipo<select data-edit-field="fixed" aria-label="Tipo">
          <option value="false" ${!group.fixed?'selected':''}>El cliente elige</option>
          <option value="true" ${group.fixed?'selected':''}>Producto fijo</option>
        </select></label>
        ${input('Unidades por combo','quantity',group.quantity,'type="number" min="1" max="20"')}
      </div>
      <div class="menu-combo-products">${group.options.map((option,index)=>`<div class="menu-option-row menu-combo-option" data-option-index="${index}">
        <label>Producto<select data-edit-field="productId" aria-label="Producto"><option value="">Seleccionar producto</option>${renderProducts(option.productId,group)}</select></label>
        ${!group.fixed?input('Suplemento (MXN)','surcharge',option.surcharge,'type="number" min="0" max="100000" step="0.01"'):''}
        <button type="button" class="menu-button menu-icon" data-editor-action="remove-combo-option" aria-label="Quitar producto">×</button>
      </div>`).join('')}</div>
      <div class="menu-card-head">
        ${(!group.fixed||!group.options.length)?`<button class="menu-button" type="button" data-editor-action="add-combo-option" ${group.options.length>=Math.min(30,products.length)?'disabled':''}>+ Agregar producto</button>`:'<span></span>'}
        <button class="menu-button menu-link" type="button" data-editor-action="remove-combo-group">Quitar grupo</button>
      </div>
    </div></section>`:''}`;
  }

  function renderItemPreview(item) {
    const photo=editor.photoPreview||itemPhoto(editor.id,item);
    const summary=item.description || 'Sin descripción';
    const name=item.name|| (item.type==='combo'?'Nuevo combo':'Nuevo producto');
    return `<section class="menu-preview-card"><h3>Vista previa</h3>
      <div class="menu-preview-photo" data-preview-photo>${photoMarkup(photo,name)}</div>
      <div class="menu-preview-content">
        <small data-preview-category>${escape(categoryName(item.category))}</small>
        <strong data-preview-name>${escape(name)}</strong>
        <p data-preview-description>${escape(summary)}</p>
        <div><b data-preview-price>${item.price!==''?money.format(item.price):'—'}</b>
        <span data-preview-state>${item.active?'Disponible':'Pausado'}</span></div>
      </div>
    </section>`;
  }

  function renderEditor(error='') {
    const {item,kind,step}=editor;
    const combo=item.type==='combo';
    const existing=editor.previous||editor.original;
    const type=kind==='general'?'configuración':kind==='category'?'categoría':kind==='group'?'grupo':combo?'combo':'producto';
    const title=kind==='general'?'Complementos generales del pedido':existing?'Editar '+type:kind==='category'?'Nueva categoría':'Nuevo '+type;
    let fields='';
    if (kind==='item') {
      fields=`<div class="menu-item-editor">
        <div class="menu-editor-main">
          <nav class="menu-editor-nav" aria-label="Secciones del editor">
            <button type="button" data-step="details" aria-pressed="${step==='details'}">Datos del ${type}</button>
            ${combo?`<button type="button" data-step="options" aria-pressed="${step==='options'}">Composición</button>`:''}
            <button type="button" data-step="extras" aria-pressed="${step==='extras'}">Complementos</button>
          </nav>
          ${step==='details'?renderDetails(item):step==='options'?renderCombo(item):renderExtras(item)}
        </div>${renderItemPreview(item)}</div>`;
    } else if (kind==='general') {
      fields=`<div class="menu-single-editor">${renderExtras(item,true)}</div>`;
    } else if (kind==='category') {
      fields=`<section class="menu-editor-card menu-single-editor"><h3>Nombre en el menú</h3>
        ${input('Nombre de la categoría','label',item.label,'maxlength="80" placeholder="Ej. Bebidas artesanales"')}
      </section>`;
    } else {
      fields=`<div class="menu-single-editor"><section class="menu-editor-card"><h3>Información del grupo</h3>
        ${input('Nombre del grupo','name',item.name,'maxlength="80" placeholder="Ej. Salsas"')}
        <p>Los límites se configuran al vincular este grupo a un producto o combo.</p>
      </section><section class="menu-editor-card"><h3>Opciones del grupo</h3>
        ${optionRows(item.options,true)}<button type="button" class="menu-button" data-editor-action="add-shared-option">+ Agregar opción</button>
      </section></div>`;
    }
    editorHost().innerHTML=`<form data-menu-form novalidate>
      <div class="menu-editor-heading"><div><button type="button" class="menu-button menu-link" data-editor-action="cancel">← Volver al menú</button>
        <h2 id="menu-editor-title" data-editor-title tabindex="-1">${title}</h2></div>
        <div class="menu-actions"><button type="button" class="menu-button" data-editor-action="cancel">Cancelar</button>
        <button type="submit" class="menu-button menu-primary" data-editor-submit>Guardar ${type}</button></div></div>
      <p class="menu-error menu-editor-error" data-editor-error role="alert" ${error?'':'hidden'}>${escape(error)}</p>
      ${fields}
    </form>`;
  }

  function refreshPreview() {
    const item=editor.item;
    const name=item.name.trim()||(item.type==='combo'?'Nuevo combo':'Nuevo producto');
    $('[data-preview-name]').textContent=name;
    $('[data-preview-category]').textContent=categoryName(item.category);
    $('[data-preview-description]').textContent=item.description||'Sin descripción';
    $('[data-preview-price]').textContent=item.price!==''&&Number.isFinite(Number(item.price))?money.format(item.price):'—';
    $('[data-preview-state]').textContent=item.active?'Disponible':'Pausado';
    $('[data-preview-photo]').innerHTML=photoMarkup(editor.photoPreview||itemPhoto(editor.id,item),name);
  }

  function showError(error) {
    const node=$('[data-editor-error]');
    node.hidden=false;
    node.textContent=error;
  }

  async function encodePhoto(file) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024) {
      throw new Error('Selecciona una imagen JPG, PNG o WebP de hasta 8 MB.');
    }
    const bitmap=await createImageBitmap(file);
    try {
      const canvas=document.createElement('canvas');
      const context=canvas.getContext('2d');
      for (const side of [900,680,480]) {
        const scale=Math.min(1,side/Math.max(bitmap.width,bitmap.height));
        canvas.width=Math.max(1,Math.round(bitmap.width*scale));
        canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        context.fillStyle='#fff';
        context.fillRect(0,0,canvas.width,canvas.height);
        context.drawImage(bitmap,0,0,canvas.width,canvas.height);
        const url=canvas.toDataURL('image/jpeg',0.78);
        if (url.length<=175000) return url;
      }
      throw new Error('La imagen sigue siendo demasiado pesada.');
    } finally {
      bitmap.close();
    }
  }

  async function uploadPhoto(file) {
    const target=editor;
    if (!file || busy || target.processingPhoto) return;
    target.processingPhoto=true;
    $('[data-editor-submit]').disabled=true;
    try {
      const url=await encodePhoto(file);
      if (editor!==target) return;
      target.photoPreview=url;
      target.photo=url.split(',')[1];
      target.item.image='';
      renderEditor();
    } catch(error) {
      if (editor===target) showError(error.message||'No se pudo leer la imagen.');
    } finally {
      target.processingPhoto=false;
      if (editor===target) $('[data-editor-submit]').disabled=false;
    }
  }

  function changeEditorField(event) {
    if (!editor||busy) return;
    const element=event.target;
    const optionIndex=element.closest('[data-option-index]')?.dataset.optionIndex;
    const inCombo=element.closest('[data-combo-group]');
    const field=element.dataset.editField;
    const attached=element.dataset.attachGroup;
    const item=editor.item;
    if (attached) {
      if (element.checked && item.modifierGroupRules.length>=10) {
        element.checked=false;
        showError('Puedes vincular hasta diez grupos por artículo.');
        return;
      }
      if (element.checked) item.modifierGroupRules.push({id:attached,min:0,max:1});
      else item.modifierGroupRules=item.modifierGroupRules.filter(rule=>rule.id!==attached);
      renderEditor();
      host.querySelectorAll('[data-attach-group]').forEach(checkbox=>{
        if (checkbox.dataset.attachGroup===attached) checkbox.focus();
      });
      return;
    }
    if (!field) return;
    const linkedGroup=element.closest('[data-modifier-link]')?.dataset.modifierLink;
    if (linkedGroup) {
      const rule=item.modifierGroupRules.find(entry=>entry.id===linkedGroup);
      rule[field]=element.value;
      delete rule.repeat;
      return;
    }
    let target=item;
    if (inCombo) target=item.groups[editor.groupIndex];
    if (optionIndex!==undefined) target=(inCombo||editor.kind==='group'?target.options:item.modifiers)[Number(optionIndex)];
    target[field]=element.type==='checkbox'?element.checked:field==='fixed'?element.value==='true':element.value;
    if (field==='fixed' && target.fixed) target.options=target.options.slice(0,1);
    if (field==='fixed'||field==='productId') renderEditor();
    else if (inCombo&&field==='name') $(`[data-combo-index="${editor.groupIndex}"]`).textContent=target.name||'Grupo '+(editor.groupIndex+1);
    else if (editor.kind==='item'&&!inCombo&&optionIndex===undefined) {
      if (field==='image') { editor.photo=undefined; editor.photoPreview=undefined; }
      refreshPreview();
    }
  }

  function editorAction(button) {
    if (busy) return;
    const command=button.dataset.editorAction;
    if (command==='cancel') { closeEditor(); return; }
    const item=editor.item;
    const optionIndex=Number(button.closest('[data-option-index]')?.dataset.optionIndex);
    const group=item.groups?.[editor.groupIndex];
    if (command==='remove-photo') {
      item.image='-';
      editor.photo=undefined;
      editor.photoPreview=undefined;
    }
    if (command==='add-extra'&&item.modifiers.length<30) item.modifiers.push({id:idFor('extra'),name:'',price:0,active:true});
    if (command==='remove-extra') item.modifiers.splice(optionIndex,1);
    if (command==='add-shared-option'&&item.options.length<20) item.options.push({id:idFor('opcion'),name:'',price:0,active:true});
    if (command==='remove-shared-option') item.options.splice(optionIndex,1);
    if (command==='add-combo-group') {
      item.groups.push({id:idFor('grupo'),name:'',quantity:1,fixed:false,options:[{productId:'',surcharge:0}]});
      editor.groupIndex=item.groups.length-1;
    }
    if (command==='remove-combo-group') {
      item.groups.splice(editor.groupIndex,1);
      editor.groupIndex=Math.max(0,editor.groupIndex-1);
    }
    if (command==='add-combo-option') group.options.push({productId:'',surcharge:0});
    if (command==='remove-combo-option') group.options.splice(optionIndex,1);
    renderEditor();
    if (command.startsWith('add-')) {
      const fields=editorHost().querySelectorAll('[data-edit-field="name"],[data-edit-field="productId"]');
      fields[fields.length-1]?.focus();
    }
  }

  function invalidModifierLimits(rules) {
    return rules.some(({min,max})=>!number(min,0,20)||!number(max,Math.max(1,Number(min)),20)||
      !Number.isInteger(Number(min))||!Number.isInteger(Number(max)));
  }

  function validateItem() {
    const item=editor.item;
    if (!item.name.trim() || !number(item.price,0,100000) || !item.category) {
      editor.step='details';
      return 'Completa el nombre, la categoría y un precio válido.';
    }
    if (item.image&&item.image!=='-'&&!/^(https?:\/\/|\/(?!\/))/i.test(item.image.trim())) {
      editor.step='details';
      return 'Usa una foto o un enlace que empiece con https://.';
    }
    if (invalidModifierLimits(item.modifierGroupRules)) {
      editor.step='extras';
      return 'Revisa el mínimo y máximo de cada grupo de complementos.';
    }
    if (item.type==='combo') {
      const invalid=item.groups.findIndex(group=>
        !group.name.trim() || !number(group.quantity,1,20) || !Number.isInteger(Number(group.quantity)) ||
        !group.options.length || (group.fixed&&group.options.length!==1) ||
        group.options.some(option=>!catalog[option.productId] || (!group.fixed&&!number(option.surcharge,0,100000))));
      if (!item.groups.length || invalid>=0) {
        editor.step='options';
        editor.groupIndex=Math.max(0,invalid);
        return 'Cada grupo necesita un nombre, una cantidad y al menos un producto.';
      }
    } else if (item.modifiers.some(option=>!option.name.trim()||!number(option.price,0,100000))) {
      editor.step='extras';
      return 'Revisa los nombres y precios de los extras.';
    }
    return '';
  }

  async function saveItem(id,item,previous,photo) {
    const result=await request({action:'catalog_item_save',id,item,previous,photo});
    catalog=result.catalog;
  }

  async function saveSettings(next) {
    const result=await request({action:'menu_settings_save',settings:next,previous:settings});
    settings=result.settings;
  }

  async function saveEditor(event) {
    event.preventDefault();
    if (busy || !editor || editor.processingPhoto) return;
    const {kind,item,original}=editor;
    let next;
    if (kind==='item') {
      const error=validateItem();
      if (error) { renderEditor(error); return; }
    } else if (kind==='general') {
      if (invalidModifierLimits(item.modifierGroupRules)) {
        showError('Revisa el mínimo y máximo de cada grupo de complementos.');
        return;
      }
      next={...settings,generalRules:item.modifierGroupRules};
    } else if (kind==='category') {
      item.label=item.label.trim();
      const list=categories();
      if (!item.label || list.some(category=>category.key!==item.key&&normalize(category.label)===normalize(item.label))) {
        showError('Escribe un nombre de categoría que todavía no exista.');
        return;
      }
      next={...settings,categories:original?list.map(category=>category.key===item.key?item:category):[...list,item]};
    } else {
      const {name,options}=item;
      if (!name.trim()||!options.length||
          options.some(option=>!option.name.trim()||!number(option.price,0,100000))) {
        showError('Escribe el nombre del grupo y revisa los nombres y precios de las opciones.');
        return;
      }
      next={...settings,groups:original?settings.groups.map(group=>group.id===item.id?item:group):[...settings.groups,item]};
    }
    busy=true;
    const button=$('[data-editor-submit]');
    button.disabled=true;
    try {
      if (kind==='item') await saveItem(editor.id,item,editor.previous,editor.photo);
      else await saveSettings(next);
      busy=false;
      closeEditor();
      renderList();
      message('Cambios guardados.');
    } catch(error) {
      showError(error.message);
    } finally {
      busy=false;
      button.disabled=false;
    }
  }

  async function quickAction(button,id,move) {
    if (busy||loading) return;
    busy=true;
    button.disabled=true;
    try {
      if (move) {
        const [index,direction]=move.split(':').map(Number);
        const list=categories();
        [list[index],list[index+direction]]=[list[index+direction],list[index]];
        await saveSettings({...settings,categories:list});
        message('Orden actualizado.');
      } else {
        const item=catalog[id];
        await saveItem(id,{...item,active:!item.active},item);
        message(item.active?'Artículo pausado.':'Artículo activado.');
      }
      renderList();
    } catch(error) {
      message(error.message,true);
    } finally {
      busy=false;
      button.disabled=false;
    }
  }

  function mount(view) {
    if (host===view) return;
    host=view;
    if (!document.querySelector('link[href*="menu-admin.css"]')) {
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href='/menu-admin.css?v=3';
      document.head.append(link);
    }
    view.innerHTML=`<div class="menu-workspace" data-menu-workspace>
      <div class="menu-top"><div><h2>Menú</h2><p>Gestiona lo que tus clientes pueden pedir.</p></div>
        <div class="menu-actions">
          <a class="menu-button" href="${menuLink}" target="_blank" rel="noopener">Ver menú del cliente <span aria-hidden="true">↗</span></a>
          <button class="menu-button menu-primary" type="button" data-menu-add disabled>+ Nuevo producto</button>
        </div></div>
      <nav class="menu-tabs" aria-label="Secciones del menú">${Object.entries(tabs).map(([key,item])=>
        `<button type="button" data-tab="${key}" aria-pressed="${key==='products'}">${item.name}</button>`).join('')}</nav>
      <div class="menu-filters" data-menu-filters>
        <label class="menu-search"><span aria-hidden="true">⌕</span><input type="search" data-menu-search aria-label="Buscar por nombre" placeholder="Buscar por nombre"></label>
        <select data-menu-status-filter aria-label="Filtrar por disponibilidad"><option value="">Todos los estados</option><option>Disponible</option><option>Pausado</option><option>Sin disponibilidad</option></select>
      </div>
      <div class="menu-feedback" hidden><span data-menu-status role="status"></span><button type="button" class="menu-button" data-menu-retry hidden>Recargar menú</button></div>
      <div data-menu-content></div>
    </div>
    <section class="menu-editor" data-menu-editor aria-labelledby="menu-editor-title" hidden></section>`;
    $('[data-menu-add]').onclick=()=>{
      if (tab==='categories') openCategory();
      else if (tab==='groups') openGroup();
      else openItem(null);
    };
    $('[data-menu-retry]').onclick=load;
    $('[data-menu-search]').oninput=event=>{search=event.target.value.trim();renderList();};
    $('[data-menu-status-filter]').onchange=event=>{statusFilter=event.target.value;renderList();};
    $('.menu-tabs').onclick=event=>{const button=event.target.closest('[data-tab]');if(button)changeTab(button.dataset.tab);};
    $('[data-menu-content]').onclick=event=>{
      const button=event.target.closest('button');
      if (!button||busy||loading) return;
      const data=button.dataset;
      if (data.edit) openItem(data.edit);
      else if (data.toggle||data.categoryMove) quickAction(button,data.toggle,data.categoryMove);
      else if (data.category!==undefined) {categoryFilter=data.category;renderList();}
      else if (data.addCategory) openItem(null,data.addCategory);
      else if (data.categoryEdit) openCategory(data.categoryEdit);
      else if (data.groupEdit) openGroup(data.groupEdit);
      else if (data.generalEdit!==undefined) openGeneral();
      else if (data.manageCategories!==undefined) changeTab('categories');
    };
    editorHost().onclick=event=>{
      const button=event.target.closest('button');
      if (!button||!editor||busy) return;
      if (button.dataset.editorAction) editorAction(button);
      else if (button.dataset.step) {editor.step=button.dataset.step;renderEditor();}
      else if (button.dataset.comboIndex!==undefined) {editor.groupIndex=Number(button.dataset.comboIndex);renderEditor();}
    };
    editorHost().oninput=changeEditorField;
    editorHost().onchange=event=>{if(event.target.hasAttribute('data-photo-file'))uploadPhoto(event.target.files[0]);};
    editorHost().onsubmit=saveEditor;
    editorHost().onkeydown=event=>{if(event.key==='Escape'&&!busy)closeEditor();};
    load();
  }

  window.restaurantMenuAdmin={mount};
})();
