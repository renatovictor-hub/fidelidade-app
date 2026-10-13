(() => {
  async function apply(){
    try{
      const params=new URLSearchParams(location.search);
      const company=String(params.get('company')||'').trim();
      const companyQuery=company?'&company='+encodeURIComponent(company):'';
      const r=await fetch('/api/cliente?action=public_config&t='+Date.now()+companyQuery,{cache:'no-store'});
      if(!r.ok)return;
      const cfg=await r.json();
      window.RESTAURANT_CONFIG=cfg;
      window.RESTAURANT_COMPANY_ID=cfg.restaurant_id||company||'uai-so';
      const primary=String(cfg.primary_color||'#6a0dad'),accent=String(cfg.accent_color||'#ffcc00');
      document.documentElement.style.setProperty('--roxo',primary);
      document.documentElement.style.setProperty('--primary',primary);
      document.documentElement.style.setProperty('--accent',accent);
      document.documentElement.style.setProperty('--amarelo',accent);
      document.documentElement.style.setProperty('--p',primary);
      document.documentElement.style.setProperty('--p2',accent);
      document.documentElement.style.setProperty('--purple',primary);
      document.documentElement.style.setProperty('--purple2',accent);
      document.documentElement.style.setProperty('--tenant-primary',primary);
      document.documentElement.style.setProperty('--tenant-accent',accent);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content',primary);
      if(cfg.short_name||cfg.name){
        const brand=String(cfg.short_name||cfg.name);
        if(/Uai Sô/i.test(document.title))document.title=document.title.replace(/Uai Sô/gi,brand);
        document.querySelectorAll('[data-brand-name]').forEach(el=>el.textContent=brand);
      }
      const tenantId=String(cfg.restaurant_id||company||'uai-so');
      const legacy=tenantId==='uai-so';
      document.querySelectorAll('img').forEach(img=>{
        const src=String(img.getAttribute('src')||'');
        const brandAsset=src==='/logo.png'||src.endsWith('/logo.png')||img.hasAttribute('data-brand-logo');
        if(!brandAsset)return;
        if(cfg.logo){img.src=cfg.logo;img.style.removeProperty('display')}
        else if(!legacy){img.removeAttribute('src');img.style.display='none'}
      });
      if(!legacy){
        document.querySelectorAll('img.banner,img[src="/banner.jpg"],img[src="banner.jpg"]').forEach(img=>img.style.display='none');
      }
      document.documentElement.dataset.delivery=cfg?.modules?.delivery===true?'1':'0';
      document.documentElement.dataset.loyalty=cfg?.modules?.loyalty===false?'0':'1';
      window.dispatchEvent(new CustomEvent('restaurant-config-ready',{detail:cfg}));
    }catch(_){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
