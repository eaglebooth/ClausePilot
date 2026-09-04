# ClausePilot

ClausePilot is a GenLayer temporal commercial assurance primitive. It binds a bounded obligation to an agreement version, counterparty, approved public source and sealed checkpoint schedule. The counterparty separately accepts an immutable digest of the exact obligation, evidence policy and schedule before monitoring begins. Validators independently fetch and interpret evidence; deterministic code controls consent, provenance, lifecycle and standing updates.

Historical V1 demo: [clausepilot-seven.vercel.app](https://clausepilot-seven.vercel.app) · [V1 monitor](https://clausepilot-seven.vercel.app/monitor). The remediated frontend must be configured with a fresh contract address and redeployed before resubmission.

## Why GenLayer

External publications often express incidents, certification scope and operational status in unstructured language. The consequential semantic question cannot be reduced to a stable numeric oracle, while source authority, timestamps and lifecycle remain deterministic contract rules.

## Safe MVP boundary

- Monitoring registry, not a dispute court.
- No custody or automatic damages.
- No autonomous scheduler claim; a keeper opens due checkpoints.
- Missing or inadequate evidence is `UNRESOLVED`, not `BREACHED`.
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

Writes: `register_agreement`, `accept_agreement`, `add_obligation`, `accept_obligation`, `open_due_checkpoint`, `assess_checkpoint`, `close_obligation`.

Views: `get_contract_version`, `get_agreement`, `get_obligation`, `get_checkpoint`, `get_totals`. The frontend requires the V2 schema handshake before enabling writes.

See [SPEC.md](SPEC.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for exact claims and limitations.

Pre-deployment checks and public fixture digests are recorded in
[docs/PREDEPLOY_VERIFICATION.md](docs/PREDEPLOY_VERIFICATION.md). The final
StudioNet address, successful lifecycle chains, adversarial rollbacks and
authoritative readbacks are recorded in
[docs/RELEASE_EVIDENCE.md](docs/RELEASE_EVIDENCE.md).
