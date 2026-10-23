# ClausePilot

V4 constrained web release: bounded checkpoint recovery, bilateral policy
revisions and failure-aware operations on the existing contract. **AI assessment
and adjudication writes are paused in the web UI and shared write service**
because repeated consensus is not yet reliable. This is not a full AI-jury rollout.
See [submission and reviewer guide](docs/MILESTONE_V4_SAFE_OPERATIONS.md),
[live evidence](docs/V4_CLOSED_LIVE_EVIDENCE.md) and
[V4 contract notes](docs/MILESTONE_V4_RECOVERY_REVISIONS.md).

ClausePilot is a GenLayer temporal commercial assurance primitive. V3 binds a
bounded obligation to 2–4 approved public sources, a corroboration threshold,
counterparty challenge policy and sealed checkpoint schedule. Validators
interpret evidence; deterministic code controls consent, provenance, deadlines,
replay protection and final standing.

The constrained V4 web release targets the existing StudioNet deployment
[`0xb5E3...9DfD`](https://explorer-studio.genlayer.com/address/0xb5E3D9F50e40CB599629048dE1f58427e5c49DfD)
at [clausepilot-seven.vercel.app](https://clausepilot-seven.vercel.app).
The [evidence page](https://clausepilot-seven.vercel.app/evidence) provides a
wallet-free reviewer path. Historical V3 address
`0x0350c736033bE5b0e66a15512475D12d573412A4` and older deployments remain
documented as technical comparisons, not the current web target.

## Why GenLayer

External publications often express incidents, certification scope and operational status in unstructured language. The consequential semantic question cannot be reduced to a stable numeric oracle, while source authority, timestamps and lifecycle remain deterministic contract rules.

## Safe MVP boundary

- Monitoring registry, not a dispute court.
- No custody or automatic damages.
- No autonomous scheduler claim; a keeper opens due checkpoints.
- Missing, conflicting or below-threshold evidence is `UNRESOLVED`.
- Provisional AI output cannot update standing; finalization is separate.
- No confidential agreement document is stored on-chain.

## Local verification

```powershell
python -m pytest -q
$env:PYTHONUTF8='1'
genvm-lint check contracts\ClausePilot.py
npm ci
npm test
npm run lint
npm run build
```

## Configuration

Copy `.env.example` to `.env.local`. It points to the reviewed existing V4
StudioNet contract; no further deployment is needed for this web completion.
The frontend requires version 4, consent schema `recovery-revisions-v1` and
consensus schema `closed-evidence-v1`. There is no historical-address fallback.

## Public methods

Writes: `register_agreement`, `accept_agreement`, `add_obligation`,
`accept_obligation`, `open_due_checkpoint`, `assess_checkpoint`,
`submit_challenge`, `adjudicate_challenge`, `finalize_checkpoint`,
`close_obligation`, `expire_checkpoint`, `propose_revision`, `accept_revision`,
`cancel_revision`. The deployed ABI retains both AI methods; the web release
blocks `assess_checkpoint` and `adjudicate_challenge` rather than claiming they
were removed from the contract.

Views: `get_contract_version`, `get_agreement`, `get_obligation`,
`get_checkpoint`, `get_totals`, `get_policy_lifecycle`, `get_recovery_state`.
The upgraded frontend requires the V4 schema handshake before enabling writes.

See [SPEC.md](SPEC.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for exact claims and limitations.

V3 source parity, finalized lifecycle transactions, sealed evidence digests and
authoritative readbacks are recorded in
[docs/V3_LIVE_EVIDENCE.md](docs/V3_LIVE_EVIDENCE.md). The immutable milestone
comparison is in
[docs/MILESTONE_V3_CORROBORATED_CHALLENGE.md](docs/MILESTONE_V3_CORROBORATED_CHALLENGE.md).
Historical V2 and V1 evidence remain available for comparison and are explicitly
superseded.
