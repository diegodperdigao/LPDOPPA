-- ============================================================================
-- Avisos do time pros criadores: pop-up, faixa no topo ou só no mural.
-- Público segmentado, período de exibição, botão de ação e métricas de leitura.
-- ============================================================================
create table if not exists public.avisos (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  corpo      text not null default '',
  tipo       text not null default 'popup' check (tipo in ('popup', 'faixa', 'mural')),
  tom        text not null default 'info' check (tom in ('info', 'sucesso', 'alerta', 'urgente')),
  publico    text not null default 'todos' check (publico in ('todos', 'sem_termo', 'onboarding', 'sem_video_7d')),
  cta_texto  text,
  cta_url    text,
  inicio     timestamptz not null default now(),
  fim        timestamptz,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now(),
  criado_por uuid references public.contas(id) on delete set null
);
create index if not exists avisos_ativos on public.avisos (ativo, inicio);

create table if not exists public.avisos_lidos (
  aviso_id  uuid not null references public.avisos(id) on delete cascade,
  conta_id  uuid not null references public.contas(id) on delete cascade,
  visto_em  timestamptz not null default now(),
  clicou_em timestamptz,
  primary key (aviso_id, conta_id)
);

alter table public.avisos enable row level security;
alter table public.avisos_lidos enable row level security;
-- Criador lê pelos RPCs; admin gerencia direto.
create policy avisos_admin on public.avisos for all to authenticated
  using (public.app_eh_admin()) with check (public.app_eh_admin());
create policy avisos_lidos_admin on public.avisos_lidos for select to authenticated using (public.app_eh_admin());

-- A conta se encaixa no público do aviso?
create or replace function public.app_aviso_alvo(p_publico text, c public.contas)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return case p_publico
    when 'todos' then true
    when 'sem_termo' then c.termo_em is null
    when 'onboarding' then c.orient_producao_em is null
    when 'sem_video_7d' then c.orient_producao_em is not null and coalesce((
        select sum(p.videos) from wl_producao p
        where p.criador_id = c.criador_id and p.data_ref > (now() at time zone 'America/Sao_Paulo')::date - 7), 0) = 0
    else false end;
end $$;

-- Avisos ativos pra quem está logado (com "lido").
create or replace function public.app_meus_avisos()
returns json language plpgsql stable security definer set search_path = public as $$
declare c contas;
begin
  select * into c from contas where id = auth.uid();
  if not found then return '[]'::json; end if;
  return coalesce((
    select json_agg(x order by x.inicio desc) from (
      select a.id, a.titulo, a.corpo, a.tipo, a.tom, a.cta_texto, a.cta_url, a.inicio,
             (l.aviso_id is not null) as lido
      from avisos a
      left join avisos_lidos l on l.aviso_id = a.id and l.conta_id = c.id
      where a.ativo and a.inicio <= now() and (a.fim is null or a.fim > now())
        and app_aviso_alvo(a.publico, c)
    ) x), '[]'::json);
end $$;

create or replace function public.app_marcar_aviso(p_id uuid, p_clicou boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sessão expirada.'; end if;
  insert into avisos_lidos (aviso_id, conta_id, clicou_em)
  values (p_id, auth.uid(), case when p_clicou then now() end)
  on conflict (aviso_id, conta_id) do update
    set clicou_em = coalesce(avisos_lidos.clicou_em, excluded.clicou_em);
end $$;

-- Admin: lista com alcance (quantos no público), vistos e cliques.
create or replace function public.app_admin_avisos()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not app_eh_admin() then raise exception 'Só admin.'; end if;
  return coalesce((
    select json_agg(x order by x.criado_em desc) from (
      select a.*,
             (select count(*) from contas c where c.papel = 'criador' and app_aviso_alvo(a.publico, c)) as alcance,
             (select count(*) from avisos_lidos l where l.aviso_id = a.id) as vistos,
             (select count(*) from avisos_lidos l where l.aviso_id = a.id and l.clicou_em is not null) as cliques
      from avisos a
    ) x), '[]'::json);
end $$;

revoke all on function public.app_aviso_alvo(text, public.contas) from public, anon, authenticated;
revoke all on function public.app_meus_avisos() from public, anon;
revoke all on function public.app_marcar_aviso(uuid, boolean) from public, anon;
revoke all on function public.app_admin_avisos() from public, anon;
grant execute on function public.app_meus_avisos() to authenticated;
grant execute on function public.app_marcar_aviso(uuid, boolean) to authenticated;
grant execute on function public.app_admin_avisos() to authenticated;
