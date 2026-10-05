(() => {
  const MODULES=[
    ['/recompensas-admin.js?v=20261001-rewards1','recompensasAdminScript'],
    ['/notificacoes-admin.js?v=20261002-consolidation1','notificacoesAdminScript'],
    ['/cumpleanos-admin.js?v=20260826-1','cumpleanosAdminScript'],
    ['/bonus-pontos-admin.js?v=20260930-saas3','bonusPontosAdminScript'],
    ['/referidos-admin.js?v=20260930-saas2','referidosAdminScript'],
    ['/niveles-vip-admin.js?v=20261002-consolidation1','nivelesVipAdminScript'],
    ['/reviews-admin.js?v=20260927-reorg1','reviewsAdminScript'],
    ['/reviews-dashboard-v2.js?v=20260928-4','reviewsDashboardV2Script'],
    ['/pedidos-admin.js?v=20260913-2','pedidosAdminScript'],
    ['/dashboard-ux-v2.js?v=20261004-multirest2','dashboardUxV2Script'],
    ['/dashboard-navigation-v3.js?v=20260928-fidunified1','dashboardNavigationV3Script'],
    ['/dashboard-overview-v4.js?v=20260927-crm2','dashboardOverviewV4Script'],
    ['/dashboard-core-modules-v5.js?v=20261004-multirest2','dashboardCoreModulesV5Script'],
    ['/dashboard-growth-modules-v6.js?v=20261001-rewards1','dashboardGrowthModulesV6Script'],
    ['/dashboard-final-modules-v7.js?v=20261005-multirest3','dashboardFinalModulesV7Script'],
    ['/fidelidad-growth-admin.js?v=20261002-cleanresults1','fidelidadGrowthAdminScript'],
    ['/fidelity-settings-saas.js?v=20261001-viptab1','fidelitySettingsSaasScript'],
    ['/admin-context-help.js?v=20260930-config2','adminContextHelpScript']
  ];

  async function appendSequentially(doc,index=0){
    if(index>=MODULES.length)return;
    const [src,id]=MODULES[index];
    if(doc.getElementById(id))return appendSequentially(doc,index+1);
    await new Promise((resolve,reject)=>{
      const s=doc.createElement('script');
      s.id=id;s.src=src;s.async=false;
      s.onload=resolve;
      s.onerror=()=>reject(new Error('No se pudo cargar '+src));
      doc.body.appendChild(s);
    });
    return appendSequentially(doc,index+1);
  }

  window.loadRestaurantAdminModules=doc=>appendSequentially(doc);
})();
