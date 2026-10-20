import { supabase } from '../lib/supabase.js';

export async function addGosto(userId:string,valor:string){
  const v=valor.trim();
  if(v.length===0) return {ok:false};
  const {data:ex}=await supabase.from('preferences').select('id').eq('user_id',userId).eq('tipo','gosto').ilike('valor',v).maybeSingle();
  if(ex) return {ok:true,exists:true};
  await supabase.from('preferences').insert({user_id:userId,tipo:'gosto',valor:v});
  return {ok:true};
}

export async function listGostos(userId:string){
  const {data}=await supabase.from('preferences').select('valor').eq('user_id',userId).eq('tipo','gosto').order('created_at',{ascending:true});
  return (data||[]).map(d=>d.valor);
}
