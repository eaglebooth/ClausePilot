# ClausePilot V2 live verification

Status: **V2 LIVE SUITE COMPLETE AND FRONTEND DEPLOYED**.

Contract: `0x03B1d1c9761A8EabfB365dB42AE2F513575c5D89` on StudioNet.
Reviewed source commit: `ac40cdba839ff03f9c1627987665b57c9cece7d5`.
RPC version readback: `ClausePilot`, version `2`, consent schema `exact-obligation-digest`.
Independent RPC `getContractCode` verification also matched the local reviewed source byte-for-byte:
21,586 bytes, SHA-256 `87e0e0edf5157101fd16506d18aad950d83f0c27a9cdeb16ea49bc3f1c93a06e`.

## Test actors

- Owner: `0xeb57bc7125fa60d7482ce12058397369ab3581f8`
- Counterparty: `0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f`
- All test writes used attached value `0`. No private keys are stored in this evidence.

## Completed lifecycle

Agreement, obligation and checkpoint IDs: `0`.
Expected result, chosen before execution: `UNRESOLVED` for insufficient / prompt-injection evidence.
Source: https://raw.githubusercontent.com/eaglebooth/ClausePilot/9b157cd6b4a18075253c5da3deb9cb63c1410134/samples/prompt-injection.txt
This is a synthetic project-owned fixture, not an independent commercial attestation.

All of these transactions finalized:

| Step | Transaction hash |
| --- | --- |
| Register agreement | `0xb06e6f18f919ec262a33861df47da3a75477cfe1a65cf3e7c46cc367403a999f` |
| Accept agreement | `0xba5281257883971701e75e80fbea452d149ba0eeadb2500936781dd1f0ed6a75` |
| Add obligation | `0xe98036b21eb64c17290a2b65d2f9a44c8198583a7ef95a5e5d1707e3d1564dd2` |
| Accept exact digest | `0x3dfd295c11ee7f3f0dde0d7e3c2a55c22add16b20074e3a9c479c2975ba4f7e5` |
| Open checkpoint | `0xfb47ab9af876d1870c0ff245496e90accccebbf2c9175952e368275735d340df` |
| Assess after window | `0xfa8e59c55b3679f0eb3531850389241f59fb934d9901b260b319ae86e01e13f7` |

Explorer transaction URL prefix: `https://explorer-studio.genlayer.com/tx/`.

## Adversarial controls

| Control | Transaction | Verified result |
| --- | --- | --- |
| Wrong terms digest | `0x35b5d5bf8bddb84837e0a51f3af8ec42f3f43cbccdf35381c00447e793f0205c` | FINALIZED rollback, `TERMS_DIGEST_MISMATCH`; full obligation readback unchanged |
| Assess before window end | `0x107515430b4cceb3d22d4bea5f5f0067837424842ed334562219e1bfbe89a1cd` | FINALIZED rollback, `OBSERVATION_WINDOW_OPEN`; full checkpoint readback unchanged |
| Self as counterparty | `0xe92881001e53c4e2bd0ab4ef0e1f1feaacdfdd6bc526a7e03d085a7d932612e1` | FINALIZED rollback, `INVALID_COUNTERPARTY`; totals unchanged at 1/1/1 |
| Malformed agreement digest | `0xffcd43ea064411b85cd528802f2f2aa68ce9b4c714dba44a73594d60229b926a` | FINALIZED rollback, `INVALID_AGREEMENT`; totals unchanged at 1/1/1 |
| Unknown obligation | `0xacd335f2c3529e1ef28a70d26a2574abc26429dec0c6435357e07ef8396f1c33` | FINALIZED rollback, `OBLIGATION_NOT_FOUND`; totals unchanged at 1/1/1 |

The script summarized both rollback reasons as `ERROR`. Separate direct receipt reads verified the exact payloads above; the summary alone was not used to identify the error.

## Final authoritative readback

- Accepted terms digest: `5e787ecb63468c0102eef1c3b12fc7b0c9b1703ed4b1e7df13ebdcba7c0068b7`
- Acceptance time: `1788510620`
- Window start/end: `1788510658` / `1788510958`
- Observation time: `1788510962` (4 seconds after window end)
- Checkpoint: `ASSESSED`, `MATCH`, `INSUFFICIENT`, `UNRESOLVED`
- Obligation standing: `UNRESOLVED`; latest checkpoint: `0`
- Snapshot SHA-256: `da884304546948a79dd35635721d384fcbcbf7e112984bd3626b987e0b390521`
- Totals: 1 agreement, 1 obligation, 1 checkpoint

## Expanded V2 suite

Synthetic V2 positive/breach fixtures and their manifest were published at
`2634db57d10f88ae9d8dba4f3c13fa7f926cc8a7`. Both commit-pinned raw URLs returned HTTP 200
and matched the local bytes (673 / 740 bytes). The earlier publication blocker is resolved.
Their simulated interval is 2026-09-04 UTC. These are explicitly synthetic scenarios,
not real vendor telemetry or independent attestations.

The machine-readable [suite report](v2-suite-results.json) has `complete: true`. It records 24
finalized transactions, explicit consensus/execution results, expected rollback payloads and
before/after state comparisons. Initial totals were 1/1/1; final totals are 2 agreements,
4 obligations and 4 checkpoints.

| Outcome | IDs | Assessment transaction | Final readback |
| --- | --- | --- | --- |
| SATISFIED | obligation/checkpoint `1` | `0x1a657c65b63fc8b7871a1ba6665131dda1f777d7ba2a9d12d238ba65e6722214` | `ASSESSED / SATISFIED`; snapshot `39aa267d12f3345379322de68c4a6b033936bfb747f70035f6d16d95ecb71983` |
| BREACHED | obligation/checkpoint `2` | `0xdf13cce3974a93d6a575aceae770a315e0925dfc2554aa41d8d69c28aa96156d` | `ASSESSED / BREACHED`; snapshot `257c9aaca6b6c01a0ba0c75a784bfa8b166643329360c627c7bff798816514a7` |
| UNRESOLVED | obligation/checkpoint `3` | `0xd4bb77d6d2a03806c0270a007441915fd9f64bc2c5eb4ad829648a5ccb526e00` | `UNRESOLVED / UNRESOLVED`; missing source; retry remained fail-closed |

The observation timestamps for SATISFIED and BREACHED were after their sealed window ends,
and their on-chain snapshot digests exactly match the predeclared public fixture bytes.

Additional finalized rollback controls passed without state mutation: owner agreement consent
`COUNTERPARTY_ONLY`, owner obligation consent `COUNTERPARTY_ONLY`, checkpoint before consent
`OBLIGATION_NOT_ACCEPTED`, repeat consent `OBLIGATION_NOT_ACCEPTABLE`, early second checkpoint
`CHECKPOINT_NOT_DUE`, counterparty close `OWNER_ONLY`, terminal replay `CHECKPOINT_NOT_OPEN`, and
assessment after owner closure `STALE_CHECKPOINT`. Exact hashes and readbacks are in the report.

The missing-source retry only proves that retry remains fail-closed; it does not claim recovery
to a positive semantic outcome.

The V2 frontend was deployed to production as Vercel deployment
`dpl_9jDejXUmJSRk3cihJNJcQzLc5urD` (`READY`) and aliased to
<https://clausepilot-seven.vercel.app>. Browser-extension wallet signing E2E remains explicitly
outside the automated verification scope.

Post-deployment browser smoke test loaded `/monitor`, confirmed the configured V2 address,
completed the schema handshake, and read authoritative totals `2 / 4 / 4`. It did not submit
a wallet transaction.

## Frontend verification (local)

- Configuration points to the V2 address above; browser Sync verified the schema and read totals.
- Loading obligation/checkpoint `0` displayed the exact accepted digest and `ASSESSED / UNRESOLVED` readback.
- A terminal checkpoint cannot be reassessed from the UI. Changing the duplicate obligation ID
  removes the old consent readback and disables opening a checkpoint until the new ID is loaded.
- The write helper now waits for `FINALIZED`, explicitly checks consensus and leader execution,
  and never turns a failed readback into a reconciled-success notice.
- Verification: 23 local Python tests, 8 frontend helper tests, ESLint and production build passed.
  Local Python tests use mocks/static invariants, not a second live network run.
- These are local UI/readback and helper tests, not browser-extension wallet signing E2E.
