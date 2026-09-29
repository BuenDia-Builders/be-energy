# Argentine I-REC(E) / I-TRACK flow (IRAM + Evident) — desk research

> Scope: map the real certification pipeline in Argentina so BeEnergy knows where an
> external preparation tool stops. This document describes the official flow only.
> It does not design any product, and BeEnergy is not described here as an issuer
> or a certificate of any kind.


## Sources read

1. **Evident I-REC Code for Electricity v1.11** (release 10 Oct 2022, 81 pp.) — the normative source. Evident acts as Code Manager and Registry Operator; accredited Issuers deliver local services (§§4.2–4.4). All section numbers below refer to this Code unless noted. `https://www.trackingstandard.org/wp-content/uploads/Evident-I-RECCodeForElectricity-v1.11-2.pdf`
2. **IRAM I-TRACK(E) / I-REC service page (ES)** — IRAM presents itself as "the only recognized and authorized body issuing the certification in the country", with certification validated by the International Tracking Standard Foundation. No procedural detail (forms, evidence rules, timelines) is published on this page.
   `https://www.iram.org.ar/servicio/itrack-irec/`
3. **IRAM I-TRACK(E) / I-REC service page (EN)** — same content in English. `https://www.iram.org.ar/en/servicio/i-track-and-i-recc-en/`
4. **SD-01: Authorised Issuing Countries (Evident subsidiary document)** — referenced by name in the Code (§7.2, §20.3) as the source of country-specific requirements. Searched for but not found published for open access — treated throughout this document as **Not publicly available**, not assumed.

## Confidence convention

- **Documented — Evident Code**: the Code states this explicitly (section cited). Unless noted otherwise per stage, all content below is Documented — Evident Code.
- **Not publicly available**: the Code references the document by name (SD-01 country notes, SD-02 technology notes, CA-03 Issuer Local Working Instructions,
  CA-04 Accepted Evidence, CG-02/UG-03/UG-04 user guides), but its full content is either confidential under Code §20.6, issued directly to accredited parties (Code §20.1), or held by the Issuer. Content is not assumed.

Country note: IRAM (Instituto Argentino de Normalización y Certificación, Perú 552/6, Buenos Aires) was approved as the I-REC Issuer for Argentina in February 2021, per the Tracking Standard Foundation's own announcement (https://www.trackingstandard.org/first-three-plants-registered-by-argentinas-i-rec-issuer-iram/).
The content of `SD-01: Authorised Issuing Countries` (which would list any Argentina-specific conditions) was not found published for open access — **Not publicly available**. Any additional IRAM intake requirements beyond the Code would live in IRAM's LWIs (CA-03) — also **Not publicly available**.

---

## 1. Plant

| Field | Content |
|---|---|
| Actor | Production Facility Owner (Code §4.7: owns a facility eligible for registration). |
| Document / evidence | The physical plant itself and its commissioning facts. Registration "cannot be completed before the Production Facility is substantially complete in engineering terms and capable of electricity generation" (§7.1). |
| System of record | Evident Registry. Core Records include Production Facilities (§2, "Core Records"); all registration activities are recorded within the Registry (Fig. 5, §7.2). |
| Public source | Code §§4.7, 7.1. |

## 2. Eligibility

| Field | Content |
|---|---|
| Actor | Issuer (IRAM in Argentina) determines eligibility; the Registrant must satisfy the Issuer that the facility and its output are eligible (§7.3). |
| Document / evidence | (a) Technology/fuel eligibility per SD-02: Technologies and Fuels — content not publicly available; (b) country authorisation — Argentina is an authorised issuing country (confirmed by IRAM's appointment and registered plants), but SD-01's specific content on any country conditions is not publicly available; (c) no-double-counting declaration — facilities registered in other tracking systems must be disclosed to the Issuer (§7.1), and no I-REC(E) may be issued where another certificate for the same unit of electricity exists (§3.3). |
| System of record | Evident Registry (eligibility outcome is the approved registration); SD-01/SD-02 referenced as standing data (§20.3), content not publicly available. |
| Public source | Code §§3.3, 7.1, 7.3, 7.4, 8.2, 8.3, 13. |
| Confidence | **Documented — Evident Code** for the eligibility rules and process; **Not publicly available** for SD-01/SD-02's actual content (technology list, country-specific conditions). |

## 3. Facility registration

| Field | Content |
|---|---|
| Actor | Registrant submits (owner or its appointee, §§4.5, 7.3); Issuer (IRAM) reviews, verifies, approves and activates (§§7.4, 7.5). Registrant must first have signed Standard Terms ST-02 with the Issuer (§7.1). |
| Document / evidence | SF-02 Production Facility Registration + SF-02A Registrant's Declaration (§7.8) + SF-02C Owner's Declaration where Registrant ≠ Owner (§7.9). Minimum supporting evidence (§7.3): unedited project photos, sample metering evidence, single-line electrical diagram (network entry/exit points, directly connected loads), proof the Registrant owns the energy attributes. Mixed-fuel, storage/import, and label cases need extra methodology/evidence (§7.3). |
| System of record | Evident Registry — the Issuer approves and activates the facility in the Registry and confirms identifiers + first eligible production date (§7.5). Registration expires 5 years from the Effective Registration Date unless the Issuer sets earlier (§7.5). |
| Public source | Code §§7.1–7.9 (process Fig. 5 §7.2; verification §7.4; registration §7.5; boundary §7.6; groups §7.7; declarations §§7.8–7.9). Standard-form names per §20.2 (forms published on Evident's site). |
| Note | IRAM's intake channel (quote form on iram.org.ar) is marketing/contact only — no procedural content. |

## 4. Evidence

| Field | Content |
|---|---|
| Actor | Registrant provides; independent Production Auditor validates; Issuer approves or rejects (§§8.5.5, 8.6–8.7). |
| Document / evidence | Hierarchy of evidence (§8.5.1): (a) electricity-market settlement metering data (preferred); (b) non-settlement metering data, at Issuer discretion; (c) commercial/legal energy-transfer documentation, at Issuer discretion and only if (a)/(b) infeasible; (d) an Evident-and-Issuer-approved measurement system. Categories (c)/(d) need purchaser-or-auditor agreement, non-claimability by others, and a reasonable representation of volume. Examples in CA-04: Accepted Evidence (§8.1). |
| System of record | Evident Registry — "The Issuer will store all documentation related to the issued I-REC(E)s in the Registry" (§8.1). |
| Public source | Code §§8.1, 8.5.1–8.5.5. |
| Confidence | **Documented — Evident Code** for the hierarchy; **Not publicly available** for CA-04's full example list (confidential-appendix class, §20.6). |

## 5. Production data

> Explicit note: **the Code does not separate "evidence" (§4 above) and "production
> data" (this section) as distinct concepts.** Measured production volume *is* the
> direct form of evidence: "direct form, through measurement data … or … indirect
> through the transfer of information from an Approved Tracking Scheme" (§8.1).
> They are kept as two rows here only because the requested stage list names both;
> operationally they are one evidentiary object (metered volume for a Production
> Period) plus its independent validation (§8.5.5).


| Field | Content |
|---|---|
| Actor | Same as §4 (Registrant → Production Auditor → Issuer). |
| Document / evidence | Measured volume, nearest whole kWh where available; net-output methodology where the plant imports/stores energy (§8.5.2, also §7.3); SF-04B Production Group Statement for groups (§8.5.7); SF-04C Fuel Consumption Statement + pro-rata formula for multi-fuel plant (§§8.5.8, 8.7.1); meter-reading alignment pro-rating (§8.5.9); ATS exit data under interface protocols (§8.5.10). Eligible Production Periods (§8.2): ≤ 1 year, single calendar year, within the facility's registration window and owner's declaration, subject to Residual Mix Deadlines (§8.2.1: Jan–Jun → 31 May next year; Jul–Dec → 30 Sep next year). No future periods (§8.2). |
| System of record | Evident Registry (same as §4). |
| Public source | Code §§8.1, 8.2 (incl. 8.2.1), 8.5.2, 8.5.7–8.5.10. |

## 6. Issue request

| Field | Content |
|---|---|
| Actor | Registrant of the facility submits to the Issuer managing it (Fig. 6, §8.4); must nominate the receiving Trade Account. |
| Document / evidence | Completed SF-04 Issue Request + SF-04A Issuing Declaration or Issuer-specified equivalent (§8.6); evidence supplied "in a timely manner" (§8.6). Self-consumption cases name a Self-Consumption Redemption Account and attach consumption-site volume evidence (§8.5.6). |
| System of record | Evident Registry — Draft → Submitted → In-progress states; all activities recorded in the Registry (Fig. 6, §8.4; detail in UG-03 Registrant). |
| Public source | Code §§8.4, 8.6 (incl. 8.5.6 for self-consumption). |
| Confidence | **Documented — Evident Code** at Code level; **Not publicly available** for Registry click-path detail (Registrant/Issuer user guides are confidential per §20.1). |

## 7. Verification

| Field | Content |
|---|---|
| Actor | Issuer reviews every request (§8.7); independent Production Auditor verifies volume (§8.5.5 — settlement operator counts as auditor where settlement data exists); Facility Verifier / Verification Agent for site inspections at registration (§§2, 7.4); Evident/Foundation for quality audits and unannounced control visits (§18). |
| Document / evidence | Settlement reports or auditor verification of measurement data + no-tampering assurance (costs on Registrant, §8.5.5); site-inspection report (normally ≤ half a day, report within 1 week; checklist §7.4); cross-check that volume was not presented to another attribute/carbon system (§8.7); Labelling Authority confirmation for labels (§7.4). |
| System of record | Evident Registry + Issuer-held review records (§§8.7, 18). |
| Public source | Code §§7.4, 8.5.5, 8.7, 18 (esp. 18.3–18.5). |
| Confidence | **Documented — Evident Code**; **Not publicly available** for IRAM's verification checklist/LWIs (CA-03). |

## 8. Issuance

| Field | Content |
|---|---|
| Actor | Issuer (IRAM) issues into the nominated Account (§8.8); Evident as Registry Operator maintains the record (§4.3). |
| Document / evidence | The I-REC(E) record itself: "a verified record of electricity production … Issued in accordance with the Standard" (§2); "a statement of verified historical fact" that cannot cover future activity (§3.3). An I-REC(E) always exists within an Account (§3.3). Service level: normally within one Business Week of a complete request — indicative, non-binding (§8.8.1). IRAM's page describes each certificate as covering 1 MWh of renewable generation (IRAM marketing page; not a Code citation). |
| System of record | Evident Registry — Core Records include issuing events and certificates (§2); bespoke immutable accounting engine with referential integrity and double-entry protocols (§3.4). |
| Public source | Code §§2 (Issuance/Issue Request definitions), 3.3, 3.4, 4.3, 8.8 (incl. 8.8.1). |

## 9. Transfer

| Field | Content |
|---|---|
| Actor | Account Holder of the source Account initiates and completes; no destination confirmation required (§9.3). |
| Document / evidence | Transfer record in the Registry (per UG-04 Participant, §9.3). Ownership rule (§9.2): Trade-Account holdings are deemed owned by that Participant; Marketplace-Account ownership is kept by the Platform Operator; Redemption-Account holdings are deemed owned by the recorded Beneficiary. |
| System of record | Evident Registry — the authoritative record of custody/ownership; Platforms "do not constitute a primary record of custody" (§4.10). Account types and flows: §9.1 (Fig. 7). |
| Public source | Code §§4.10, 9.1–9.3. |

## 10. Redemption

| Field | Content |
|---|---|
| Actor | Source Account Holder redeems; Beneficiary (end-user) is assigned the attributes (§§10.1–10.4). |
| Document / evidence | Redemption = moving the I-REC(E) into a Redemption (or Self-Consumption Redemption) Account, from which it cannot be transferred — irreversible (§10.1). Recorded at redemption (§10.3): Beneficiary, purpose, consumption location, Reporting Period (immutable after processing). **Only Redemption Statements produced within the Registry are valid for disclosure** — "Transaction copies and extracts do not constitute evidence of a Redemption" (§10.6); statements carry QR + verification key. Self-consumption assignment is notified via the issuing process (§10.2/§8.5.6). Certificates are enduring (no expiry), but eligibility for a given reporting purpose may expire (§10.5). |
| System of record | Evident Registry (UG-04 Participant / UG-05 Beneficiary for process detail). |
| Public source | Code §§10.1–10.6. |

---

## BeEnergy boundary — where IRAM/Evident end and a prep tool may start

- The actors that **decide** anything are fixed by the Code: **Issuer (IRAM)** registers facilities and approves Issue Requests (§§7.4–7.5, 8.7–8.8); **Evident** manages the Code and operates the Registry (§§4.2–4.3); **Production Auditors / Verification Agents** provide independent validation (§§7.4, 8.5.5); **Registrants and Participants** are market entities under Standard Terms (§§6, 20.4).
- An external preparation tool may operate outside the official I-REC(E) certification and Registry processes, for example by gathering plant data, assembling SF-02/SF-04 documentation, checking production-period eligibility (§8.2), or tracking internal readiness. It cannot pre-approve, accelerate, or substitute any Issuer, Auditor, Verifier, or Registry decision. Data and documents maintained by such a tool remain external preparation material and do not become I-REC(E) Registry records or Issuer-approved submissions by virtue of being stored there.
- BeEnergy is **not** an Issuer, **not** a certifier, **not** a verifier or auditor, and **not** a Registry/Platform Operator in the I-REC(E) system. Nothing in this repository confers accreditation under the Standard (accreditation: §§3.5, 15–16), and this document must not be read as claiming any such role.

## On-chain / Stellar records are not identified as accepted evidence

- The Code identifies two main evidence routes for issuance: direct measurement data under the §8.5.1 hierarchy (with settlement metering preferred), and indirect evidence through an Approved Tracking Scheme with cancellation in the source system (§§8.1, 8.3, 8.5.10). Both are subject to independent verification (§8.5.5) and Issuer approval (§8.7).
- No on-chain, Stellar, token, or NFT record appears among the evidence channels identified by the Code. Platforms "do not constitute a primary record of custody" (§4.10). This document therefore makes no claim that tokenised representations, Soroban contracts, or BeEnergy-internal ledger records would be accepted as evidence for an Issue Request. They are not part of the official system described above.
- Likewise, only **Registry-produced Redemption Statements** count as disclosure evidence (§10.6) — no third-party extract, dashboard, or chain explorer view qualifies.
