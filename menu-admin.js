(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
  const money = new Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN'});
  const idFor = prefix => prefix + '_' + crypto.randomUUID();
  const defaultCategories = ['ESFIHAS SALADAS', 'ESFIHAS DULCES', 'COXINHAS', 'BEBIDAS', 'COMBOS', 'OTROS'];
  let catalog = {}, tab = 'products', filter = '', host, draft, editingId, previous, saving = false;
  const $ = selector => host.querySelector(selector);
  const categories = () => [...new Set([...defaultCategories, ...Object.values(catalog).map(item => item.category)])];

  async function request(options) {
    const response = await fetch(options ? '/api/cliente' : '/api/cliente?action=admin_catalog', {
      cache:'no-store', ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No se pudo conectar con el catálogo.');
    return data.catalog || {};
  }

  function status(message, isError = false) {
    const node = $('[data-menu-status]');
    node.textContent = message;
    node.classList.toggle('menu-error', isError);
  }

  async function load() {
    status('Cargando menú…');
    $('[data-menu-add]').disabled = true;
    $('[data-menu-list]').replaceChildren();
    $('[data-menu-retry]').hidden = true;
    try {
      catalog = await request();
      status('');
      renderList();
      $('[data-menu-add]').disabled = false;
    } catch (error) {
      status(error.message, true);
      $('[data-menu-retry]').hidden = false;
    }
  }

  function comboState(item) {
    const incomplete = (item.groups || []).some(group =>
      !group.options.some(option => catalog[option.productId]?.active));
    return !item.groups?.length || incomplete ? 'Sin disponibilidad' : 'Disponible';
  }

  function renderList() {
    const isCombo = tab === 'combos';
    const query = $('[data-menu-search]').value.trim().toLocaleLowerCase('es-MX');
    $('[data-menu-add]').textContent = isCombo ? '+ Crear combo' : '+ Nuevo producto';
    $('[data-menu-category]').hidden = isCombo;
    $('[data-menu-category]').innerHTML = '<option value="">Todas las categorías</option>' +
      categories().map(category => `<option>${escape(category)}</option>`).join('');
    $('[data-menu-category]').value = filter;
    const items = Object.entries(catalog).filter(([,item]) =>
      (item.type === 'combo') === isCombo &&
      (isCombo || !filter || item.category === filter) &&
      `${item.name} ${item.category}`.toLocaleLowerCase('es-MX').includes(query));
    $('[data-menu-list]').innerHTML = items.length ? items.map(([id,item]) => {
      const photo = /^(https?:\/\/|\/(?!\/))/i.test(item.image) ? item.image : '';
      const availability = !item.active ? 'Pausado' : isCombo ? comboState(item) : 'Disponible';
      return `<article class="menu-row">
        <div class="menu-photo">${photo ? `<img src="${escape(photo)}" alt="" loading="lazy">` : `<span aria-hidden="true">${escape(item.name.slice(0,1))}</span>`}</div>
        <div class="menu-item"><strong>${escape(item.name)}</strong><small>${escape(isCombo ? `${item.groups?.length || 0} grupos · ${item.category}` : item.category)}</small></div>
        <strong class="menu-price">${money.format(item.price)}</strong>
        <span class="menu-availability" data-available="${availability === 'Disponible'}">${availability}</span>
        <div class="menu-actions">
          <button type="button" class="menu-button" data-edit="${escape(id)}">Editar</button>
          <button type="button" class="menu-button menu-quiet" data-toggle="${escape(id)}" aria-label="${item.active ? 'Pausar' : 'Activar'} ${escape(item.name)}">${item.active ? 'Pausar' : 'Activar'}</button>
        </div>
      </article>`;
    }).join('') : `<div class="menu-empty">${query || (!isCombo && filter) ? 'No encontramos artículos con estos filtros.' :
      isCombo ? 'Aún no hay combos. Crea uno con los productos de tu menú.' : 'Aún no hay productos. Agrega el primero.'}</div>`;
  }

  function openEditor(id = null) {
    editingId = id || idFor(tab === 'combos' ? 'combo' : 'producto');
    previous = id ? catalog[id] : null;
    if (previous) draft = structuredClone(previous);
    else draft = {
      name:'', price:'', category:tab === 'combos' ? 'COMBOS' : filter,
      description:'', image:'', active:true, modifiers:[],
      ...(tab === 'combos' ? {type:'combo', groups:[]} : {})
    };
    const isCombo = draft.type === 'combo';
    if (isCombo) draft.groups ||= [];
    $('[data-editor-title]').textContent = `${id ? 'Editar' : 'Nuevo'} ${isCombo ? 'combo' : 'producto'}`;
    const form = $('[data-menu-form]');
    for (const name of ['name','price','category','description','image']) form.elements[name].value = draft[name] ?? '';
    form.elements.active.checked = draft.active;
    $('[data-category-names]').innerHTML = categories().map(value => `<option value="${escape(value)}">`).join('');
    $('[data-menu-advanced-title]').textContent = isCombo ? 'Composición del combo' : 'Complementos';
    $('[data-menu-add-rule]').textContent = isCombo ? '+ Agregar grupo' : '+ Agregar complemento';
    $('[data-editor-error]').textContent = '';
    renderRules();
    $('[data-menu-dialog]').showModal();
    form.elements.name.focus();
  }

  function renderRules() {
    const node = $('[data-menu-rules]');
    if (draft.type !== 'combo') {
      node.innerHTML = (draft.modifiers || []).map((modifier,index) => `
        <div class="menu-editor-row" data-rule="${index}">
          <label>Nombre<input data-field="name" maxlength="100" required value="${escape(modifier.name)}"></label>
          <label>Precio adicional<input data-field="price" type="number" required min="0" max="100000" step="0.01" value="${escape(modifier.price)}"></label>
          <label class="menu-check"><input data-field="active" type="checkbox" ${modifier.active !== false ? 'checked' : ''}> Disponible</label>
          <button class="menu-button menu-quiet" type="button" data-remove-rule>Quitar</button>
        </div>`).join('');
      return;
    }

    const products = Object.entries(catalog).filter(([,item]) => item.type !== 'combo')
      .sort(([,a],[,b]) => a.category.localeCompare(b.category,'es') || a.name.localeCompare(b.name,'es'));
    node.innerHTML = (draft.groups || []).map((group,index) => `
      <section class="menu-rule" data-rule="${index}">
        <div class="menu-editor-row">
          <label>Nombre del grupo<input data-field="name" required maxlength="80" placeholder="Ej. Elige tu bebida" value="${escape(group.name)}"></label>
          <label>Tipo<select data-field="fixed"><option value="false" ${!group.fixed ? 'selected' : ''}>El cliente elige</option><option value="true" ${group.fixed ? 'selected' : ''}>Producto fijo</option></select></label>
          <label>Unidades por combo<input data-field="quantity" type="number" required min="1" max="20" value="${escape(group.quantity)}"></label>
          <button class="menu-button menu-quiet" type="button" data-remove-rule>Quitar grupo</button>
        </div>
        ${group.options.map((option,optionIndex) => `
          <div class="menu-editor-row menu-option" data-option="${optionIndex}">
            <label>Producto<select data-field="productId" required><option value="">Seleccionar producto</option>
              ${products.map(([id,item]) => `<option value="${escape(id)}" ${id === option.productId ? 'selected' : ''} ${group.options.some(other => other !== option && other.productId === id) ? 'disabled' : ''}>${escape(item.category)} · ${escape(item.name)}${item.active ? '' : ' (Pausado)'}</option>`).join('')}
            </select></label>
            ${!group.fixed ? `<label>Suplemento por unidad<input data-field="surcharge" type="number" required min="0" max="100000" step="0.01" value="${escape(option.surcharge)}"></label>` : ''}
            <button class="menu-button menu-quiet" type="button" data-remove-option>Quitar</button>
          </div>`).join('')}
        ${!group.fixed || !group.options.length ? `<button class="menu-button" type="button" data-add-option ${group.options.length >= 30 || products.length === group.options.length ? 'disabled' : ''}>+ Agregar producto</button>` : ''}
      </section>`).join('');
  }

  function handleRulesClick(event) {
    const button = event.target.closest('button');
    const rule = button?.closest('[data-rule]');
    if (!rule) return;
    const rules = draft.type === 'combo' ? draft.groups : draft.modifiers;
    const index = Number(rule.dataset.rule);
    if (button.hasAttribute('data-remove-rule')) rules.splice(index,1);
    else if (button.hasAttribute('data-add-option')) rules[index].options.push({productId:'',surcharge:0});
    else if (button.hasAttribute('data-remove-option')) rules[index].options.splice(Number(button.closest('[data-option]').dataset.option),1);
    renderRules();
  }

  function addRule() {
    if (draft.type === 'combo') {
      if (draft.groups.length >= 10) return;
      draft.groups.push({id:idFor('grupo'),name:'',fixed:false,quantity:1,options:[{productId:'',surcharge:0}]});
    } else {
      if (draft.modifiers.length >= 30) return;
      draft.modifiers.push({id:idFor('extra'),name:'',price:0,active:true});
    }
    renderRules();
    $('[data-menu-rules]').lastElementChild?.querySelector('input')?.focus();
  }

  async function save(id,item,oldItem,editing,button) {
    if (saving) return;
    saving = true;
    button.disabled = true;
    const errorBox = $('[data-editor-error]');
    if (editing) errorBox.textContent = '';
    try {
      catalog = await request({method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'catalog_item_save',id,item,previous:oldItem})});
      if (editing) $('[data-menu-dialog]').close();
      renderList();
      status(editing ? 'Cambios guardados.' : item.active ? 'Artículo activado.' : 'Artículo pausado.');
    } catch (error) {
      if (editing) errorBox.textContent = error.message;
      else status(error.message,true);
      $('[data-menu-retry]').hidden = false;
    } finally {
      saving = false;
      button.disabled = false;
    }
  }

  function submitEditor(event) {
    event.preventDefault();
    const form = event.currentTarget;
    for (const name of ['name','price','category','description','image']) draft[name] = form.elements[name].value.trim();
    draft.active = form.elements.active.checked;
    if (draft.type === 'combo' && (!draft.groups.length || draft.groups.some(group => !group.options.length))) {
      $('[data-editor-error]').textContent = 'Agrega al menos un producto a cada grupo del combo.';
      return;
    }
    save(editingId,draft,previous,true,form.querySelector('[type="submit"]'));
  }

  function mount(view) {
    if (host === view) return;
    host = view;
    if (!document.querySelector('link[href*="menu-admin.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/menu-admin.css?v=1';
      document.head.append(link);
    }
    view.innerHTML = `
      <div class="menu-workspace">
        <header class="menu-header"><h2>Menú</h2><button type="button" class="menu-button menu-primary" data-menu-add disabled>+ Nuevo producto</button></header>
        <nav class="menu-tabs" aria-label="Tipo de artículo"><button type="button" data-tab="products" aria-pressed="true">Productos</button><button type="button" data-tab="combos" aria-pressed="false">Combos</button></nav>
        <div class="menu-filters">
          <input type="search" data-menu-search aria-label="Buscar en el menú" placeholder="Buscar por nombre">
          <select data-menu-category aria-label="Filtrar por categoría"></select>
        </div>
        <div class="menu-feedback"><span data-menu-status role="status"></span><button type="button" class="menu-button" data-menu-retry hidden>Recargar menú</button></div>
        <div data-menu-list></div>
      </div>
      <dialog class="menu-dialog" data-menu-dialog aria-labelledby="menu-editor-title">
        <form data-menu-form>
          <header class="menu-header"><h2 id="menu-editor-title" data-editor-title></h2><button type="button" class="menu-button menu-quiet" data-menu-close aria-label="Cerrar">×</button></header>
          <div class="menu-body">
            <label>Nombre<input name="name" required maxlength="120"></label>
            <div class="menu-editor-row">
              <label>Precio (MXN)<input name="price" type="number" required min="0" max="100000" step="0.01"></label>
              <label>Categoría<input name="category" list="menu-category-names" required maxlength="80"><datalist id="menu-category-names" data-category-names></datalist></label>
            </div>
            <label>Descripción<textarea name="description" rows="2" maxlength="240"></textarea></label>
            <label>Enlace de la foto<input name="image" type="text" inputmode="url" maxlength="800" placeholder="https://…"></label>
            <label class="menu-check"><input name="active" type="checkbox"> Disponible para pedidos</label>
            <div class="menu-section"><h3 data-menu-advanced-title></h3><div data-menu-rules></div><button type="button" class="menu-button" data-menu-add-rule></button></div>
          </div>
          <footer><span class="menu-error" data-editor-error role="alert"></span><button class="menu-button menu-primary" type="submit">Guardar</button></footer>
        </form>
      </dialog>`;
    $('[data-menu-add]').onclick = () => openEditor();
    $('[data-menu-retry]').onclick = load;
    $('[data-menu-search]').oninput = renderList;
    $('[data-menu-category]').onchange = event => { filter = event.target.value; renderList(); };
    $('.menu-tabs').onclick = event => {
      const button = event.target.closest('[data-tab]');
      if (!button || tab === button.dataset.tab) return;
      tab = button.dataset.tab;
      $('.menu-tabs [aria-pressed="true"]').setAttribute('aria-pressed','false');
      button.setAttribute('aria-pressed','true');
      renderList();
    };
    $('[data-menu-list]').onclick = event => {
      const button = event.target.closest('button');
      if (button?.dataset.edit) openEditor(button.dataset.edit);
      if (button?.dataset.toggle) {
        const id = button.dataset.toggle, item = catalog[id];
        save(id,{...item,active:!item.active},item,false,button);
      }
    };
    $('[data-menu-close]').onclick = () => { if (!saving) $('[data-menu-dialog]').close(); };
    $('[data-menu-dialog]').oncancel = event => { if (saving) event.preventDefault(); };
    $('[data-menu-form]').onsubmit = submitEditor;
    $('[data-menu-add-rule]').onclick = addRule;
    $('[data-menu-rules]').onclick = handleRulesClick;
    $('[data-menu-rules]').oninput = event => {
      const field = event.target.dataset.field;
      const rule = event.target.closest('[data-rule]');
      if (!field || !rule) return;
      const data = (draft.type === 'combo' ? draft.groups : draft.modifiers)[Number(rule.dataset.rule)];
      const option = event.target.closest('[data-option]');
      const target = option ? data.options[Number(option.dataset.option)] : data;
      target[field] = field === 'fixed' ? event.target.value === 'true'
        : field === 'active' ? event.target.checked : event.target.value;
      if (field === 'fixed' && data.fixed) data.options = data.options.slice(0,1);
      if (field === 'fixed' || field === 'productId') renderRules();
    };
    load();
  }

  window.restaurantMenuAdmin = {mount};
})();
