# Branch Audit — BuenDia-Builders/be-energy

**Snapshot date:** 2026-09-25
**Remote:** `origin` → `https://github.com/IFEANYIBRIGHT/be-energy.git`
**GitHub repo:** `BuenDia-Builders/be-energy`
**Default branch:** `main` (protected)

---

## Branch Inventory

| Branch | Last commit | PR? | Overlaps main? | Recoverable work? | Action |
|---|---|---|---|---|---|
| `main` | `8b1a494` · 2026-07-01 | #213 (merged) | — (current tip) | None needed — active production branch | **keep** |
| `develop` | `5ffbff2` · 2026-07-01 | #213 (merged, promote) | Behind main by 13 commits | 13 commits on main not yet in develop | **needs-maintainer** |
| `feat/frontend-v2-enpower` | `309e4b1` · 2026-02-27 | None | Diverged: 1 ahead, 262 behind | 1 unique commit (Enpower dark theme redesign) | **cherry-pick-notes** |
| `front-dashboard` | `971b96f` · 2026-03-07 | None | Diverged: 1 ahead, 230 behind | 1 unique commit (dashboard + analytics module) | **cherry-pick-notes** |

---

## Detailed Findings

### `main` — keep

- Protected branch, 5 open-issue-tracked PRs all closed
- Last promoted from `develop` via PR #213 on 2026-07-01
- 13 commits ahead of `develop` that were never merged back down
- **No force-push or history rewrite detected** — linear merge history preserved

### `develop` — needs-maintainer

- Last commit same date as `main` (2026-07-01), but `main` is 13 commits ahead
- Historically received all feature PRs; automated promote script merged to `main`
- The 13 commits on `main` not in `develop` may represent hotfixes or direct-to-main changes
- **Recommendation:** review whether `develop` is still needed or has been superseded by the promote workflow

### `feat/frontend-v2-enpower` — cherry-pick-notes

- Stale since 2026-02-27 (7 months no updates)
- 1 unique commit: `feat: frontend v2 redesign (Enpower-inspired dark theme)`
- 262 commits behind `main` — would require significant merge conflict resolution
- No associated PR; likely abandoned
- **Recoverable:** the single commit contains a frontend redesign that could be cherry-picked to a new branch if desired

### `front-dashboard` — cherry-pick-notes

- Stale since 2026-03-07 (6+ months no updates)
- 1 unique commit: `feat: implementacion de dashboard, analytics y modulos de co`
- 230 commits behind `main` — significant divergence
- No associated PR; likely abandoned
- **Recoverable:** the single commit contains dashboard/analytics work that could be cherry-picked

---

## Recoverable Work from Deleted Branches

The following PRs were closed without merge. Their head branches appear to have been deleted. These represent potentially recoverable work:

| PR | Branch (deleted) | Title | Merged? | Notes |
|---|---|---|---|---|
| #199 | `Adds-certificate` | feat(web): add certificate detail page | No | Web feature |
| #197 | `Integer_overflow` | fix(contracts): integer overflow in community_governance | No | Contract fix |
| #195 | `feat/170-cooperative-factory` | Feat/170 cooperative factory | No | Contract feature |
| #194 | `base168` | feat(contracts): complete community_governance — vote, quorum, execute | No | Contract feature |
| #193 | `prime` | fix(contracts): remove orphaned persistent storage on add_members_multisig | No | Contract fix |
| #192 | `branch` | fix(contracts): clean up stale member data on add_members_multisig | No | Contract fix |
| #188 | `feat/transfer-admin-energy-token` | Add `transfer_admin` to energy_token Contract | No | Contract feature |
| #186 | `feat/web-members-management` | feat(web): implement cooperative members management dashboard | No | Web feature |
| #191 | `fix/179-rate-limit-auth-endpoints-v2` | fix(web): apply rate limiting to auth endpoints | No | Web fix |
| #190 | `fix/179-rate-limit-auth-endpoints` | fix(web): apply rate limiting to auth endpoints | No | Web fix |
| #189 | `fix/179-rate-limit-auth-endpoints` | fix(web): apply rate limiting to auth endpoints | No | Web fix |
| #146 | `feat/certificates-filter-labels` | feat: add labels to certificate filter dropdowns | No | Web feature |
| #140 | `feat/stellar-expert-url-utility` | feat: add getStellarExpertUrl utility | No | Web feature |
| #139 | `main` | feat: add getStellarExpertUrl utility and replace hardcoded | No | Web feature |
| #136 | `feat/marketplace-offer-persistence` | feat: connect marketplace buy to contract | No | Contract feature |
| #133 | `feat/170-cooperative-factory` | Feat/170 cooperative factory | No | Contract feature |
| #72 | `feat/marketplace-offer-persistence` | feat: connect marketplace buy to contract | No | Contract feature |
| #71 | `fix/i18n-missing-keys` | fix: add missing i18n keys | No | Web fix |
| #70 | `fix/i18n-missing-keys` | fix: add missing i18n keys | No | Web fix |
| #73 | `fix/dashboard-balance-infinite-loading` | Fix/dashboard balance infinite loading | No | Web fix |
| #22 | `feat/WAD` | feat: Show Connected Wallet Address | No | Web feature |
| #6 | `vercel/react-server-components-cve-vu-xkyej4` | Fix React Server Components CVE | No | Security fix |

---

## No Force-Push / History Rewrite Verification

- `git fsck --unreachable --no-reflogs` returned no dangling commits
- Commit graph shows clean merge-based history (no rewritten commits)
- All branch tips are reachable through the normal merge workflow
- **Conclusion:** No force-push detected on any branch

---

## Summary

- **4 remote branches** total (down from historical peak with many short-lived branches)
- **0 open PRs** across all branches
- **2 stale branches** (`feat/frontend-v2-enpower`, `front-dashboard`) with 1 unique commit each — candidates for cherry-pick and deletion
- **1 branch** (`develop`) that may be superseded by the automated promote workflow
- **~20 unmerged PRs** from deleted branches represent recoverable work
- **No force-push or history rewrite** detected

---

*Generated by `docs/audit/branches.md` chore task. No branches were deleted in this audit.*
