-- Drop pre-launch funnel / waitlist tables (no longer used by the app).
-- Run in Supabase SQL Editor after exporting any emails you want to keep.
-- Safe to re-run (IF EXISTS).

drop table if exists public.wardrobe_notify_signups cascade;
drop table if exists public.member_notify_signups cascade;
drop table if exists public.archive_stream_signups cascade;
drop table if exists public.checkout_priority_signups cascade;
drop table if exists public.purchase_intent_events cascade;
drop table if exists public.purchase_intent_stats cascade;
