# Digitally Anne Universal Checkout V2

A separate checkout app for Digitally Anne. It is **not connected to GoHighLevel**. The customer-facing homepage has a new warm orange/amber/brown/cream design; products are managed from `/admin` and published product pages are shared as `/p/<slug>`.

## Project files
- `index.html`: minimal welcome page with only Support Anne and Pay for Products & Services choices
- `support.html`: support intake page before payment
- `catalog.html`: customer-facing multi-select catalogue with live order summary
- `checkout.html`: staged details/payment checkout for support and multi-item orders
- `product.html`: product/support checkout, payment selection, QR enlargement, proof upload, thank-you state
- `admin.html`: Supabase Auth-based product/order admin UI
- `api/products.js`: public published catalogue endpoint
- `api/submit-checkout.js`: server-side product price validation, private proof upload, order storage, initial Brevo transactional email
- `api/admin.js`: admin-only order/product actions, signed proof URLs, status updates and status email
- `supabase/schema.sql`: tables and RLS setup
- `assets/`: extracted V1 portrait and actual GCash/GoTyme/BPI QR images

## Before testing/deploying
1. Create a **new** Supabase project for V2. Do not reuse or modify the GHL app.
2. Run `supabase/schema.sql` in the new project's SQL editor.
3. Create a **private** Storage bucket named `payment-proofs`. Never make it public.
4. In Supabase Auth, create your admin user. Then insert that user's ID/email into `public.admin_profiles` (see SQL below).
5. Edit `config.js` with the new Supabase project URL and anon key. These are public browser values only; never put the service-role key in `config.js`.
6. Add Vercel environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `SITE_URL`, and optional `ADMIN_EMAILS`. Never expose the service-role key or Brevo key to the browser.
7. In Vercel, import this folder into a **new** project/repository. Keep the existing GHL project untouched.
8. Set the Brevo sender to your verified sender, e.g. `Digitally Anne <moolah@m.michelleannalopez.com>`.

After creating your Supabase Auth user, run this in the new Supabase SQL editor using that user's actual ID and email:
```sql
insert into public.admin_profiles (user_id, email) values ('YOUR_AUTH_USER_UUID', 'your-admin-email@example.com');
```

## Important behavior
- Public catalogue only shows published, non-archived products. Admin product edits are persisted in Supabase. Customers can select multiple products in `/catalog.html`; the order summary updates before checkout. Support uses `/support.html`. Direct single-product URLs can use `/p/<slug>`.
- Product prices are read and validated server-side from the published product record; the browser cannot set a product's price. Support contributions use the customer-entered amount.
- QR images enlarge when tapped/clicked. GCash, GoTyme, and BPI proof uploads accept JPG, PNG, or PDF up to 3 MB and are stored in a private bucket. Admin can open a short-lived signed proof URL.
- Orders are not automatically marked paid. They enter `under_review` and need manual verification. The order-received email explicitly says this is not payment confirmation. Status changes can send Brevo transactional emails.
- PayPal remains an external PayPal.Me flow; this app does not verify PayPal transactions with an API.

## Manual smoke-test checklist
- [ ] Add a draft product in `/admin`; confirm it does not appear publicly.
- [ ] Publish it; confirm it appears on the homepage and `/p/<slug>` opens.
- [ ] Submit a test order with dummy details and a test proof file.
- [ ] Confirm the order, item, proof path and status history in the new Supabase project.
- [ ] Confirm the proof bucket is private and the admin's signed URL works.
- [ ] Confirm Brevo receives the order-received email and admin status updates send status email.
- [ ] Confirm product price cannot be changed by editing the browser request.
- [ ] Confirm no GHL webhook URL or GHL credentials are present in this project.

This is a deployable implementation draft, not a claim that a live production deployment has been verified. Complete the checklist with test data before accepting real payments.
