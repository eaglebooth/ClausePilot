# ClausePilot V4 — Bounded Recovery and Bilateral Policy Revisions

Date: 2026-10-22
Status: implemented and locally verified; fresh deployment and live proof pending
Comparison baseline candidate: 1e098b306edb191c667ae3dd7991d6cb58066c96.
The rewarded baseline must be confirmed from the Portal before submission.

## Value

V3 can leave an OPEN or CHALLENGED checkpoint blocking an obligation forever
when nondeterministic consensus cannot complete. Closing an obligation currently
deactivates it even with a live checkpoint. Changing a publication URL requires
an unrelated obligation without an explicit succession record.

V4 adds a bounded route back to monitoring and an auditable bilateral policy
revision. No timeout infers compliance or breach. Existing evidence stays bound
to its original policy and cannot be reinterpreted under replacement terms.

## Contract design

1. Bind fixed one-hour assessment and adjudication grace periods into the terms
   digest. Fixed values bound processing and simplify consent and verification.
2. Seal assessment deadline at checkpoint creation; seal adjudication deadline
   when a challenge is submitted. Store these timestamps in each checkpoint.
3. Add permissionless `expire_checkpoint(id)` after the relevant deadline.
   OPEN or CHALLENGED becomes FINALIZED/UNRESOLVED with a closed timeout reason.
   Clear only that checkpoint's in-flight marker and update standing exactly once.
   At the exact deadline assessment/adjudication is allowed; expiry requires `now > deadline`.
4. Reject assessment/adjudication after their deadline, before web fetch or AI.
   PROVISIONAL keeps its existing challenge/finalization path. RESOLVED keeps its
   existing finalization path. Terminal records cannot expire or change again.
5. Reject unilateral closure while a checkpoint is live. Closing an idle
   obligation preserves historical records and blocks future checkpoints.
6. Add immutable revision records: parent obligation, revision number, proposed
   complete policy, digest, proposer, status and successor obligation ID.
   The owner proposes; the counterparty accepts the exact digest. Either party
   may cancel a pending proposal. A candidate obligation is the revision record.
   Acceptance requires active agreement and parent, no in-flight checkpoint and
   unchanged parent revision. Atomically retire the parent and activate a linked
   successor with a fresh schedule and UNRESOLVED standing. Historical findings
   are not inherited as findings for the new policy.
7. Proposal does not pause monitoring. If a checkpoint opens, revision acceptance
   waits until it reaches a terminal state. Competing proposals become stale after
   one successor is accepted. Repeated acceptance cannot create another successor.
8. Provide bounded revision read methods; do not iterate unbounded history.
9. Fix challenge prompt context to include title, kind, agreement version, policy
   revision and sealed observation timestamps explicitly.
10. Publish a V4 schema handshake so the V3 deployment cannot receive V4 writes.

## Frontend

Show authoritative deadlines, timeout eligibility and recovery reason. Offer
expiry only for eligible OPEN/CHALLENGED records. Show revision proposal and
complete policy diff, exact digest consent, pending/accepted/stale status and
parent/successor links. Derive buttons from loaded state and connected role;
reconcile every finalized write with contract readback.

## Verification and release gate

- Contract runtime tests: boundary timestamps, repeated expiry, no AI during
  expiry or late assessment, challenge timeout, marker ownership and stale IDs.
- Revision tests: wrong party/digest, pending checkpoint, competing proposals,
  proposal cancellation, retired parents, immutable historical policy and replay.
- State sequences: recover -> next due checkpoint -> finalize; propose -> monitor
  -> finalize -> accept revision -> new policy checkpoint.
- GenVM validation, Python suite, frontend tests, lint and production build.
- Independent review of state transitions and storage before deployment.
- User deploys fresh contract; verify on-chain source and schema parity.
- Two-wallet Studionet proof of normal lifecycle, timeout recovery and revision
  consent. Keep local/model results distinct from actual network evidence.
- Update production address only after live verification; commit, push, deploy
  and record immutable comparison plus Explorer transaction links.

## Pending decisions

Use fixed one-hour grace periods for real operation;
live timeout proof consequently requires elapsed network time. No custody or
automatic payments are introduced. No deployment has been performed for V4.
