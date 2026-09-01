import { readFile } from "node:fs/promises";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const rawKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
if (!rawKey) throw new Error("Missing DEPLOYER_PRIVATE_KEY");
const account = createAccount(rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`);
const client = createClient({ chain: studionet, account });
const code = await readFile(new URL("../contracts/ClausePilot.py", import.meta.url), "utf8");
const hash = await client.deployContract({ code, args: [] });
process.stdout.write(`deploy: submitted ${hash}\n`);
const receipt = await client.waitForTransactionReceipt({
  hash, status: TransactionStatus.FINALIZED, interval: 2000, retries: 300,
});
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
