-- ============================================================================
-- Campanhas: substitui o fórum #campanhas-ativas do Discord (um post por ciclo).
-- ============================================================================
create table if not exists public.campanhas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  ciclo       text,
  inicio      date not null,
  fim         date,
  marcas      text[] not null default '{}',
  meta_dia    int check (meta_dia is null or meta_dia > 0),
  duracao_min int check (duracao_min is null or duracao_min > 0),
  valor_mes   numeric(10,2) check (valor_mes is null or valor_mes >= 0),
  regras      text[] not null default '{}',
  corpo       text not null default '',
  publicado   boolean not null default false,
  criado_em   timestamptz not null default now()
);
create index if not exists campanhas_inicio on public.campanhas (inicio desc);

alter table public.campanhas enable row level security;
create policy campanhas_ler on public.campanhas for select to authenticated
  using (publicado or public.app_eh_admin());
create policy campanhas_admin on public.campanhas for all to authenticated
  using (public.app_eh_admin()) with check (public.app_eh_admin());
revoke all on public.campanhas from anon;
