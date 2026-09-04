# ClausePilot Studionet release evidence

Status: **ARCHIVED TEMPLATE**

Historical V1 evidence is documented in [RELEASE_EVIDENCE.md](RELEASE_EVIDENCE.md).
This file is the checklist for the pending V2 deployment and contains no release claims.

## Release identity

- Repository commit: `<full commit>`
- Contract address: `<address>`
- Deployed/local source SHA-256: `<digest>`
- Exact source parity: `<true/false with method>`
- Production frontend: `<URL>`

## Verification commands

Record exact tool versions, commands, pass/fail/skipped counts and warnings.

## Live lifecycle matrix

| Branch | Expected | Transaction links | Authoritative readback |
| --- | --- | --- | --- |
| Satisfied | `SATISFIED` | Pending | Pending |
| Positive contradiction | `BREACHED` | Pending | Pending |
| Unavailable/mismatched source | `UNRESOLVED` | Pending | Pending |
| Retry unresolved | terminal safe result | Pending | Pending |
| Wrong obligation terms digest | `TERMS_DIGEST_MISMATCH` rollback | Pending | Pending |
| Assessment before window end | `OBSERVATION_WINDOW_OPEN` rollback | Pending | Pending |
| Replay/terminal write | rollback/no mutation | Pending | Pending |

Do not replace pending fields or mark submission-ready until the exact final deployment has finalized transactions and matching readbacks.
