create table if not exists users (
  id serial primary key,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text
);

create table if not exists leads (
  id serial primary key,
  external_id text,
  name text not null,
  phone text,
  email text,
  timezone text,
  source text,
  stage text not null default 'New',
  wa_number text,
  calendly_utm text,
  last_contact_method text,
  last_contact_at timestamptz,
  next_action text,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activities (
  id serial primary key,
  lead_id integer not null references leads(id) on delete cascade,
  type text not null,
  notes text,
  timestamp timestamptz not null default now()
);

create table if not exists appointments (
  id serial primary key,
  lead_id integer references leads(id) on delete set null,
  calendly_id text,
  start timestamptz,
  "end" timestamptz,
  status text default 'Scheduled',
  closer_name text,
  created_at timestamptz not null default now()
);

create table if not exists message_templates (
  id serial primary key,
  key text not null,
  title text not null,
  body text not null,
  created_by_user_id integer references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists followups (
  id serial primary key,
  lead_id integer not null references leads(id) on delete cascade,
  type text not null,
  due_at timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
