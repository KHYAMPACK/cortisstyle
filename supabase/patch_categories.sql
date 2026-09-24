-- Categories: per-boutique category tree, product assignments (one primary), and the
-- switch that says which category system a boutique uses
-- (product upload foundation, milestone M3). See docs/product-upload-foundation-plan.md.
--
--   tr_boutiques.category_mode   'legacy' = the built-in fashion category tree in code
--                                (what lilabutik uses today, untouched);
--                                'custom' = the boutique's own categories from the tables
--                                below. Existing boutiques become 'legacy'; boutiques
--                                created after this patch default to 'custom'. Nothing
--                                changes for a boutique until it is switched.
--   tr_categories                the tree: name, slug, parent, description, image, default
--                                sort order of its products, SEO overrides.
--   tr_product_categories        many-to-many, exactly one primary category per product.
--                                tr_products.category keeps a copy of the primary's slug
--                                (maintained by the app) so existing filters and feeds work.
--
-- Safe to apply before or after the app version that uses it (the app treats a missing
-- column or table as "legacy, no categories"). Idempotent.
--
-- To try it on the test boutique after applying:
--   update public.tr_boutiques set category_mode = 'custom' where slug = 'deneme-butik';
--
-- Manual apply only (Supabase SQL editor). Not applied by the agent.

begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tr_boutiques'
      and column_name = 'category_mode'
  ) then
    -- Existing rows are stamped 'legacy'; the default is then switched so new
    -- boutiques start with their own categories.
    alter table public.tr_boutiques
      add column category_mode text not null default 'legacy';
    alter table public.tr_boutiques
      alter column category_mode set default 'custom';
  end if;
end
$$;

alter table public.tr_boutiques
  drop constraint if exists tr_boutiques_category_mode_check;
alter table public.tr_boutiques
  add constraint tr_boutiques_category_mode_check
  check (category_mode in ('legacy', 'custom'));

comment on column public.tr_boutiques.category_mode is
  'legacy = built-in fashion category tree (code); custom = this boutique''s own tr_categories.';

create table if not exists public.tr_categories (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  -- NO ACTION (checked at end of statement) so deleting a boutique can remove a
  -- category and its children together; the app moves children up before a delete.
  parent_id uuid references public.tr_categories (id),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (
    char_length(slug) <= 185
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ),
  description text,
  image_url text,
  sort_criterion text check (
    sort_criterion is null
    or sort_criterion in (
      'best_selling', 'discount_desc', 'discount_asc',
      'price_desc', 'price_asc', 'newest'
    )
  ),
  seo jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (boutique_id, slug)
);

create index if not exists tr_categories_boutique_parent_idx
  on public.tr_categories (boutique_id, parent_id);

create table if not exists public.tr_product_categories (
  product_id uuid not null references public.tr_products (id) on delete cascade,
  category_id uuid not null references public.tr_categories (id) on delete cascade,
  is_primary boolean not null default false,
  primary key (product_id, category_id)
);

-- At most one primary category per product.
create unique index if not exists tr_product_categories_one_primary_key
  on public.tr_product_categories (product_id)
  where is_primary;

create index if not exists tr_product_categories_category_idx
  on public.tr_product_categories (category_id);

alter table public.tr_categories enable row level security;
alter table public.tr_product_categories enable row level security;

-- No policies on purpose: the storefront and the panel read and write through the
-- service role in server code.
revoke all on public.tr_categories from anon, authenticated;
revoke all on public.tr_product_categories from anon, authenticated;

comment on table public.tr_categories is
  'Per-boutique category tree (category_mode = custom). Service-role only.';
comment on table public.tr_product_categories is
  'Product <-> category, exactly one primary per product. Service-role only.';

commit;
