# Open questions — #255 reinterpret certificates as internal credits

## Schema (no migration in this PR)

`retirements` still uses legacy columns:

| Column | Old meaning | New meaning (this PR) |
|--------|-------------|------------------------|
| `buyer_address` | External buyer wallet | Admin/operator (`session.sub`) who applied the credit |
| `buyer_name` | Buyer org name | Free-text member or billing-cycle label |
| `buyer_purpose` | ESG etc. | Prefer `billing_settlement` / `member_allocation` |

Suggested future migration (not done here):

- `applied_by` (stellar address or user id)
- `applied_to_member_id` and/or `billing_cycle_id`
- Rename or drop ESG-only purpose values once product confirms

## Status names

Statuses remain `pending | available | retired`. UI may describe `retired` as applied/billed. Renaming statuses is a follow-up.

## Billing cycle entity

No first-class billing cycle table. Free-text `buyer_name` is a stopgap until a cycle model exists.

## Burn authority

`burn_energy` is still invoked with `MINTER_SECRET_KEY` (server-side), same as before. Contracts unchanged.