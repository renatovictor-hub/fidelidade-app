# Restaurant deployment model

This repository is the shared product codebase. Do not maintain independent code copies per restaurant.

## Recommended structure

Each restaurant receives its own deployment and isolated infrastructure:

- one Vercel project;
- one Firebase / Google Cloud project;
- one OneSignal app;
- its own environment variables, branding, secrets and enabled modules.

All restaurants use this same repository. New features and bug fixes are implemented once and then deployed to every restaurant installation.

## Shared across all restaurants

- application source code;
- loyalty, VIP, missions, rewards and offers logic;
- delivery and order workflow;
- dashboard components;
- security fixes;
- future product features.

## Isolated per restaurant

- Firebase project and data;
- Google Cloud billing, Places / Routes quotas;
- OneSignal app and subscribers;
- Vercel environment variables;
- dashboard password and session secrets;
- branding;
- WhatsApp and social links;
- restaurant coordinates;
- enabled modules;
- product catalog and operational configuration.

## New restaurant checklist

1. Create Firebase / Google Cloud for the restaurant.
2. Enable Realtime Database and create a service account.
3. Enable Google Maps APIs only when Delivery was contracted.
4. Create one OneSignal app.
5. Create a Vercel project pointing to this repository.
6. Copy all variables from `.env.restaurant.example` into Vercel and replace the values.
7. Set `MODULE_DELIVERY=false` when Delivery was not contracted.
8. Deploy.
9. Open Dashboard > Ajustes > Diagnóstico de instalación.
10. Every required item must show LISTO.
11. Configure loyalty rules, VIP, rewards, WhatsApp, catalog, banners and offers.
12. Test registration, points, redemption, push and, when enabled, one complete Delivery order before handing the app to the restaurant.

## Product rule

A paid module must never be enabled only by browser parameters. The client can hide or show UI, but the API must independently enforce whether the module is enabled.

## Uai Sô

Uai Sô is the first/default installation and remains backward compatible. New restaurant deployments must explicitly define their environment variables instead of relying on Uai Sô fallback values.
