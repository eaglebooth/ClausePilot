# V4 closed-consensus deployment verification

Updated: October 23, 2026. Status: production rollout blocked by inconsistent
assessment consensus in a second observation. Production remains V3.

## Exact deployment

- Network: StudioNet.
- [Replacement contract](https://explorer-studio.genlayer.com/address/0xb5E3D9F50e40CB599629048dE1f58427e5c49DfD).
- Source SHA-256: `590d0682d33bdb057feddd31a7cc8a03a01cb5df6a4c24fbd5acdb6b9e0f9e85`.
- Verified source parity: 42,755 bytes; version 4; consent schema
  `recovery-revisions-v1`; consensus schema `closed-evidence-v1`.
- Both recovery grace periods are 3,600 seconds.

The [first V4 candidate incident](V4_LIVE_EVIDENCE.md) is historical evidence,
not a successful assessment on this replacement deployment.

## Finalized evidence

| Control | Transaction | Verified result |
| --- | --- | --- |
| Late assessment | [Explorer](https://explorer-studio.genlayer.com/tx/0x08cf60b8e958250140016ae38b3dc399239da18be3e594f5add149dd57d58628) | `ASSESSMENT_DEADLINE_PASSED` rollback |
| Permissionless recovery | [Explorer](https://explorer-studio.genlayer.com/tx/0x19ee86d8c987a4c0d6bdeef5fb00543ff47ace5aae55ca0d4bc98f7240116c8e) | FINALIZED/UNRESOLVED; in-flight marker cleared |
| Recovery replay | [Explorer](https://explorer-studio.genlayer.com/tx/0xe7048fd5c8e4b56c3bd0b23da09f3a400905c62c2a82528ca26593f28d5ddb89) | `STALE_CHECKPOINT` rollback |
| Owner accepts own revision | [Explorer](https://explorer-studio.genlayer.com/tx/0xc958863a364b8abc2ba31cd2687f910ff8833f44baea38ffac6b83605e72504b) | `COUNTERPARTY_ONLY` rollback |
| Wrong consent digest | [Explorer](https://explorer-studio.genlayer.com/tx/0x2c2477c69dc06c289ef74e86a189d9947b784f9e7e3ff89332ba05f8576aff85) | `TERMS_DIGEST_MISMATCH` rollback; tracked state unchanged |
| Exact-digest counterparty consent | [Explorer](https://explorer-studio.genlayer.com/tx/0x9573d235b6b09abde5f1ea3657c5fbbff5114678ddb1e8668a3e6ce95330eaf3) | Successful revision acceptance |
| Successor checkpoint | [Explorer](https://explorer-studio.genlayer.com/tx/0x91a4f7a9f661a96c5509ca71685df897de48b8c924a1c3785f49485772442b79) | Successful opening |

The [machine-readable report](v4-live-0xb5e3d9f50e40cb599629048de1f58427e5c49dfd.json)
records hashes, finality checks, rollback controls and public readbacks. Entries
with `verified: false` are pending, not successful evidence.

## Remaining gates and limitations

- Successor assessment finalized successfully:
  [transaction](https://explorer-studio.genlayer.com/tx/0x8c850ac609ae479c4f7b1d380c035e5ad825659ed4cc326a8cdd96ce68f2da0b).
  Both sources qualified as MATCH/SUFFICIENT/SATISFIED, with distinct stored
  snapshot hashes and no source errors. Assessment consensus outlasted the
  test policy's five-minute challenge window; the subsequent challenge finalized
  with `CHALLENGE_NOT_OPEN`
  ([transaction](https://explorer-studio.genlayer.com/tx/0xe1ac0aced22375e07c5782139f6d57f2588357d212b7fcd845a4c3b07a09591f)).
  This is retained as a failed challenge, not a jury success. A separately
  consented policy with a one-hour challenge window is being tested on the same
  contract; the original accepted policy is not edited in place.
  The original successor finalized on its unchallenged SATISFIED finding:
  [transaction](https://explorer-studio.genlayer.com/tx/0xe3c3eb2117e187839bfb138106c5d4e698f309aa1d384b13db05759ed4414d11).
  A tooling/network interruption subsequently missed the new policy's first
  observation slot; opening it correctly produced FINALIZED/UNRESOLVED with
  `MISSED_SCHEDULE`
  ([transaction](https://explorer-studio.genlayer.com/tx/0x70b27296fb0d1e3719967f55526407793dca365f11e38fd0f6aab7cb27901efe)).
  The runner waits for the next anchored slot rather than assessing retrospectively.
- The next valid slot opened successfully
  ([transaction](https://explorer-studio.genlayer.com/tx/0x322f51551b9e17d47a0cc914784c344fcd11b9fbcc3280759e398a9802552d07)),
  but its assessment finalized `MAJORITY_DISAGREE`
  ([transaction](https://explorer-studio.genlayer.com/tx/0x4297874681df557a0203515c85c873f0c7bcae5299474bc45123cd314bb19138)).
  The leader's canonical packet classified both sources as `INVALID_MODEL_OUTPUT`;
  three validators disagreed at nondeterministic output index 0. The raw model
  responses are not available in this extracted evidence, so the exact invalid
  fields are not established. Do not infer a transport failure or a specific
  malformed field from this alone. The checkpoint remained OPEN with no stored
  source verdicts; no standing was updated and no challenge/jury success is claimed.
- After the actual assessment deadline, permissionless recovery finalized the
  failed observation as UNRESOLVED and cleared its in-flight marker:
  [transaction](https://explorer-studio.genlayer.com/tx/0xb10ae43d9659086817f2e6d5006eae2db5c7c6723ccfea6b2cfded6e497a622c).
- Competing revision rejected with `REVISION_STALE`:
  [transaction](https://explorer-studio.genlayer.com/tx/0x5ed23e1a58f519f2da6160806e21d498727ac5e26c3c0d266158854d1a99e4ab).
  Acceptance replay also rejected with `REVISION_NOT_PENDING`
  ([transaction](https://explorer-studio.genlayer.com/tx/0xcd012ae6c6e0173505bd94f9a8b85befbd375f4053048fa4190f0b90925d1394)).
  Closing a policy with an in-flight checkpoint rejected with `CHECKPOINT_IN_FLIGHT`
  ([transaction](https://explorer-studio.genlayer.com/tx/0x51f49b7415e079224484d18ce5f944f22ac1082855bf0d3a2aeea8c9a854b699)).
- One successful assessment does not establish reliable consensus across later
  observations. Diagnose model-output validity before retrying or changing
  validation. Do not weaken consequential-field agreement to obtain a pass.
- Production still uses the V3 contract until these gates pass.
- Synthetic fixtures share one publisher despite using distinct hosting origins;
  they do not prove independent organizations or real service uptime.
- No third-party audit or formal verification is claimed. Live challenge-timeout
  recovery is not claimed by the OPEN-checkpoint timeout proof above.

Fresh local checks: 68 Python tests and 8 Node tests passed; ESLint passed.
The Next.js production build also passed. These checks are separate from live consensus.

