import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {readFile,writeFile,mkdtemp,symlink} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {createHash} from "node:crypto";
import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {TransactionStatus,transactionResultNumberToName} from "genlayer-js/types";
import {finalizedFailure} from "../lib/finality.ts";
import {decodeReturnedId} from "../lib/receipt.ts";

// Uses unlocked GenLayer CLI accounts. No keys or raw receipts are printed/saved.
const address=process.env.CLAUSEPILOT_CONTRACT_ADDRESS;
const stage=process.argv[2]||"status";
if(!/^0x[0-9a-fA-F]{40}$/.test(address||""))throw Error("Set CLAUSEPILOT_CONTRACT_ADDRESS");
const client=createClient({chain:studionet});
const file=new URL(`../docs/v4-live-${address.toLowerCase()}.json`,import.meta.url);
let report;
try{report=JSON.parse(await readFile(file,"utf8"));}catch(e){if(e.code!=="ENOENT")throw e;report={address,network:"studionet",transactions:[],ids:{},readbacks:{}};}
if(report.address!==address)throw Error("Report address mismatch");
const save=()=>writeFile(file,JSON.stringify(report,null,2)+"\n");
const run=promisify(execFile);
const cliRoot=join(process.env.APPDATA,"npm","node_modules","genlayer");
const originalCli=join(cliRoot,"dist","index.js");
const temp=await mkdtemp(join(tmpdir(),"clausepilot-v4-cli-"));
await symlink(join(cliRoot,"node_modules"),join(temp,"node_modules"),"junction");
let cliCode=await readFile(originalCli,"utf8");
const parser="function parseScalar(value) {";
if(!cliCode.includes(parser))throw Error("Unsupported GenLayer CLI parser");
cliCode=cliCode.replace(parser,parser+'\n  if (value.startsWith("cpstr#")) return Buffer.from(value.slice(6), "base64").toString("utf8");');
const cli=join(temp,"cli.mjs");
await writeFile(cli,cliCode);
async function command(args){try{return (await run(process.execPath,[cli,...args],{maxBuffer:64*1024*1024,timeout:900000})).stdout;}catch{throw Error(`CLI command failed (${args[0]}). No automatic resubmission; inspect saved hashes.`);}}
async function retryRead(operation,label){
 for(let attempt=0;attempt<6;attempt++){
  try{return await operation();}
  catch(error){
   if(!/Server busy|fetch failed|ECONNRESET|timeout|Rate limit/i.test(String(error?.details||error?.message||error))||attempt===5)throw error;
   console.log("RPC_READ_RETRY",label,attempt+1);
   const rateLimited=/Rate limit/i.test(String(error?.details||error?.message||error));
   const delay=rateLimited?Math.min(60000,1000*(Number(error?.cause?.data?.retry_after_seconds)||20)+2000):2000*(attempt+1);
   await new Promise(resolve=>setTimeout(resolve,delay));
  }
 }
}
async function read(method,args=[]){const value=await retryRead(()=>client.readContract({address,functionName:method,args}),method);return typeof value==="string"?JSON.parse(value):value;}
const ids=report.ids;
async function snapshot(){const result={totals:await read("get_totals")};for(const [key,id] of Object.entries(ids)){if(key.startsWith("cp"))result[key]=await read("get_checkpoint",[id]);else if(key.startsWith("ob")||key.startsWith("rev"))result[key]=[await read("get_obligation",[id]),await read("get_policy_lifecycle",[id])];}return result;}
async function write(label,account,method,args,expected=""){
 if(report.transactions.some(t=>t.label===label&&t.verified)){const prior=report.transactions.find(t=>t.label===label);if(prior.failure)throw Error(`${label}: previously verified failure; explicit retry stage required`);return prior.returnedId;}
 const pending=report.transactions.find(t=>t.label===label&&!t.verified);
 const before=pending?pending.before:(expected?await snapshot():null);
 let entry=pending;
 if(!entry){
 await command(["account","use",account]);
 const encoded=args.map(v=>typeof v==="string"?"cpstr#"+Buffer.from(v).toString("base64"):JSON.stringify(v));
 const output=await command(["write",address,method,"--rpc","https://studio.genlayer.com/api","--args",...encoded]);
 const hash=output.match(/Write Transaction Hash:\s*(0x[0-9a-fA-F]{64})/)?.[1];
 if(!hash)throw Error(`${label}: no transaction hash returned; inspect network before retry`);
 entry={label,method,hash,verified:false};if(before)entry.before=before;report.transactions.push(entry);await save();
 }
 const hash=entry.hash;
 console.log(`${label}|${hash}|WAITING_FOR_FINALITY`);
 const receipt=await retryRead(()=>client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:3000,retries:600}),"receipt");
 const tx=await retryRead(()=>client.getTransaction({hash}),"transaction");const failure=finalizedFailure(tx);
 if(expected){const leader=tx.consensus_data?.leader_receipt?.[0];const rejection=JSON.stringify(leader?.result??{});if(!failure||!rejection.includes(expected))throw Error(`${label}: expected ${expected}, received ${failure}`);if(before){if(JSON.stringify(before)!==JSON.stringify(await snapshot()))throw Error(`${label}: rollback changed state`);entry.stateUnchanged=true;}else entry.stateComparison="Unavailable after process interruption; receipt independently verified";entry.rollback=expected;}
 else if(failure){entry.failure=failure;entry.consensusResult=transactionResultNumberToName[String(tx.result)];entry.verified=true;await save();throw Error(`${label}: ${failure}`);}
 else {try{entry.returnedId=decodeReturnedId(tx,receipt);}catch{/* Void/semantic return. */}}
 entry.verified=true;delete entry.before;await save();console.log(`${label}|${hash}|FINALIZED|${expected||"SUCCESS"}`);return entry.returnedId;
}
async function create(key,label,account,method,args){if(ids[key]!==undefined)return ids[key];const id=await write(label,account,method,args);if(id===undefined)throw Error(`No returned ID for ${label}`);ids[key]=id;await save();return id;}
const A="lifecycle-a",B="lifecycle-b";
const counterparty="0xc67532aef9d2879cba9375a02e6217a3524657b8";
const fixtureCommit="3e16b30";
const sources=JSON.stringify([
 {origin:"https://raw.githubusercontent.com",url:`https://raw.githubusercontent.com/eaglebooth/ClausePilot/${fixtureCommit}/samples/v4-primary-status.json`,marker:"ClausePilot V4 Demo API"},
 {origin:"https://cdn.jsdelivr.net",url:`https://cdn.jsdelivr.net/gh/eaglebooth/ClausePilot@${fixtureCommit}/samples/v4-monitor-attestation.json`,marker:"ClausePilot V4 Demo API"},
]);
const challengeUrl=`https://cdn.statically.io/gh/eaglebooth/ClausePilot/${fixtureCommit}/samples/v4-counter-evidence.json`;
const challengeBody=await readFile(new URL("../samples/v4-counter-evidence.json",import.meta.url));
// Git-published fixtures use LF bytes.
const challengeDigest=createHash("sha256").update(challengeBody.toString("utf8").replaceAll("\r\n","\n")).digest("hex");
const policy=key=>[key,"UPTIME","Synthetic protocol availability","For this synthetic test, assess whether the ClausePilot V4 Demo API remained available during the sealed observation window.",sources,2,"https://cdn.statically.io",300,3600,300];
const v=await read("get_contract_version");if(v.version!==4||v.consent_schema!=="recovery-revisions-v1"||v.consensus_schema!=="closed-evidence-v1")throw Error("Not the closed-consensus V4 candidate; prior deployment retained as historical evidence");report.version=v;
if(stage==="prepare"){
 const aid=await create("agreement","register",A,"register_agreement",[counterparty,"ClausePilot V4 live verification","v4","8".repeat(64)]);
 await write("accept-agreement",B,"accept_agreement",[aid]);
 for(const name of ["Recovery","Normal"]){
  const oid=await create("ob"+name,"add-"+name,A,"add_obligation",[aid,...policy("v4-"+name.toLowerCase())]);
  const p=await read("get_obligation",[oid]);
  await write("accept-"+name,B,"accept_obligation",[oid,p.terms_digest]);
  if(name==="Recovery"){
   await create("cpRecovery","open-recovery",A,"open_due_checkpoint",[oid]);
   await write("early-recovery",B,"expire_checkpoint",[ids.cpRecovery],"RECOVERY_NOT_DUE");
  }
 }
 report.recovery=await read("get_recovery_state",[ids.cpRecovery]);
 console.log("ASSESSMENT_RECOVERY_AFTER",new Date((report.recovery.deadline+1)*1000).toISOString());
}else if(stage==="exercise"){
 const oid=ids.obNormal;if(oid===undefined)throw Error("Run prepare first");
 const candidate=await create("revAccepted","propose-revision",A,"propose_revision",[oid,...policy("v4-successor")]);
 const alternate=await create("revStale","propose-alternative",A,"propose_revision",[oid,...policy("v4-alternative")]);
 const cancelled=await create("revCancelled","propose-cancelled",A,"propose_revision",[oid,...policy("v4-cancelled")]);
 await write("cancel-revision",B,"cancel_revision",[cancelled]);
 const digest=(await read("get_obligation",[candidate])).terms_digest;
 await write("revision-old-entrypoint",B,"accept_obligation",[candidate,digest],"USE_ACCEPT_REVISION");
 await write("revision-wrong-role",A,"accept_revision",[candidate,digest],"COUNTERPARTY_ONLY");
 await write("revision-wrong-digest",B,"accept_revision",[candidate,"0".repeat(64)],"TERMS_DIGEST_MISMATCH");
 // Use a fresh successor activation to create a current observation window.
 await write("accept-revision",B,"accept_revision",[candidate,digest]);
 await create("cpNormal","open-successor",A,"open_due_checkpoint",[candidate]);
 await write("revision-competing-stale",B,"accept_revision",[alternate,(await read("get_obligation",[alternate])).terms_digest],"REVISION_STALE");
 await write("revision-accept-replay",B,"accept_revision",[candidate,digest],"REVISION_NOT_PENDING");
 await write("close-live-checkpoint",A,"close_obligation",[candidate],"CHECKPOINT_IN_FLIGHT");
 const cp=await read("get_checkpoint",[ids.cpNormal]);
 while(Date.now()/1000<cp.window_end){console.log("OBSERVATION_WAIT",Math.ceil(cp.window_end-Date.now()/1000));await new Promise(r=>setTimeout(r,15000));}
 if((await read("get_checkpoint",[ids.cpNormal])).status==="OPEN")await write("assess-successor",A,"assess_checkpoint",[ids.cpNormal]);
 await write("challenge-successor",B,"submit_challenge",[ids.cpNormal,challengeUrl,"ClausePilot V4 Demo API",challengeDigest]);
 await write("adjudicate-successor",A,"adjudicate_challenge",[ids.cpNormal]);
 await write("finalize-successor",A,"finalize_checkpoint",[ids.cpNormal]);
 const final=await read("get_checkpoint",[ids.cpNormal]);
 if(final.status!=="FINALIZED")throw Error("Successor checkpoint not finalized");
 report.normalOutcome={final_state:final.final_state,challenge_decision:final.challenge_decision};
 report.readbacks.normal=await snapshot();
}else if(stage==="retry-assessment"){
 const previous=report.transactions.find(t=>t.label==="assess-successor");
 if(previous&&!previous.verified){
  const tx=await retryRead(()=>client.getTransaction({hash:previous.hash}),"prior-assessment");
  if(tx.statusName!=="FINALIZED")throw Error("Prior assessment not finalized");
  const failed=finalizedFailure(tx);if(!failed)throw Error("Prior assessment succeeded; reconcile state instead of retrying");
  previous.failure=failed;previous.consensusResult=transactionResultNumberToName[String(tx.result)];previous.verified=true;await save();
 }
 const cid=ids.cpNormal;const cp=await read("get_checkpoint",[cid]);
 if(cp.status!=="OPEN")throw Error("Assessment retry requires OPEN checkpoint");
 await write("assess-successor-retry-1",A,"assess_checkpoint",[cid]);
 report.readbacks.assessmentRetry=await read("get_checkpoint",[cid]);
}else if(stage==="recover"){
 const cid=ids.cpRecovery;if(cid===undefined)throw Error("Run prepare first");
 const state=await read("get_recovery_state",[cid]);
 const alreadyExpired=report.transactions.some(t=>t.label==="expire-open-checkpoint"&&t.verified&&!t.failure);
 if(!state.eligible&&!alreadyExpired){console.log("RECOVERY_NOT_YET_DUE",JSON.stringify(state));await save();process.exit(2);}
 await write("late-assessment",A,"assess_checkpoint",[cid],"ASSESSMENT_DEADLINE_PASSED");
 await write("expire-open-checkpoint",B,"expire_checkpoint",[cid]);
 await write("expiry-replay",A,"expire_checkpoint",[cid],"STALE_CHECKPOINT");
 report.readbacks.recovery=await snapshot();
}else if(stage!=="status")throw Error("Unknown stage");
report.latest=await snapshot();await save();console.log("V4_STAGE_COMPLETE",stage,JSON.stringify({ids,totals:report.latest.totals}));
