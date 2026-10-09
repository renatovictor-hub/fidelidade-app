(() => {
  const params=new URLSearchParams(location.search);
  const company=(params.get('company')||'uai-so').trim().toLowerCase();
  window.__TENANT_ID__=company;

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    try{
      const raw=typeof input==='string'?input:input?.url;
      if(raw){
        const u=new URL(raw,location.origin);
        if(u.origin===location.origin&&u.pathname.startsWith('/api/')){
          if(!u.searchParams.has('company'))u.searchParams.set('company',company);
          input=typeof input==='string'?u.toString():new Request(u.toString(),input);
          if(init?.body&&typeof init.body==='string'&&(init.headers?.['Content-Type']==='application/json'||init.headers?.get?.('Content-Type')==='application/json')){
            try{
              const body=JSON.parse(init.body);
              if(body&&typeof body==='object'&&!Array.isArray(body)&&!body.company)init={...init,body:JSON.stringify({...body,company})};
            }catch{}
          }
        }
      }
    }catch{}
    return nativeFetch(input,init);
  };

  async function apply(){
    try{
      const r=await nativeFetch('/api/cliente?action=public_config&company='+encodeURIComponent(company)+'&t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const cfg=await r.json();
      window.RESTAURANT_CONFIG=cfg;
      const primary=String(cfg.primary_color||'#6a0dad'),accent=String(cfg.accent_color||'#ffcc00');
      for(const k of ['--roxo','--primary','--p'])document.documentElement.style.setProperty(k,primary);
      for(const k of ['--accent','--amarelo','--p2'])document.documentElement.style.setProperty(k,accent);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',primary);
      const brand=String(cfg.short_name||cfg.name||'Restaurante');
      if(/Uai Sô|Restaurante/i.test(document.title))document.title=brand+' · '+document.title.replace(/Uai Sô|Restaurante/gi,'').replace(/^\s*[·-]?\s*/,'');
      document.querySelectorAll('[data-brand-name]').forEach(el=>el.textContent=brand);
      if(cfg.logo){
        document.querySelectorAll('img').forEach(img=>{
          const src=String(img.getAttribute('src')||'');
          if(src==='/logo.png'||src.endsWith('/logo.png')||img.hasAttribute('data-brand-logo'))img.src=cfg.logo;
        });
      }
      document.documentElement.dataset.delivery=cfg?.modules?.delivery===true?'1':'0';
      document.documentElement.dataset.loyalty=cfg?.modules?.loyalty===false?'0':'1';
      window.dispatchEvent(new CustomEvent('restaurant-config-ready',{detail:cfg}));
    }catch(e){console.warn('tenant runtime',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();