# ClausePilot pre-deployment verification

Verified locally: 2026-09-04
Reviewed commit and contract SHA-256: **pending final commit**
Local contract SHA-256: `87e0e0edf5157101fd16506d18aad950d83f0c27a9cdeb16ea49bc3f1c93a06e`

## Local gates

- GenVM AST lint: pass, 2 checks.
- GenVM semantic validation: pass, contract `ClausePilot`, 12 public methods (5 view, 7 write).
- Python static/invariant/runtime tests: 23 passed.
- Receipt-ID tests: 4 passed; missing return ID fails closed instead of defaulting to zero.
- ESLint: pass.
- Next.js production build: pass; `/` and `/monitor` statically generated.
- Browser inspection: V2 workflow rendered and the frontend rejected the
  configured historical V1 address before any write.
- StudioNet V2 deployment: pending fresh deployment.

The remediation adds a seventh public write, `accept_obligation`, which binds
counterparty consent to a deterministic digest of every consequential obligation,
evidence-policy and schedule field. It also rejects `assess_checkpoint` while the
sealed observation window remains open.

GenVM reports one acknowledged warning for `time.time()` used by the checkpoint
schedule. This must be verified through finalized Studionet timing behavior and
must not be silently omitted from final release evidence.

## Public fixture verification

Each URL returned HTTP `200` and its fetched bytes matched the repository
manifest on 2026-09-01.

| Fixture | Bytes | SHA-256 | Commit-pinned source |
| --- | ---: | --- | --- |
| Clause bundle | 278 | `7213d0b657b15aca1addeb81ee75434cef1174134fa8df5dd7ad7870d79187cc` | [raw](https://raw.githubusercontent.com/eaglebooth/ClausePilot/9b157cd6b4a18075253c5da3deb9cb63c1410134/samples/clause-bundle.json) |
| Satisfied uptime | 170 | `1e9abdcdd273427db39f7edb5780eba5681716e842b1d341649808b971148117` | [raw](https://raw.githubusercontent.com/eaglebooth/ClausePilot/9b157cd6b4a18075253c5da3deb9cb63c1410134/samples/uptime-satisfied.json) |
| Breached uptime | 229 | `bd8100e0e5af654ec87740841ab2146d85b70a425c31e0c4b9fce77009e5b9c7` | [raw](https://raw.githubusercontent.com/eaglebooth/ClausePilot/9b157cd6b4a18075253c5da3deb9cb63c1410134/samples/uptime-breached.json) |
| Prompt injection | 146 | `da884304546948a79dd35635721d384fcbcbf7e112984bd3626b987e0b390521` | [raw](https://raw.githubusercontent.com/eaglebooth/ClausePilot/9b157cd6b4a18075253c5da3deb9cb63c1410134/samples/prompt-injection.txt) |

These digests authenticate the listed fixture bytes only. They do not establish
a complete Git repository snapshot.

## Deployment stop gate

The remediated source is not submission-ready and no new StudioNet success is claimed yet.
Next authorized action is deployment of the exact reviewed contract source,
followed by source-parity verification and live satisfied, breach, unresolved,
retry and rollback/no-mutation controls on that final address.
