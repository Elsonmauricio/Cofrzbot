import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '@/lib/supabase';
import { parseNatural } from '@/lib/parser';
import { sendMessage, answerCallbackQuery, keyboardPeriods, keyboardQuick } from '@/lib/telegram';
import { replies } from '@/lib/replies';
import { ensureUser, ensureDefaultAccounts, getAccountIdByName, listAccountsWithBalance } from '@/services/accounts';
import { ensureDefaultCategories, getCategoryIdByName, getCategorySpendMonth } from '@/services/categories';
import { addGosto, listGostos } from '@/services/preferences';
import { addTransaction, getSaldo, getResumoMes, getHoje, getSemana, getMes, gastosPorCategoriaMes, totalRecebidoMes } from '@/services/transactions';
import type { TelegramUpdate } from '@/types/telegram';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(200).send('OK');
    }

    const secret = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;
    if (process.env.TELEGRAM_SECRET_TOKEN && secret !== process.env.TELEGRAM_SECRET_TOKEN) {
      console.warn('Webhook com secret_token inválido');
      return res.status(200).json({ ok: false, error: 'invalid_secret' });
    }

    const update = req.body as TelegramUpdate;
    const allowed = Number(process.env.ALLOWED_TELEGRAM_ID);

    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat.id || cq.from.id;
      if (allowed && cq.from.id !== allowed) {
        await sendMessage({ chat_id: chatId, text: replies.notAllowed, parse_mode: 'Markdown' });
        await answerCallbackQuery(cq.id);
        return res.status(200).send('OK');
      }
      const data = cq.data || '';
      await answerCallbackQuery(cq.id);
      if (data.startsWith('period:')) {
        const p = data.split(':')[1];
        const user = await ensureUser(cq.from.id, cq.from.first_name);
        await ensureDefaultAccounts(user.id);
        if (p === 'today') {
          const r = await getHoje(user.id);
          await sendMessage({ chat_id: chatId, text: replies.hoje(r.count, r.totalExp), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
        } else if (p === 'week') {
          const r = await getSemana(user.id);
          await sendMessage({ chat_id: chatId, text: replies.semana(r.count, r.totalExp), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
        } else if (p === 'month') {
          const r = await getMes(user.id);
          await sendMessage({ chat_id: chatId, text: replies.mes(r.count, r.totalExp, r.totalInc), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
        }
      } else if (data.startsWith('view:')) {
        const v = data.split(':')[1];
        const user = await ensureUser(cq.from.id, cq.from.first_name);
        if (v === 'balance') {
          const s = await getSaldo(user.id);
          await sendMessage({ chat_id: chatId, text: replies.saldo(s.total, s.mes), parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
        } else if (v === 'expenses') {
          const cats = await getCategorySpendMonth(user.id);
          await sendMessage({ chat_id: chatId, text: replies.categorias(cats), parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
        } else if (v === 'incomes') {
          const inc = await totalRecebidoMes(user.id);
          await sendMessage({ chat_id: chatId, text: `*Receitas do mês*: *${inc.toFixed(2)}€*`, parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
        }
      }
      return res.status(200).send('OK');
    }

    const msg = update.message;
    if (!msg || !msg.text) {
      return res.status(200).send('OK');
    }
    const chatId = msg.chat.id;
    const fromId = msg.from?.id;
    const text = msg.text.trim();
    const firstName = msg.from?.first_name;

    if (allowed && fromId !== allowed) {
      await sendMessage({ chat_id: chatId, text: replies.notAllowed, parse_mode: 'Markdown' });
      return res.status(200).send('OK');
    }

    const user = await ensureUser(fromId!, firstName);
    await ensureDefaultAccounts(user.id);
    await ensureDefaultCategories(user.id);

    const lower = text.toLowerCase();

    if (text.startsWith('/start')) {
      await sendMessage({ chat_id: chatId, text: replies.start(firstName), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/ajuda')) {
      await sendMessage({ chat_id: chatId, text: replies.ajuda, parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/gosto ')) {
      const val = text.replace(/^\/gosto\s+/i, '');
      await addGosto(user.id, val);
      await sendMessage({ chat_id: chatId, text: replies.gostoAdicionado(val), parse_mode: 'Markdown' });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/adicionargosto ')) {
      const val = text.replace(/^\/adicionargosto\s+/i, '');
      await addGosto(user.id, val);
      await sendMessage({ chat_id: chatId, text: replies.gostoAdicionado(val), parse_mode: 'Markdown' });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/gostos')) {
      const items = await listGostos(user.id);
      await sendMessage({ chat_id: chatId, text: replies.gostos(items), parse_mode: 'Markdown' });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/saldo')) {
      const s = await getSaldo(user.id);
      await sendMessage({ chat_id: chatId, text: replies.saldo(s.total, s.mes), parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/resumo')) {
      const r = await getResumoMes(user.id);
      await sendMessage({ chat_id: chatId, text: replies.resumo(r), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/categorias')) {
      const cats = await getCategorySpendMonth(user.id);
      await sendMessage({ chat_id: chatId, text: replies.categorias(cats), parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/contas')) {
      const accs = await listAccountsWithBalance(user.id);
      await sendMessage({ chat_id: chatId, text: replies.contas(accs), parse_mode: 'Markdown' });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/hoje')) {
      const r = await getHoje(user.id);
      await sendMessage({ chat_id: chatId, text: replies.hoje(r.count, r.totalExp), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/semana')) {
      const r = await getSemana(user.id);
      await sendMessage({ chat_id: chatId, text: replies.semana(r.count, r.totalExp), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }
    if (text.startsWith('/mes')) {
      const r = await getMes(user.id);
      await sendMessage({ chat_id: chatId, text: replies.mes(r.count, r.totalExp, r.totalInc), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }

    if (text.startsWith('/gasto') || text.startsWith('/receita')) {
      const parsed = parseNatural(text);
      if (parsed.valor == null || parsed.tipo == null) {
        await sendMessage({ chat_id: chatId, text: replies.notUnderstood, parse_mode: 'Markdown' });
        return res.status(200).send('OK');
      }
      const accId = await getAccountIdByName(user.id, parsed.contaNome);
      const catId = await getCategoryIdByName(user.id, parsed.categoriaNome, parsed.tipo);
      await addTransaction({ userId: user.id, accountId: accId, categoryId: catId, valor: parsed.valor, tipo: parsed.tipo, descricao: parsed.descricao });
      await sendMessage({ chat_id: chatId, text: replies.transactionAdded(parsed.tipo, parsed.valor, parsed.categoriaNome, parsed.descricao, parsed.contaNome), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }

    if (/(quanto gastei este mês|quanto gastei no mês|gastos do mês)/.test(lower)) {
      const cats = await getCategorySpendMonth(user.id);
      const total = cats.reduce((s, x) => s + x.total, 0);
      let resp = `*Gastos este mês*: *${total.toFixed(2)}€*\n`;
      for (const c of cats.slice(0, 4)) resp += `- ${c.nome}: *${c.total.toFixed(2)}€*\n`;
      await sendMessage({ chat_id: chatId, text: resp.trim(), parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
      return res.status(200).send('OK');
    }
    if (/(quanto gastei em|gasto em)\s+([a-zA-ZÀ-ÿ]+)/.test(lower)) {
      const m = lower.match(/(quanto gastei em|gasto em)\s+([a-zA-ZÀ-ÿ]+)/);
      const cat = m?.[2];
      if (cat) {
        const total = await gastosPorCategoriaMes(user.id, cat);
        await sendMessage({ chat_id: chatId, text: `*Gasto em ${cat} este mês*: *${total.toFixed(2)}€*`, parse_mode: 'Markdown' });
        return res.status(200).send('OK');
      }
    }
    if (/(qual é o meu saldo|meu saldo|saldo)/.test(lower) && !lower.includes('mês')) {
      const s = await getSaldo(user.id);
      await sendMessage({ chat_id: chatId, text: replies.saldo(s.total, s.mes), parse_mode: 'Markdown', reply_markup: keyboardPeriods() });
      return res.status(200).send('OK');
    }
    if (/(despesas hoje|gastos hoje)/.test(lower)) {
      const r = await getHoje(user.id);
      await sendMessage({ chat_id: chatId, text: replies.hoje(r.count, r.totalExp), parse_mode: 'Markdown' });
      return res.status(200).send('OK');
    }
    if (/(quanto recebi este mês|receitas do mês|recebi no mês)/.test(lower)) {
      const inc = await totalRecebidoMes(user.id);
      await sendMessage({ chat_id: chatId, text: `*Receitas este mês*: *${inc.toFixed(2)}€*`, parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }
    if (/(qual categoria onde mais gasto|maior gasto por categoria|categoria mais cara)/.test(lower)) {
      const cats = await getCategorySpendMonth(user.id);
      if (cats.length === 0) {
        await sendMessage({ chat_id: chatId, text: `Ainda não há despesas este mês.`, parse_mode: 'Markdown' });
      } else {
        const top = cats[0];
        await sendMessage({ chat_id: chatId, text: `*Categoria onde mais gastas*: *${top.nome}* – *${top.total.toFixed(2)}€* este mês.`, parse_mode: 'Markdown' });
      }
      return res.status(200).send('OK');
    }

    const parsedNat = parseNatural(text);
    if (parsedNat.valor != null && parsedNat.tipo != null) {
      const accId = await getAccountIdByName(user.id, parsedNat.contaNome);
      const catId = await getCategoryIdByName(user.id, parsedNat.categoriaNome, parsedNat.tipo);
      await addTransaction({ userId: user.id, accountId: accId, categoryId: catId, valor: parsedNat.valor, tipo: parsedNat.tipo, descricao: parsedNat.descricao });
      await sendMessage({ chat_id: chatId, text: replies.transactionAdded(parsedNat.tipo, parsedNat.valor, parsedNat.categoriaNome, parsedNat.descricao, parsedNat.contaNome), parse_mode: 'Markdown', reply_markup: keyboardQuick() });
      return res.status(200).send('OK');
    }

    await sendMessage({ chat_id: chatId, text: replies.notUnderstood, parse_mode: 'Markdown' });
    return res.status(200).send('OK');
  } catch (err: any) {
    console.error('Erro no handler /api/telegram:', err?.message || err);
    return res.status(200).send('OK');
  }
}