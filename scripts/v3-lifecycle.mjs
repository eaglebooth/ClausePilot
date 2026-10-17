import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, transactionResultNumberToName } from "genlayer-js/types";
import { decodeReturnedId } from "../lib/receipt.ts";

const address = process.env.CLAUSEPILOT_CONTRACT_ADDRESS?.trim();
const sources = JSON.parse(process.env.CLAUSEPILOT_SOURCES_JSON || "[]");
const expectedState = (process.env.CLAUSEPILOT_EXPECTED_STATE || "SATISFIED").toUpperCase();
const challenge = process.env.CLAUSEPILOT_CHALLENGE_JSON ? JSON.parse(process.env.CLAUSEPILOT_CHALLENGE_JSON) : null;
if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("Missing/invalid CLAUSEPILOT_CONTRACT_ADDRESS");
if (!Array.isArray(sources) || sources.length < 2 || sources.length > 4) throw new Error("CLAUSEPILOT_SOURCES_JSON requires 2–4 sources");
if (!sources.every(s => /^https:\/\//.test(s.origin) && /^https:\/\//.test(s.url) && s.marker)) throw new Error("Invalid source policy");

async function readKeys() {
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume(); const values=[]; let value="";
  for await (const chunk of process.stdin) for (const character of String(chunk)) {
    if (character === "\r" || character === "\n") { if (value) values.push(value.trim()); value=""; if (values.length===2) { if (process.stdin.isTTY) process.stdin.setRawMode(false); return values; } }
    else value += character;
  }
  throw new Error("Pass owner and counterparty private keys as two stdin lines");
}
const keys=await readKeys();const accounts=keys.map(key=>createAccount(key.startsWith("0x")?key:`0x${key}`));keys.fill("");
const [owner,party]=accounts.map(account=>createClient({chain:studionet,account}));
const report={address,version:null,actors:accounts.map(a=>a.address),transactions:[],readbacks:{}};
function failure(transaction,receipt){const leader=transaction?.consensus_data?.leader_receipt?.[0];const execution=String(leader?.execution_result??"").toUpperCase();const result=String(leader?.result?.status??"").toUpperCase();const status=String(transaction?.statusName??receipt?.statusName??"").toUpperCase();const consensus=String(transaction?.resultName??transactionResultNumberToName?.[String(transaction?.result)]??"").toUpperCase();if(execution&&execution!=="SUCCESS")return String(leader?.result?.payload?.readable??execution);if(["ROLLBACK","ERROR","FAILED"].some(v=>result.includes(v)))return String(leader?.result?.payload?.readable??result);if(status!=="FINALIZED")return `status ${status}`;if(consensus&&!['AGREE','MAJORITY_AGREE'].includes(consensus))return `consensus ${consensus}`;return "";}
async function read(name,args=[]){let value=await owner.readContract({address,functionName:name,args});if(typeof value==="string")value=JSON.parse(value);value=value?.result??value;return typeof value==="string"?JSON.parse(value):value;}
async function write(label,client,name,args){const hash=await client.writeContract({address,functionName:name,args,value:0n});console.log(`${label}: ${hash}`);const receipt=await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:2000,retries:600});const transaction=await client.getTransaction({hash});const error=failure(transaction,receipt);report.transactions.push({label,hash,error:error||null});if(error)throw new Error(`${label}: ${error}`);return {transaction,receipt};}
async function create(label,client,name,args){const result=await write(label,client,name,args);return decodeReturnedId(result.transaction,result.receipt);}
async function rollback(label,client,name,args,reason){const before=await read("get_totals");const hash=await client.writeContract({address,functionName:name,args,value:0n});const receipt=await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:2000,retries:600});const transaction=await client.getTransaction({hash});const error=failure(transaction,receipt);const after=await read("get_totals");report.transactions.push({label,hash,error});if(!error.includes(reason)||JSON.stringify(before)!==JSON.stringify(after))throw new Error(`${label}: rollback/readback mismatch`);}

report.version=await read("get_contract_version");if(report.version.version!==3||report.version.consent_schema!=="corroborated-challenge-v1")throw new Error("Wrong contract schema");
const agreementId=await create("register",owner,"register_agreement",[accounts[1].address,"ClausePilot V3 live proof","v3","7".repeat(64)]);
await write("accept agreement",party,"accept_agreement",[agreementId]);
const challengeOrigin=challenge?new URL(challenge.url).origin:"https://counter.example.com";
const obligationId=await create("add obligation",owner,"add_obligation",[agreementId,"v3-live","UPTIME","Corroborated service status","Maintain the bound service during the sealed observation window.",JSON.stringify(sources),Math.min(2,sources.length),challengeOrigin,300,3600,300]);
const obligation=await read("get_obligation",[obligationId]);await rollback("wrong digest",party,"accept_obligation",[obligationId,"f".repeat(64)],"TERMS_DIGEST_MISMATCH");await write("accept terms",party,"accept_obligation",[obligationId,obligation.terms_digest]);
const checkpointId=await create("open checkpoint",owner,"open_due_checkpoint",[obligationId]);const sealed=await read("get_checkpoint",[checkpointId]);if(Date.now()/1000<sealed.window_end)await rollback("early assess",owner,"assess_checkpoint",[checkpointId],"OBSERVATION_WINDOW_OPEN");while(Date.now()/1000<sealed.window_end)await new Promise(resolve=>setTimeout(resolve,15000));
await write("assess",owner,"assess_checkpoint",[checkpointId]);let checkpoint=await read("get_checkpoint",[checkpointId]);if(checkpoint.status!=="PROVISIONAL"||checkpoint.provisional_state!==expectedState)throw new Error(`Unexpected provisional result ${checkpoint.provisional_state}`);
if(challenge){await write("challenge",party,"submit_challenge",[checkpointId,challenge.url,challenge.marker,challenge.sha256]);await write("adjudicate",owner,"adjudicate_challenge",[checkpointId]);}
else { while(Date.now()/1000<=checkpoint.challenge_deadline)await new Promise(resolve=>setTimeout(resolve,15000)); }
await write("finalize",owner,"finalize_checkpoint",[checkpointId]);await rollback("finalize replay",owner,"finalize_checkpoint",[checkpointId],"CHECKPOINT_NOT_FINALIZABLE");
report.readbacks={agreementId,obligationId,checkpointId,checkpoint:await read("get_checkpoint",[checkpointId]),obligation:await read("get_obligation",[obligationId]),totals:await read("get_totals")};console.log(`V3_LIFECYCLE_COMPLETE ${JSON.stringify(report,null,2)}`);
