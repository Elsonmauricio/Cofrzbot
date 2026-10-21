import type { ParsedTransaction, TransactionType } from '../types/finance.js';

const DEFAULT_CATEGORIES: string[] = [
  'Alimentação',
  'Transporte',
  'Casa',
  'Saúde',
  'Estudos',
  'Lazer',
  'Compras',
  'Salário',
  'Outros',
];

const CAT_MAP: Record<string, string> = {
  comida: 'Alimentação',
  refeição: 'Alimentação',
  jantar: 'Alimentação',
  almoço: 'Alimentação',
  cafe: 'Alimentação',
  mercado: 'Alimentação',
  uber: 'Transporte',
  taxi: 'Transporte',
  autocarro: 'Transporte',
  metro: 'Transporte',
  combustível: 'Transporte',
  gasoleo: 'Transporte',
  gasolina: 'Transporte',
  casa: 'Casa',
  renda: 'Casa',
  luz: 'Casa',
  água: 'Casa',
  internet: 'Casa',
  saúde: 'Saúde',
  farmacia: 'Saúde',
  médico: 'Saúde',
  estudos: 'Estudos',
  curso: 'Estudos',
  livro: 'Estudos',
  lazer: 'Lazer',
  cinema: 'Lazer',
  ginásio: 'Lazer',
  compras: 'Compras',
  roupa: 'Compras',
  salário: 'Salário',
  ordenado: 'Salário',
  vencimento: 'Salário',
};

export function extractValue(text: string): number | null {
  const patterns = [
    /(\d+[.,]\d{1,2})\s*€?/i,
    /(\d+)\s*€?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const raw = m[1].replace(',', '.');
      const n = parseFloat(raw);
      if (!isNaN(n) && n >= 0) return Math.round(n * 100) / 100;
    }
  }
  return null;
}

export function detectType(text: string): TransactionType | null {
  const t = text.toLowerCase();
  if (/(recebi|receita|ganhei|rendimento|tenho|possuo|em mão|em mao|carteira|saldo)/.test(t)) return 'income';
  if (/(gastei|paguei|despesa|debito|custo|comprei)/.test(t)) return 'expense';
  if (t.startsWith('/receita')) return 'income';
  if (t.startsWith('/gasto')) return 'expense';
  return null;
}

export function detectCategory(text: string): string | null {
  const t = text.toLowerCase();
  const currencyWords = ['yuan', 'yan', 'rmb', 'real', 'reais', 'euro', 'euros', 'brl', 'cny', 'eur'];
  for (const key of Object.keys(CAT_MAP)) {
    if (t.includes(key)) {
      return CAT_MAP[key];
    }
  }
  const m = t.match(/(\d+[.,]?\d*)\s*€?\s+([a-zA-ZÀ-ÿ\s]+?)(?:\s+|$)/);
  if (m && m[2]) {
    const cand = m[2].trim();
    if (currencyWords.includes(cand)) return null;
    if (cand.length > 2 && cand.length < 20) {
      const cap = cand.charAt(0).toUpperCase() + cand.slice(1);
      return cap;
    }
  }
  return null;
}

export function detectAccount(text: string): string | null {
  const t = text.toLowerCase();
  const accs = ['dinheiro', 'banco', 'cartão', 'mb way', 'mbway', 'poupança', 'multibanco'];
  for (const a of accs) {
    if (t.includes(a)) return a === 'mbway' ? 'MB Way' : a.charAt(0).toUpperCase() + a.slice(1);
  }
  return null;
}

export function extractDescription(text: string): string | null {
  let t = text.trim();
  t = t.replace(/^\/(gasto|receita)\s+/i, '');
  t = t.replace(/\d+[.,]\d{1,2}\s*€?/g, '');
  t = t.replace(/\d+\s*€?/g, '');
  const cat = detectCategory(text);
  if (cat) {
    const re = new RegExp(cat.toLowerCase(), 'i');
    t = t.replace(re, '');
  }
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length === 0 || t.length > 80) return null;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function parseNatural(text: string): ParsedTransaction {
  const valor = extractValue(text);
  const tipo = detectType(text);
  const categoriaNome = detectCategory(text);
  const contaNome = detectAccount(text);
  const descricao = extractDescription(text);
  return {
    valor,
    tipo,
    categoriaNome,
    descricao,
    contaNome,
    date: new Date(),
  };
}

export function getDefaultCategories(): string[] {
  return DEFAULT_CATEGORIES;
}
