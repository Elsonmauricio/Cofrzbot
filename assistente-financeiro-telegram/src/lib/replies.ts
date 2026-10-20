export const replies = {
  start: (nome?: string) =>
    `Olá${nome ? `, *${nome}*` : ''}!\n\n` +
    `Eu sou o teu *Assistente Financeiro* no Telegram.\n\n` +
    `Escreve algo como: *"gastei 12€ uber transporte"* ou *"recebi 850€ salário"*. ` +
    `Também podes usar comandos: /ajuda, /saldo, /resumo, /hoje, /mes, /categorias, /contas, /gostos.\n\n` +
    `Resposta rápida e direta.`,

  ajuda: `*Comandos principais*\n` +
    `- /start – Apresentação\n` +
    `- /ajuda – Esta ajuda\n` +
    `- /gasto [valor] [categoria] [descrição]\n` +
    `- /receita [valor] [categoria] [descrição]\n` +
    `- /saldo – Saldo total e do mês\n` +
    `- /resumo – Resumo do mês\n` +
    `- /categorias – Categorias + total gasto\n` +
    `- /contas – Contas + saldos\n` +
    `- /hoje – Transações de hoje\n` +
    `- /semana – Transações da semana\n` +
    `- /mes – Transações do mês\n` +
    `- /gostos – Lista de gostos\n` +
    `- /adicionargosto [texto] – Adicionar gosto\n\n` +
    `*Exemplos naturais*\n` +
    `- "gastei 12€ uber transporte"\n` +
    `- "paguei 35€ comida"\n` +
    `- "recebi 850€ salário"\n` +
    `- "adiciona despesa 20€ internet"\n` +
    `- "quanto gastei este mês?"\n` +
    `- "qual é o meu saldo?"`,

  notAllowed: `Não autorizado. Este bot só funciona para o ID autorizado.`,

  invalidSecret: `Webhook inválido: secret_token incorreto.`,

  notUnderstood: `Não percebi. Usa um exemplo: *"gastei 12€ uber transporte"* ou */ajuda*.`,

  transactionAdded: (tipo: 'income' | 'expense', valor: number, cat?: string | null, desc?: string | null, conta?: string | null) => {
    const label = tipo === 'income' ? 'Receita' : 'Despesa';
    const parts = [`*${label}* registada: *${valor.toFixed(2)}€*`];
    if (cat) parts.push(`Categoria: ${cat}`);
    if (conta) parts.push(`Conta: ${conta}`);
    if (desc) parts.push(`Descrição: ${desc}`);
    return parts.join('\n');
  },

  saldo: (total: number, mes: number) => `*Saldo*\n- Total: *${total.toFixed(2)}€*\n- Mês atual: *${mes.toFixed(2)}€*`,

  resumo: (r: { receitas: number; despesas: number; saldo: number; byCategory: Array<{ categoria: string; total: number }> }) => {
    let s = `*Resumo do mês*\nReceitas: *${r.receitas.toFixed(2)}€*\nDespesas: *${r.despesas.toFixed(2)}€*\nSaldo: *${r.saldo >= 0 ? '+' : ''}${r.saldo.toFixed(2)}€*\n\n`;
    if (r.byCategory.length > 0) {
      s += `*Maiores despesas por categoria*\n`;
      for (const c of r.byCategory.slice(0, 5)) {
        s += `- ${c.categoria}: *${c.total.toFixed(2)}€*\n`;
      }
    }
    return s.trim();
  },

  categorias: (items: Array<{ nome: string; total: number }>) => {
    if (items.length === 0) return `Ainda não há categorias com gastos este mês.`;
    let s = `*Categorias (gasto no mês)*\n`;
    for (const it of items) {
      s += `- ${it.nome}: *${it.total.toFixed(2)}€*\n`;
    }
    return s.trim();
  },

  contas: (items: Array<{ nome: string; saldo: number }>) => {
    if (items.length === 0) return `Ainda não há contas registadas.`;
    let s = `*Contas e saldos*\n`;
    for (const it of items) {
      s += `- ${it.nome}: *${it.saldo.toFixed(2)}€*\n`;
    }
    return s.trim();
  },

  hoje: (count: number, totalExp: number) => `*Hoje*\n${count} transações. Despesas: *${totalExp.toFixed(2)}€*.`,

  semana: (count: number, totalExp: number) => `*Semana*\n${count} transações. Despesas: *${totalExp.toFixed(2)}€*.`,

  mes: (count: number, totalExp: number, totalInc: number) => `*Mês*\n${count} transações. Receitas: *${totalInc.toFixed(2)}€*, Despesas: *${totalExp.toFixed(2)}€*.`,

  gostos: (items: string[]) => items.length === 0 ? `Ainda não adicionaste gostos.` : `*Gostos*\n- ` + items.join('\n- '),

  gostoAdicionado: (v: string) => `Gosto adicionado: *${v}*.`,

  naturalQuery: (text: string) => `Consulta interpretada: *${text}*. (resultado detalhado pode ser expandido em breve)`,
};