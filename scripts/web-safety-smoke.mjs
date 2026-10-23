import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Optional QA uses the Chrome DevTools skill's shared Puppeteer library.
// No wallet is installed in this isolated browser. No transactions are submitted.
if(!process.env.CLAUSEPILOT_BROWSER_LIB)throw Error('Set CLAUSEPILOT_BROWSER_LIB to the Chrome DevTools skill lib/browser.js');
const {getBrowser,getPage,closeBrowser}=await import(pathToFileURL(process.env.CLAUSEPILOT_BROWSER_LIB).href);
const base=process.env.CLAUSEPILOT_WEB_URL||'http://localhost:3104';
const output=new URL('../docs/screenshots/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await getBrowser({...(process.env.CLAUSEPILOT_CHROME_PATH?{executablePath:process.env.CLAUSEPILOT_CHROME_PATH}:{}),viewport:{width:1440,height:1000}});
const page=await getPage(browser);
const errors=[];const writeRequests=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{
  try {const body=JSON.parse(request.postData()||'{}');if(/sendTransaction|sendRawTransaction|writeContract/i.test(body.method||''))writeRequests.push(body.method);}catch{/* Non-RPC request. */}
});
async function click(text){
  const buttons=await page.$$('button');
  for(const button of buttons)if((await button.evaluate(el=>el.textContent)).trim()===text){await button.click();return;}
  throw Error('Button not found: '+text);
}
async function state(){return page.$eval('.statePanel',el=>el.innerText);}
try {
  await page.goto(base+'/monitor',{waitUntil:'networkidle2'});
  assert.equal(await page.evaluate(()=>typeof window.ethereum),'undefined');
  assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('button')).filter(b=>/AI (assessment|adjudication) paused/.test(b.textContent)).map(b=>b.disabled)),[true,true]);
  await click('Load finalized successor');
  await page.waitForFunction(()=>document.querySelector('.notice.ok')?.textContent.includes('state synchronized'),{timeout:60000});
  assert.match(await state(),/FINALIZED/);assert.match(await state(),/SATISFIED/);assert.match(await state(),/UNCHALLENGED/);
  await click('Load recovered timeout');
  await page.waitForFunction(()=>document.querySelector('.statePanel')?.textContent.includes('ASSESSMENT_TIMEOUT')&&document.querySelector('.notice.ok'),{timeout:60000});
  assert.match(await state(),/UNRESOLVED/);
  const labels=await page.$$('label');
  for(const label of labels)if((await label.evaluate(el=>el.textContent)).includes('Revision candidate ID')){await(await label.$('input')).type('2');break;}
  await click('Load policy comparison');
  await page.waitForFunction(()=>document.body.textContent.includes('Parent 1 → candidate 2')&&document.body.textContent.includes('ACCEPTED'),{timeout:60000});
  const recovery=await page.$$('.workCard button');
  for(const button of recovery)if((await button.evaluate(el=>el.textContent)).includes('Expire checkpoint as'))assert.equal(await button.evaluate(el=>el.disabled),true);
  await (await page.$('.statePanel')).screenshot({path:new URL('v4-recovered-state.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  await page.type('#receipt-hash','0x123');await click('Inspect transaction');
  await page.waitForFunction(()=>document.body.textContent.includes('Enter a complete 0x transaction hash'));
  await page.click('#receipt-hash',{clickCount:3});await page.keyboard.press('Backspace');
  await page.type('#receipt-hash','0x4297874681df557a0203515c85c873f0c7bcae5299474bc45123cd314bb19138');await click('Inspect transaction');
  await page.waitForFunction(()=>document.getElementById('receipt-outcome')?.textContent.includes('MAJORITY_DISAGREE'),{timeout:60000});
  await page.goto(base+'/evidence',{waitUntil:'networkidle2'});
  assert.match(await page.$eval('main',el=>el.innerText),/MAJORITY_DISAGREE/);
  await page.screenshot({path:new URL('v4-evidence-desktop.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  await page.setViewport({width:390,height:844});
  await page.goto(base+'/monitor',{waitUntil:'networkidle2'});
  await page.screenshot({path:new URL('v4-monitor-mobile.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).map(el=>({tag:el.tagName,className:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).filter(el=>el.right>window.innerWidth+1||el.left<0).slice(0,12));
  if(overflow.length)console.log('MOBILE_OVERFLOW',JSON.stringify(overflow));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'Mobile monitor overflows horizontally');
  assert.deepEqual(writeRequests,[]);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,base,walletRequired:false,writeRequests:0,successor:'FINALIZED/SATISFIED/UNCHALLENGED',recovery:'FINALIZED/UNRESOLVED/ASSESSMENT_TIMEOUT',revisionComparison:true,failedConsensusReceipt:true,invalidHashRejected:true,mobileOverflow:false,pageErrors:errors},null,2));
}finally{await closeBrowser();}
