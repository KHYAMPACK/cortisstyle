-- Drop international lookbook / wardrobe / Lookbook Studio tables from the
-- LIVE Cortisstyle (TR) Supabase project.
-- International archive will use its own DB later — these are unused here.
--
-- KEEP: public.profiles (TR auth still upserts here)
-- KEEP: all tr_* tables and tr_boutiques_public
--
-- Run manually in Supabase SQL editor. Irreversible without backup.

-- Studio
drop table if exists public.studio_import_cache cascade;
drop table if exists public.studio_drafts cascade;
drop table if exists public.studio_curators cascade;

-- International wardrobe
drop table if exists public.user_saved_outfits cascade;
drop table if exists public.user_wardrobe cascade;
