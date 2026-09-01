import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const contract = process.env.CLAUSEPILOT_CONTRACT_ADDRESS?.trim();
const rawKey = process.env.CLAUSEPILOT_ATTACKER_PRIVATE_KEY?.trim();
if (!contract || !/^0x[0-9a-fA-F]{40}$/.test(contract)) throw new Error("Missing/invalid CLAUSEPILOT_CONTRACT_ADDRESS");
if (!rawKey) throw new Error("Missing CLAUSEPILOT_ATTACKER_PRIVATE_KEY");
const account = createAccount(rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`);
const client = createClient({ chain: studionet, account });

async function read(functionName, args = []) {
  const raw = await client.readContract({ address: contract, functionName, args });
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  return typeof value?.result === "string" ? JSON.parse(value.result) : (value?.result ?? value);
}

function containsRollback(value) {
  const text = JSON.stringify(value).toUpperCase();
  return text.includes("ROLLBACK") || text.includes("ERROR") || text.includes("FAILED");
}

async function expectRollback(label, functionName, args) {
  const before = await read("get_totals");
  const hash = await client.writeContract({ address: contract, functionName, args, value: 0n });
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 2000, retries: 300 });
  let transaction = receipt; try { transaction = await client.getTransaction({ hash }); } catch {}
  if (!containsRollback(transaction) && !containsRollback(receipt)) throw new Error(`${label}: expected rollback`);
  const after = await read("get_totals");
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error(`${label}: rejected write mutated totals`);
  return { label, hash, before, after };
}

const results = [];
results.push(await expectRollback("invalid_counterparty", "register_agreement", [account.address, "Self dealing agreement", "v1", "a".repeat(64)]));
results.push(await expectRollback("invalid_digest", "register_agreement", ["0x0000000000000000000000000000000000000001", "Malformed digest agreement", "v1", "not-a-digest"]));
results.push(await expectRollback("unknown_obligation", "open_due_checkpoint", ["999999999"]));
process.stdout.write(`FAILURE_CONTROLS_COMPLETE ${JSON.stringify({ contract, results }, null, 2)}\n`);
