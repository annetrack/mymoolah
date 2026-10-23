# Digitally Anne Universal Checkout

A separate checkout app starter for Digitally Anne. It does **not** connect to GoHighLevel.
Includes a public donation flow, product catalogue/product detail pages, manual payment submission, admin order review, Supabase schema/RLS, and Brevo transactional email scaffolding.

## Important before deployment
This is a starter implementation, not a production-audited payment system. Review and test the security checklist below before accepting real payments.

## Stack
- Vercel serverless functions (`api/`)
- Static HTML/CSS/JavaScript frontend (`public/`)
- Supabase database, Auth, and private Storage bucket
- Brevo transactional email API

## Files
- `public/index.html` — homepage, donation checkout, catalogue
- `public/product.html` — product detail + checkout
- `public/admin.html` — admin login and order review UI
- `public/assets/css/styles.css` — responsive branding
- `public/assets/js/` — frontend logic
- `api/` — server-side endpoints; secrets stay server-side
- `supabase/schema.sql` — database schema, RLS policies, storage bucket
- `vercel.json` — route/security headers
- `.env.example` — variable names only; never put real secrets in GitHub

## 1. Create Supabase project
1. Create a new Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Supabase Auth, create your admin user with your intended admin email.
4. Add that email to `ADMIN_EMAILS` in Vercel.
5. Create/verify a private Storage bucket named `payment-proofs` (schema attempts to create it).

## 2. Configure GitHub
1. Create a **private** repository named `digitally-anne-universal-checkout`.
2. Unzip this folder locally.
3. Upload the contents of this folder to the repository root (not the containing folder itself).
4. Do not upload `.env` files or secrets.

## 3. Deploy to Vercel
Import the GitHub repository into a **new** Vercel project. Do not change the old checkout project.

Set these Vercel Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never prefix with `VITE_` or expose in frontend)
- `ADMIN_EMAILS` (comma-separated admin email addresses)
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL` (e.g. `moolah@m.michelleannalopez.com`)
- `BREVO_SENDER_NAME` (e.g. `Digitally Anne`)
- `SITE_URL` (the deployed app URL, no trailing slash)

Redeploy after adding environment variables.

## 4. Configure payment details
Edit `public/assets/js/config.js` and replace the placeholder payment display details with the correct public-facing GCash, GoTyme, BPI and PayPal.Me details. These are display details, not secrets. Do not publish private account information you do not want customers to see.
- Add the actual QR images in `public/assets/images/` and update `config.js`.
- PayPal.Me link is configurable in `config.js`.

## 5. Admin flow
- Sign in at `/admin.html` using Supabase Auth.
- The admin email must be in `ADMIN_EMAILS`.
- Supabase policies restrict order access to authenticated users whose email is in `ADMIN_EMAILS`.
- Admin can mark an order Paid, Rejected, or Cancelled.
- Manual payments are never automatically treated as paid.

## 6. Test before launch
- Test donation with preset and custom amounts.
- Test published/unpublished product behaviour.
- Test proof upload and confirm that proof objects are private.
- Test a rejected payment and resubmission.
- Test order emails and payment-confirmation emails.
- Test unauthenticated admin access and unauthorized API calls.
- Confirm no service role key or Brevo key appears in browser source or network responses.
- Confirm existing GHL checkout still works and was not edited.

## Limitations in this starter
- Admin product creation/editing is scaffolded at the UI/API level; thoroughly test product image upload and slug uniqueness before launch.
- The starter uses manual payment verification and does not implement payment gateway webhooks.
- Rate limiting should be added at the edge/provider layer before production use.
- Never rely on a payment screenshot or customer-entered transaction ID alone as proof of payment.
