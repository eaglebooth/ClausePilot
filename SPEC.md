# ClausePilot specification

## Proof obligation

For one bounded commercial obligation, determine whether a consented set of
public sources meets a corroboration threshold for `SATISFIED`, `AT_RISK`,
`BREACHED` or `UNRESOLVED`, then allow one bounded counterparty challenge before
the finding becomes final.

ClausePilot does not determine legal liability, damages, enforceability or facts outside the approved public source. A missing source is `UNRESOLVED`, never a fabricated breach.

## Architecture

The owner proposes 2–4 exact sources, threshold, challenge origin/window and
schedule. All consequential fields enter `terms_digest`; the counterparty must
accept it before monitoring. After the observation window, validators fetch and
classify every configured source. A consistent threshold produces only a
provisional finding. The counterparty may seal one digest-bound counter-evidence
page before expiry. A challenged finding is adjudicated under a closed result;
unchallenged or resolved findings require a separate deterministic finalization
before obligation standing changes.

## State model

- Agreement: active or inactive; immutable registered version in MVP.
- Obligation: immutable terms digest, counterparty acceptance timestamp, active/inactive status, due sequence, current standing and latest assessed checkpoint.
- Checkpoint: `OPEN`, `PROVISIONAL`, `CHALLENGED`, `RESOLVED`, `FINALIZED`.
- Semantic standing: `SATISFIED`, `AT_RISK`, `BREACHED`, `UNRESOLVED`.

Only consistent results with `scope_relation=MATCH`, `coverage=SUFFICIENT` and
the consented threshold can create a non-unresolved provisional standing.
`BREACHED` additionally requires a positive material fact. Only
`finalize_checkpoint` changes obligation standing.

## Intentional limitations

- Two to four public sources; this is corroboration, not proof of objective truth.
- One bounded challenge per checkpoint; no multi-round appeal court.
- External keepers open due checkpoints; the contract does not claim autonomous scheduling.
- No escrow, payouts, private PDF storage, arbitrary URL crawling or automatic enforcement.
- Vendor publications prove what the vendor published, not universal objective truth.
