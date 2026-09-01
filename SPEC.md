# ClausePilot specification

## Proof obligation

For one bounded commercial obligation, agreement version, counterparty and sealed checkpoint window, determine whether approved public evidence sufficiently supports `SATISFIED`, `AT_RISK`, `BREACHED` or `UNRESOLVED`.

ClausePilot does not determine legal liability, damages, enforceability or facts outside the approved public source. A missing source is `UNRESOLVED`, never a fabricated breach.

## Architecture

The agreement owner registers an agreement digest and counterparty. The named counterparty must accept that exact record before the owner can add obligations with an authority origin, evidence URL, object marker, cadence and observation window. Anyone may open a due checkpoint. Validators independently fetch the same authorized URL and independently judge the bounded semantic relation. Deterministic code enforces agreement version, checkpoint uniqueness, source origin, schedule, schema consistency and append-only standing.

## State model

- Agreement: active or inactive; immutable registered version in MVP.
- Obligation: active/inactive, due sequence, current standing and latest assessed checkpoint.
- Checkpoint: `OPEN`, `ASSESSED` or `UNRESOLVED`.
- Semantic standing: `SATISFIED`, `AT_RISK`, `BREACHED`, `UNRESOLVED`.

Only a result with `scope_relation=MATCH` and `coverage=SUFFICIENT` can create a non-unresolved standing. `BREACHED` additionally requires at least one positive material fact.

## Intentional limitations

- One approved public source per obligation in MVP.
- External keepers open due checkpoints; the contract does not claim autonomous scheduling.
- No escrow, payouts, private PDF storage, arbitrary URL crawling or automatic enforcement.
- Vendor publications prove what the vendor published, not universal objective truth.
