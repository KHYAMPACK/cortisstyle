-- Phase 1 §3: per-boutique payment/shipping provider capability + encrypted
-- credentials. Replaces the hardcoded IYZICO_CHECKOUT_SLUGS /
-- IYZICO_BUYER_PROTECTION_BY_SLUG / CREDENTIAL_ENV_BY_SLUG maps in
-- src/lib/tr/payments/registry.ts.
--
-- credentials_encrypted is AES-256-GCM ciphertext (iv + authTag + ciphertext,
-- base64), encrypted/decrypted in src/lib/tr/payments/credentialEncryption.ts
-- using the server-only TR_INTEGRATION_ENCRYPTION_KEY env var. Key rotation:
-- decrypt every row with the old key, re-encrypt with the new key, then swap
-- the env var — there is no versioning column, so rotation must be a single
-- atomic pass across all rows before the old key is discarded.
create table if not exists tr_boutique_integrations (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references tr_boutiques(id) on delete cascade,
  provider text not null,
  mode text not null default 'sandbox',
  enabled boolean not null default false,
  credentials_encrypted text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (boutique_id, provider)
);

comment on table tr_boutique_integrations is
  'Per-boutique payment/shipping provider capability + encrypted credentials. Service-role only — never grant anon/authenticated access.';
comment on column tr_boutique_integrations.provider is 'iyzico | basit_kargo | future providers.';
comment on column tr_boutique_integrations.mode is 'sandbox | live.';
comment on column tr_boutique_integrations.credentials_encrypted is 'AES-256-GCM ciphertext (iv + authTag + ciphertext, base64). Null until connected.';
comment on column tr_boutique_integrations.metadata is 'Non-secret provider config, e.g. iyzico buyer-protection token/position.';

alter table tr_boutique_integrations enable row level security;
-- No policies: service-role bypasses RLS by design; anon/authenticated get
-- zero access, same pattern as tr_orders/tr_invoices.

create trigger tr_boutique_integrations_set_updated_at
before update on public.tr_boutique_integrations
for each row execute function public.tr_set_updated_at();
