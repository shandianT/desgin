import {distributionError} from './distribution-model.js';
const TOKEN=/^[A-Za-z0-9_-]{32,128}$/;
export function shareToken(hash = globalThis.location?.hash || '') {
  const params=new URLSearchParams(hash.replace(/^#/,''));
  const value=params.get('token');
  if(!TOKEN.test(value||''))throw Error('分享链接不完整，请联系分享人重新获取');
  return value;
}
export function browserIdentifier(storage=globalThis.localStorage,random=()=>crypto.randomUUID()) {
  const key='salesbuddy:knowledge-visitor';
  try {const saved=storage.getItem(key);if(/^[A-Za-z0-9_-]{16,128}$/.test(saved||''))return saved;}catch{}
  const value=random();try{storage.setItem(key,value);}catch{}
  return value;
}
export function createPublicService(token,fetcher=globalThis.fetch) {
  if(!TOKEN.test(token||''))throw Error('分享链接无效');
  async function request(path,{body,key,grant,binary=false}={}) {
    let result;
    try {
      result=await fetcher('/api/v1/public/knowledge'+path,{method:body?'POST':'GET',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000),headers:{'X-Knowledge-Share':token,...(grant?{'X-Knowledge-Grant':grant}:{}),...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
    }catch {throw Object.assign(Error('网络连接未完成，请稍后重新读取；不会自动重复提交'),{code:'NETWORK_ERROR'});}
    if(!result.ok){let data;try{data=await result.json();}catch{}throw distributionError({serverCode:data?.code||data?.detail,statusCode:result.status});}
    if(binary){const blob=await result.blob();if(!blob.size)throw Error('文件为空，请联系分享人');return blob;}
    try{return await result.json();}catch{throw Object.assign(Error('响应未完整收到，请确认原提交或重新读取'),{code:'NETWORK_ERROR'});}
  }
  return {
    read:browserId=>request('/share?browser_id='+encodeURIComponent(browserId)),
    respond:(body,key)=>request('/responses',{body,key}),
    cover:()=>request('/cover',{binary:true}),
    file:(fileId,kind,grant)=>{
      if(!['preview','download'].includes(kind)||!grant)throw Error('请先完成资料访问问卷');
      return request(`/files/${encodeURIComponent(fileId)}/${kind}`,{grant,binary:true});
    },
  };
}
