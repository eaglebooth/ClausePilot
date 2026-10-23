"use client";

import { useState, useSyncExternalStore } from "react";
import { inspectTransaction } from "@/lib/genlayer";
import { pendingHash, subscribePending } from "@/lib/pending";
import { transactionResultNumberToName } from "genlayer-js/types";
const resultNames: Readonly<Record<string,string>> = transactionResultNumberToName;

/** Public receipt inspection does not require a wallet or initiate any write. */
export default function TransactionInspector({
  latestHash,
}: {
  latestHash?: string;
}) {
  const pending = useSyncExternalStore(subscribePending, pendingHash, () => "");
  const [entered, setEntered] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ hash: string; text: string } | null>(
    null,
  );
  const hash = entered.trim() || pending || latestHash || "";
  async function inspect() {
    const target = hash;
    setBusy(true);
    try {
      const result = await inspectTransaction(target);
      const tx = result.transaction;
      const status = String(tx?.statusName || "UNKNOWN");
      const consensus = String(
        tx?.resultName ??
          resultNames[String(tx?.result)] ??
          "UNKNOWN",
      );
      setOutcome({
        hash: target,
        text: result.success
          ? `FINALIZED · ${consensus}. Execution succeeded. Sync the contract to verify IDs and authoritative state before another action.`
          : `${status} · ${consensus}. ${result.error}`,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="operationsPanel" aria-labelledby="receipt-title">
      <h2 id="receipt-title">Transaction safety desk</h2>
      <p>
        Inspect any transaction without connecting a wallet. A submitted hash is
        saved in this browser when storage is available. Unresolved submissions
        block further web writes until their finalized outcome is checked. There
        are no automatic retries.
      </p>
      {pending && (
        <p role="status">
          <b>Unresolved submission:</b> <code>{pending}</code>
        </p>
      )}
      <label htmlFor="receipt-hash">Transaction hash</label>
      <div className="receiptInput">
        <input
          id="receipt-hash"
          value={entered}
          placeholder={pending || latestHash || "0x…"}
          onChange={(e) => setEntered(e.target.value)}
        />
        <button
          className="secondary"
          disabled={busy || !hash}
          onClick={inspect}
        >
          {busy ? "Inspecting…" : "Inspect transaction"}
        </button>
      </div>
      {outcome && (
        <div id="receipt-outcome" role="status" aria-live="polite">
          <p>{outcome.text}</p>
          <code>{outcome.hash}</code>
          {/^0x[0-9a-fA-F]{64}$/.test(outcome.hash) && (
            <p>
              <a
                href={`https://explorer-studio.genlayer.com/tx/${outcome.hash}`}
                target="_blank"
                rel="noreferrer"
              >
                Open this transaction ↗
              </a>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
