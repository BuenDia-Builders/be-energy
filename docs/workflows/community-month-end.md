# Community solar park month-end close

This is a documented reconstruction of the month-end process for a community
solar park. It uses public information about CoopMorteros and the Cooperativa
Eléctrica de Espartillar, plus the Argentine distributed-generation framework.
It is a workflow description, not a software design or an accounting policy.

The sources do not expose a complete internal close procedure, invoice layout,
member register, or meter-export file. Where the evidence stops, the step is
marked `inferred` or `needs-interview`; no missing detail is presented as fact.

## End-to-end flow

`production → received datum → calculation → allocation → credit → account/invoice → dispute`

| Step | Input | Owner | System (if known) | File type | Transformation | Output | Exception | Evidence label |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Production | Solar irradiance and plant generation for the close period | Park/operator team | Solar-park monitoring system; exact product not public | Meter export or portal report — format unknown | Read the period's generation and retain the source reading | Period generation in kWh, with timestamp and meter/plant identifier | Missing, late, reset, or corrected meter data; curtailment; outage | `public-source` for the existence of local generation; `needs-interview` for the operational extract |
| Received datum | Generation report plus the close period and plant identity | Cooperative energy/billing team | Internal billing/operations system — not public | CSV, XLSX, PDF, or API payload — confirm | Validate period, units, plant, and completeness; record corrections without overwriting the source | Accepted generation record and exception log | Unit mismatch, duplicate report, missing interval, or report received after close | `inferred` |
| Calculation | Accepted generation and each participant's subscribed or declared share | Cooperative energy/billing team | Spreadsheet or billing system — not public | Calculation workbook or system record — confirm | Calculate each participant's share of generation and value it using the applicable/current price rule | Participant allocation basis: kWh and/or monetary amount | Tariff/date rule unknown; share changes; generation below expected level; rounding | `public-source` for the participant-share concept; `needs-interview` for the formula and price basis |
| Allocation | Allocation basis and current participant register | Cooperative administration/billing team | Member/customer register — not public | Padron/member export — confirm | Match participant share to the correct supply point/account; check that the total allocation is explainable | Per-member allocation ready for posting | Member inactive, duplicate supply point, transfer request, or allocation total does not reconcile | `statutory` for the need to identify participants in a community scheme; `needs-interview` for the local register |
| Credit | Per-member allocation and the cooperative's credit policy | Cooperative billing team | Billing/accounting system — not public | Posting batch or ledger export — confirm | Apply the eligible energy value as a bill credit, transfer, or other approved treatment; keep the source calculation traceable | Credit instruction linked to member and period | Credit treatment, expiry, transferability, or cash conversion not confirmed for either reference case | `public-source` for CoopMorteros publicly describing account credit/transfer options; `needs-interview` for the actual posting rule |
| Account/invoice | Posted credit plus the member's billing account and period invoice | Cooperative billing/invoicing team | Invoice and customer-account system — not public | PDF/e-invoice and account transaction export | Render the credit with the ordinary account charges and preserve period/source references | Invoice/account statement showing the applied credit or an unapplied exception | Invoice already issued, credit cannot be applied, tax/tariff treatment unclear, or account is disputed | `public-source` for CoopMorteros having an online billing channel; `needs-interview` for invoice presentation and accounting treatment |
| Dispute | Member question, invoice, allocation, meter report, and close evidence | Customer service plus billing/energy teams | Customer-service or claims system — not public | Claim/ticket plus supporting PDF/CSV/email | Compare the invoice, allocation, source reading, and posting; correct or reject with a reason and audit trail | Resolution, adjustment, or explanation sent to the member | Missing evidence, unresolved meter correction, deadline, or disagreement over price/share | `public-source` for CoopMorteros publishing a billing-claims channel; `needs-interview` for SLA and escalation |

## Reference cases and boundaries

### CoopMorteros

CoopMorteros describes a community photovoltaic park whose participants own a
share of production. Its 2024 sustainability report says the participant share
is calculated at the monthly billing close and credited to the participant's
account using current prices; it also describes transfer to another user or
conversion to a liquid credit when production exceeds consumption. Those
statements support the allocation and credit stages, but they do not disclose
the meter export, tariff formula, account schema, or reconciliation checklist.

The cooperative publicly separates general customer support from billing
claims, which supports treating disputes as a distinct final stage rather than
silently changing a posting.

### Espartillar

Public reporting describes Espartillar's Parque Solar II as a community-
investment model where members can subscribe to 1 kW. That establishes a
public reference for participant subscription and community investment. It does
not establish how the cooperative calculates, allocates, posts, or disputes
monthly credits. Those parts of the table remain `needs-interview` rather than
being copied from CoopMorteros.

### Regulatory boundary

Argentina's Resolution 608/2023 describes community and virtual-community
user-generators and requires the community contract to state each participant's
percentage so injection-related credits can be distributed. This workflow uses
that as a statutory control point. It does not assume that either reference
case uses a blockchain ledger, and it does not infer a particular settlement or
tax treatment from the regulation.

## Manual-work candidates

- Exporting or receiving the plant meter report.
- Checking units, missing intervals, corrections, and period boundaries.
- Maintaining the participant/supply-point padron.
- Reviewing allocation totals and rounding exceptions.
- Approving transfers, cash-credit treatment, or late corrections.
- Matching a credit batch to invoices and handling already-issued invoices.
- Investigating member disputes and recording the resolution.

## Artifacts still needed

The following should be requested from the cooperative before this workflow is
treated as an operational specification:

- A redacted month-end generation/meter export (CSV or XLSX), including units,
  interval or period timestamps, plant/meter identifier, and correction fields.
- The participant padron (CSV or XLSX): member, supply point/account,
  subscribed share or kW, effective dates, and transfer status.
- A redacted invoice showing where a generation credit appears.
- The calculation workbook or billing report that reconciles plant generation
  to participant allocations.
- The current tariff/valuation rule and an example of rounding treatment.
- A credit-posting/export report tying each credit to a member and close period.
- A dispute/claims example showing evidence, owner, response deadline, and
  correction authority.
- For Espartillar specifically, the subscription agreement and any public or
  internal monthly allocation/credit procedure.

## Public sources

- [CoopMorteros 2024 sustainability report](https://coopmorteros.com/public/document/Rep_CoopMorteros_2024.pdf)
  — community park, monthly billing-close calculation, account credits, and
  transfer/liquid-credit description.
- [CoopMorteros procedures](https://coopmorteros.com/tramites) — public
  service and account requirements.
- [CoopMorteros contact and billing-claims channels](https://www.coopmorteros.com/contacto)
  — customer support and billing-claim separation.
- [Espartillar Parque Solar II report](https://www.convergencia.com/a-diario-convergencia/la-cooperativa-electrica-de-espartillar-inauguro-el-parque-solar-ii-bajo-un-modelo-de-inversion-comunitaria-6007/)
  — public description of community investment and 1 kW subscriptions.
- [Argentina Resolution 608/2023](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-608-2023-386988/texto)
  — statutory community-generation and participant-percentage requirements.
