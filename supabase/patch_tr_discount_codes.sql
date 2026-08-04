-- Boutique discount / coupon codes (Ikas-like campaigns MVP).
create table if not exists public.tr_discount_codes (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references public.tr_boutiques (id) on delete cascade,
  code text not null,
  /** percent off (1-100) XOR fixed amount in kuruş */
  percent_off integer check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_kurus integer check (amount_off_kurus is null or amount_off_kurus > 0),
  active boolean not null default true,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tr_discount_codes_type_chk check (
    (percent_off is not null and amount_off_kurus is null)
    or (percent_off is null and amount_off_kurus is not null)
  ),
  constraint tr_discount_codes_code_boutique_uidx unique (boutique_id, code)
);

create index if not exists tr_discount_codes_boutique_id_idx
  on public.tr_discount_codes (boutique_id);

alter table public.tr_discount_codes enable row level security;

drop trigger if exists tr_discount_codes_set_updated_at on public.tr_discount_codes;
create trigger tr_discount_codes_set_updated_at
before update on public.tr_discount_codes
for each row execute function public.tr_set_updated_at();

comment on table public.tr_discount_codes is
  'Owner-managed coupon codes per boutique (panel campaigns).';
