# Restaurant deployment model

This repository is the shared product codebase. Do not fork/copy the application code per restaurant unless a customer contract requires ownership of a separate repository.

## What stays shared
- Loyalty logic
- VIP levels and benefits
- Rewards
- Missions
- Promotions
- Push workflows
- Delivery checkout
- Order workflow
- Catalog editor
- Security fixes
- UI improvements

A feature or bug fix should be implemented once here and then deployed to each restaurant project.

## What is separated per restaurant
Create a separate deployment/infrastructure set for each restaurant:

- Vercel project
- Firebase / Google Cloud project
- OneSignal app
- Google Maps / Routes quota and billing
- Environment variables
- Database and customer data
- Domain / subdomain
- Branding assets

## Provisioning a new restaurant
1. Create Firebase / Google Cloud project.
2. Create Realtime Database and service account.
3. Enable required Google Maps APIs if Delivery is contracted.
4. Create OneSignal app.
5. Create a Vercel project connected to this same repository.
6. Copy the variables from `restaurant.env.example` into that Vercel project.
7. Set `MODULE_DELIVERY=false` when Delivery is not contracted.
8. Add that restaurant's logo/icons and domain.
9. Deploy the same branch/release used by the other customers.
10. Validate registration, points, rewards, push and (if enabled) Delivery.

## Important rule
Modules are controlled by server environment variables. Query parameters such as `?plan=` must never grant paid functionality.

## Releases
Use one release/commit for all restaurants whenever possible. Restaurant-specific differences belong in configuration or data, not in source-code forks.
