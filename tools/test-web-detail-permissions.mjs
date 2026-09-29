import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../demo/web/detail-workspace.js',import.meta.url),'utf8');
function ready(session,allowed,op){
 const page={route:'pages/customer-assets/index',data:{customerId:'c',opportunityId:'o',opportunity:{id:'o',customer_id:'c',owner_id:'u',...op}}};
 const sandbox={SalesRuntime:{app:{globalData:{session},can:()=>allowed}}};
 runInNewContext(source,sandbox);sandbox.SalesDetailWorkspace.configure(page);return page.data.webCanEditOpportunity;
}
test('modern detail edit requires both current permission and server record grant',()=>{
 const session={userId:'u',role:'sales',permissions:{'opportunity.update':true},capabilities:{'opportunity.edit':true}};
 assert.equal(ready(session,true,{can_edit:true}),true);
 assert.equal(ready(session,true,{can_edit:false}),false);
 assert.equal(ready(session,true,{}),false);
 assert.equal(ready(session,false,{can_edit:true}),false);
 assert.equal(ready(session,true,{id:'different',can_edit:true}),false);
});
test('legacy detail edit preserves owner scope without inferring a missing grant',()=>{
 const session={userId:'u',role:'sales',capabilities:{'opportunity.edit':true}};
 assert.equal(ready(session,true,{}),true);
 assert.equal(ready(session,true,{owner_id:'another'}),false);
 assert.equal(ready(session,false,{}),false);
});
