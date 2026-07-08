-- Boutique ownership for owner portal + public TR product image bucket.
-- Run after patch_tr_marketplace.sql / patch_tr_boutique_brand.sql

alter table public.tr_boutiques
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

create index if not exists tr_boutiques_owner_user_id_idx
  on public.tr_boutiques (owner_user_id);

comment on column public.tr_boutiques.owner_user_id is
  'Supabase auth user who manages this boutique in /tr/panel. Set manually after owner signs up.';

-- ---------------------------------------------------------------------------
-- Public asset bucket for boutique product photos (upload via service role)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('tr-assets', 'tr-assets', true)
on conflict (id) do update
  set public = excluded.public;

drop policy if exists "TR assets are publicly readable" on storage.objects;
create policy "TR assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'tr-assets');

-- Inserts go through service role from /api/tr/owner/upload; policies below allow
-- authenticated owners if ever uploaded client-side under their folder prefix.
drop policy if exists "TR assets upload scoped to owner folder" on storage.objects;
create policy "TR assets upload scoped to owner folder"
  on storage.objects for insert
  with check (
    bucket_id = 'tr-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "TR assets update scoped to owner folder" on storage.objects;
create policy "TR assets update scoped to owner folder"
  on storage.objects for update
  using (
    bucket_id = 'tr-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "TR assets delete scoped to owner folder" on storage.objects;
create policy "TR assets delete scoped to owner folder"
  on storage.objects for delete
  using (
    bucket_id = 'tr-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
