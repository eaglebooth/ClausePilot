# ClausePilot

ClausePilot is a GenLayer temporal commercial assurance primitive. It binds a bounded obligation to an agreement version, counterparty, approved public source and sealed checkpoint schedule. Validators independently fetch and interpret evidence; deterministic code controls provenance, lifecycle and standing updates.

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

Copy `.env.example` to `.env.local` after deployment. Never configure the frontend with a historical or placeholder address for submission.

## Public methods

Writes: `register_agreement`, `accept_agreement`, `add_obligation`, `open_due_checkpoint`, `assess_checkpoint`, `close_obligation`.

Views: `get_agreement`, `get_obligation`, `get_checkpoint`, `get_totals`.

See [SPEC.md](SPEC.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for exact claims and limitations.
