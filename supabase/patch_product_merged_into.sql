-- F6: a product merged into another as one of its colours.
-- The merged product is hidden, not deleted (old order lines, favourites and links keep
-- resolving); its address redirects to `merged_into` with `?renk=`.
-- Additive only. Run before patch_lilabutik_variants.sql.

alter table public.tr_products
  add column if not exists merged_into uuid
    references public.tr_products (id) on delete set null;

create index if not exists tr_products_merged_into_idx
  on public.tr_products (merged_into)
  where merged_into is not null;
