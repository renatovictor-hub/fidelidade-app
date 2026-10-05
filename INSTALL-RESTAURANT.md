# Instalação de um novo restaurante

Este repositório é o código-base único. Não copie nem crie um fork por restaurante.

## 1. Infraestrutura separada
Crie para o restaurante:
- 1 projeto Firebase / Google Cloud exclusivo
- 1 Realtime Database exclusivo
- 1 service account Firebase exclusiva
- 1 app OneSignal exclusivo
- 1 projeto Vercel exclusivo apontando para este mesmo repositório

Quando Delivery estiver contratado:
- habilitar Places API
- habilitar Routes API
- criar chaves Google exclusivas e quotas próprias

## 2. Vercel
No novo projeto Vercel, copie as variáveis descritas em `.env.restaurant.example`.

Nunca reutilize entre restaurantes:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- FIREBASE_DATABASE_URL
- ONESIGNAL_APP_ID
- ONESIGNAL_REST_KEY
- GOOGLE_ROUTES_API_KEY
- GOOGLE_MAPS_BROWSER_KEY
- DASHBOARD_PASSWORD
- ADMIN_SESSION_SECRET
- CLIENT_SESSION_SECRET
- CRON_SECRET

## 3. Identidade do restaurante
Configurar:
- RESTAURANT_ID
- RESTAURANT_NAME
- RESTAURANT_SHORT_NAME
- APP_PUBLIC_URL
- RESTAURANT_LOGO_URL
- RESTAURANT_ICON_192_URL
- RESTAURANT_ICON_512_URL
- RESTAURANT_PRIMARY_COLOR
- RESTAURANT_ACCENT_COLOR
- RESTAURANT_WHATSAPP
- RESTAURANT_INSTAGRAM_URL
- RESTAURANT_TIMEZONE
- RESTAURANT_CURRENCY
- RESTAURANT_LOCALE
- RESTAURANT_ADDRESS_SUFFIX
- RESTAURANT_LATITUDE
- RESTAURANT_LONGITUDE

## 4. Módulos contratados
Definir no servidor:
- MODULE_LOYALTY=true|false
- MODULE_DELIVERY=true|false
- MODULE_MISSIONS=true|false
- MODULE_REVIEWS=true|false

A interface não deve decidir módulos pela URL.

## 5. Primeiro acesso
Após o deploy:
1. abrir /admin.html
2. entrar com DASHBOARD_PASSWORD
3. abrir Ajustes
4. verificar Diagnóstico de instalação
5. configurar WhatsApp
6. cadastrar catálogo
7. configurar regras de Fidelidad / VIP / recompensas
8. configurar banners e reviews
9. testar um cliente real de ponta a ponta

## 6. Testes obrigatórios
- cadastro e recuperação de sessão do cliente
- pontos de compra
- resgate de recompensa
- benefício VIP
- solicitação manual de benefício
- promo segmentada
- push individual e geral
- Delivery, se contratado
- preço calculado no servidor
- frete calculado no servidor
- cancelamento
- pedido entregue gerando pontos uma única vez
- PWA / manifest / logo / cores

## 7. Atualizações futuras
Toda funcionalidade nova e correção deve entrar neste repositório único.
Depois, cada projeto Vercel recebe o mesmo commit.
As diferenças entre restaurantes devem existir apenas em:
- variáveis de ambiente
- dados/configuração no Firebase
- arquivos de mídia/URLs configuráveis

Não manter versões de código independentes por cliente.
