# ClausePilot V4 live verification

Status: **ROLLOUT BLOCKED — deployed candidate requires a consensus fix and redeployment**.

Network: GenLayer StudioNet.
Contract: [`0xDDB1fdc8eA22654501bC10b2af7A03f900D4dF7F`](https://explorer-studio.genlayer.com/address/0xDDB1fdc8eA22654501bC10b2af7A03f900D4dF7F).

## Deployment verification

`scripts/verify-v4-deployment.mjs` confirmed exact byte-for-byte equality between
deployed source and the local contract at core commit
[`48901e2c24bcea9ac4f7f2f3d0f8fc26a30ad702`](https://github.com/eaglebooth/ClausePilot/commit/48901e2c24bcea9ac4f7f2f3d0f8fc26a30ad702).

- Source size: 42,648 bytes.
- SHA-256: `08d171dc3596d13c77eda33579102a547629099465adf70a8e259dd15031d3f1`.
- Schema: version 4, `recovery-revisions-v1`.
- Assessment and adjudication grace: 3,600 seconds each.
- Initial state: zero agreements, obligations and checkpoints.

## Actors and evidence boundary

Owner: `0xfed97e2ae1a8c1983b7ca206b3545e6a2c685e43`.
Counterparty: `0xc67532aef9d2879cba9375a02e6217a3524657b8`.

The dated test publications are synthetic fixtures at commit
[`3e16b30`](https://github.com/eaglebooth/ClausePilot/commit/3e16b30).
Their separate delivery origins exercise origin policy. They share a publisher
and do not establish independent organizations or actual service uptime.

## Live gates

- Agreement and exact obligation consent: verified.
- Owner proposal / counterparty exact revision consent: verified.
- Wrong-role, wrong-digest, stale proposal and replay rollback proofs: verified.
- Successor observation: opened; assessment rejected by consensus twice.
- Successor challenge / finalization: not reached.
- Early timeout rejection and elapsed-time assessment recovery: verified.
- Challenge elapsed-time recovery: pending.
- Production environment and deployment: pending; public production stays V3.

The runner saves only transaction hashes, verification outcomes and public
readbacks to `v4-live-0xddb1fdc8ea22654501bc10b2af7a03f900d4df7f.json`.
No account secrets or raw validator receipts are stored.

## Deterministic live evidence

| Check | Finalized transaction | Outcome |
| --- | --- | --- |
| Propose successor | [Transaction](https://explorer-studio.genlayer.com/tx/0xbf7c80bf7d43232804041cb2fd854c72030553f6692727d4de77576e840b103e) | Candidate created |
| Reject legacy acceptance | [Transaction](https://explorer-studio.genlayer.com/tx/0x6b8744e1c931e19c38fb9a15e242fbde1e6afb92718fec9801951c2062f25850) | USE_ACCEPT_REVISION |
| Reject owner acceptance | [Transaction](https://explorer-studio.genlayer.com/tx/0xe818da17cb7524e7e1bfb709f309f17510f071f9c5bdf09531b81bb49fda52a8) | COUNTERPARTY_ONLY |
| Reject wrong digest | [Transaction](https://explorer-studio.genlayer.com/tx/0x3c9de7a6d798d958bfb6209a8f6cb99c9d1d13b8641bb238b245b807cd738579) | TERMS_DIGEST_MISMATCH |
| Accept exact successor | [Transaction](https://explorer-studio.genlayer.com/tx/0xb1a542c19d89572825950be1036cf105af634a4566266a9f68c0a0a26540957a) | Success |
| Reject competing proposal | [Transaction](https://explorer-studio.genlayer.com/tx/0x96f4b2fb655e6e758853b27839083f25f7dc4cf610dcd3da0d2bdb27dd85159e) | REVISION_STALE |
| Reject acceptance replay | [Transaction](https://explorer-studio.genlayer.com/tx/0x50659d5e654f167b03fb59099f9e2c92cebbdc1bec375074098bf14c5b0f7b4f) | REVISION_NOT_PENDING |
| Reject close during observation | [Transaction](https://explorer-studio.genlayer.com/tx/0xa87759afaf9dd66a3aadbaa7433b3d482589818ee27b6fa6475b90939e0ff66f) | CHECKPOINT_IN_FLIGHT |
| Reject premature recovery | [Transaction](https://explorer-studio.genlayer.com/tx/0xce8c9a6f6bf99a8c6af700c2d0cfaeb99610870eb54d172210ec988da424f42b) | RECOVERY_NOT_DUE |
| Reject late assessment | [Transaction](https://explorer-studio.genlayer.com/tx/0x4c7f3f8355d8b3016b031a9a4db4a8977eee2f150fb44f7d77a0110df9432010) | ASSESSMENT_DEADLINE_PASSED |
| Expire stalled checkpoint | [Transaction](https://explorer-studio.genlayer.com/tx/0x0ff8ba4026a6f8a5ba5381a0261ed2c5c1e97301f7e3539811b01b20cd64d99c) | FINALIZED / UNRESOLVED |
| Reject expiry replay | [Transaction](https://explorer-studio.genlayer.com/tx/0x5b71a382b9556d46c110e29297d3a3a3f40a45302fed1c0e53bc67ba4102ac6e) | STALE_CHECKPOINT |

The close-during-observation receipt was re-read after an RPC connection reset.
Its rollback receipt is verified; the pre-transaction full snapshot was not
persisted by that earlier runner version. Later runner versions persist snapshots
for rollback comparisons before waiting for finality.

## Assessment consensus incident

The first successor assessment
([transaction](https://explorer-studio.genlayer.com/tx/0xd9ff5b1db8041d28760f8c203238d94df8825eb7ddd89076d278edd2c1792868))
finalized with MAJORITY_DISAGREE after four rounds. The displayed leader and
validator returned SATISFIED, but that does not establish validator agreement on
all compared fields or independent evidence. Authoritative checkpoint readback
remained OPEN / UNRESOLVED with no stored source results. This transaction is
explicitly excluded from successful lifecycle evidence. A single explicit retry
is tracked separately. It also finalized MAJORITY_DISAGREE after four rounds:
[retry transaction](https://explorer-studio.genlayer.com/tx/0x59abe7a547db8324fcf37e933865f9f4201c99150e679a8e82feab86f24c4e60).
The retry's displayed leader returned UNRESOLVED. Neither attempt is successful
assessment evidence, and no production switch was made.

## Remediation candidate

The replacement source canonicalizes source and challenge outputs before using
strict equality on independently derived decision fields and fetched snapshot
hashes. Free-form rationale and material-fact wording are excluded from the
comparison. Positive contradictory support is validated before a breach can be
canonicalized. Actual differing labels, failures or snapshot hashes still reject
consensus; this fix does not guarantee model agreement or mask unavailable data.

The new `closed-evidence-v1` consensus handshake distinguishes this replacement
from the address above. It needs a fresh deployment and new source/schema parity
checks before retrying live lifecycle tests. The exact underlying causes of every
validator's vote are not fully observable from these receipts; removal of prose
comparison is a targeted reduction in avoidable consensus variability, not proof
that prose alone caused both failures.
