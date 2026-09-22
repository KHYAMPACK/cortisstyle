-- Phase 1 §6: public storefront contact email override, DB-backed instead of
-- the hardcoded CONTACT_EMAIL_BY_SLUG map in src/lib/tr/commerce/checkoutMode.ts.
-- Null falls back to info@{custom_domain}, then the platform mailbox.
alter table tr_boutiques add column if not exists contact_email text;
comment on column tr_boutiques.contact_email is 'Public storefront contact email override. Null falls back to info@{custom_domain} or platform mailbox.';

update tr_boutiques set contact_email = 'ncp20@outlook.com' where slug = 'lilabutik';
