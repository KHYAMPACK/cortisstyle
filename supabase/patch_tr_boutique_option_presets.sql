-- Boutique-scoped reusable size + color presets for the product editor.
alter table public.tr_boutiques
  add column if not exists size_presets jsonb not null default '[]'::jsonb,
  add column if not exists color_presets jsonb not null default '[]'::jsonb;

comment on column public.tr_boutiques.size_presets is
  'Owner-managed size chips for this boutique, e.g. ["S","M","L","38"].';

comment on column public.tr_boutiques.color_presets is
  'Owner-managed color chips for this boutique, e.g. [{"name":"Siyah","hex":"#1A1A1A"}].';
