# ClausePilot V4 — Bounded Recovery and Bilateral Policy Revisions

Prepared: October 22, 2026.
Status: implementation locally verified; user deployment required.

## Comparison boundary

Previous shipped V3 snapshot:
[`1e098b306edb191c667ae3dd7991d6cb58066c96`](https://github.com/eaglebooth/ClausePilot/commit/1e098b306edb191c667ae3dd7991d6cb58066c96).
This is a technical release baseline, not an assertion about the Portal's rewarded
commit. Confirm the rewarded snapshot before submitting an immutable comparison.

## Before and after

V3 allowed a checkpoint awaiting assessment or challenge consensus to retain its
in-flight lock indefinitely. An owner could also deactivate an obligation while
its checkpoint was still in progress. Source-policy changes had no explicit
parent/successor consent lifecycle.

V4 introduces deterministic timeouts and a bilateral replacement-policy protocol.

- Assessment deadline: sealed observation end plus one hour.
- Adjudication deadline: challenge submission plus one hour.
- After the applicable deadline anyone can expire a stalled OPEN or CHALLENGED
  checkpoint to FINALIZED/UNRESOLVED. This clears its lock without AI, web access,
  a fabricated breach, or inherited provisional compliance.
- Assessment/adjudication can execute at the exact deadline; expiration requires
  strictly later chain time. Late AI attempts reject before fetching evidence.
- Owner closure is blocked while any checkpoint remains in flight.
- The owner proposes a complete replacement policy; the counterparty accepts
  its exact digest. Either party can cancel a pending revision.
- Revision digest includes the new policy, parent ID, parent digest and revision
  number. Fixed recovery rules are also committed in the underlying policy digest.
- Acceptance requires an idle active parent, atomically retires it and activates
  one linked successor. Competing proposals become stale. New schedules start
  at acceptance, with UNRESOLVED standing and no inherited compliance finding.
- Parent policies and checkpoint evidence remain unchanged and readable.
- Challenge prompts now explicitly bind kind, title, policy revision, agreement
  version and sealed observation timestamps.

## User workflow

The upgraded monitor verifies the V4 schema before enabling writes. It reads
timeout eligibility using contract time, displays the processing deadline, and
provides deterministic recovery. The policy builder can propose a replacement;
the revision panel loads both full policies, displays their differences and
digest, and enables counterparty acceptance only when the parent is idle.
Authoritative read failures clear loaded state and disable writes.

## Verification

- 62 Python tests pass, including mocked contract-runtime transitions and the
  existing semantic decision/static tests.
- 8 Node receipt/finality tests pass.
- GenVM lint and semantic validation pass: 21 methods, 7 view and 14 write.
- ESLint and the Next.js production build pass.
- Independent source review found two correctness issues; both were fixed and
  re-reviewed. No remaining Important/Critical source-level blocker was reported.

These results do not claim live V4 execution or a third-party security audit.

## Fresh deployment gate

Deploy `contracts/ClausePilot.py` to StudioNet with no constructor arguments.
The expected schema is version 4, `recovery-revisions-v1`, with both grace values
equal to 3600 seconds. Then run:

```powershell
node scripts/verify-v4-deployment.mjs <new-address>
```

The check must confirm exact byte-for-byte source parity and the expected schema.
Next verify a two-wallet normal lifecycle, timeout recovery, wrong-role/digest
rejection, competing revisions and accepted successor monitoring. Timeout proof
requires actual elapsed network time. Record direct Explorer transaction links
and post-state reads before moving production to V4.

V3 remains the production deployment until this gate is complete.
