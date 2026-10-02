-- lilabutik's main address is www.lilaboutiquedenizli.com: the hosting (Vercel) sends the
-- bare domain to www. (308). `custom_domain` now holds the store's main address exactly as
-- served, and canonical links, the sitemap and the Google feed use it as stored.
-- Both lilaboutiquedenizli.com and www. keep resolving to the store (src/lib/tr/customDomain.ts).
-- Data only; idempotent. Revert: set custom_domain = 'lilaboutiquedenizli.com'.
update public.tr_boutiques
set custom_domain = 'www.lilaboutiquedenizli.com'
where slug = 'lilabutik'
  and custom_domain = 'lilaboutiquedenizli.com';
