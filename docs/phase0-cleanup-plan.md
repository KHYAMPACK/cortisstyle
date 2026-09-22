# Phase 0 Cleanup Plan — hand this to Claude Code

_Prepared 2026-09-22 for the `cortisstyle` repo at `C:\Users\Mert\OneDrive\Desktop\Projects\cortisstyle`. Confirmed against the live repo the same day: 190 modified files, 9 untracked, one stale `.git/index.lock`._

## 0. Before anything: unblock git (you do this, not the agent)

There's a leftover empty lock file at `.git/index.lock` (created Sep 20, harmless but blocks every git command). Delete it yourself first:

- Close any programs that might be touching the repo (editors, other terminals).
- Delete `cortisstyle\.git\index.lock` in File Explorer, or run `del .git\index.lock` from a terminal in the repo folder.
- Confirm with `git status` — it should run without error.

Do this before opening Claude Code on this repo, or every git command in the session will fail.

## 1. What the mess actually is (confirmed, not guessed)

- **190 modified files, but the diff is ~29,340 insertions / 29,285 deletions** — nearly a 1:1 swap on almost every file. That's line-ending churn (CRLF ↔ LF), not real edits. Spot-checked `.cursor/rules/*.mdc`, `public/tr-panel-sw.js`, `public/tr-panel/manifest.webmanifest` — confirmed same pattern.
- **9 untracked items**, and these are **not scratch** — most are a real, unfinished feature:
  - `src/components/tr/boutique/newtenant/`, `src/lib/tr/boutique/newtenant/`, `src/data/tr/newtenant-seed.json`, `scripts/seed-newtenant.mts` — the "NewTenant" boutique skin/seed data referenced elsewhere in the codebase (`isNewTenantBoutique.ts` is already tracked and imports from these).
  - `src/components/icons/FacebookIcon.tsx`, `TikTokIcon.tsx`, `YouTubeIcon.tsx` — plain icon components, low risk.
  - `docs/platform-roadmap.md` — the roadmap I just wrote and already copied into the repo.
  - `.claude/` — Claude Code's own project config folder; decide whether it should be committed or gitignored (see step 4).
- Separately, `.tmp-chrome-analysis/`, `.tmp-chrome-recovered-meta.txt`, `.tmp-chrome-recovery-notes.txt`, and `tmp/` exist in the repo **and are already tracked** (they showed as `M`, not `??`, in an earlier check) — these are scratch files that got committed at some point and need removing from tracking, not just deleting.

## 2. Fix the root cause (line endings), then the noise disappears on its own

Do this before touching individual files — it should resolve most of the 190 "modified" files in one move.

1. Check whether `.gitattributes` exists (it doesn't currently — not in the file listing). Create one:
   ```
   * text=auto eol=lf
   ```
2. Renormalize: `git add --renormalize .` then check `git status` again. This rewrites line endings in the index to match the new rule without you touching file content.
3. Re-diff a couple of the previously-noisy files (`public/tr-panel-sw.js`, one `.cursor/rules/*.mdc`) to confirm the diff is now empty or near-empty.
4. **Do not** blanket-commit yet — first make sure this didn't touch anything binary (images, fonts). `.gitattributes` with `eol=lf` only affects text files by default, but verify nothing under `public/images/` or similar shows as modified after renormalizing.

## 3. Handle the untracked NewTenant feature

Since `isNewTenantBoutique.ts` is already tracked and clearly depends on these untracked files, this looks like an in-progress feature that never got committed. **Mert confirmed only `lilabutik` needs to keep working, so the agent can decide without stopping to ask:**

- Default: commit it as its own PR — `git add src/components/tr/boutique/newtenant/ src/lib/tr/boutique/newtenant/ src/data/tr/newtenant-seed.json scripts/seed-newtenant.mts` with a message like `Add NewTenant boutique skin and seed script`. This is the safer default since it's finished-looking code, not scratch.
- If the agent judges it genuinely incomplete/broken (e.g. references files that don't exist, half-finished component), it's fine to delete instead — grep for remaining references to `isNewTenantBoutique` first so nothing tracked ends up with a dangling import, but there's no need to preserve NewTenant's functionality either way.

## 4. Tracked scratch files — remove from git, keep or delete locally as you prefer

These are currently tracked (showing as `M`) but are clearly scratch/debug artifacts, not product code:
- `.tmp-chrome-analysis/` (contains `write0-line1146.tsx` etc. — recovered fragments from a past incident)
- `.tmp-chrome-recovered-meta.txt`
- `.tmp-chrome-recovery-notes.txt`
- `tmp/`

**Agent instructions:**
1. Add these paths to `.gitignore`.
2. `git rm -r --cached .tmp-chrome-analysis .tmp-chrome-recovered-meta.txt .tmp-chrome-recovery-notes.txt tmp/` (removes from tracking, leaves the files on disk — Mert can delete them by hand afterward if he doesn't need them).
3. Also handle `.claude/` — if it holds only local Claude Code session config with nothing sensitive, add to `.gitignore`, matching how most repos treat AI-tool config directories. If it holds anything that looks intentionally authored (custom commands, project instructions worth keeping), commit it instead. The agent can decide this one itself; it's low-stakes either way.
4. Leave `boutique-model-front-pose.png` (2MB image in repo root) and `test-guide.pdf` alone for now — not urgent, just noted as repo-root clutter worth relocating into `docs/` or `public/` at some point.

## 5. Delete confirmed-dead code from the cleanup audit

`docs/codebase-cleanup-audit.md` already identifies these as dead with zero callers (see that doc for full reasoning — the agent should re-verify each with a grep before deleting, since the audit is from July 2026):

- `src/app/api/wardrobe-notify/route.ts`
- `src/app/checkout-coming-soon/page.tsx` + `src/components/CheckoutComingSoonGate.tsx`
- Funnel source `archive-extension` (in `funnel-notify/route.ts` `VALID_SOURCES` and types)

**Agent instructions:** for each item, `grep -rn` the exact export/route name across `src/` before deleting, confirm zero real callers (test files don't count as callers), delete, then run `npm run build` (or the repo's typecheck/lint command) to confirm nothing broke. One commit per deleted item, not a batch — if the build breaks, it's obvious which commit did it.

**Also fine to delete now** (previously held back pending Mert's input — no longer needed since only `lilabutik` is protected): the rest of the email-capture/funnel system (`FunnelEmailCapture.tsx`, `/notify`, `/wardrobe-coming-soon`, funnel DB helpers, `supabase/patch_member_notify.sql` / `patch_wardrobe_notify.sql` — export any signup emails first if Mert wants them, otherwise just drop the code and leave the Supabase tables for Mert to drop manually), and the `uuid` npm package once the agent confirms via grep that nothing else imports it.

## 6. Commit shape

Once 2–5 are done, the working tree should be close to clean. Commit in this order, each with a real message (not "asf"):

1. `Add .gitattributes to normalize line endings` (from step 2, if not already folded into the renormalize commit)
2. `Untrack scratch/debug files (.tmp-chrome-*, tmp/)` (step 4)
3. `Add NewTenant boutique skin` or delete it (step 3, per Mert's decision)
4. One commit per dead-code removal (step 5)
5. `Add platform roadmap` for `docs/platform-roadmap.md` if not already committed

Confirm at the end with `git status` — should show clean, and `git log --oneline -10` should show real messages.

## 7. Verify nothing broke (the actual acceptance check for Phase 0)

- `npm run build` (or equivalent) passes.
- `npm run lint` / typecheck passes.
- Manually confirm in a local dev run (or by reading the code) that `/tr/lilabutik` and its checkout/payment/shipping path are untouched — Phase 0 is cleanup only, it must not change any runtime behavior for the one live store (Mert confirmed 2026-09-22: only `lilabutik` needs to keep working; other boutiques, e.g. Pervin/Minimora/NewTenant, are not production-critical and can be broken, changed, or removed during cleanup if it helps).
- Push nothing to production from this session; this is local repo hygiene only.

## 8. What Phase 0 does *not* include

Don't let the agent drift into these while "cleaning up" — they're separate roadmap phases:
- Moving hardcoded slugs into the database (Phase 1).
- Touching `src/lib/tr/payments/registry.ts`, `customDomain.ts`, or anything in the checkout/payment/shipping path.
- Renaming routes or changing UI copy.
- Deleting anything not explicitly listed above without asking first.
