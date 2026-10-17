# Phase 3 — Frontend and public evidence

Status: FRONTEND COMPLETE — DEPLOYMENT PENDING
Priority: HIGH

## Frontend

- Update `lib/genlayer.ts` schema handshake to V3 and pin the new deployment.
- Extend `/monitor` with source-policy builder, threshold explanation,
  provisional/final state separation, challenge countdown, counter-evidence
  submission, adjudication, finalization, and authoritative readback.
- Never infer success from transaction submission; retain finalized receipt and
  contract readback checks.

## Documentation

- Update README, SPEC, threat model and changelog/release notes.
- Create `docs/MILESTONE_V3_CORROBORATED_CHALLENGE.md` with before/after,
  consensus boundary, invariants, exact compare base, migration note and limits.
- Create a machine-readable live report plus direct Explorer links for every
  write transaction.

## Studionet proof

- Deploy exact reviewed source and verify source parity.
- Use at least owner and counterparty wallets.
- Prove unchallenged corroborated finalization.
- Prove challenged revision or uphold path.
- Prove conflict/unavailable fail-closed path.
- Prove premature, unauthorized, duplicate and replay rejections leave state
  unchanged.
- Update Vercel only after the final address and lifecycle pass.

## Final submission evidence

- Immutable GitHub compare from `831b447`.
- Core feature and security-fix commits.
- Milestone document and live transaction report.
- Final contract Explorer and production frontend.
