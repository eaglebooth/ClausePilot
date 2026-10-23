# V4 constrained web release — Recovery, Revisions and Failure-Aware Operations

Date: October 23, 2026.

## Submission scope

This milestone delivers bounded recovery and bilateral policy revisions, with a
failure-aware web interface on the already deployed V4 contract. No further
contract deployment or source change is part of this frontend completion.
The AI assessment/adjudication path is **not** claimed complete or reliably
verified. Those two web write methods are intentionally paused at both the UI
and shared write-service boundary; the immutable contract still exposes them.
The site therefore ships a constrained operations release, not unrestricted V4.

## Immutable comparison boundaries

- Previous technical V3 release:
  [`1e098b306edb191c667ae3dd7991d6cb58066c96`](https://github.com/eaglebooth/ClausePilot/commit/1e098b306edb191c667ae3dd7991d6cb58066c96).
- V4 contract and live evidence snapshot:
  [`28f647fa3205a9a97cda7effcdb68215e2db8ecf`](https://github.com/eaglebooth/ClausePilot/commit/28f647fa3205a9a97cda7effcdb68215e2db8ecf).
- [V3 → V4 evidence comparison](https://github.com/eaglebooth/ClausePilot/compare/1e098b306edb191c667ae3dd7991d6cb58066c96...28f647fa3205a9a97cda7effcdb68215e2db8ecf).

These are technical source snapshots, not an assertion about the Portal's last
rewarded commit. If that rewarded snapshot differs, the owner must provide its
exact SHA when submitting; a deployment address does not identify it.
The final web-release commit and compare link accompany the submission separately.

## Material contract changes already deployed

V3 had no bounded escape from a stalled assessment/adjudication lock and no
parent/successor replacement-policy protocol. V4 adds one-hour deadlines,
permissionless expiry to FINALIZED/UNRESOLVED, late-AI rejection, in-flight closure
guards and exact-digest counterparty acceptance of full replacement policies.
Accepting a revision retires an idle parent and activates one successor with
fresh schedule and UNRESOLVED standing; competing candidates become stale.
Historical policies and checkpoints remain readable.

These controls were exercised on the existing
[StudioNet contract](https://explorer-studio.genlayer.com/address/0xb5E3D9F50e40CB599629048dE1f58427e5c49DfD).
Source SHA-256 remains
`590d0682d33bdb057feddd31a7cc8a03a01cb5df6a4c24fbd5acdb6b9e0f9e85`.

## Web improvements in this completion

- Explicit limited-release notice and paused AI actions, enforced in the shared
  write service as well as disabled controls; no automatic write retries.
- Submitted hashes saved immediately in browser storage where available. Further
  web writes are guarded while a saved transaction remains unresolved. A memory
  fallback protects the current tab if storage is denied. This is not a global
  cross-browser transaction lock, nor recovery of an RPC failure before a hash
  is returned; wallet history must be checked in that case.
- Wallet-free, read-only receipt inspection checks contract destination and
  finalized consensus/execution. Only a finalized matching transaction clears
  its pending guard. Successful execution still requires contract state readback.
- Error messages expose the actual finalized consensus label or contract rejection
  without leaking raw validator receipts. Failed submissions clear loaded state
  and require resynchronization rather than leaving optimistic controls enabled.
- Observation and challenge timing derived from the synchronized contract clock,
  not the device clock. Strict recovery eligibility is shown with a clear next
  action; chain time is explicitly a snapshot, refreshed through Sync.
- Final standing labeled NOT FINALIZED until the checkpoint is terminal; sealed
  source verdicts and hashes are inspectable.
- Wallet-free examples and an evidence page give reviewers an exact path to
  reproduce verified readbacks and inspect success, rejection and failure hashes.

## Verification and limitations

See [live evidence](V4_CLOSED_LIVE_EVIDENCE.md) and its linked public JSON report.
The successor reached SATISFIED/UNCHALLENGED. A later assessment finalized
MAJORITY_DISAGREE; the leader packet contained INVALID_MODEL_OUTPUT for both
sources. After actual timeout, recovery finalized UNRESOLVED and cleared the lock.
The exact invalid model fields were not established; do not describe them as fixed.

The five-minute challenge test expired during consensus and correctly rolled back.
A one-hour challenge policy was separately consented, but its assessment did not
reach successful consensus. No successful live jury adjudication is claimed.
CHALLENGED-timeout expiry is covered locally, not by a direct live proof here.
Synthetic evidence shares one publisher and is not proof of independent uptime.
No third-party security audit, formal verification or score guarantee is claimed.

The historical full-rollout block in the frozen report remains valid. This
release deliberately narrows the web scope to verified deterministic operations.

Fresh completion checks: 68 Python tests and 16 Node tests pass; ESLint and
Next.js production build pass. A real Chrome smoke test loaded both public live
examples and the accepted revision comparison, inspected a failed-consensus
receipt, rejected an invalid hash, and checked the 390px mobile layout. No wallet,
write RPC or page error occurred. Screenshots:
[recovered state](screenshots/v4-recovered-state.png),
[desktop evidence](screenshots/v4-evidence-desktop.png),
[mobile monitor](screenshots/v4-monitor-mobile.png).

Optional browser QA: set `CLAUSEPILOT_BROWSER_LIB` to the Chrome DevTools skill's
`scripts/lib/browser.js`, optionally `CLAUSEPILOT_CHROME_PATH` to an installed
Chrome binary and `CLAUSEPILOT_WEB_URL` to the site to check. Run
`node scripts/web-safety-smoke.mjs`. The browser test performs public reads only.

## Exact reviewer path

Production verification completed on October 23, 2026:

- Web source commit:
  [`da785731ae342e01f4335b63736224839345295c`](https://github.com/eaglebooth/ClausePilot/commit/da785731ae342e01f4335b63736224839345295c).
- [Immutable V3 technical baseline → web release comparison](https://github.com/eaglebooth/ClausePilot/compare/1e098b306edb191c667ae3dd7991d6cb58066c96...da785731ae342e01f4335b63736224839345295c).
- [Production deployment](https://clausepilot-lbujvo82s-eaglebooth197-5212s-projects.vercel.app),
  aliased to [clausepilot-seven.vercel.app](https://clausepilot-seven.vercel.app).
- The full read-only Chrome smoke test passed on the public production alias,
  including accepted revision comparison and MAJORITY_DISAGREE receipt inspection.
  No wallet, write RPC, browser page error or mobile horizontal overflow occurred.
- Deployment parity was rechecked: version/schema valid, 42,755 bytes, matching
  SHA-256 `590d0682d33bdb057feddd31a7cc8a03a01cb5df6a4c24fbd5acdb6b9e0f9e85`.
  `.gitattributes` pins LF for the contract to prevent Windows checkout line-ending
  conversion from creating false raw-byte mismatches. Contract content/blob and
  deployed code remain unchanged by the web completion.

1. Open [the evidence page](https://clausepilot-seven.vercel.app/evidence).
2. Open Monitor; do not connect a wallet for inspection.
3. Click **Load finalized successor**. Confirm obligation 2/checkpoint 1 is
   FINALIZED, SATISFIED, UNCHALLENGED; inspect two sealed source hashes.
4. Click **Load recovered timeout**. Confirm obligation 5/checkpoint 3 is
   FINALIZED, UNRESOLVED, ASSESSMENT_TIMEOUT. It must not offer another expiry.
5. Load revision candidate 2 in the comparison panel. Inspect parent 1, revision 1,
   ACCEPTED state, exact digest, and immutable parent/new policy comparison.
6. Paste a linked transaction into Transaction safety desk; inspect a successful
   receipt, wrong-digest rollback, and failed assessment consensus. No step writes.
7. New deterministic writes require the appropriate wallet and fresh consent.
   Do not repeat terminal demonstration actions; no test wallet keys are provided.

## Suggested submission text (under 1,000 characters)

Title: Bounded Recovery, Bilateral Policy Revisions & Failure-Aware Operations

Changes & Improvements:

Added one-hour checkpoint recovery and exact-digest bilateral policy revisions:
idle parents retire atomically, successors start fresh, and history remains
readable. Live checks cover wrong-role/digest, competing revisions, replay and
in-flight closure guards. A successor finalized SATISFIED; a later assessment
disagreed and was recovered to UNRESOLVED after timeout. The completed web UI
adds saved transaction hashes, read-only receipt inspection, chain-time deadline
guidance, sealed evidence readback and wallet-free reviewer examples. AI
assessment/adjudication writes are explicitly paused because repeated consensus
is not yet reliable; no completed live jury is claimed. Uses the existing V4
deployment without another contract redeploy. Immutable source comparisons and
linked Explorer receipts document both successful controls and remaining limits.
