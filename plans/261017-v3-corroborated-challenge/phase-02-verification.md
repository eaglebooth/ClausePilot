# Phase 2 — Tests and adversarial verification

Status: LOCAL GATES COMPLETE — STUDIONET PENDING
Priority: CRITICAL

## Baseline

- Python: 23 passing at `831b447`.
- Node helpers: existing 8 tests; sandbox runner needs unrestricted child spawn.

## Required coverage

- Happy paths: corroborated `SATISFIED`, `AT_RISK`, and `BREACHED`.
- Threshold failure and mutually conflicting sources fail closed.
- One unavailable source below threshold; enough remaining sources can proceed.
- All sources unavailable results in `UNRESOLVED`.
- Duplicate URL/origin policy, invalid threshold, oversized policy, bad marker.
- Terms digest sensitivity for every source/policy/challenge field.
- Outsider challenge, owner challenge, duplicate challenge, late challenge.
- Challenge source outside accepted origin; digest mismatch; prompt injection.
- `UPHOLD`, `REVISE`, and `UNRESOLVED` challenge decisions.
- Premature finalization, double finalization, jury replay, stale agreement.
- Hallucinated source ID/citation and malformed model output fail closed.
- Property matrix across source outcomes and thresholds.
- Backward claim audit: V3 frontend refuses V2 schema/address.

## Gate

Target at least 45 meaningful Python tests plus Node helper tests, GenVM lint,
ESLint, TypeScript, production build, and clean diff. Counts are evidence only;
behavioral assertions and state readbacks are mandatory.
