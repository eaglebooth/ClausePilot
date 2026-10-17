# Milestone V3 — Corroborated Evidence & Counterparty Challenge

## Immutable comparison

- Reviewed V2 base: [`831b447`](https://github.com/eaglebooth/ClausePilot/commit/831b4473a4b7ba6e1e6b3c24e1ed92e2a0dab8ad)
- Core V3 commit: [`1c8fab9`](https://github.com/eaglebooth/ClausePilot/commit/1c8fab9)
- Immutable comparison: [`831b447...1c8fab9`](https://github.com/eaglebooth/ClausePilot/compare/831b447...1c8fab9)

## Before

V2 assessed one owner-selected public source and immediately updated obligation
standing. Counterparty consent bound the source policy, but there was no way to
answer a later publication with counter-evidence.

## After

V3 binds 2–4 exact sources, a corroboration threshold, challenge origin/window
and schedule into counterparty consent. Assessment produces a provisional
finding only. The counterparty may seal one raw-byte-digest-bound challenge.
Challenge adjudication uses a closed verdict; deterministic finalization alone
updates standing.

## Why GenLayer

Natural-language publications can support, warn about or contradict a commercial
obligation without sharing a stable schema. GenLayer interprets that semantic
relation and resolves bounded counter-evidence. Contract code retains source
membership, thresholds, authorization, deadlines and terminal transitions.

## Safety invariants

- All consequential policy fields are covered by `terms_digest`.
- Only configured source IDs and one consent-bound challenge can be evaluated.
- Provisional/adjudication output cannot directly change standing.
- Each checkpoint has at most one challenge and one finalization.
- Each obligation has at most one in-flight checkpoint; scheduled windows remain
  anchored to `next_due_at`. A window missed before opening is recorded directly
  as `FINALIZED / UNRESOLVED / MISSED_SCHEDULE`; current evidence is never used
  to infer historical compliance.
- Stored source results contain only consensus-closed fields and raw-byte hashes;
  validator prose is not authoritative state.
- Missing, conflicting, below-threshold or malformed evidence fails closed.
- Source loops are bounded at four.

## Verification before deployment

- 52 Python contract/model/static tests pass.
- 8 Node receipt/finality tests pass.
- GenVM lint and semantic validation pass: 15 methods (5 view, 10 write).
- ESLint and Next.js production build pass.
- `scripts/v3-lifecycle.mjs` provides a two-wallet, finalized-receipt live gate
  with digest mismatch, early assessment and finalization replay controls.

## Deployment status

V3 deployment and live evidence are pending. The public Vercel application and
documented address remain V2 until the final reviewed V3 source completes a
fresh StudioNet lifecycle.
