import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";

const address=process.argv[2]?.trim();
if(!address||!/^0x[0-9a-fA-F]{40}$/.test(address))throw new Error("Usage: node scripts/verify-v4-deployment.mjs <contract-address>");
const client=createClient({chain:studionet});
const local=await readFile(new URL("../contracts/ClausePilot.py",import.meta.url));
const deployed=Buffer.from(await client.getContractCode(address));
const unwrap=value=>typeof value==="string"?JSON.parse(value):value;
const version=unwrap(await client.readContract({address,functionName:"get_contract_version",args:[]}));
const totals=unwrap(await client.readContract({address,functionName:"get_totals",args:[]}));
const sha=value=>createHash("sha256").update(value).digest("hex");
const result={network:"studionet",address,version,totals,
 schemaValid:version?.version===4&&version?.name==="ClausePilot"&&version?.consent_schema==="recovery-revisions-v1"&&version?.assessment_grace===3600&&version?.adjudication_grace===3600,
 sourceParity:Buffer.compare(local,deployed)===0,localSha256:sha(local),deployedSha256:sha(deployed),localBytes:local.length,deployedBytes:deployed.length};
console.log(JSON.stringify(result,null,2));
if(!result.sourceParity||!result.schemaValid)process.exitCode=1;
