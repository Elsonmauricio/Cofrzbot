# Assistente Financeiro Telegram Bot (MVP)

Bot do Telegram para registo e consulta de transações, contas, categorias, gostos e resumos financeiros.

## Stack
- Node.js + TypeScript
- Vercel (Serverless Functions em /api)
- Supabase (PostgreSQL)
- Telegram Bot API

## Pré-requisitos
- [Node.js >= 18.17.0](https://nodejs.org/)
- [Vercel CLI](https://vercel.com/docs/cli) (opcional para dev local)
- Conta Supabase
- Bot criado no @BotFather

## Instalação
```bash
npm install
```

## Configuração
1. Copiar `.env.example` para `.env`:
```bash
cp .env.example .env
```
2. Preencher variáveis:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_SECRET_TOKEN
- ALLOWED_TELEGRAM_ID
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

3. Executar SQL no Supabase: `sql/schema.sql`

## Desenvolvimento local
```bash
npm run dev
```
Usa `vercel dev`. Para testar webhook localmente, usa túnel (ngrok/cloudflared).

## Deploy
1. Commit + push para Git
2. Importar repo no Vercel
3. Adicionar variáveis de ambiente
4. Deploy
5. Configurar webhook do Telegram (ver instruções abaixo)

## Configurar webhook
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "url=https://<VERCEL_URL>/api/telegram" \
  -d "secret_token=<TELEGRAM_SECRET_TOKEN>" \
  -d "allowed_updates=[\"message\",\"callback_query\"]"
```

## Testes rápidos
- `/start` - apresentação
- `gastei 12€ uber transporte` - registar despesa
- `/saldo` - ver saldo
- `/resumo` - resumo do mês

## Fase 2 (preparado)
- Metas de poupança, limites por categoria, exportação CSV/PDF, importação extratos, IA, notificações recorrentes, gráficos
