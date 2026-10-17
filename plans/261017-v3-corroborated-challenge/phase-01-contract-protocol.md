# Phase 1 — Contract protocol

Status: COMPLETE
Priority: CRITICAL

## Contract changes

- Modify `contracts/ClausePilot.py`.
- Add bounded source-policy storage keyed by obligation/source index.
- Extend `Obligation` with source count, corroboration threshold, challenge
  origin, and challenge duration.
- Extend `Checkpoint` with provisional state, challenge deadline/status,
  challenge snapshot, finalization status, and final standing.
- Replace single-source `add_obligation` arguments with canonical JSON source
  policy. Validate 2–4 unique HTTPS origins/URLs and threshold bounds.
- Include canonical source policy, threshold, challenge origin, and duration in
  `terms_digest`; require the existing explicit counterparty acceptance.
- `assess_checkpoint`: independently fetch each configured source under bounded
  nondeterminism, verify markers, hash raw bytes, classify each source, and
  aggregate only validated closed outputs into a provisional finding.
- `submit_challenge`: counterparty-only, one use, within deadline, authorized
  origin, URL and digest/marker permanently sealed before adjudication.
- `adjudicate_challenge`: compare the immutable original source packet and
  counter-evidence; output closed `UPHOLD | REVISE | UNRESOLVED` plus bounded
  final standing.
- `finalize_checkpoint`: deterministic and replay-safe. Finalize unchallenged
  findings only after deadline; challenged findings only after adjudication.
- Add views for source policy and challenge/finalization state. Bump schema to V3.

## Closed consensus surfaces

Per source: `MATCH|MISMATCH|UNKNOWN`, `SUFFICIENT|INSUFFICIENT`, and
`SATISFIED|AT_RISK|BREACHED|UNRESOLVED`.

Challenge: `UPHOLD|REVISE|UNRESOLVED` and a standing from the existing closed
vocabulary. Contract rejects invented source IDs, missing hashes, contradictory
field combinations, and any output outside the supplied candidate set.

## Success criteria

- All storage growth and loops bounded.
- Consent digest changes for every consequential policy field.
- Provisional output cannot update obligation standing.
- Terminal checkpoint cannot be replayed or challenged.
- Existing V2 source remains documented as superseded, not mutated in claims.
