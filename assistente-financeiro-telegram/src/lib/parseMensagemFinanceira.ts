export type Intencao = 'receita' | 'despesa' | 'saldo';

export interface ResultadoParse {
  intencao: Intencao | null;
  valor: number | null;
  moeda: string;
  categoria: string;
  sucesso: boolean;
  erro: string | null;
}

const INTENCOES: Record<Intencao, string[]> = {
  receita: ['recebi', 'ganhei', 'entrou', 'receita', 'rendimento', 'salario', 'salário'],
  despesa: ['gastei', 'paguei', 'comprei', 'despesa', 'custo', 'debito', 'débito'],
  saldo: ['tenho', 'possuo', 'em mão', 'em mao', 'carteira', 'saldo'],
};

const MOEDAS: Record<string, string> = {
  yuan: 'CNY',
  yan: 'CNY',
  rmb: 'CNY',
  real: 'BRL',
  reais: 'BRL',
  euro: 'EUR',
  euros: 'EUR',
  brl: 'BRL',
  cny: 'CNY',
  eur: 'EUR',
};

const DEFAULT_MOEDA = 'BRL';

export function parseMensagemFinanceira(texto: string): ResultadoParse {
  const t = String(texto || '').toLowerCase().trim();

  let intencao: Intencao | null = null;
  for (const [key, words] of Object.entries(INTENCOES) as [Intencao, string[]][]) {
    if (words.some((w) => t.includes(w))) {
      intencao = key;
      break;
    }
  }

  const valorMatch = t.match(/(\d+[.,]\d{1,2}|\d+)/);
  const valor = valorMatch ? parseFloat(valorMatch[1].replace(',', '.')) : null;

  let moeda = DEFAULT_MOEDA;
  for (const [word, code] of Object.entries(MOEDAS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(t)) {
      moeda = code;
      break;
    }
  }

  const palavras = t.split(/\s+/);
  const ignorar = new Set<string>([
    ...Object.values(INTENCOES).flat(),
    ...Object.keys(MOEDAS),
    ...Object.values(MOEDAS).map((c) => c.toLowerCase()),
  ]);
  let categoria = 'Geral';
  for (const p of palavras) {
    const limpo = p.replace(/[^a-záéíóúâêôãõç]/gi, '');
    if (!limpo) continue;
    if (ignorar.has(limpo)) continue;
    if (/^\d/.test(limpo)) continue;
    categoria = limpo.charAt(0).toUpperCase() + limpo.slice(1);
    break;
  }

  if (!intencao) {
    return { intencao: null, valor, moeda, categoria, sucesso: false, erro: 'Intenção não identificada' };
  }
  if (valor === null || isNaN(valor)) {
    return { intencao, valor: null, moeda, categoria, sucesso: false, erro: 'Valor não encontrado' };
  }
  return { intencao, valor, moeda, categoria, sucesso: true, erro: null };
}
