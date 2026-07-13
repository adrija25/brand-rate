import {json} from "../../_lib.js";
export async function onRequestGet({params,env}){const row=await env.DB.prepare("SELECT id,payload,status FROM kits WHERE id=?").bind(params.id).first(); if(!row)return json({error:"Kit not found"},404); return json({id:row.id,payload:JSON.parse(row.payload),status:row.status});}
