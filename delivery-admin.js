(() => {
  const mounted = new WeakSet();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]
  ));
  const field = (label, key, value, attrs = '') =>
    `<label>${label}<input name="${key}" value="${escape(value)}" ${attrs}></label>`;
  const amount = (label, key, value) => field(label, key, value, 'type="number" min="0" max="100000" step="0.01" required');

  async function request(payload) {
    const response = await fetch(payload ? '/api/cliente' : '/api/cliente?action=delivery_settings', payload
      ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'delivery_settings', ...payload}) }
      : {cache:'no-store'});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No pudimos abrir la configuración de envío.');
    return data;
  }

  function tierRow({km,fee}, index) {
    return `<div class="delivery-row" data-tier>
      ${field('Hasta (km)', 'km', km, 'type="number" min="0.001" max="1000" step="0.001" required')}
      ${amount('Tarifa', 'fee', fee)}
      <button class="btn-secondary" type="button" data-remove aria-label="Eliminar tramo ${index+1}">Quitar</button>
    </div>`;
  }

  function zoneRow({name,keywords,fee}) {
    return `<div class="delivery-row delivery-zone" data-zone>
      ${field('Nombre', 'zoneName', name, 'maxlength="70" placeholder="Ej. Bonfil" required')}
      ${field('Palabras en la dirección', 'keywords', keywords, 'maxlength="240" placeholder="Ej. Bonfil, Alfredo V. Bonfil" required')}
      ${amount('Recargo', 'zoneFee', fee)}
      <button class="btn-secondary" type="button" data-remove aria-label="Eliminar zona">Quitar</button>
    </div>`;
  }

  function mount(host) {
    if (mounted.has(host)) return;
    mounted.add(host);
    const style = document.createElement('style');
    style.textContent = `
      #uxDeliverySettingsView [hidden]{display:none!important}
      #uxDeliverySettingsView .delivery-editor{display:grid;gap:14px}
      #uxDeliverySettingsView .delivery-fields,#uxDeliverySettingsView .delivery-row{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));align-items:end;margin:12px 0}
      #uxDeliverySettingsView .delivery-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;padding:12px;background:#f8f5fa;border:1px solid #ede3f0;border-radius:12px}
      #uxDeliverySettingsView .delivery-zone{grid-template-columns:repeat(3,minmax(0,1fr)) auto}
      #uxDeliverySettingsView label:not(.delivery-toggle){display:grid;gap:4px;min-width:0;font-weight:700}
      #uxDeliverySettingsView input:not([type="checkbox"]){box-sizing:border-box;width:100%;min-width:0}
      #uxDeliverySettingsView .delivery-toggle{display:flex;align-items:center;gap:8px;margin-block:12px;font-weight:700}
      #uxDeliverySettingsView .delivery-toggle input{width:18px;height:18px;min-height:18px;margin:0;accent-color:var(--tenant-primary,#57009a)}
      #uxDeliverySettingsView .delivery-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
      #uxDeliverySettingsView .delivery-actions button,#uxDeliverySettingsView [data-remove],#uxDeliverySettingsView [data-add]{width:auto}
      #uxDeliverySettingsView [role="status"]{font-weight:700}
      #uxDeliverySettingsView [role="status"][data-error]{color:#a52445}
      @media(max-width:620px){#uxDeliverySettingsView .delivery-zone{grid-template-columns:1fr 1fr}#uxDeliverySettingsView .delivery-row:not(.delivery-zone){grid-template-columns:1fr 1fr auto}#uxDeliverySettingsView .delivery-row [data-remove]{padding:9px}}
    `;
    document.head.append(style);
    let revision = '';

    function render({settings, revision:savedRevision, currency}) {
      revision = savedRevision;
      host.innerHTML = `<form class="delivery-editor">
        <section class="ux-panel"><h2>Origen de entrega</h2><p>Usamos este punto para calcular la distancia real por carretera. Puedes copiar las coordenadas del restaurante desde Google Maps.</p>
          <div class="delivery-fields">
            ${field('Latitud','latitude',settings.origin.latitude,'type="number" min="-90" max="90" step="any" required')}
            ${field('Longitud','longitude',settings.origin.longitude,'type="number" min="-180" max="180" step="any" required')}
            ${field('Ciudad y estado para buscar direcciones','addressSuffix',settings.addressSuffix,'maxlength="140" placeholder="Ej. Cancún, Quintana Roo, México"')}
          </div>
        </section>
        <section class="ux-panel"><h2>Tarifas por distancia</h2><p>Ordena los tramos de menor a mayor. Cada tarifa aplica hasta la distancia indicada, inclusive. Importes en ${escape(currency||'MXN')}.</p>
          <div data-tiers>${(settings.tiers.length?settings.tiers:[{}]).map(tierRow).join('')}</div>
          <button class="btn-secondary" type="button" data-add="tier">+ Agregar tramo</button>
          <label class="delivery-toggle"><input type="checkbox" name="extend" ${settings.extend?'checked':''}> Entregar más allá del último tramo</label>
          <div data-extension ${settings.extend?'':'hidden'}>${amount('Recargo por cada km iniciado','extraPerKm',settings.extraPerKm)}</div>
        </section>
        <section class="ux-panel"><h2>Zonas con recargo</h2><p>Escribe palabras separadas por comas que aparezcan en la colonia o dirección del cliente. Aplica la primera zona que coincide.</p>
          <div data-zones>${settings.zones.map(zoneRow).join('')}</div>
          <button class="btn-secondary" type="button" data-add="zone">+ Agregar zona</button>
        </section>
        <section class="ux-panel"><h2>Recargos</h2><p>Deja el monto en 0 si el recargo no aplica. El horario usa la zona horaria del restaurante.</p>
          <div class="delivery-fields">
            ${amount('Plaza comercial','plazaFee',settings.plazaFee)}
            ${amount('Residencial o condominio','residentialFee',settings.residentialFee)}
            ${field('Horario regular desde','from',settings.schedule.from,'type="time" required')}
            ${field('Horario regular hasta','until',settings.schedule.until,'type="time" required')}
            ${amount('Fuera del horario regular','outsideFee',settings.schedule.fee)}
            ${amount('Recargo por lluvia','rainFee',settings.rain.fee)}
          </div>
          <label class="delivery-toggle"><input type="checkbox" name="rainActive" ${settings.rain.active?'checked':''}> Aplicar recargo por lluvia ahora</label>
        </section>
        <div class="delivery-actions"><button class="btn-primary" type="submit">Guardar configuración</button><button class="btn-secondary" type="button" data-refresh>Recargar</button><span role="status"></span></div>
      </form>`;

      const form = host.querySelector('form');
      const status = form.querySelector('[role="status"]');
      const show = (message, error = false) => {status.textContent=message;status.toggleAttribute('data-error',error);};
      form.elements.extend.oninput = () => {form.querySelector('[data-extension]').hidden = !form.elements.extend.checked;};
      form.onclick = event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-refresh')) return load();
        if (button.hasAttribute('data-remove')) {button.closest('[data-tier],[data-zone]').remove();return;}
        const kind = button.dataset.add;
        if (!kind) return;
        const list = form.querySelector(kind==='tier'?'[data-tiers]':'[data-zones]');
        if (list.children.length >= (kind==='tier'?25:15)) return;
        list.insertAdjacentHTML('beforeend', kind==='tier'?tierRow({},list.children.length):zoneRow({}));
        list.lastElementChild.querySelector('input').focus();
      };

      form.onsubmit = async event => {
        event.preventDefault();
        const formData = new FormData(form);
        const get = key => formData.get(key);
        const tiers = [...form.querySelectorAll('[data-tier]')].map(row=>({
          km:row.querySelector('[name="km"]').value, fee:row.querySelector('[name="fee"]').value
        }));
        const zones = [...form.querySelectorAll('[data-zone]')].map(row=>({
          name:row.querySelector('[name="zoneName"]').value, keywords:row.querySelector('[name="keywords"]').value,
          fee:row.querySelector('[name="zoneFee"]').value
        }));
        if (!tiers.length || tiers.some((row,i)=>i>0&&Number(row.km)<=Number(tiers[i-1].km))) {
          show('Agrega al menos un tramo con distancias en orden ascendente.',true);
          return;
        }
        const settings = {origin:{latitude:get('latitude'),longitude:get('longitude')},addressSuffix:get('addressSuffix'),
          tiers,zones,extend:get('extend')==='on',extraPerKm:get('extraPerKm'),
          plazaFee:get('plazaFee'),residentialFee:get('residentialFee'),
          rain:{active:get('rainActive')==='on',fee:get('rainFee')},
          schedule:{from:get('from'),until:get('until'),fee:get('outsideFee')}};
        const controls = [...form.querySelectorAll('button,input')];
        controls.forEach(control=>control.disabled=true);
        show('Guardando…');
        try {
          const saved = await request({settings,revision});
          revision = saved.revision;
          show('Configuración guardada. Se aplica a las nuevas cotizaciones.');
        } catch (error) {
          show(error.message,true);
        } finally {
          controls.forEach(control=>control.disabled=false);
        }
      };
    }

    async function load() {
      host.innerHTML = '<section class="ux-panel"><p role="status">Cargando configuración de envío…</p></section>';
      try {render(await request());}
      catch(error) {
        host.innerHTML = '<section class="ux-panel"><p role="status" data-error></p><button class="btn-secondary" type="button">Reintentar</button></section>';
        host.querySelector('[role="status"]').textContent = error.message;
        host.querySelector('button').onclick = load;
      }
    }

    load();
  }
  window.restaurantDeliveryAdmin = { mount };
})();
