export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  telegram_id: number;
  nome?: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  nome: string;
  saldo_inicial: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  nome: string;
  tipo?: TransactionType | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  valor: number;
  tipo: TransactionType;
  descricao?: string | null;
  occurred_at: string;
  created_at: string;
}

export interface Preference {
  id: string;
  user_id: string;
  tipo: 'gosto' | 'interesse' | 'preferencia';
  valor: string;
  created_at: string;
}

export interface ParsedTransaction {
  valor: number | null;
  tipo: TransactionType | null;
  categoriaNome: string | null;
  descricao: string | null;
  contaNome: string | null;
  date: Date;
}

export interface SummaryMonth {
  receitas: number;
  despesas: number;
  saldo: number;
  byCategory: Array<{ categoria: string; total: number }>;
}