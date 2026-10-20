import type { InlineKeyboardMarkup, SendMessageParams } from '../types/telegram.js';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function apiUrl(method: string): string {
  if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN não definido');
  return `https://api.telegram.org/bot${TOKEN}/${method}`;
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  try {
    const res = await fetch(apiUrl('sendMessage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('Erro ao enviar mensagem Telegram:', res.status, body);
    }
  } catch (err) {
    console.error('Exceção ao enviar mensagem Telegram:', err);
  }
}

export async function answerCallbackQuery(callback_query_id: string, text?: string): Promise<void> {
  try {
    const res = await fetch(apiUrl('answerCallbackQuery'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id, text, show_alert: false }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('Erro answerCallbackQuery:', res.status, body);
    }
  } catch (err) {
    console.error('Exceção answerCallbackQuery:', err);
  }
}

export function keyboardPeriods(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Hoje', callback_data: 'period:today' },
        { text: 'Semana', callback_data: 'period:week' },
        { text: 'Mês', callback_data: 'period:month' },
      ],
    ],
  };
}

export function keyboardQuick(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Despesas', callback_data: 'view:expenses' },
        { text: 'Receitas', callback_data: 'view:incomes' },
        { text: 'Saldo', callback_data: 'view:balance' },
      ],
    ],
  };
}
