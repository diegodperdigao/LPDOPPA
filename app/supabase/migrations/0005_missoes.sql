-- ============================================================================
-- Onboarding enxuto: o obrigatório é criar/vincular os perfis e ajustá-los
-- (orient_perfil). Grupo, dicas de gravação e "conheça criadores" viram
-- missões secundárias, feitas quando a pessoa quiser. O termo é o passo 2.
-- ============================================================================
alter table public.contas add column if not exists criadores_em timestamptz;

-- Roteiros liberam assim que o perfil está ajustado.
drop policy if exists roteiros_ler on public.roteiros;
create policy roteiros_ler on public.roteiros for select to authenticated using (
  publicado and exists (
    select 1 from public.contas c
    where c.id = auth.uid() and c.perfis_em is not null and c.orient_perfil_em is not null
  )
);

create or replace function public.app_marcar_etapa(p_etapa text)
returns void language plpgsql security definer set search_path = public as $$
declare c contas;
begin
  select * into c from contas where id = auth.uid();
  if not found then raise exception 'Sessão expirada.'; end if;
  if p_etapa = 'regras' then
    update contas set regras_em = coalesce(regras_em, now()) where id = c.id;
  elsif c.perfis_em is null then
    raise exception 'Vincule seus perfis primeiro.';
  elsif p_etapa = 'orient_perfil' then
    update contas set orient_perfil_em = coalesce(orient_perfil_em, now()) where id = c.id;
  elsif p_etapa = 'grupo' then
    update contas set grupo_em = coalesce(grupo_em, now()) where id = c.id;
  elsif p_etapa = 'orient_producao' then
    update contas set orient_producao_em = coalesce(orient_producao_em, now()) where id = c.id;
  elsif p_etapa = 'criadores' then
    update contas set criadores_em = coalesce(criadores_em, now()) where id = c.id;
  else
    raise exception 'Etapa inválida.';
  end if;
end $$;

create or replace function public.app_minha_conta()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_meta jsonb;
  v_lead record;
begin
  if v_uid is null then raise exception 'Sessão expirada.'; end if;

  if not exists (select 1 from contas where id = v_uid) then
    select lower(email), raw_user_meta_data into v_email, v_meta from auth.users where id = v_uid;
    select nome, telefone, btag into v_lead from leads where lower(email) = v_email order by created_at desc limit 1;
    insert into contas (id, email, nome, telefone, btag)
    values (
      v_uid, v_email,
      coalesce(v_meta->>'nome', v_lead.nome),
      coalesce(v_meta->>'telefone', v_lead.telefone),
      coalesce(v_meta->>'btag', v_lead.btag)
    )
    on conflict (id) do nothing;
  end if;

  return (
    select json_build_object(
      'id', c.id, 'nome', c.nome, 'email', c.email, 'papel', c.papel,
      'ig_esp', app_norm_ig(w.instagram_esp), 'ig_cas', app_norm_ig(w.instagram_cas),
      'regras_em', c.regras_em, 'perfis_em', c.perfis_em,
      'orient_perfil_em', c.orient_perfil_em, 'orient_producao_em', c.orient_producao_em,
      'termo_em', c.termo_em, 'grupo_em', c.grupo_em, 'criadores_em', c.criadores_em,
      'wl_token', w.token,
      'grupo_link', case when c.perfis_em is not null then (select valor from app_config where chave = 'grupo_whatsapp') end
    )
    from contas c left join wl_criadores w on w.id = c.criador_id
    where c.id = v_uid
  );
end $$;

-- Públicos dos avisos passam a olhar o fim do onboarding novo.
create or replace function public.app_aviso_alvo(p_publico text, c public.contas)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return case p_publico
    when 'todos' then true
    when 'sem_termo' then c.termo_em is null
    when 'onboarding' then c.orient_perfil_em is null
    when 'sem_video_7d' then c.orient_perfil_em is not null and coalesce((
        select sum(p.videos) from wl_producao p
        where p.criador_id = c.criador_id and p.data_ref > (now() at time zone 'America/Sao_Paulo')::date - 7), 0) = 0
    else false end;
end $$;
