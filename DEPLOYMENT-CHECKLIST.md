# Deployment checklist

## Before GitHub
- [ ] This is a new repository; do not overwrite the old checkout.
- [ ] Keep `.env` out of GitHub.
- [ ] Replace the placeholder QR files with the correct payment QR images.
- [ ] Update `public/assets/js/config.js` with accurate payment details and PayPal.Me URL.

## Supabase
- [ ] Create a new Supabase project.
- [ ] Run `supabase/schema.sql` in SQL Editor.
- [ ] Create admin user in Supabase Auth.
- [ ] Verify RLS and private Storage settings.
- [ ] Test an anonymous request cannot read orders or proof metadata.

## Vercel
- [ ] Import the new GitHub repo into a new Vercel project.
- [ ] Add all environment variables from `.env.example` in Vercel Project Settings.
- [ ] Redeploy after setting variables.
- [ ] Confirm no service role or Brevo key appears in client source/maps/network.

## Important pre-production fixes/tests
- [ ] Test Supabase signed upload URL format against current Supabase Storage API.
- [ ] Implement a secure guest-upload authorization token or signed upload workflow bound to the order; do not rely on order ID alone for real production use.
- [ ] Add rate limiting/bot protection to public order and upload endpoints.
- [ ] Add server-side file signature validation, not MIME type alone.
- [ ] Test order and order_items writes are atomic (consider a Postgres RPC transaction).
- [ ] Add private proof preview via short-lived signed download URL in admin UI.
- [ ] Complete product CRUD interface and test archive/publish behavior.
- [ ] Add status-transition validation and email event logging.
- [ ] Add retry handling for Brevo errors.
- [ ] Test mobile, accessibility, duplicate submissions, and real payment reconciliation.
- [ ] Do not accept live payments until all items above are checked.
