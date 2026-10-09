import { normalizeCompanyId } from "./tenant-config.js";

export function tenantFromRequest(req){
  return normalizeCompanyId(
    req?.body?.company ||
    req?.query?.company ||
    req?.headers?.["x-restaurant-id"] ||
    "uai-so"
  );
}
export function tenantBase(tenant){
  const id=normalizeCompanyId(tenant);
  return id==="uai-so" ? "" : `saas/tenantData/${id}`;
}
export function tenantPath(tenant,path=""){
  const base=tenantBase(tenant);
  const clean=String(path||"").replace(/^\/+|\/+$/g,"");
  if(!base)return clean;
  return clean ? base+"/"+clean : base;
}
export function tenantDatabase(db,tenant){
  const id=normalizeCompanyId(tenant);
  return new Proxy(db,{
    get(target,prop){
      if(prop==="ref"){
        return (path="")=>target.ref(tenantPath(id,path));
      }
      const value=target[prop];
      return typeof value==="function" ? value.bind(target) : value;
    }
  });
}
export function isLegacyTenant(tenant){
  return normalizeCompanyId(tenant)==="uai-so";
}
