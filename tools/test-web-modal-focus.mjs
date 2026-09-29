// Exercise the actual runtime modal against a minimal DOM; browser keyboard
// behavior and the AntD focus boundary are additionally checked in the live UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../demo/web/runtime.js',import.meta.url),'utf8');
const modalSource=source.slice(source.indexOf('  function modal('),source.indexOf('  function ownerElement('));
function harness(){
  const listeners=new Map(),frames=[],activity=[],activeModals=new Set(),current={};
  let focused=0,externalFocus;
  const document={activeElement:null,createElement:tag=>element(tag),addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);}};
  function emit(type,event){for(const listener of [...(listeners.get(type)||[])])listener(event);}
  function element(tag){return {tag,children:[],isConnected:true,setAttribute(){},append(...children){for(const child of children){this.children.push(child);child.parent=this;}},remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);},contains(other){return this===other||this.children.some(child=>child.contains(other));},querySelectorAll(){return this.children.flatMap(child=>['button','textarea','input','select'].includes(child.tag)?[child]:child.querySelectorAll());},get lastChild(){return this.children.at(-1);},focus(){focused++;assert.ok(focused<30,'focus handlers must not recurse indefinitely');document.activeElement=this;emit('focusin',{target:this});externalFocus?.(this);}};}
  const overlays=element('overlay'),outside=element('outside');document.activeElement=outside;
  const window={dispatchEvent(event){activity.push({name:event.type,open:activeModals.size>0,focused});}};
  const sandbox={document,window,overlays,current,activeModals,CustomEvent:class{constructor(type){this.type=type;}},requestAnimationFrame:fn=>frames.push(fn),report:error=>{throw error;}};
  runInNewContext(modalSource+'\nthis.modal=modal;',sandbox);
  return {modal:sandbox.modal,activity,activeModals,document,outside,overlays,
    flush(){while(frames.length)frames.shift()();},
    key(key,shiftKey=false){const event={key,shiftKey,preventDefault(){},stopPropagation(){}};emit('keydown',event);},
    setExternalFocus(fn){externalFocus=fn;},get focused(){return focused;},
    controls(){return overlays.children.at(-1).querySelectorAll();}};
}
test('native modal announces focus ownership before initial focus and releases after completion',async()=>{
  const h=harness(),result=h.modal({title:'确认',cancelText:'继续编辑'});
  assert.deepEqual(h.activity,[{name:'sales-native-modal-change',open:true,focused:0}]);
  h.flush();assert.equal(h.document.activeElement,h.controls().at(-1));
  h.key('Tab');assert.equal(h.document.activeElement,h.controls()[0]);
  h.key('Tab',true);assert.equal(h.document.activeElement,h.controls().at(-1));
  h.key('Escape');assert.equal((await result).cancel,true);assert.equal(h.activity.at(-1).open,false);
  h.flush();assert.equal(h.document.activeElement,h.outside);
});
test('nested native confirmations retain ownership until the final dialog closes',async()=>{
  const h=harness(),one=h.modal({title:'第一层'});h.flush();const two=h.modal({title:'第二层'});h.flush();
  h.controls().at(-1).onclick();assert.equal((await two).confirm,true);assert.equal(h.activity.at(-1).open,true);assert.equal(h.activeModals.size,1);
  h.flush();h.controls()[0].onclick();assert.equal((await one).cancel,true);assert.equal(h.activity.at(-1).open,false);
});
test('an unexpected external focus trap cannot recursively overflow the native handler',()=>{
  const h=harness();h.modal({title:'确认'});h.flush();
  h.setExternalFocus(target=>{if(target.tag==='button')h.outside.focus();});
  h.outside.focus();assert.ok(h.focused<8);assert.equal(h.activeModals.size,1);
});
