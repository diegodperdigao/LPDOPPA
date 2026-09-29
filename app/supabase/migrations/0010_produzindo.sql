-- ============================================================================
-- "Já produz": tem pelo menos 1 vídeo contado na planilha (wl_producao).
-- Usado pra não encher o criador novo: termo só abre sozinho depois do 1º vídeo
-- contado, e avisos podem ir só pra quem já produz (ex.: NF, pagamento).
-- ============================================================================
create or replace function public.app_produzindo(p_criador uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_criador is not null and exists (select 1 from wl_producao p where p.criador_id = p_criador and p.videos > 0)
$$;
revoke all on function public.app_produzindo(uuid) from public, anon, authenticated;

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
      'produzindo', app_produzindo(c.criador_id),
      'wl_token', w.token,
      'grupo_link', case when c.perfis_em is not null then (select valor from app_config where chave = 'grupo_whatsapp') end
    )
    from contas c left join wl_criadores w on w.id = c.criador_id
    where c.id = v_uid
  );
end $$;

alter table public.avisos drop constraint if exists avisos_publico_check;
alter table public.avisos add constraint avisos_publico_check
  check (publico in ('todos', 'sem_termo', 'onboarding', 'sem_video_7d', 'produzindo'));

create or replace function public.app_aviso_alvo(p_publico text, c public.contas)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  return case p_publico
    when 'todos' then true
    when 'sem_termo' then c.termo_em is null
    when 'onboarding' then c.orient_perfil_em is null
    when 'produzindo' then app_produzindo(c.criador_id)
    when 'sem_video_7d' then c.orient_perfil_em is not null and coalesce((
        select sum(p.videos) from wl_producao p
        where p.criador_id = c.criador_id and p.data_ref > (now() at time zone 'America/Sao_Paulo')::date - 7), 0) = 0
    else false end;
end $$;
