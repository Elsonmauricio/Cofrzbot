import { supabase } from '../lib/supabase.js';

export async function ensureDefaultCategories(userId: string) {
  const defaults = ['Alimentação','Transporte','Casa','Saúde','Estudos','Lazer','Compras','Salário','Outros'];
  const { data: existing } = await supabase.from('categories').select('nome').eq('user_id', userId);
  const set = new Set((existing||[]).map(e=>e.nome));
  const toInsert = defaults.filter(d=>!set.has(d)).map(nome=>({user_id:userId,nome}));
  if (toInsert.length>0) await supabase.from('categories').insert(toInsert);
}

export async function getCategoryIdByName(userId:string,nome:string|null,tipo?:'income'|'expense'){
  if(!nome) {
    const def = tipo==='income'?'Salário':'Outros';
    const {data}=await supabase.from('categories').select('id').eq('user_id',userId).ilike('nome',def).maybeSingle();
    if(data) return data.id;
    const {data:c}=await supabase.from('categories').insert({user_id:userId,nome:def,tipo}).select('id').single();
    return c?.id||null;
  }
  const {data}=await supabase.from('categories').select('id').eq('user_id',userId).ilike('nome',nome).maybeSingle();
  if(data) return data.id;
  const {data:c}=await supabase.from('categories').insert({user_id:userId,nome,tipo:tipo||null}).select('id').single();
  return c?.id||null;
}

export async function getCategorySpendMonth(userId:string){
  const now=new Date();
  const start=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
  const end=new Date(now.getFullYear(),now.getMonth()+1,1).toISOString();
  const {data}=await supabase
    .from('transactions')
    .select('valor,categories(nome)')
    .eq('user_id',userId)
    .eq('tipo','expense')
    .gte('occurred_at',start)
    .lt('occurred_at',end);
  const map=new Map<string,number>();
  for(const t of data||[]){
    const nome=(t as any).categories?.nome||'Outros';
    map.set(nome,(map.get(nome)||0)+t.valor);
  }
  return Array.from(map.entries()).map(([nome,total])=>({nome,total})).sort((a,b)=>b.total-a.total);
}
