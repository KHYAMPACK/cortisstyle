# Legal & Affiliate Compliance — Cortisstyle

Operational guide for disclosures, policies, and affiliate-network requirements before monetized shop links go live on **cortisstyle.com**.

> **Disclaimer:** This document is internal guidance and draft copy — not legal advice. Have a qualified attorney review before relying on it at scale, especially for GDPR/KVKK and US FTC obligations.

---

## Placeholders (fill in before publishing)

| Token | Example | Used in |
| ----- | ------- | ------- |
| `{{OPERATOR_NAME}}` | Your full legal name or registered company | Privacy, Terms, Contact |
| `{{CONTACT_EMAIL}}` | `hello@cortisstyle.com` | Footer, policies, network applications |
| `{{PRIVACY_EMAIL}}` | `privacy@cortisstyle.com` | Privacy requests (can match contact) |
| `{{EFFECTIVE_DATE}}` | `July 1, 2026` | Policy headers |
| `{{SUPABASE_REGION}}` | e.g. `EU (Frankfurt)` or `US East` | Privacy — data hosting |
| `{{GOVERNING_LAW}}` | `Republic of Türkiye` | Terms |

---

## Current site context

| Area | Status / notes |
| ---- | -------------- |
| Primary audience | ~44% USA — **FTC affiliate rules matter** |
| Operator location | Türkiye — **KVKK** applies for Turkish users |
| Auth & accounts | Supabase (email, profiles, wardrobe, saved outfits) |
| Analytics | Vercel Analytics + Speed Insights |
| Cookies | Auth session cookies on `.cortisstyle.com` |
| Monetization | Amazon Associates, CJ Affiliate (in progress), eBay, Etsy planned |
| Legal pages today | **None live** — footer is copyright only |

---

## Priority checklist

### Tier 1 — Before affiliate links go live

- [ ] Publish `/affiliate-disclosure`
- [ ] Publish `/privacy`
- [ ] Publish `/terms`
- [ ] Footer links on **homepage**, **wardrobe**, and **auth** flows
- [ ] Short affiliate line in **look modal** (near shop links)
- [ ] Amazon required sentence on any page with Amazon links
- [ ] Public **contact email** in footer

### Tier 2 — Strongly recommended

- [ ] Cookie notice (banner or bar) on first visit
- [ ] `/contact` or visible contact route
- [ ] `/about` (helps affiliate network approval + user trust)
- [ ] TikTok/Instagram caption habit: disclose affiliate when driving to shop

### Tier 3 — When you scale

- [ ] Lawyer-reviewed policies
- [ ] Formal cookie consent manager (if you add ad pixels / marketing tags)
- [ ] CCPA “Do Not Sell” page (only if you sell/share data for ads — not typical for this setup)

---

## Site map (recommended routes)

```
cortisstyle.com/privacy
cortisstyle.com/terms
cortisstyle.com/affiliate-disclosure
cortisstyle.com/contact          (optional)
cortisstyle.com/about            (optional)
```

---

## Footer copy (site-wide)

**Minimum block** — add to homepage, wardrobe, and auth-related layouts:

```text
© 2026 Cortisstyle — All rights reserved.

Privacy Policy · Terms of Use · Affiliate Disclosure

Cortisstyle may earn commission when you purchase through links on this site.

Contact: {{CONTACT_EMAIL}}
```

**Link targets:**

| Label | Path |
| ----- | ---- |
| Privacy Policy | `/privacy` |
| Terms of Use | `/terms` |
| Affiliate Disclosure | `/affiliate-disclosure` |

---

## In-product disclosure (look modal / shop links)

Place **above or directly below** outbound shop links when item metadata is visible:

```text
Some links on this page are affiliate links. If you buy through them, Cortisstyle may earn a commission at no extra cost to you. See our Affiliate Disclosure for details.
```

**Amazon-specific** — required by the [Amazon Associates Operating Agreement](https://affiliate-program.amazon.com/help/operating/agreement) on pages that include Amazon links:

```text
As an Amazon Associate I earn from qualifying purchases.
```

---

## Cookie notice (starter)

Show once on first visit until dismissed. Link to Privacy Policy § Cookies.

```text
We use essential cookies for sign-in and analytics to improve the site. By continuing, you agree to our Privacy Policy.

[Accept]  [Privacy Policy]
```

**Cookies to document in Privacy Policy:**

| Cookie / storage | Purpose | Essential? |
| ---------------- | ------- | ---------- |
| Supabase auth cookies (`.cortisstyle.com`) | Keep you signed in | Yes |
| `localStorage` (saved outfits fallback) | Offline / fallback outfit storage | Functional |
| Vercel Analytics | Aggregated usage metrics | Analytics |

---

## Social media disclosure

FTC expects disclosure **wherever** you promote affiliate links — not only on the website.

| Platform | When | Suggested disclosure |
| -------- | ---- | -------------------- |
| TikTok | Video drives to shoppable look / buy links | On-screen text or voice: “affiliate links”; caption: “Links may earn commission” or `#ad` when applicable |
| Instagram | Bio → cortisstyle.com shop looks | Bio line: “Shop links may earn commission” |
| Pinned comment | Look-specific deep link | “Full look + affiliate shop links on site” |

---

## Affiliate network expectations

| Network | Key requirements |
| ------- | ---------------- |
| **Amazon Associates** | Clear affiliate disclosure; exact sentence *“As an Amazon Associate I earn from qualifying purchases.”* on pages with Amazon links |
| **CJ Affiliate** | FTC-compliant disclosure; privacy policy; contact info; accurate site description |
| **eBay Partner Network** | Disclosure of affiliate relationship |
| **Etsy Affiliate** | Disclosure per program terms |

Incomplete privacy policy + missing disclosure commonly delays or rejects applications.

---

## Draft: Affiliate Disclosure (`/affiliate-disclosure`)

**Effective date:** {{EFFECTIVE_DATE}}

### Affiliate Disclosure

Cortisstyle (“we”, “us”) operates **cortisstyle.com**, a fashion lookbook and shopping guide. Transparency about how we earn money is important to us.

#### Affiliate relationships

Some links on this website — including product links shown in our looks, wardrobe, and editorial pages — are **affiliate links**. This means:

- If you click a link and make a qualifying purchase, we may receive a commission from the retailer or affiliate network.
- **You do not pay more** because you used our link. In some cases, offers may differ from what you would see by visiting the retailer directly.
- We participate in affiliate programs including, but not limited to, **Amazon Associates**, **CJ Affiliate**, **eBay Partner Network**, and **Etsy Affiliate**, and may add other programs over time.

#### Amazon Associates

**As an Amazon Associate I earn from qualifying purchases.**

#### Editorial independence

Affiliate relationships do not dictate our editorial choices. Looks are curated for aesthetic and editorial reasons. Commission potential does not determine which pieces we feature, though we may prioritize retailers that ship to our audience (primarily the United States) and that offer reliable shopping experiences.

#### Third-party retailers

We do not own, operate, or control linked retailers. Product availability, pricing, shipping, returns, and customer service are handled solely by the third party. We are not responsible for errors on retailer sites, out-of-stock items, or changes made after we publish a look.

#### Depop, marketplace, and one-off listings

Some links may point to third-party marketplaces (for example Depop) or independent shops. These may not be affiliate links. When an original item is unavailable, we may link to a similar product from another retailer, including affiliate retailers.

#### Updates

We may update this disclosure as our programs change. Continued use of the site after updates constitutes acceptance of the revised disclosure.

#### Contact

Questions about this disclosure: **{{CONTACT_EMAIL}}**

---

## Draft: Privacy Policy (`/privacy`)

**Effective date:** {{EFFECTIVE_DATE}}

### Privacy Policy

Cortisstyle operates **cortisstyle.com** and related subdomains (including **studio.cortisstyle.com**). This Privacy Policy explains what information we collect, how we use it, and your choices.

**Operator:** {{OPERATOR_NAME}}  
**Contact:** {{CONTACT_EMAIL}}  
**Privacy requests:** {{PRIVACY_EMAIL}}

#### 1. Information we collect

**Information you provide**

- **Account data:** email address and authentication credentials when you sign up or log in (via Supabase Auth).
- **Profile data:** email stored in your profile record.
- **Wardrobe data:** looks you unlock, outfits you save, outfit names, mood words, layout preferences, and related metadata.
- **Communications:** emails you send us or addresses you submit for waitlists, drop alerts, or newsletter-style notifications.

**Information collected automatically**

- **Usage data:** pages visited, referrers, device/browser type, and general interaction patterns via **Vercel Analytics** and **Vercel Speed Insights**.
- **Cookies and similar technologies:** authentication session cookies on `.cortisstyle.com` and local storage used for functional features (for example saved outfit fallback).

**Information from third parties**

- **Affiliate networks** may provide aggregated reporting about link clicks and qualifying purchases. We do not receive your full payment card details from retailers.

#### 2. How we use information

We use information to:

- Provide and maintain accounts, the digital wardrobe, and saved outfits.
- Authenticate you across cortisstyle.com and studio.cortisstyle.com.
- Improve site performance, content, and user experience.
- Measure traffic and referral sources (including from TikTok and Instagram).
- Operate affiliate programs and understand which content drives shopping activity.
- Respond to support and privacy requests.
- Send optional product or drop notifications if you opt in.
- Protect against abuse, fraud, and security incidents.

#### 3. Legal bases (EEA/UK visitors)

Where GDPR applies, we rely on:

- **Contract** — to provide account and wardrobe features you request.
- **Legitimate interests** — site security, analytics, and improving our service.
- **Consent** — where required for non-essential cookies or marketing emails.

#### 4. Sharing of information

We share information with service providers who help us run the site:

| Provider | Purpose |
| -------- | ------- |
| **Supabase** | Authentication, database, user profiles, wardrobe and outfit storage |
| **Vercel** | Hosting, analytics, performance monitoring |
| **Affiliate networks** (Amazon, CJ, eBay, Etsy, etc.) | Attribution of qualifying purchases via affiliate links |

We do not sell your personal information. We may disclose information if required by law or to protect our rights, users, or the public.

#### 5. International transfers

We and our providers may process data in countries other than your own (including the United States and the European Union, depending on hosting configuration). We take reasonable steps to protect data in line with this policy.

**Supabase region (update when known):** {{SUPABASE_REGION}}

#### 6. Data retention

We retain account and wardrobe data while your account is active. You may request deletion of your account and associated data. Analytics data is retained in aggregated form according to our analytics providers’ policies.

#### 7. Your rights

Depending on your location, you may have the right to:

- Access, correct, or delete your personal data.
- Object to or restrict certain processing.
- Withdraw consent where processing is consent-based.
- Lodge a complaint with a supervisory authority (EEA/UK) or apply under **KVKK** (Türkiye).

To exercise these rights, contact **{{PRIVACY_EMAIL}}**. We may need to verify your identity.

#### 8. Children

Cortisstyle is not directed at children under 13 (or under 16 where applicable). We do not knowingly collect personal information from children. Contact us to request deletion if you believe a child provided data.

#### 9. Security

We use industry-standard measures through our providers (encryption in transit, access controls). No method of transmission or storage is 100% secure.

#### 10. Third-party links

Our site links to external retailers and services. Their privacy practices are governed by their own policies. We are not responsible for third-party sites.

#### 11. Changes

We may update this policy. We will post the new effective date at the top. Material changes may be communicated via the site or email where appropriate.

#### 12. Contact

{{OPERATOR_NAME}}  
Email: {{PRIVACY_EMAIL}}

---

## Draft: Terms of Use (`/terms`)

**Effective date:** {{EFFECTIVE_DATE}}

### Terms of Use

Welcome to **cortisstyle.com**. By accessing or using this website, you agree to these Terms of Use. If you do not agree, do not use the site.

**Operator:** {{OPERATOR_NAME}}  
**Contact:** {{CONTACT_EMAIL}}

#### 1. About the service

Cortisstyle provides an editorial fashion lookbook, outfit inspiration, and links to third-party retailers. The site may include a digital wardrobe and account features. Content is provided for **informational and inspirational purposes** only. We do not provide professional styling, financial, or legal advice.

#### 2. Accounts

You may need an account to access certain features. You are responsible for:

- Providing accurate information.
- Maintaining the security of your credentials.
- Activity under your account.

We may suspend or terminate accounts that violate these terms or harm the service or other users.

#### 3. Affiliate links and shopping

The site contains **affiliate links**. We may earn commission on qualifying purchases. See our [Affiliate Disclosure](/affiliate-disclosure).

Purchases are made directly with third-party retailers. We are not a party to those transactions. We do not guarantee product quality, sizing, authenticity (especially on marketplace listings), pricing, shipping times, or return policies.

#### 4. User content

If you save outfits, upload mood imagery, or submit other content:

- You retain ownership of your content.
- You grant us a non-exclusive, worldwide license to host, display, and process that content solely to operate the service.
- You represent that you have the right to submit the content and that it does not violate others’ rights.

#### 5. Intellectual property

The Cortisstyle name, branding, lookbook layouts, editorial presentation, and site design are owned by {{OPERATOR_NAME}} or licensors. You may not copy, scrape, redistribute, or commercially exploit site content without written permission.

Product names, logos, and trademarks of retailers and brands belong to their respective owners.

#### 6. Acceptable use

You agree not to:

- Use the site unlawfully or to harass others.
- Attempt unauthorized access to systems or accounts.
- Reverse engineer, overload, or disrupt the service.
- Use automated means to scrape content at scale without permission.

#### 7. Disclaimers

THE SITE AND CONTENT ARE PROVIDED **“AS IS”** AND **“AS AVAILABLE”** WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that the site will be uninterrupted, error-free, or that product links will always be available, accurate, or current.

#### 8. Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, {{OPERATOR_NAME}} AND CORTISSTYLE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SITE OR THIRD-PARTY PURCHASES.

OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SITE SHALL NOT EXCEED THE GREATER OF (A) AMOUNTS YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED US DOLLARS (USD $100).

Some jurisdictions do not allow certain limitations; in those cases, limitations apply to the fullest extent permitted.

#### 9. Indemnity

You agree to indemnify and hold harmless {{OPERATOR_NAME}} from claims arising out of your misuse of the site or violation of these terms.

#### 10. Governing law

These terms are governed by the laws of **{{GOVERNING_LAW}}**, without regard to conflict-of-law principles. Courts in that jurisdiction shall have exclusive venue, unless mandatory consumer protection laws in your country require otherwise.

#### 11. Changes

We may modify these terms at any time. Updated terms are effective when posted. Continued use after changes constitutes acceptance.

#### 12. Contact

Questions about these terms: **{{CONTACT_EMAIL}}**

---

## Draft: Contact page (`/contact`) — optional

```text
Contact Cortisstyle

General inquiries: {{CONTACT_EMAIL}}
Privacy requests: {{PRIVACY_EMAIL}}

We aim to respond within a few business days.

Cortisstyle is an editorial fashion lookbook operated by {{OPERATOR_NAME}}.
Primary audience: United States. Operator based in Türkiye.
```

---

## Draft: About page (`/about`) — optional

Useful for affiliate program review and user trust:

```text
About Cortisstyle

Cortisstyle is an editorial SS26 lookbook — curated outfits, shoppable breakdowns, and a digital wardrobe for building your own looks.

We are operated by {{OPERATOR_NAME}} from Türkiye, with a primary audience in the United States.

Some product links on this site are affiliate links. We may earn a commission when you shop through them, at no extra cost to you. See our Affiliate Disclosure.

Contact: {{CONTACT_EMAIL}}
```

---

## Implementation notes (when you build routes)

| Item | Suggestion |
| ---- | ---------- |
| Route files | `src/app/privacy/page.tsx`, `terms/page.tsx`, `affiliate-disclosure/page.tsx` |
| Styling | Match existing editorial typography (`text-meta`, serif headings, blueprint borders) |
| Footer component | Extract shared `<SiteFooter />` used on homepage + wardrobe |
| Look modal | Add disclosure block when `shopUrl` links render |
| `metadata` | Per-page `title` + `description` for SEO |
| Sitemap | Include legal routes in `sitemap.xml` when present |

---

## Amazon Associates tax setup (reference)

For operator records — not published on site:

| Question | Typical answer (Türkiye-based solo operator) |
| -------- | ------------------------------------------- |
| Intermediary / flow-through entity? | **No** |
| Location of services performed? | **All services outside the U.S.** |
| Non-US TIN | Turkish National Identity Number (11 digits) |
| Applicable withholding rate | **0.0%** (when treaty/W-8BEN completed correctly) |
| Payment | Payoneer bank details linked in Associates account |

---

## Revision log

| Date | Change |
| ---- | ------ |
| {{EFFECTIVE_DATE}} | Initial internal compliance doc and draft policy copy |
