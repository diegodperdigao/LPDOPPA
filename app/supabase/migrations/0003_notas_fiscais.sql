-- ============================================================================
-- Notas fiscais por ciclo (substitui o Google Forms da NF)
-- Arquivo no Storage privado "notas": {criador_id}/{ciclo_start}/{arquivo}
-- ============================================================================
create table if not exists public.notas_fiscais (
  id           uuid primary key default gen_random_uuid(),
  criador_id   uuid not null references public.wl_criadores(id) on delete cascade,
  conta_id     uuid references public.contas(id) on delete set null,
  ciclo_start  date not null,
  ciclo_end    date not null,
  numero       text not null,
  valor        numeric(12,2) not null check (valor > 0),
  arquivo_path text not null,
  status       text not null default 'enviada' check (status in ('enviada', 'aprovada', 'recusada')),
  motivo       text,
  enviada_em   timestamptz not null default now(),
  revisada_em  timestamptz,
  revisada_por uuid references public.contas(id) on delete set null,
  unique (criador_id, ciclo_start)
);
alter table public.notas_fiscais enable row level security;
-- leitura: o próprio criador ou admin; escrita só pelas funções abaixo
create policy nf_ler on public.notas_fiscais for select to authenticated using (
  public.app_eh_admin() or criador_id = (select criador_id from public.contas where id = auth.uid())
);

-- prazo pra enviar a NF: dias depois do fim do ciclo
insert into public.app_config (chave, valor) values ('nf_prazo_dias', '5') on conflict (chave) do nothing;

-- Storage privado
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notas', 'notas', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create or replace function public.app_meu_criador_id()
returns uuid language sql stable security definer set search_path = public as $$
  select criador_id from contas where id = auth.uid()
$$;
revoke all on function public.app_meu_criador_id() from public, anon;
grant execute on function public.app_meu_criador_id() to authenticated;

create policy notas_upload_proprio on storage.objects for insert to authenticated
  with check (bucket_id = 'notas' and (storage.foldername(name))[1] = public.app_meu_criador_id()::text);
create policy notas_ler on storage.objects for select to authenticated
  using (bucket_id = 'notas' and (public.app_eh_admin() or (storage.foldername(name))[1] = public.app_meu_criador_id()::text));

-- Criador envia (ou reenvia, se recusada) a NF de um ciclo fechado
create or replace function public.app_enviar_nf(p_ciclo_start date, p_ciclo_end date, p_numero text, p_valor numeric, p_path text)
returns void language plpgsql security definer set search_path = public as $$
declare
  c contas;
  v_atual notas_fiscais;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into c from contas where id = auth.uid();
  if not found or c.criador_id is null then raise exception 'Vincule seus perfis primeiro.'; end if;
  if p_ciclo_end >= v_hoje then raise exception 'A NF desse ciclo só pode ser enviada depois que ele fechar.'; end if;
  if coalesce(trim(p_numero), '') = '' then raise exception 'Informe o número da nota.'; end if;
  if p_valor is null or p_valor <= 0 then raise exception 'Informe o valor da nota.'; end if;
  if split_part(p_path, '/', 1) <> c.criador_id::text then raise exception 'Arquivo inválido.'; end if;

  select * into v_atual from notas_fiscais where criador_id = c.criador_id and ciclo_start = p_ciclo_start;
  if found and v_atual.status = 'aprovada' then raise exception 'A NF desse ciclo já foi aprovada.'; end if;

  insert into notas_fiscais (criador_id, conta_id, ciclo_start, ciclo_end, numero, valor, arquivo_path)
  values (c.criador_id, c.id, p_ciclo_start, p_ciclo_end, trim(p_numero), p_valor, p_path)
  on conflict (criador_id, ciclo_start) do update set
    numero = excluded.numero, valor = excluded.valor, arquivo_path = excluded.arquivo_path, ciclo_end = excluded.ciclo_end,
    status = 'enviada', motivo = null, enviada_em = now(), revisada_em = null, revisada_por = null, conta_id = excluded.conta_id;
end $$;

-- Admin: lista de NFs (com nome do criador) e revisão
create or replace function public.app_admin_nfs(p_ciclo_start date default null)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not app_eh_admin() then raise exception 'Só admin.'; end if;
  return coalesce((
    select json_agg(x order by x.enviada_em desc) from (
      select n.id, n.criador_id, w.nome, app_norm_ig(w.instagram_esp) as ig_esp, c.email, c.telefone,
             n.ciclo_start, n.ciclo_end, n.numero, n.valor, n.arquivo_path, n.status, n.motivo, n.enviada_em, n.revisada_em
      from notas_fiscais n
      join wl_criadores w on w.id = n.criador_id
      left join contas c on c.id = n.conta_id
      where p_ciclo_start is null or n.ciclo_start = p_ciclo_start
    ) x), '[]'::json);
end $$;

create or replace function public.app_admin_nf_revisar(p_id uuid, p_status text, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not app_eh_admin() then raise exception 'Só admin.'; end if;
  if p_status not in ('aprovada', 'recusada') then raise exception 'Status inválido.'; end if;
  if p_status = 'recusada' and coalesce(trim(p_motivo), '') = '' then raise exception 'Diga o motivo da recusa.'; end if;
  update notas_fiscais
     set status = p_status, motivo = case when p_status = 'recusada' then trim(p_motivo) end,
         revisada_em = now(), revisada_por = auth.uid()
   where id = p_id;
end $$;

-- prazo exposto pro app
create or replace function public.app_nf_prazo_dias()
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select valor::int from app_config where chave = 'nf_prazo_dias'), 5)
$$;

revoke all on function public.app_enviar_nf(date, date, text, numeric, text) from public, anon;
revoke all on function public.app_admin_nfs(date) from public, anon;
revoke all on function public.app_admin_nf_revisar(uuid, text, text) from public, anon;
revoke all on function public.app_nf_prazo_dias() from public, anon;
grant execute on function public.app_enviar_nf(date, date, text, numeric, text) to authenticated;
grant execute on function public.app_admin_nfs(date) to authenticated;
grant execute on function public.app_admin_nf_revisar(uuid, text, text) to authenticated;
grant execute on function public.app_nf_prazo_dias() to authenticated;
