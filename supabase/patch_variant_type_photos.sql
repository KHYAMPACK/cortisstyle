-- A variant type can give each of its values its own photos (Renk, Desen…): in a
-- product, the variants of a value share them and the shop's gallery follows the
-- choice. One such type per product (checked by the app).
-- Additive. Until it is applied, a type with role 'color' is treated as the photo type.

alter table public.tr_variant_types
  add column if not exists has_photos boolean not null default false;

-- Keep today's behaviour: colour types are the photo types.
update public.tr_variant_types set has_photos = true where role = 'color' and has_photos = false;
