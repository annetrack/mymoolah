-- Digitally Anne Universal Checkout schema.
-- Run in a NEW Supabase project. Review before production use.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  short_description text not null default '',
  price_php numeric(12,2) not null check (price_php >= 0),
  image_url text,
  published boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  kind text not null check (kind in ('donation','product')),
  amount_php numeric(12,2) not null check (amount_php > 0),
  payment_method text not null check (payment_method in ('gcash','gotyme','bpi','paypal')),
  transaction_reference text,
  status text not null default 'Under review' check (status in ('Pending payment','Under review','Paid','Rejected','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_customer_email_idx on public.orders(customer_email);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  unit_price_php numeric(12,2) not null check (unit_price_php >= 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total_php numeric(12,2) not null check (line_total_php >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  storage_path text not null,
  submitted_by_email text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists payment_submissions_order_idx on public.payment_submissions(order_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  recipient_email text not null,
  event_type text not null,
  provider_message_id text,
  status text not null default 'attempted',
  error_detail text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_submissions enable row level security;
alter table public.order_status_history enable row level security;
alter table public.email_events enable row level security;

-- Public catalogue can read only published, non-archived products.
drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products" on public.products
for select to anon, authenticated using (published = true and archived = false);

-- All other sensitive table access is server-side via service role after auth checks.
-- Do not grant anon/authenticated direct access to order or proof tables.
revoke all on public.orders, public.order_items, public.payment_submissions, public.order_status_history, public.email_events from anon, authenticated;
grant select on public.products to anon, authenticated;

-- Private bucket for proof of payment. Objects are not publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];

-- No storage policies are granted to anon/authenticated. Server uses service role for signed upload URLs.
