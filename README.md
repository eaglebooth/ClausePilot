# ClausePilot

ClausePilot is a GenLayer temporal commercial assurance primitive. It binds a bounded obligation to an agreement version, counterparty, approved public source and sealed checkpoint schedule. The counterparty separately accepts an immutable digest of the exact obligation, evidence policy and schedule before monitoring begins. Validators independently fetch and interpret evidence; deterministic code controls consent, provenance, lifecycle and standing updates.

Production: [clausepilot-seven.vercel.app](https://clausepilot-seven.vercel.app) · [V2 monitor](https://clausepilot-seven.vercel.app/monitor). StudioNet V2 contract: [`0x03B1d1c9761A8EabfB365dB42AE2F513575c5D89`](https://explorer-studio.genlayer.com/address/0x03B1d1c9761A8EabfB365dB42AE2F513575c5D89).

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
V2 StudioNet address, exact source parity, lifecycle matrix, adversarial rollbacks and
authoritative readbacks are recorded in [docs/V2_LIVE_EVIDENCE.md](docs/V2_LIVE_EVIDENCE.md)
and [docs/v2-suite-results.json](docs/v2-suite-results.json). Historical V1 evidence remains
available in [docs/RELEASE_EVIDENCE.md](docs/RELEASE_EVIDENCE.md) and is explicitly superseded.
