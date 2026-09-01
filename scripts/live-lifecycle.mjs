import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { decodeReturnedId } from "../lib/receipt.ts";

const contract = process.env.CLAUSEPILOT_CONTRACT_ADDRESS?.trim();
const rawKey = process.env.CLAUSEPILOT_OWNER_PRIVATE_KEY?.trim();
const counterpartyKey = process.env.CLAUSEPILOT_COUNTERPARTY_PRIVATE_KEY?.trim();
const evidenceUrl = process.env.CLAUSEPILOT_EVIDENCE_URL?.trim();
const expectedState = (process.env.CLAUSEPILOT_EXPECTED_STATE || "SATISFIED").trim().toUpperCase();
const objectMarker = process.env.CLAUSEPILOT_OBJECT_MARKER?.trim() || "ClausePilot Demo API";
if (!contract || !/^0x[0-9a-fA-F]{40}$/.test(contract)) throw new Error("Missing/invalid CLAUSEPILOT_CONTRACT_ADDRESS");
if (!rawKey) throw new Error("Missing CLAUSEPILOT_OWNER_PRIVATE_KEY");
if (!counterpartyKey) throw new Error("Missing CLAUSEPILOT_COUNTERPARTY_PRIVATE_KEY");
if (!evidenceUrl || !/^https:\/\/raw\.githubusercontent\.com\/.+\/[0-9a-f]{40}\/.+/.test(evidenceUrl)) throw new Error("Evidence URL must be raw GitHub pinned to a full 40-character commit");
if (!["SATISFIED", "AT_RISK", "BREACHED", "UNRESOLVED"].includes(expectedState)) throw new Error("Invalid CLAUSEPILOT_EXPECTED_STATE");

const origin = new URL(evidenceUrl).origin;
const account = createAccount(rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`);
const client = createClient({ chain: studionet, account });
const counterpartyAccount = createAccount(counterpartyKey.startsWith("0x") ? counterpartyKey : `0x${counterpartyKey}`);
const counterpartyClient = createClient({ chain: studionet, account: counterpartyAccount });
const counterparty = counterpartyAccount.address;
const clauseDigest = process.env.CLAUSEPILOT_CLAUSE_DIGEST || "7213d0b657b15aca1addeb81ee75434cef1174134fa8df5dd7ad7870d79187cc";

function failure(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return "";
  seen.add(value);
  const status = String(value.status ?? value.execution_result ?? value.txExecutionResultName ?? "").toUpperCase();
  if (["ROLLBACK", "ERROR", "FAILED"].some((part) => status.includes(part))) return String(value.payload ?? value.error_description ?? value.message ?? status);
  for (const nested of Object.values(value)) { const found = failure(nested, seen); if (found) return found; }
  return "";
}

async function write(label, functionName, args, writer = client) {
  const hash = await writer.writeContract({ address: contract, functionName, args, value: 0n });
  process.stdout.write(`${label}: submitted ${hash}\n`);
  const receipt = await writer.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 2000, retries: 300 });
  let transaction = receipt;
  try { transaction = await writer.getTransaction({ hash }); } catch { /* receipt remains authoritative fallback */ }
  const rejected = failure(transaction) || failure(receipt);
  if (rejected) throw new Error(`${label}: ${rejected}`);
  const record = { label, hash, receipt, transaction };
  process.stdout.write(`${label}: FINALIZED\n`);
  return record;
}

async function read(functionName, args = []) {
  const raw = await client.readContract({ address: contract, functionName, args });
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  return typeof value?.result === "string" ? JSON.parse(value.result) : (value?.result ?? value);
}

const initial = await read("get_totals");
const agreementTx = await write("register_agreement", "register_agreement", [counterparty, "ClausePilot Demonstration Agreement", "v1", clauseDigest]);
const agreementId = decodeReturnedId(agreementTx.transaction, agreementTx.receipt);
const acceptTx = await write("accept_agreement", "accept_agreement", [agreementId], counterpartyClient);
const obligationTx = await write("add_obligation", "add_obligation", [
  agreementId, `demo-${expectedState.toLowerCase()}`, "UPTIME", "Commercially reasonable uptime",
  "Maintain commercially reasonable availability for the ClausePilot Demo API during every sealed observation window.",
  origin, evidenceUrl, objectMarker, 86400, 3600,
]);
const obligationId = decodeReturnedId(obligationTx.transaction, obligationTx.receipt);
const openTx = await write("open_due_checkpoint", "open_due_checkpoint", [obligationId]);
const checkpointId = decodeReturnedId(openTx.transaction, openTx.receipt);
const assessTx = await write("assess_checkpoint", "assess_checkpoint", [checkpointId]);
const checkpoint = await read("get_checkpoint", [checkpointId]);
const obligation = await read("get_obligation", [obligationId]);
const totals = await read("get_totals");
if (checkpoint.semantic_state !== expectedState || obligation.standing !== expectedState) throw new Error(`Expected ${expectedState}, got checkpoint=${checkpoint.semantic_state} standing=${obligation.standing}`);
if (Number(totals.agreements) !== Number(initial.agreements) + 1 || Number(totals.obligations) !== Number(initial.obligations) + 1 || Number(totals.checkpoints) !== Number(initial.checkpoints) + 1) throw new Error("Final totals do not match lifecycle writes");
process.stdout.write(`LIFECYCLE_COMPLETE ${JSON.stringify({ contract, agreementId, obligationId, checkpointId, expectedState, transactions: [agreementTx.hash, acceptTx.hash, obligationTx.hash, openTx.hash, assessTx.hash], checkpoint, obligation, totals }, null, 2)}\n`);
