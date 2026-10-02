(() => {
  let APP_ID="";
  const qs=new URLSearchParams(location.search);
  const uid=String(qs.get("uid")||localStorage.getItem("uid")||"").trim();
  if(!/^user_\d+$/.test(uid)) return;

  let syncing=false;
  async function report(OS,reason){
    if(syncing)return;
    syncing=true;
    try{
      const sub=OS?.User?.PushSubscription;
      await fetch("/api/cliente",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          action:"push_sync",
          uid,
          permission:typeof Notification!=="undefined"?Notification.permission:"default",
          opted_in:sub?.optedIn===true,
          subscription_id:String(sub?.id||""),
          token_present:!!sub?.token,
          reason
        })
      });
    }catch(e){console.warn("push sync report",e)}
    finally{syncing=false}
  }

  async function reconcile(OS,reason="app_open"){
    try{
      await OS.login(uid);
      const telefone=String(localStorage.getItem("telefone")||"").replace(/\D/g,"");
      const nome=String(localStorage.getItem("nome")||"").trim();
      try{
        if(telefone.length===10)await OS.User.addTag("telefone",telefone);
        if(nome)await OS.User.addTag("user_name",nome.slice(0,80));
      }catch(e){console.warn("push tag refresh",e)}

      const permission=typeof Notification!=="undefined"?Notification.permission:"default";
      const previouslyEnabled=localStorage.getItem("push")==="true";
      const sub=OS?.User?.PushSubscription;

      // Only restore the subscription automatically when the user had already
      // opted in before. Never override a denied/revoked permission.
      if(permission==="granted"&&previouslyEnabled&&sub?.optedIn===false&&typeof sub.optIn==="function"){
        try{await sub.optIn()}catch(e){console.warn("push optIn",e)}
      }

      await report(OS,reason);
    }catch(e){
      console.warn("OneSignal reconcile",e);
    }
  }

  async function getAppId(){
    if(APP_ID)return APP_ID;
    try{
      const r=await fetch('/api/cliente?action=public_config&t='+Date.now(),{cache:'no-store'});
      const d=await r.json();if(r.ok&&d.onesignal_app_id)APP_ID=String(d.onesignal_app_id).trim();
    }catch(_){}
    return APP_ID;
  }

  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async function(OS){
    const appId=await getAppId();
    if(!appId){console.warn("OneSignal app id missing");return}
    try{
      await OS.init({
        appId,
        notifyButton:{enable:false},
        serviceWorkerPath:"OneSignalSDKWorker.js",
        serviceWorkerParam:{scope:"/"}
      });
    }catch(e){
      // If the SDK was initialized elsewhere on this page/session, keep going.
      console.warn("OneSignal init",e);
    }

    await reconcile(OS,"app_open");

    try{
      OS.User.PushSubscription.addEventListener("change",()=>report(OS,"subscription_change"));
    }catch(e){console.warn("push subscription listener",e)}

    try{
      OS.Notifications.addEventListener("permissionChange",()=>report(OS,"permission_change"));
    }catch(e){console.warn("push permission listener",e)}

    window.addEventListener("focus",()=>reconcile(OS,"focus"));
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="visible")reconcile(OS,"visible");
    });
  });
})();
