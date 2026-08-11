# TR boutique legal templates (taslak)

> **Not legal advice.** Internal clone pack for white-label boutiques.  
> **Runtime (live pages):** `src/lib/tr/legal/docs.ts` → `/tr/{slug}/yasal/{doc}` (custom domain: `/yasal/{doc}`).  
> Fill boutique Ayarlar / seed (`legalName`, address, phone, email, vergi, shipping, exchange) — the same templates render for every tenant.

## Placeholders

| Placeholder | Source |
|-------------|--------|
| `{{BRAND}}` | Boutique display name |
| `{{SELLER}}` | `legalName` (else brand) |
| `{{ADDRESS}}` | `physicalAddress` |
| `{{EMAIL}}` | Contact email (`CONTACT_EMAIL_BY_SLUG` or `info@{domain}`) |
| `{{PHONE}}` | `whatsappPhone` |
| `{{SITE_URL}}` | `https://{customDomain}` or platform boutique URL |
| `{{VERGI_NO}}` | `vergiNo` |
| `{{SHIPPING}}` | `shippingNote` (or default kargo copy) |
| `{{RETURNS}}` | `exchangePolicy` (or default 14-gün cayma copy) |
| `{{VENUE}}` | City from address (e.g. Denizli) for non-consumer venue |
| `{{CONTACT}}` | Phone + email line |

## Doc IDs (storefront paths)

| ID | Page title (approx.) |
|----|----------------------|
| `kunye` | Hakkımızda / Künye |
| `uyelik` | Site Kullanım Şartları – Üyelik Sözleşmesi |
| `gizlilik` | {{BRAND}} Gizlilik Politikası |
| `cerez` | {{BRAND}} Çerez Politikası |
| `kvkk` | KVKK Aydınlatma Metni |
| `mesafeli-satis` | Mesafeli Satış Sözleşmesi |
| `on-bilgilendirme` | Ön Bilgilendirme Formu |
| `iade` | Tüketici Hakları – Cayma – İptal İade Koşulları |

---

## 1. Üyelik / site kullanım (`uyelik`)

Giriş: Site {{ADDRESS}} adresindeki {{SELLER}} (marka: {{BRAND}}) tarafından işletilir. Üyelik formu onayı = şartların kabulü. İletişim: {{CONTACT}}. Site: {{SITE_URL}}.

Sections to keep when cloning: 1 Sorumluluklar · 2 Fikrî mülkiyet · 3 KVKK/gizlilik · 4 Hizmetlerin sunumu · 5 Kayıt ve güvenlik · 6 Mücbir sebep · 7 Bütünlük · 8 Değişiklikler · 9 Bildirimler · 10 Kayıtlar · 11 Uyuşmazlık (tüketici mercileri + {{VENUE}} mahkemeleri).

---

## 2. Gizlilik (`gizlilik`)

{{SELLER}} / {{BRAND}} gizlilik politikası; KVKK uyumu; {{SITE_URL}} çerez politikası ayrılmaz parça. Veri sorumlusu: {{SELLER}}, {{ADDRESS}}, {{CONTACT}}, {{VERGI_NO}}.

Kategoriler: kimlik, iletişim, kullanıcı, işlem, güvenlik, finansal (kart → ödeme kuruluşu), pazarlama, talep/şikayet. Amaçlar: üyelik, sipariş, güvenlik, iyileştirme, (rıza ile) pazarlama. Aktarım: hosting, ödeme, kargo, e-posta/SMS, hukuk. Haklar (m.11) → {{EMAIL}}, 30 gün.

---

## 3. Çerez (`cerez`)

{{BRAND}} çerez politikası; birinci/üçüncü taraf; oturum/kalıcı; teknik, doğrulama, analitik, reklam, kişiselleştirme. Tercihler: tarayıcı, GA opt-out, adssettings, youronlinechoices. Değişiklikler sitede yayımlandığında yürürlükte.

---

## 4. Mesafeli satış (`mesafeli-satis`)

1 Taraflar — ALICI = sipariş formu; SATICI = {{SELLER}} / {{BRAND}} / {{ADDRESS}}  
2 Tanımlar (Kanun, Yönetmelik, Site={{SITE_URL}}, …)  
3 Konu  
4 Satıcı — unvan, adres, tel {{PHONE}}, faks Yok, e-posta {{EMAIL}}, vergi  
5–6 Alıcı / sipariş veren = form  
7 Ürün özellikleri + fiyatlar (sipariş özeti)  
8 Fatura = form  
9 Genel — ön bilgi onayı; teslim ≤30 gün; {{SHIPPING}}  
10 Cayma 14 gün; {{RETURNS}}  
11 Cayma istisnaları  
12 Temerrüt (kart)  
13 Yetkili merciler + {{VENUE}}  
14 Yürürlük = sipariş onayı / ödeme  

---

## 5. Ön bilgilendirme (`on-bilgilendirme`)

Satıcı: {{SELLER}}, {{ADDRESS}}, {{CONTACT}}, {{VERGI_NO}}, {{SITE_URL}}. Mal/fiyat sipariş özetinde. Ödeme + {{SHIPPING}}. Cayma → `iade` sayfası. Sipariş öncesi onay zorunlu.

---

## 6. Tüketici hakları / cayma / iade (`iade`)

Genel: ön bilgi + mesafeli kabul; 6502 + Yönetmelik; giden kargo aksi belirtilmezse alıcı; teslim ≤30 gün; {{SHIPPING}}; satılamazsa 3 gün bildirim + 14 gün bedel iadesi.  
Bedel ödenmezse teslim yok. Yetkisiz kart → 3 gün iade, nakliye satıcı. Mücbir sebep seçenekleri + 14 gün iade. Muayene yükümlülüğü.  
Cayma 14 gün. Bildirim: {{SELLER}}, {{ADDRESS}}, {{EMAIL}}, {{PHONE}}, Faks Yok. Cayma masrafları satıcı; restocking yok. İade koşulları (10/20 gün). İstisnalar (hijyen, kişiye özel, açılmış ambalaj vb.). Temerrüt. Ödeme: havale bilgisi ödeme ekranında; kart → iyzico.

---

## 7. KVKK (`kvkk`) + Künye (`kunye`)

KVKK: veri sorumlusu {{SELLER}}, kategoriler, amaçlar, aktarım, saklama, m.11 → {{EMAIL}}.  
Künye / hakkımızda: marka, unvan, adres, iletişim, vergi, MERSİS/KEP (varsa), web.

---

## Clone checklist (next boutique)

1. Seed / Ayarlar: `legalName`, `physicalAddress`, `whatsappPhone`, contact email override if needed, `vergiNo`, `shippingNote`, `exchangePolicy`, `customDomain`
2. Smoke `/yasal/uyelik`, `gizlilik`, `cerez`, `mesafeli-satis`, `on-bilgilendirme`, `iade`, `kunye`, `kvkk` on boutique domain
3. Lawyer review of filled pages (this file = structure only; live prose in `docs.ts`)
4. iyzico / Merchant: link footer legal URLs + payment logos already shared

**Lila reference fill:** Nefise Gül Cengiz Peker · Bahçelievler Mh. Gülistan Cd. No:7/A Merkezefendi/Denizli · ncp20@outlook.com · lilaboutiquedenizli.com
