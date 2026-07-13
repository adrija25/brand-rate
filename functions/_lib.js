export const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json","cache-control":"no-store"}});
export const id = (prefix="") => prefix + crypto.randomUUID().replaceAll("-", "");
export async function sha256(value){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
export async function unlock(env, kitId, provider, paymentId){
  const token=id("br_"); const hash=await sha256(token); const paidAt=new Date().toISOString();
  const result=await env.DB.prepare("UPDATE kits SET status='paid',access_token_hash=?,payment_provider=?,payment_id=?,paid_at=? WHERE id=? AND status='locked'").bind(hash,provider,paymentId,paidAt,kitId).run();
  if(!result.meta.changes){const row=await env.DB.prepare("SELECT status FROM kits WHERE id=?").bind(kitId).first(); if(!row) throw new Error("Kit not found"); if(row.status==='paid') throw new Error("Kit already unlocked");}
  return token;
}
