"use client";

import {useState} from "react";
import {readContract, unwrap} from "@/lib/genlayer";

type Policy = {obligation_id:string;agreement_id:string;obligation_key:string;kind:string;title:string;requirement:string;sources:{origin:string;url:string;marker:string}[];corroboration_threshold:number;challenge_origin:string;challenge_seconds:number;cadence_seconds:number;window_seconds:number;terms_digest:string;accepted:boolean};
type Lifecycle = {obligation_id:string;parent_id:string;successor_id:string;revision:number;revision_status:string;stale:boolean;active:boolean;open_checkpoint_id:string;owner:string;counterparty:string;assessment_grace:number;adjudication_grace:number};
type Props = {wallet:string;busy:boolean;compatible:boolean;parentId:string;proposalArgs:unknown[];submit:(label:string,method:string,args:unknown[],onId?:(id:string)=>void)=>Promise<void>};

export default function RevisionPanel({wallet,busy,compatible,parentId,proposalArgs,submit}:Props){
 const [candidateId,setCandidateId]=useState("");
 const [revisionKey,setRevisionKey]=useState("");
 const [loaded,setLoaded]=useState<{id:string;candidate:Policy;parent:Policy;life:Lifecycle;parentLife:Lifecycle}|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [acting,setActing]=useState(false);
 const current=loaded?.id===candidateId?loaded:null;
 const blocked=busy||loading||acting||!compatible;
 const isCounterparty=current?.life.counterparty.toLowerCase()===wallet.toLowerCase();
 const isParty=isCounterparty||current?.life.owner.toLowerCase()===wallet.toLowerCase();
 async function load(id=candidateId){
  setLoading(true);setError("");setLoaded(null);
  try{
   const [p,l]=await Promise.all([readContract("get_obligation",[id]),readContract("get_policy_lifecycle",[id])]);
   const candidate=p.success?unwrap<Policy>(p.data):null;const life=l.success?unwrap<Lifecycle>(l.data):null;
   if(!candidate||!life?.parent_id)throw new Error("Load a revision candidate, not an original obligation.");
   const [old,ol]=await Promise.all([readContract("get_obligation",[life.parent_id]),readContract("get_policy_lifecycle",[life.parent_id])]);
   const parent=old.success?unwrap<Policy>(old.data):null;const parentLife=ol.success?unwrap<Lifecycle>(ol.data):null;
   if(!parent||!parentLife)throw new Error("Unable to verify parent policy.");
   setLoaded({id,candidate,parent,life,parentLife});
  }catch(e){setError(e instanceof Error?e.message:"Revision read failed.");}finally{setLoading(false);}
 }
 async function act(method:string){
  if(!current)return;
  setActing(true);
  try{await submit(method==="accept_revision"?"Accept policy revision":"Cancel policy revision",method,method==="accept_revision"?[candidateId,current.candidate.terms_digest]:[candidateId]);await load();}finally{setActing(false);}
 }
 function policyRows(policy:Policy):[string,string][] {return [
  ["Kind / title",`${policy.kind} / ${policy.title}`],["Requirement",policy.requirement],
  ["Sources",JSON.stringify(policy.sources,null,2)],["Threshold",String(policy.corroboration_threshold)],
  ["Challenge",`${policy.challenge_origin} · ${policy.challenge_seconds}s`],
  ["Schedule",`${policy.cadence_seconds}s cadence · ${policy.window_seconds}s observation`],
 ];}
 return <article className="workCard full">
  <div className="cardTitle"><span>04</span><div><small>BILATERAL POLICY REVISIONS</small><h2>Change policy with fresh consent</h2></div></div>
  <p>The owner uses the policy builder above to propose a complete replacement for parent obligation {parentId||"—"}. Proposal keeps the current policy running. The counterparty must review and accept the exact new digest after any checkpoint finishes.</p>
  <label>Unique replacement obligation key<input value={revisionKey} maxLength={64} placeholder="uptime-policy-r1" onChange={e=>setRevisionKey(e.target.value)}/></label>
  <button className="secondary" disabled={blocked||!parentId||revisionKey.length<3} onClick={()=>submit("Propose policy revision","propose_revision",[parentId,revisionKey,...proposalArgs.slice(1)],id=>{setCandidateId(id);setLoaded(null);})}>Propose replacement from policy builder</button>
  <div className="two"><label>Revision candidate ID<input value={candidateId} onChange={e=>{setCandidateId(e.target.value);setLoaded(null);}}/></label><button className="secondary" disabled={blocked||!candidateId} onClick={()=>load()}>Load policy comparison</button></div>
  {error&&<p role="alert">{error}</p>}
  {current&&<>
   <p>Parent {current.life.parent_id} → candidate {candidateId} · revision {current.life.revision} · {current.life.stale?"STALE":current.life.revision_status}</p>
   <div style={{overflowX:"auto"}}><table><thead><tr><th>Policy</th><th>Current parent</th><th>Proposed successor</th></tr></thead><tbody>{policyRows(current.candidate).map(([label,value],index)=><tr key={label}><th>{label}</th><td style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{policyRows(current.parent)[index][1]}</td><td style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{value}</td></tr>)}</tbody></table></div>
   <p>Assessment and adjudication grace: {current.life.assessment_grace}s / {current.life.adjudication_grace}s. These rules are committed in the consent digest.</p>
   <label>Exact candidate digest<code style={{overflowWrap:"anywhere"}}>{current.candidate.terms_digest}</code></label>
   {current.parentLife.open_checkpoint_id&&<p>Acceptance blocked by parent checkpoint {current.parentLife.open_checkpoint_id}. Finish or recover that checkpoint first.</p>}
   <div className="two"><button className="primary" disabled={blocked||!isCounterparty||current.life.stale||!current.life.active||current.life.revision_status!=="PENDING"||!!current.parentLife.open_checkpoint_id} onClick={()=>act("accept_revision")}>Accept exact revision digest</button><button className="secondary" disabled={blocked||!isParty||current.life.revision_status!=="PENDING"} onClick={()=>act("cancel_revision")}>Cancel pending revision</button></div>
   <p>Accepted revisions start a fresh schedule with UNRESOLVED standing. Historical checkpoints remain attached to the parent policy.</p>
  </>}
 </article>;
}
