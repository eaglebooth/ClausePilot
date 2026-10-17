import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const address = process.argv[2]?.trim();
if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
  throw new Error("Usage: node scripts/verify-v3-deployment.mjs <contract-address>");
}

const client = createClient({ chain: studionet });
const localCode = await readFile(new URL("../contracts/ClausePilot.py", import.meta.url));
const deployedCode = await client.getContractCode(address);
const deployedBytes = Buffer.isBuffer(deployedCode) ? deployedCode : Buffer.from(deployedCode);
const digest = value => createHash("sha256").update(value).digest("hex");
const unwrap = value => {
  if (typeof value === "string") return JSON.parse(value);
  if (value && typeof value === "object" && "result" in value) return unwrap(value.result);
  return value;
};
const version = unwrap(await client.readContract({ address, functionName: "get_contract_version", args: [] }));
const totals = unwrap(await client.readContract({ address, functionName: "get_totals", args: [] }));
const result = {
  network: "studionet",
  address,
  schemaValid: version?.name === "ClausePilot" && version?.version === 3 && version?.consent_schema === "corroborated-challenge-v1",
  sourceParity: Buffer.compare(localCode, deployedBytes) === 0,
  localBytes: localCode.length,
  deployedBytes: deployedBytes.length,
  localSha256: digest(localCode),
  deployedSha256: digest(deployedBytes),
  version,
  totals,
};
console.log(JSON.stringify(result, null, 2));
if (!result.schemaValid || !result.sourceParity) process.exitCode = 1;
