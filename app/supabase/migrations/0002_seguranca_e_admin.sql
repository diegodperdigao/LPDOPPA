-- ============================================================================
-- 1) Segurança: fecha acessos públicos antigos (aplicado em 28/09)
--    Quem usa esses objetos é o bot (service_role), o cron e a função ig (ig_worker).
-- ============================================================================
alter table public.dias_criador enable row level security;
revoke all on public.dias_criador from anon, authenticated;
alter view public.vw_entregas_hoje set (security_invoker = true);
revoke all on public.vw_entregas_hoje from anon, authenticated;
revoke all on function public.fechar_dia(date) from public, anon, authenticated;
revoke all on function public.ig_criador_por_token(uuid) from public, anon, authenticated;
alter function public.entregas_set_link_norm() set search_path = public;
alter function public.ig_midias_biu() set search_path = public;

-- ============================================================================
-- 2) Admin: funil de criadores e configurações do app
-- ============================================================================

-- Funil: contas do app com a etapa de cada uma + produção recente (planilha),
-- e os criadores da carteira que ainda não entraram no app (pra convidar).
create or replace function public.app_admin_criadores()
returns json language plpgsql stable security definer set search_path = public as $$
declare v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not app_eh_admin() then raise exception 'Só admin.'; end if;
  return json_build_object(
    'contas', coalesce((
      select json_agg(x order by x.criado_em desc) from (
        select c.id, c.nome, c.email, c.telefone, c.btag, c.papel, c.criado_em,
               c.regras_em, c.perfis_em, c.grupo_em, c.orient_perfil_em, c.orient_producao_em, c.termo_em,
               app_norm_ig(w.instagram_esp) as ig_esp, app_norm_ig(w.instagram_cas) as ig_cas,
               w.status,
               (select coalesce(sum(p.videos), 0) from wl_producao p where p.criador_id = w.id and p.data_ref > v_hoje - 7) as videos_7d,
               (select max(p.data_ref) from wl_producao p where p.criador_id = w.id and p.videos > 0) as ultimo_video
        from contas c left join wl_criadores w on w.id = c.criador_id
      ) x), '[]'::json),
    'legado', coalesce((
      select json_agg(y order by y.ultimo_video desc nulls last) from (
        select w.id, w.nome, app_norm_ig(w.instagram_esp) as ig_esp, app_norm_ig(w.instagram_cas) as ig_cas, w.status,
               (select coalesce(sum(p.videos), 0) from wl_producao p where p.criador_id = w.id and p.data_ref > v_hoje - 7) as videos_7d,
               (select max(p.data_ref) from wl_producao p where p.criador_id = w.id and p.videos > 0) as ultimo_video
        from wl_criadores w
        where not exists (select 1 from contas c where c.criador_id = w.id)
      ) y), '[]'::json)
  );
end $$;

-- Configurações que o time pode mudar pelo app (lista fechada de chaves).
create or replace function public.app_admin_config()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not app_eh_admin() then raise exception 'Só admin.'; end if;
  return (select coalesce(json_object_agg(chave, valor), '{}'::json) from app_config where chave in ('grupo_whatsapp'));
end $$;

create or replace function public.app_admin_config_salvar(p_chave text, p_valor text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not app_eh_admin() then raise exception 'Só admin.'; end if;
  if p_chave not in ('grupo_whatsapp') then raise exception 'Configuração não permitida.'; end if;
  if p_chave = 'grupo_whatsapp' and coalesce(p_valor, '') !~ '^https://(chat\.whatsapp\.com|wa\.me|whatsapp\.com)/' then
    raise exception 'Use um link do WhatsApp (https://chat.whatsapp.com/...).';
  end if;
  insert into app_config (chave, valor) values (p_chave, p_valor)
  on conflict (chave) do update set valor = excluded.valor;
end $$;

revoke all on function public.app_admin_criadores() from public, anon;
revoke all on function public.app_admin_config() from public, anon;
revoke all on function public.app_admin_config_salvar(text, text) from public, anon;
grant execute on function public.app_admin_criadores() to authenticated;
grant execute on function public.app_admin_config() to authenticated;
grant execute on function public.app_admin_config_salvar(text, text) to authenticated;
