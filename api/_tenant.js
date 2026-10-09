const LEGACY_TENANT="uai-so";

export function normalizeTenant(value){
  const raw=String(value||LEGACY_TENANT).trim().toLowerCase();
  const clean=raw.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,50);
  return clean||LEGACY_TENANT;
}
export function tenantFromRequest(req){
  return normalizeTenant(req?.body?.company||req?.body?.tenant||req?.query?.company||req?.query?.tenant||req?.headers?.["x-company-id"]||LEGACY_TENANT);
}
export function tenantBase(tenant){
  const id=normalizeTenant(tenant);
  return id===LEGACY_TENANT?"":`saas/tenantData/${id}/`;
}
export function tenantPath(tenant,path){
  return tenantBase(tenant)+String(path||"").replace(/^\/+/, "");
}
export function tenantRef(db,tenant,path){
  return db.ref(tenantPath(tenant,path));
}
export function isLegacyTenant(tenant){return normalizeTenant(tenant)===LEGACY_TENANT}
