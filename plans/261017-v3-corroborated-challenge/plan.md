# ClausePilot V3 — Corroborated Evidence & Challenge

Date: 2026-10-17
Status: IMPLEMENTED — PENDING STUDIONET DEPLOYMENT
Immutable base: `831b4473a4b7ba6e1e6b3c24e1ed92e2a0dab8ad`

## Outcome

Replace V2's single owner-selected page with a consent-bound evidence policy of
2–4 sources, then let the named counterparty submit one bounded counter-evidence
source before finalization. GenLayer assesses each source independently and
resolves conflicts under a closed verdict. Deterministic code controls source
membership, deadlines, replay protection, and standing finalization.

## Why this is materially stronger than V2

- V2: one approved page can determine standing.
- V3: no positive standing without a configured corroboration threshold.
- V2: counterparty consents once but cannot answer a later publication.
- V3: counterparty gets a sealed, one-shot challenge window.
- V2: `assess_checkpoint` immediately changes standing.
- V3: assessment creates a provisional finding; finalization occurs only after
  challenge expiry or adjudication.

## Phases

1. [Contract protocol](phase-01-contract-protocol.md) — complete
2. [Tests and adversarial verification](phase-02-verification.md) — local complete
3. [Frontend and public evidence](phase-03-release.md) — frontend complete; live release pending

## Invariants

- Accepted terms digest covers every source policy and threshold.
- Every evaluated URL belongs to the consented source set or the single sealed
  counter-evidence record.
- A checkpoint has at most one provisional finding and one final standing.
- A challenge cannot mutate the original observation or source snapshots.
- `UNAVAILABLE`, insufficient coverage, threshold failure, or invalid jury
  output cannot create `SATISFIED`, `AT_RISK`, or `BREACHED`.
- Only deterministic code changes lifecycle state; AI never selects a URL,
  deadline, threshold, caller, or financial outcome.
- Loops are bounded by `MAX_SOURCES = 4` and one challenge per checkpoint.

## Required redeploy

Yes. Storage layout, public ABI, terms digest, checkpoint lifecycle, and
consensus behavior all change. V2 remains immutable historical evidence.

## Release gate

Fresh Studionet deployment; positive, breach, conflicting, unavailable and
challenge lifecycles; rollback/readback evidence; frontend pinned to V3;
immutable comparison `831b447...<release commit>`; all tests/lint/build pass.

## Unresolved questions

None blocking. Default design: 2–4 owner-proposed sources, threshold 2–4,
counterparty challenge URL must use a separately consented challenge origin,
and challenge period is 5 minutes–7 days.
