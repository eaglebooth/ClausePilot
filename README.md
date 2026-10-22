# ClausePilot

V4 implementation is ready for a fresh deployment: bounded checkpoint recovery
and bilateral policy revisions. See
[V4 milestone notes](docs/MILESTONE_V4_RECOVERY_REVISIONS.md) and
[deployment checklist](docs/V4_DEPLOYMENT_CHECKLIST.md). Production remains V3
until the new contract completes source/schema verification and live tests.

ClausePilot is a GenLayer temporal commercial assurance primitive. V3 binds a
bounded obligation to 2–4 approved public sources, a corroboration threshold,
counterparty challenge policy and sealed checkpoint schedule. Validators
interpret evidence; deterministic code controls consent, provenance, deadlines,
replay protection and final standing.

V3 is live on StudioNet at
[`0x0350...12A4`](https://explorer-studio.genlayer.com/address/0x0350c736033bE5b0e66a15512475D12d573412A4)
and is served by [clausepilot-seven.vercel.app](https://clausepilot-seven.vercel.app).
The historical V2 deployment remains documented for comparison only.

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

Copy `.env.example` to `.env.local` after deploying the remediated source, then replace the zero address with that fresh address. The repository intentionally has no historical contract fallback, so the updated frontend cannot silently write its new ABI to the superseded V1 deployment.

## Public methods

Writes: `register_agreement`, `accept_agreement`, `add_obligation`,
`accept_obligation`, `open_due_checkpoint`, `assess_checkpoint`,
`submit_challenge`, `adjudicate_challenge`, `finalize_checkpoint`,
`close_obligation`.

Views: `get_contract_version`, `get_agreement`, `get_obligation`,
`get_checkpoint`, `get_totals`. The upgraded frontend requires the V3 schema
handshake before enabling writes.

See [SPEC.md](SPEC.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for exact claims and limitations.

V3 source parity, finalized lifecycle transactions, sealed evidence digests and
authoritative readbacks are recorded in
[docs/V3_LIVE_EVIDENCE.md](docs/V3_LIVE_EVIDENCE.md). The immutable milestone
comparison is in
[docs/MILESTONE_V3_CORROBORATED_CHALLENGE.md](docs/MILESTONE_V3_CORROBORATED_CHALLENGE.md).
Historical V2 and V1 evidence remain available for comparison and are explicitly
superseded.
