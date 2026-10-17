# ClausePilot V3 live verification

Status: **V3 LIFECYCLE COMPLETE — PRODUCTION RELEASE CANDIDATE**.

- Network: GenLayer StudioNet
- Contract: [`0x0350c736033bE5b0e66a15512475D12d573412A4`](https://explorer-studio.genlayer.com/address/0x0350c736033bE5b0e66a15512475D12d573412A4)
- Schema: `corroborated-challenge-v1`
- Deployed/local source length: `34,644` bytes
- Deployed/local SHA-256: `37557a88273f1f2bec0662583fe1abe471f8f8e33f3f99374418684331c43eca`
- Owner: `0xfed97e2ae1a8c1983b7ca206b3545e6a2c685e43`
- Counterparty: `0xc67532aef9d2879cba9375a02e6217a3524657b8`

## Finalized lifecycle

| Step | Explorer evidence | Result |
| --- | --- | --- |
| Register agreement | [`0xf1ff...9731d`](https://explorer-studio.genlayer.com/tx/0xf1ff24346da74e4c4f86f769c6a4b1cfcf5416fcd28cb34107ac042fe949731d) | Agreement `0` created |
| Counterparty acceptance | [`0x49b4...397e3`](https://explorer-studio.genlayer.com/tx/0x49b485fca7249482bef604cd64271419603b474c16b3341af68e1aa21c3397e3) | Exact agreement accepted |
| Add corroborated obligation | [`0xf726...76056`](https://explorer-studio.genlayer.com/tx/0xf726818b142bbd611dd47d4d3e5167549d3214d9f8adda4940fc4b4016976056) | Two independent origins, threshold `2` |
| Reject wrong terms digest | [`0x9cef...24622`](https://explorer-studio.genlayer.com/tx/0x9cef6880ebfacbbdda4838e5d37ddd075ee211e8f8f00aaf1c69745bff624622) | Finalized rollback: `TERMS_DIGEST_MISMATCH`; state unchanged |
| Accept exact obligation | [`0xd8f1...a9d4b`](https://explorer-studio.genlayer.com/tx/0xd8f1e7b1cca802e92aeb24b27e2af46d7248951286478b1317a3db1166ea9d4b) | Consent bound to all policy fields |
| Open sealed checkpoint | [`0xa345...d7c39`](https://explorer-studio.genlayer.com/tx/0xa345db5cabcaef8910f89672a05cc57a6d6fa3651886031b4b77eb50cd3d7c39) | Checkpoint `0`, fixed observation window |
| Reject early assessment | [`0xf0d3...a445b`](https://explorer-studio.genlayer.com/tx/0xf0d3736394b941ab38fcf9122a56d20d99d196da7087b145a5e1a8afae9a445b) | Finalized rollback: `OBSERVATION_WINDOW_OPEN`; state unchanged |
| Assess independent sources | [`0x475a...0a0fb`](https://explorer-studio.genlayer.com/tx/0x475a87918eeb8bf6a8f158178e4b2ee216dcbfbbd00d0d2f37813879d050a0fb) | `PROVISIONAL / SATISFIED`, threshold met |
| Submit counter-evidence | [`0x9faa...9e5f1`](https://explorer-studio.genlayer.com/tx/0x9faa04949ce567eff5f2d25ee102ddbf15cc2b14e0b0c7fe5c4acf3b3a69e5f1) | Third-origin challenge sealed by raw-byte digest |
| AI challenge adjudication | [`0xf685...ecb93`](https://explorer-studio.genlayer.com/tx/0xf68534e94f17b5b0e376f9e4090f33a77ba36575c4b9c58e19ff727f522ecb93) | Closed decision: `UPHOLD` |
| Deterministic finalization | [`0xbfc8...43450`](https://explorer-studio.genlayer.com/tx/0xbfc812edded04986bd92119076046e01bb3a2b76c411bb9fe6a362975bc43450) | `FINALIZED / SATISFIED` |
| Reject finalization replay | [`0x0b7b...f3ed5`](https://explorer-studio.genlayer.com/tx/0x0b7b7d973883b010c849ed0f73ecbc18f777c7c6dec2d7ca030544422ddf3ed5) | Finalized rollback: `CHECKPOINT_NOT_FINALIZABLE`; state unchanged |

## Authoritative readback

Checkpoint `0` is `FINALIZED`; both provisional and final state are
`SATISFIED`; challenge decision is `UPHOLD`; obligation standing is
`SATISFIED`; and `open_checkpoint_id` is empty. The two qualified source
snapshots are:

- `b00e4c3a7ab6f20f8783f5a64280240b14ac4d9b3bbce825f6b8f8cd59896e62`
- `c894a245c970ae6311553157d34d421aa405105d75afd2f1e3fc1019d0145ce9`

The challenge expected and observed digest both equal
`ea1532fab08ca69b9331ff25327a9853a2ba30305764456e052cc657a013e9b6`.
Only closed consensus fields and raw-byte digests affect authoritative state;
free-form model prose is excluded.

## Release gate

Before deployment, the exact source passed 52 Python tests, 8 Node tests,
GenVM lint and semantic validation (15 public methods), ESLint and a Next.js
production build. The live gate additionally proves consent mismatch rollback,
sealed-window rollback, multi-source nondeterministic assessment, independent
challenge adjudication, deterministic finalization and replay protection.
