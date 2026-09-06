# Alibek Yermagambetov — personal brand website

Static multi-page website for Alibek Yermagambetov.

## Structure
- `index.html` — home
- `about.html` — about
- `projects.html` — projects
- `media.html` — media/audience
- `cooperation.html` — cooperation form
- `site-config.js` — contacts, social links, stats and prices
- `styles.css` — styles
- `script.js` — interactions and form submission
- `api/lead.js` — protected server-side endpoint for Bitrix24
- `assets/` — local images

## Local preview
Open `index.html` directly, or run any static HTTP server in this folder.

## Vercel
Framework preset: **Other**. No build command is required. Output directory: project root.

GitHub `main` is connected to Vercel and deploys automatically.

## Custom domain checklist
1. Buy the domain.
2. Vercel -> Project -> Settings -> Domains -> Add Domain.
3. Add the DNS records Vercel shows at the registrar.
4. Set the chosen domain as Primary.
5. After the domain is final, add canonical URLs, `sitemap.xml` and the final host to `robots.txt`.

No code changes are required just to connect the domain itself.

## Bitrix24 preparation
The cooperation form already POSTs to `/api/lead`.

Until Bitrix24 is configured, the endpoint returns `bitrix_not_configured` and the browser falls back to a prepared WhatsApp message.

After a paid Bitrix24 plan / REST access is available:
1. Create an inbound webhook with CRM permissions.
2. In Vercel -> Project -> Settings -> Environment Variables add:
   - `BITRIX_WEBHOOK_BASE_URL`
   - `BITRIX_METHOD` (default `crm.lead.add.json`)
3. Redeploy the project.

The webhook secret stays on Vercel server-side and is never exposed in `script.js`.

### Planned CRM source
`Сайт Алибек Ермагамбетов`

### Form data already prepared for CRM
- company / brand
- contact name
- phone / WhatsApp
- email
- brand URL
- cooperation format
- budget
- preferred date
- task / message

When the Bitrix portal is purchased, we can map these fields to custom CRM fields and, if needed, switch from Leads to a separate Deal pipeline.
