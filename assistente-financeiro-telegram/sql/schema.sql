-- schema.sql
create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  telegram_id bigint unique not null,
  nome varchar(100),
  created_at timestamp with time zone default now()
);

create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  nome varchar(50) not null,
  saldo_inicial numeric(10,2) default 0,
  created_at timestamp with time zone default now(),
  unique (user_id, nome)
);

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  nome varchar(50) not null,
  tipo varchar(10) check (tipo in ('income','expense')),
  created_at timestamp with time zone default now(),
  unique (user_id, nome)
);

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete restrict,
  category_id uuid not null references categories(id) on delete restrict,
  valor numeric(10,2) not null check (valor >= 0),
  tipo varchar(10) not null check (tipo in ('income','expense')),
  descricao varchar(120),
  occurred_at timestamp with time zone not null default now(),
  created_at timestamp with time zone default now()
);

create table if not exists preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  tipo varchar(15) not null check (tipo in ('gosto','interesse','preferencia')),
  valor varchar(80) not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_tx_user_occurred on transactions(user_id, occurred_at);
create index if not exists idx_tx_user_type on transactions(user_id, tipo);
create index if not exists idx_tx_account on transactions(account_id);
create index if not exists idx_tx_category on transactions(category_id);
create index if not exists idx_acc_user on accounts(user_id);
create index if not exists idx_cat_user on categories(user_id);
create index if not exists idx_pref_user_tipo on preferences(user_id, tipo);

alter table users enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table preferences enable row level security;