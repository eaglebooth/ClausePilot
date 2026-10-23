# Changelog

## 2026-10-23 — V4 constrained operations web release

- Existing V4 StudioNet contract retained; no redeployment or contract-source change.
- Added pending-hash persistence, read-only receipt reconciliation, explicit
  consensus/rejection diagnostics and unresolved-submission guards.
- Timing and recovery guidance use synchronized chain time; nonterminal checkpoint
  final state is no longer presented as a finalized outcome.
- Added source-result inspection, wallet-free public examples and `/evidence`.
- Paused assessment/adjudication in the web application and its write service;
  documented the live consensus limitation instead of claiming a completed jury.
- Added regression coverage for finality diagnostics, deadline boundaries,
  guarded methods, hash validation and pending-storage behavior.

See [milestone scope and reviewer path](docs/MILESTONE_V4_SAFE_OPERATIONS.md).
