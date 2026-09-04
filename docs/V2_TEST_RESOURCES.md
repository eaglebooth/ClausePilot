# V2 semantic test resource manifest

These are synthetic test-world facts, not vendor telemetry or proof of real commercial performance. Both scenarios cover 2026-09-04 UTC; do not reuse them for checkpoints outside that interval. The timestamps include simulated future hours to allow controlled live protocol testing, not a forecast or attestation.

Publisher: project repository owner `eaglebooth`.
Canonical origin: `https://raw.githubusercontent.com`.
Repository: `eaglebooth/ClausePilot`.
Object: `ClausePilot Demo API`; agreement version `v1`.
Content type: JSON; integrity algorithm: SHA-256.
Use a full commit-pinned raw URL after publication. Record fetched digest and availability before starting each lifecycle.

| Resource | Purpose | Deterministic facts | Expected result |
| --- | --- | --- | --- |
| `samples/v2-uptime-satisfied.json` | positive | exact object/version; complete simulated period; 100% availability; no incidents | `SATISFIED` |
| `samples/v2-uptime-breached.json` | negative | exact object/version; complete simulated period; 0% availability; continuous complete outage | `BREACHED` |

Expected results were selected before validator execution. Any different outcome must be reported, not relabeled as a passing test.
