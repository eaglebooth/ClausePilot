# ClausePilot StudioNet release evidence

Status: **LIVE PATHS VERIFIED — 2026-09-01**

## Release identity

- Repository: <https://github.com/eaglebooth/ClausePilot>
- Reviewed source commit: [`1b062313e06dc257bf9f0dfc9b137dc7e26cdf67`](https://github.com/eaglebooth/ClausePilot/commit/1b062313e06dc257bf9f0dfc9b137dc7e26cdf67)
- Contract: [`0x36CdaD2E787f09e125d462764389c317616C5c94`](https://explorer-studio.genlayer.com/address/0x36CdaD2E787f09e125d462764389c317616C5c94)
- Commit-pinned contract source: [raw `ClausePilot.py`](https://raw.githubusercontent.com/eaglebooth/ClausePilot/1b062313e06dc257bf9f0dfc9b137dc7e26cdf67/contracts/ClausePilot.py)
- Source size: `18,535` bytes
- Source SHA-256: `28e67e91d5d6f8d90569970b102c09089dc4f51a608a655215afe925a3f6828d`
- Source-parity qualification: the raw GitHub source was independently downloaded and matched the reviewed local bytes and digest before deployment. The current client does not expose deployed source bytes, so this document does not claim an independent post-deployment byte comparison. Runtime ABI and all documented state transitions were verified against the address above.

## Verification commands

Executed before deployment:

- `python -m pytest -q` — `17 passed`.
- `genvm-lint check contracts\\ClausePilot.py` — lint passed (`2` checks), semantic validation passed (`ClausePilot`, `10` methods: `4` view and `6` write). The linter reports the expected `time.time()` nondeterminism warning used only to seal checkpoint times.
- `npm test` — `4 passed`, including the StudioNet leader-receipt ID regression.
- `npm run lint` — passed.
- `npm run build` — passed; `/` and `/monitor` prerendered.

## Live lifecycle matrix

Every transaction below finalized on StudioNet. Readbacks were performed with `get_agreement`, `get_obligation`, `get_checkpoint`, and `get_totals` after finality.

| Branch | Consequential transaction | Authoritative readback |
| --- | --- | --- |
| Satisfied evidence | [`assess_checkpoint`](https://explorer-studio.genlayer.com/tx/0x9bee53492b5b3cd894544eb85a8391a31bffa23345dcb79f06593e8b8a0aaab1) | Checkpoint `0`: `ASSESSED`, `MATCH`, `SUFFICIENT`, `SATISFIED`; snapshot `1e9abdcdd273427db39f7edb5780eba5681716e842b1d341649808b971148117` |
| Positive contradiction | [`assess_checkpoint`](https://explorer-studio.genlayer.com/tx/0x09f82cce23750ec0955982b2ce0a6b730d165956de812ea83145c0d373b670ea) | Checkpoint `1`: `ASSESSED`, `MATCH`, `SUFFICIENT`, `BREACHED`; snapshot `bd8100e0e5af654ec87740841ab2146d85b70a425c31e0c4b9fce77009e5b9c7` |
| Prompt injection / insufficient evidence | [`assess_checkpoint`](https://explorer-studio.genlayer.com/tx/0xf30c1b6a617d127d88c8eb94ab70e54cf25f13a366d3f2bed741770bce6a095e) | Checkpoint `2`: `ASSESSED`, `MATCH`, `INSUFFICIENT`, `UNRESOLVED`; snapshot `da884304546948a79dd35635721d384fcbcbf7e112984bd3626b987e0b390521` |

Final successful-path totals: `3 agreements`, `3 obligations`, `3 checkpoints`.

## Deterministic failure controls

Each rejected write finalized with rollback, and totals remained `1/1/1` throughout this suite (it ran after the first lifecycle and before the other two).

| Case | Transaction | Result |
| --- | --- | --- |
| Self as counterparty | [`register_agreement`](https://explorer-studio.genlayer.com/tx/0x272c7f664ed3fc8583467927ce7658992ed2b12fc2eee7b142ddb0afaf42babe) | `INVALID_COUNTERPARTY`; no totals mutation |
| Malformed clause digest | [`register_agreement`](https://explorer-studio.genlayer.com/tx/0xdf0a74683c38fddce81843c68897541ae104fc7f0a301330bc269dc9b321a784) | `INVALID_AGREEMENT`; no totals mutation |
| Unknown obligation | [`open_due_checkpoint`](https://explorer-studio.genlayer.com/tx/0x3fdafeb8e725dfc093df5b90cbf1fb69691a2cb80f8e87abb1c86a91aa8653d7) | `OBLIGATION_NOT_FOUND`; no totals mutation |

## Full successful transaction chains

### SATISFIED — agreement/obligation/checkpoint `0`

1. [Register agreement](https://explorer-studio.genlayer.com/tx/0x565e636842ce88941409a294c9e2159b485c01cb2e5d0d03883cebb48432c42e)
2. [Counterparty acceptance](https://explorer-studio.genlayer.com/tx/0x60e7a52a6c947eda9e4aa1257f7634d1bff2c187b4bfd7d0dc0bb92e59f096fc)
3. [Add bounded obligation](https://explorer-studio.genlayer.com/tx/0x7150c3694a3d35128860ec204bdf5e25af60efcc7509e6bb0ee92e939501a13a)
4. [Open checkpoint](https://explorer-studio.genlayer.com/tx/0xe23f2561d980c45bd72207613c1da9cf6505837fcf9878c377cfde274b9763b3)
5. [Assess as SATISFIED](https://explorer-studio.genlayer.com/tx/0x9bee53492b5b3cd894544eb85a8391a31bffa23345dcb79f06593e8b8a0aaab1)

### BREACHED — agreement/obligation/checkpoint `1`

1. [Register agreement](https://explorer-studio.genlayer.com/tx/0xeb0786f7e812c5bbf8cfb86a6160f8c7250bb5487ea5cbe9b22e3034033822ea)
2. [Counterparty acceptance](https://explorer-studio.genlayer.com/tx/0xc715beb0c74fded614152f9bb986ed79d0b198cfa03dc43821ce0225d5dd7e99)
3. [Add bounded obligation](https://explorer-studio.genlayer.com/tx/0x0983914a41b844b00a273cbac695cf7daa0c53b07c0ab4bff34f2f2641383b06)
4. [Open checkpoint](https://explorer-studio.genlayer.com/tx/0x7903d86d333660036229635519c880e0fef1cf6634826158022dff5cc5425880)
5. [Assess as BREACHED](https://explorer-studio.genlayer.com/tx/0x09f82cce23750ec0955982b2ce0a6b730d165956de812ea83145c0d373b670ea)

### UNRESOLVED injection defense — agreement/obligation/checkpoint `2`

1. [Register agreement](https://explorer-studio.genlayer.com/tx/0xf91e3096fbe1ee4cc3af17a7112bcd09186e6d77bdf018b3fa0b8e34cefaf99c)
2. [Counterparty acceptance](https://explorer-studio.genlayer.com/tx/0x248d20d338b8681e11da4a01dc2b49392c6275a0647a3c914a40f4c0020b04ba)
3. [Add bounded obligation](https://explorer-studio.genlayer.com/tx/0x0a7855e4fe68eab9cb536be2052a84fa4ab3e1c99af7f81cb5c5bd374fd2b7b5)
4. [Open checkpoint](https://explorer-studio.genlayer.com/tx/0x9936ad1e506079fd8f02043b604fff5915c641d08d624612e735dbe4bc5ecb73)
5. [Assess as UNRESOLVED](https://explorer-studio.genlayer.com/tx/0xf30c1b6a617d127d88c8eb94ab70e54cf25f13a366d3f2bed741770bce6a095e)

## Superseded deployment disclosure

An earlier deployment at `0xB880254450686b5A7E5FC1915d123770D24FbBe4` was not used as final evidence. Its assessment attempts finalized with `MAJORITY_DISAGREE`, and readback remained `OPEN / UNRESOLVED`. That result exposed overly brittle comparison between two differently worded prompts. Commit `1b062313e06dc257bf9f0dfc9b137dc7e26cdf67` replaced that mechanism with comparative consensus before the final address above was deployed.
