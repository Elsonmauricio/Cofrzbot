import { supabase } from '@/lib/supabase';
import type { TransactionType } from '@/types/finance';

export async function addTransaction(opts:{
  userId:string;
  accountId:string|null;
  categoryId:string|null;
  valor:number;
  tipo:TransactionType;
  descricao?:string|null;
  occurredAt?:Date;
}){
  if(!opts.accountId||!opts.categoryId||!opts.valor||!opts.tipo) throw new Error('Dados insuficientes para registar transação');
  const {error}=await supabase.from('transactions').insert({
    user_id:opts.userId,
    account_id:opts.accountId,
    category_id:opts.categoryId,
    valor:opts.valor,
    tipo:opts.tipo,
    descricao:opts.descricao||null,
    occurred_at:(opts.occurredAt||new Date()).toISOString(),
  });
  if(error) throw error;
  return {ok:true};
}

export async function getSaldo(userId:string){
  const {data:tx}=await supabase.from('transactions').select('valor,tipo').eq('user_id',userId);
  let total=0;
  for(const t of tx||[]) total += t.tipo==='income'?t.valor:-t.valor;
  const now=new Date();
  const start=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
  const end=new Date(now.getFullYear(),now.getMonth()+1,1).toISOString();
  const {data:txm}=await supabase.from('transactions').select('valor,tipo').eq('user_id',userId).gte('occurred_at',start).lt('occurred_at',end);
  let mes=0;
  for(const t of txm||[]) mes += t.tipo==='income'?t.valor:-t.valor;
  return {total,mes};
}

export async function getResumoMes(userId:string){
  const now=new Date();
  const start=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
  const end=new Date(now.getFullYear(),now.getMonth()+1,1).toISOString();
  const {data}=await supabase.from('transactions').select('valor,tipo,categories(nome)').eq('user_id',userId).gte('occurred_at',start).lt('occurred_at',end);
  let receitas=0,despesas=0;
  const by=new Map<string,number>();
  for(const t of data||[]){
    if(t.tipo==='income') receitas+=t.valor;
    if(t.tipo==='expense') { despesas+=t.valor; const nome=(t as any).categories?.nome||'Outros'; by.set(nome,(by.get(nome)||0)+t.valor); }
  }
  const byCategory=Array.from(by.entries()).map(([categoria,total])=>({categoria,total})).sort((a,b)=>b.total-a.total);
  return {receitas,despesas,saldo:receitas-despesas,byCategory};
}

function rangeToday(){
  const d=new Date(); const start=new Date(d.getFullYear(),d.getMonth(),d.getDate()); const end=new Date(start.getTime()+24*60*60*1000);
  return {start:start.toISOString(),end:end.toISOString()};
}
function rangeWeek(){
  const d=new Date(); const start=new Date(d.getFullYear(),d.getMonth(),d.getDate()-6); const end=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);
  return {start:start.toISOString(),end:end.toISOString()};
}
function rangeMonth(){
  const now=new Date(); return {start:new Date(now.getFullYear(),now.getMonth(),1).toISOString(),end:new Date(now.getFullYear(),now.getMonth()+1,1).toISOString()};
}

export async function getHoje(userId:string){
  const {start,end}=rangeToday();
  const {data}=await supabase.from('transactions').select('valor,tipo').eq('user_id',userId).gte('occurred_at',start).lt('occurred_at',end);
  let count=data?.length||0, totalExp=0,totalInc=0;
  for(const t of data||[]){ if(t.tipo==='expense') totalExp+=t.valor; if(t.tipo==='income') totalInc+=t.valor; }
  return {count,totalExp,totalInc};
}
export async function getSemana(userId:string){
  const {start,end}=rangeWeek();
  const {data}=await supabase.from('transactions').select('valor,tipo').eq('user_id',userId).gte('occurred_at',start).lt('occurred_at',end);
  let count=data?.length||0,totalExp=0,totalInc=0;
  for(const t of data||[]){ if(t.tipo==='expense') totalExp+=t.valor; if(t.tipo==='income') totalInc+=t.valor; }
  return {count,totalExp,totalInc};
}
export async function getMes(userId:string){
  const {start,end}=rangeMonth();
  const {data}=await supabase.from('transactions').select('valor,tipo').eq('user_id',userId).gte('occurred_at',start).lt('occurred_at',end);
  let count=data?.length||0,totalExp=0,totalInc=0;
  for(const t of data||[]){ if(t.tipo==='expense') totalExp+=t.valor; if(t.tipo==='income') totalInc+=t.valor; }
  return {count,totalExp,totalInc};
}

export async function gastosPorCategoriaMes(userId:string,categoria:string){
  const now=new Date(); const start=new Date(now.getFullYear(),now.getMonth(),1).toISOString(); const end=new Date(now.getFullYear(),now.getMonth()+1,1).toISOString();
  const {data}=await supabase.from('transactions').select('valor,categories(nome)').eq('user_id',userId).eq('tipo','expense').gte('occurred_at',start).lt('occurred_at',end);
  let total=0;
  for(const t of data||[]){ if(((t as any).categories?.nome||'').toLowerCase()===categoria.toLowerCase()) total+=t.valor; }
  return total;
}

export async function totalRecebidoMes(userId:string){
  const now=new Date(); const start=new Date(now.getFullYear(),now.getMonth(),1).toISOString(); const end=new Date(now.getFullYear(),now.getMonth()+1,1).toISOString();
  const {data}=await supabase.from('transactions').select('valor').eq('user_id',userId).eq('tipo','income').gte('occurred_at',start).lt('occurred_at',end);
  return (data||[]).reduce((s,x)=>s+x.valor,0);
}