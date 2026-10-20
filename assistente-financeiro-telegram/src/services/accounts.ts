import { supabase } from '../lib/supabase.js';

export async function ensureUser(telegramId: number, nome?: string) {
  let { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegramId).maybeSingle();
  if (!user) {
    const { data: created, error } = await supabase
      .from('users')
      .insert({ telegram_id: telegramId, nome })
      .select('*')
      .single();
    if (error) throw error;
    user = created;
  }
  return user;
}

export async function ensureDefaultAccounts(userId: string) {
  const defaults = ['Dinheiro', 'Banco', 'Cartão', 'MB Way', 'Poupança'];
  const { data: existing } = await supabase.from('accounts').select('nome').eq('user_id', userId);
  const existingSet = new Set((existing || []).map((e) => e.nome));
  const toInsert = defaults.filter((d) => !existingSet.has(d)).map((nome) => ({ user_id: userId, nome, saldo_inicial: 0 }));
  if (toInsert.length > 0) {
    await supabase.from('accounts').insert(toInsert);
  }
}

export async function getDefaultAccountId(userId: string): Promise<string | null> {
  const { data } = await supabase.from('accounts').select('id,nome').eq('user_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle();
  return data?.id || null;
}

export async function getAccountIdByName(userId: string, nome: string | null): Promise<string | null> {
  if (!nome) return getDefaultAccountId(userId);
  const { data } = await supabase.from('accounts').select('id').eq('user_id', userId).ilike('nome', nome).maybeSingle();
  if (data) return data.id;
  const { data: created } = await supabase.from('accounts').insert({ user_id: userId, nome, saldo_inicial: 0 }).select('id').single();
  return created?.id || null;
}

export async function listAccountsWithBalance(userId: string) {
  const { data: accounts } = await supabase.from('accounts').select('id,nome,saldo_inicial').eq('user_id', userId).order('nome');
  const accIds = (accounts || []).map((a) => a.id);
  let sums: Record<string, number> = {};
  if (accIds.length > 0) {
    const { data: tx } = await supabase
      .from('transactions')
      .select('account_id, valor, tipo')
      .eq('user_id', userId)
      .in('account_id', accIds);
    sums = {};
    for (const t of tx || []) {
      const v = t.tipo === 'income' ? t.valor : -t.valor;
      sums[t.account_id] = (sums[t.account_id] || 0) + v;
    }
  }
  return (accounts || []).map((a) => ({
    nome: a.nome,
    saldo: (a.saldo_inicial || 0) + (sums[a.id] || 0),
  }));
}
