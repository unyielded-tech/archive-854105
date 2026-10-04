-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists public.documents (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
-- Row level security ON with no policies: the public anon key can read nothing.
-- Only the server (service_role key) can read/write.
alter table public.documents enable row level security;
