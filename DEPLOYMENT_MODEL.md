# Deployment model

This repository is the single source of truth for every restaurant installation.

## Rule

Do not fork or copy the application to customize a customer. New features, bug fixes and security changes belong in this shared codebase.

A new restaurant receives a separate deployment and separate infrastructure credentials, while running the same commit/version of this repository.

## Recommended separation per restaurant

- Vercel: one project/deployment per restaurant under the operator account/team.
- Firebase / Google Cloud: separate project and database per restaurant.
- Google Maps/Routes billing and quotas: separate Google Cloud project per restaurant.
- OneSignal: separate app per restaurant during the first commercial phase.
- Secrets: separate environment variables per deployment.

## Shared

- Source code
- UI components
- Loyalty logic
- Delivery logic
- Security fixes
- New features
- Database schema/version
- Release process

## Per restaurant

- Brand name
- Short name
- Logo/icons
- Primary/accent colors
- WhatsApp
- Public domain
- Restaurant coordinates
- Enabled modules
- Firebase credentials/database
- Google API key
- OneSignal app/key
- Admin/client session secrets

Use `.env.restaurant.example` as the deployment checklist.

## Modules

Module access is enforced by server configuration. Client URL parameters must never grant paid features.

Example:

```
MODULE_LOYALTY=true
MODULE_DELIVERY=false
```

The server returns this configuration to the client and rejects Delivery endpoints when Delivery is disabled.

## Updating all restaurants

A feature is implemented once in this repository. After validation, deploy the same release commit to each restaurant project. Per-restaurant environment variables remain unchanged.

This prevents code drift between customers.
