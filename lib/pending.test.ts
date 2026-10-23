import test from 'node:test';
import assert from 'node:assert/strict';
import {clearPending, pendingHash, storePending, subscribePending} from './pending.ts';

test('saved pending hash survives a read and only the matching receipt clears it',()=>{
  const items=new Map<string,string>();
  const browser=Object.assign(new EventTarget(),{localStorage:{getItem:(k:string)=>items.get(k)??null,setItem:(k:string,v:string)=>items.set(k,v),removeItem:(k:string)=>items.delete(k)}});
  Object.defineProperty(globalThis,'window',{value:browser,configurable:true});
  const hash='0x'+'a'.repeat(64);
  try {
    storePending(hash);
    assert.equal(pendingHash(),hash);
    const unsubscribe=subscribePending(()=>{});
    const key=Array.from(items.keys())[0];
    items.delete(key);
    browser.dispatchEvent(Object.assign(new Event('storage'),{key,newValue:null}));
    assert.equal(pendingHash(),'');
    unsubscribe();
    storePending(hash);
    clearPending('0x'+'b'.repeat(64));
    assert.equal(pendingHash(),hash);
    clearPending(hash);
    assert.equal(pendingHash(),'');
    assert.equal(items.size,0);
  } finally {clearPending(hash);Reflect.deleteProperty(globalThis,'window');}
});
test('storage denial retains an in-memory guard without throwing away the hash',()=>{
  const browser=Object.assign(new EventTarget(),{localStorage:{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');},removeItem:()=>{throw Error('denied');}}});
  Object.defineProperty(globalThis,'window',{value:browser,configurable:true});
  const hash='0x'+'c'.repeat(64);
  try {storePending(hash);assert.equal(pendingHash(),hash);clearPending(hash);assert.equal(pendingHash(),'');}
  finally {clearPending(hash);Reflect.deleteProperty(globalThis,'window');}
});
