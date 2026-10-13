(()=>{
  const params=new URLSearchParams(location.search);
  const company=String(params.get('company')||'').trim();
  if(!company)return;
  window.__RESTAURANT_COMPANY__=company;

  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init={}){
    try{
      const raw=typeof input==='string'?input:input?.url;
      if(raw){
        const u=new URL(raw,location.origin);
        if(u.origin===location.origin&&u.pathname.startsWith('/api/')){
          if(!u.searchParams.has('company'))u.searchParams.set('company',company);
          input=typeof input==='string'?u.toString():new Request(u.toString(),input);
          const headers=new Headers(init?.headers||{});
          if(typeof init?.body==='string'&&String(headers.get('Content-Type')||'').includes('application/json')){
            try{
              const body=JSON.parse(init.body);
              if(body&&typeof body==='object'&&!Array.isArray(body)&&!body.company){
                init={...init,body:JSON.stringify({...body,company})};
              }
            }catch(_){}
          }
        }
      }
    }catch(_){}
    return nativeFetch(input,init);
  };
})();
