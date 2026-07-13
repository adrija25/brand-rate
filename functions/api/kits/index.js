import {json,id} from "../../_lib.js";
export async function onRequestPost({request,env}){
  try{const body=await request.json(); if(!body?.payload) return json({error:"Missing kit payload"},400);
    const kitId=id("kit_"); await env.DB.prepare("INSERT INTO kits(id,payload,email,status,created_at) VALUES(?,?,?,'locked',?)").bind(kitId,JSON.stringify(body.payload),body.email||null,new Date().toISOString()).run();
    return json({kitId});
  }catch(e){return json({error:e.message},500)}
}
