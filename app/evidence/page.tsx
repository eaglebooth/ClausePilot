import Link from "next/link";

const repo = "https://github.com/eaglebooth/ClausePilot";
const snapshot = "28f647fa3205a9a97cda7effcdb68215e2db8ecf";
const contract = "0xb5E3D9F50e40CB599629048dE1f58427e5c49DfD";
const transactions = [
  [
    "Counterparty revision acceptance",
    "0x9573d235b6b09abde5f1ea3657c5fbbff5114678ddb1e8668a3e6ce95330eaf3",
    "SUCCESS; exact-digest consent",
  ],
  [
    "Wrong consent digest",
    "0x2c2477c69dc06c289ef74e86a189d9947b784f9e7e3ff89332ba05f8576aff85",
    "TERMS_DIGEST_MISMATCH rollback",
  ],
  [
    "Competing revision",
    "0x5ed23e1a58f519f2da6160806e21d498727ac5e26c3c0d266158854d1a99e4ab",
    "REVISION_STALE rollback",
  ],
  [
    "Successor finalization",
    "0xe3c3eb2117e187839bfb138106c5d4e698f309aa1d384b13db05759ed4414d11",
    "SATISFIED / UNCHALLENGED",
  ],
  [
    "Second assessment",
    "0x4297874681df557a0203515c85c873f0c7bcae5299474bc45123cd314bb19138",
    "MAJORITY_DISAGREE; not success",
  ],
  [
    "Recovery after failed consensus",
    "0xb10ae43d9659086817f2e6d5006eae2db5c7c6723ccfea6b2cfded6e497a622c",
    "FINALIZED / UNRESOLVED / ASSESSMENT_TIMEOUT",
  ],
];

export default function EvidencePage() {
  return (
    <main>
      <header>
        <Link className="brand" href="/">
          ClausePilot
        </Link>
        <Link className="outline" href="/monitor">
          Open console →
        </Link>
      </header>
      <section className="section evidencePage">
        <small>V4 · REVIEWER WORKSPACE</small>
        <h1>Evidence, not optimistic success.</h1>
        <p>
          This release exposes verified recovery and revision controls on the
          existing StudioNet contract. It does not claim a completed AI-jury
          lifecycle. These are historical verified results; use the console for
          fresh readback.
        </p>
        <div className="releaseBanner">
          <b>Known limitation</b>
          <p>
            One assessment and unchallenged successor finalization succeeded,
            but another assessment finalized MAJORITY_DISAGREE. The leader
            reported INVALID_MODEL_OUTPUT for both sources; the exact malformed
            fields are not established. Assessment and adjudication writes are
            paused in the web application, not disabled in the deployed
            contract.
          </p>
        </div>
        <h2>Exact reviewer path</h2>
        <ol>
          <li>
            Open the monitor. No wallet is needed to inspect existing state.
          </li>
          <li>
            Choose <b>Load finalized successor</b>. Confirm obligation 2,
            checkpoint 1: FINALIZED, SATISFIED and UNCHALLENGED. Expand sealed
            verdicts to inspect two source hashes.
          </li>
          <li>
            Choose <b>Load recovered timeout</b>. Confirm obligation 5,
            checkpoint 3: FINALIZED, UNRESOLVED and ASSESSMENT_TIMEOUT; timeout
            recovery is no longer eligible because it completed.
          </li>
          <li>
            In the revision panel, load candidate 2 to inspect its accepted
            parent/successor relationship. Parent policy 1 was retired; inspect
            the exact-digest acceptance transaction below.
          </li>
          <li>
            Paste any linked hash into Transaction safety desk and inspect it. A
            finalized rollback or failed consensus is not shown as a successful
            write. Inspection submits nothing.
          </li>
          <li>
            Only connect the appropriate wallet for new deterministic actions.
            Both parties must consent to new terms. Use the on-chain processing
            deadline for recovery; do not repeat terminal example actions.
          </li>
        </ol>
        <h2>Immutable evidence</h2>
        <p>
          <a
            href={`https://explorer-studio.genlayer.com/address/${contract}`}
            target="_blank"
            rel="noreferrer"
          >
            StudioNet contract ↗
          </a>
        </p>
        <code>{contract}</code>
        <div className="evidenceTable">
          <table>
            <thead>
              <tr>
                <th>Check</th>
                <th>Verified outcome</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(([name, hash, outcome]) => (
                <tr key={hash}>
                  <td>{name}</td>
                  <td>{outcome}</td>
                  <td>
                    <a
                      href={`https://explorer-studio.genlayer.com/tx/${hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Explorer ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <a
            href={`${repo}/blob/${snapshot}/docs/V4_CLOSED_LIVE_EVIDENCE.md`}
            target="_blank"
            rel="noreferrer"
          >
            Frozen live verification report ↗
          </a>{" "}
          ·{" "}
          <a
            href={`${repo}/compare/1e098b306edb191c667ae3dd7991d6cb58066c96...${snapshot}`}
            target="_blank"
            rel="noreferrer"
          >
            V3 technical baseline → V4 live evidence snapshot ↗
          </a>
        </p>
        <h2>Verification limits</h2>
        <p>
          Fixtures are synthetic and share a publisher despite distinct hosting
          origins. They do not prove independent organizations or actual uptime.
          Live challenge adjudication and CHALLENGED-timeout recovery are not
          verified here. No third-party audit or formal verification is claimed.
          The V3 comparison is a technical release boundary, not proof of the
          last commit rewarded by the Portal.
        </p>
        <div className="actions">
          <Link className="primary" href="/monitor">
            Inspect contract state
          </Link>
          <Link className="secondary" href="/">
            Back to product
          </Link>
        </div>
      </section>
    </main>
  );
}
