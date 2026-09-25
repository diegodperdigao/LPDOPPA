-- ============================================================================
-- DOPPA app (app.doppa.com.br) — contas, onboarding e roteiros
-- Só ACRESCENTA (tabelas, funções e policies novas). Não altera dados existentes.
--
-- Princípios:
--  * Nada de escrita direta pelo navegador em tabelas sensíveis: o app chama
--    funções (RPC) SECURITY DEFINER que validam tudo e só mexem na conta de quem
--    está logado (auth.uid()).
--  * O criador continua sendo o registro de wl_criadores (carteira + planilha).
--    A conta do app só aponta pra ele (contas.criador_id).
--  * Criador que já existe na carteira é reconhecido pelo @ na hora de vincular.
-- ============================================================================

-- @ normalizado a partir de @, link, link com /reels, ?igsh=... (mesma regra do app)
create or replace function public.app_norm_ig(p text)
returns text language sql immutable set search_path = pg_catalog as $$
  select nullif(
    regexp_replace(
      split_part(split_part(split_part(
        regexp_replace(lower(trim(coalesce(p, ''))), '^(https?://)?(www\.)?instagram\.com/', ''),
      '?', 1), '#', 1), '/', 1),
    '^@|[^a-z0-9._]', '', 'g'),
  '')
$$;

-- Índices pra achar criador pelo @ (inclusive os que estão gravados como link)
create index if not exists wl_criadores_ig_esp_norm on public.wl_criadores (public.app_norm_ig(instagram_esp));
create index if not exists wl_criadores_ig_cas_norm on public.wl_criadores (public.app_norm_ig(instagram_cas));

-- ---------------------------------------------------------------------------
-- Conta do app (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.contas (
  id                 uuid primary key references auth.users(id) on delete cascade,
  nome               text,
  email              text,
  telefone           text,
  btag               text,
  papel              text not null default 'criador' check (papel in ('criador', 'admin')),
  criador_id         uuid unique references public.wl_criadores(id) on delete set null,
  regras_em          timestamptz,
  perfis_em          timestamptz,
  orient_perfil_em   timestamptz,
  orient_producao_em timestamptz,
  grupo_em           timestamptz,
  termo_em           timestamptz,
  criado_em          timestamptz not null default now()
);
alter table public.contas enable row level security;
create policy contas_ler_propria on public.contas for select to authenticated using (id = auth.uid());
-- Sem policy de insert/update/delete: só as funções abaixo escrevem.

create or replace function public.app_eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from contas where id = auth.uid() and papel = 'admin')
$$;

-- Termo assinado pelo app fica ligado à conta
alter table public.termos add column if not exists conta_id uuid references public.contas(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Roteiros do dia
-- ---------------------------------------------------------------------------
create table if not exists public.roteiros (
  id         uuid primary key default gen_random_uuid(),
  data       date not null default (now() at time zone 'America/Sao_Paulo')::date,
  segmento   text not null check (segmento in ('esp', 'cas')),
  marca      text,
  titulo     text not null,
  texto      text not null,
  imagem_url text,
  ordem      int not null default 0,
  publicado  boolean not null default true,
  criado_em  timestamptz not null default now()
);
create index if not exists roteiros_data on public.roteiros (data, segmento, ordem);
alter table public.roteiros enable row level security;
-- Criador vê os roteiros publicados depois de terminar o onboarding
create policy roteiros_ler on public.roteiros for select to authenticated using (
  publicado and exists (
    select 1 from public.contas c
    where c.id = auth.uid() and c.perfis_em is not null and c.orient_producao_em is not null
  )
);
create policy roteiros_admin on public.roteiros for all to authenticated
  using (public.app_eh_admin()) with check (public.app_eh_admin());

-- ---------------------------------------------------------------------------
-- RPC: minha conta (cria na primeira vez, puxando nome/telefone/btag do lead)
-- ---------------------------------------------------------------------------
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
      'termo_em', c.termo_em, 'grupo_em', c.grupo_em,
      'wl_token', w.token,
      'grupo_link', case when c.perfis_em is not null then (select valor from app_config where chave = 'grupo_whatsapp') end
    )
    from contas c left join wl_criadores w on w.id = c.criador_id
    where c.id = v_uid
  );
end $$;

-- ---------------------------------------------------------------------------
-- RPC: marcar etapa simples do onboarding (em ordem)
-- ---------------------------------------------------------------------------
create or replace function public.app_marcar_etapa(p_etapa text)
returns void language plpgsql security definer set search_path = public as $$
declare c contas;
begin
  select * into c from contas where id = auth.uid();
  if not found then raise exception 'Sessão expirada.'; end if;
  if p_etapa = 'regras' then
    update contas set regras_em = coalesce(regras_em, now()) where id = c.id;
  elsif p_etapa = 'grupo' then
    if c.perfis_em is null then raise exception 'Vincule seus perfis primeiro.'; end if;
    update contas set grupo_em = coalesce(grupo_em, now()) where id = c.id;
  elsif p_etapa = 'orient_perfil' then
    if c.perfis_em is null then raise exception 'Vincule seus perfis primeiro.'; end if;
    update contas set orient_perfil_em = coalesce(orient_perfil_em, now()) where id = c.id;
  elsif p_etapa = 'orient_producao' then
    if c.orient_perfil_em is null then raise exception 'Termine as orientações de perfil primeiro.'; end if;
    update contas set orient_producao_em = coalesce(orient_producao_em, now()) where id = c.id;
  else
    raise exception 'Etapa inválida.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RPC: vincular os 2 perfis (aprovação automática)
--  * @ já de outra conta do app  -> erro (chamar suporte)
--  * @ de criador antigo da carteira sem conta -> assume esse criador
--  * @ novo -> cria o criador na carteira (status ativo)
-- ---------------------------------------------------------------------------
create or replace function public.app_vincular_perfis(p_esp text, p_cas text)
returns void language plpgsql security definer set search_path = public as $$
declare
  c contas;
  v_esp text := app_norm_ig(p_esp);
  v_cas text := app_norm_ig(p_cas);
  v_alvo uuid;
  v_outros uuid[];
begin
  select * into c from contas where id = auth.uid() for update;
  if not found then raise exception 'Sessão expirada.'; end if;
  if c.regras_em is null then raise exception 'Aceite as regras primeiro.'; end if;
  if v_esp is null or v_cas is null then raise exception 'Informe os dois perfis.'; end if;
  if v_esp = v_cas then raise exception 'Os dois perfis precisam ser diferentes.'; end if;

  -- criadores da carteira que já usam algum desses @ (em qualquer segmento)
  select array_agg(distinct w.id) into v_outros
  from wl_criadores w
  where w.id is distinct from c.criador_id
    and (app_norm_ig(w.instagram_esp) in (v_esp, v_cas) or app_norm_ig(w.instagram_cas) in (v_esp, v_cas));

  if v_outros is not null then
    if c.criador_id is not null or array_length(v_outros, 1) > 1 then
      raise exception 'Um desses perfis já está vinculado a outro criador. Fale com o suporte.';
    end if;
    if exists (select 1 from contas where criador_id = v_outros[1]) then
      raise exception 'Esse perfil já está vinculado a outra conta. Fale com o suporte.';
    end if;
    v_alvo := v_outros[1];  -- criador antigo reconhecido pelo @
  else
    v_alvo := c.criador_id;
  end if;

  if v_alvo is null then
    insert into wl_criadores (nome, token, instagram_esp, instagram_cas, entrou_em, status, ativo)
    values (coalesce(c.nome, split_part(c.email, '@', 1)), gen_random_uuid(),
            'https://www.instagram.com/' || v_esp, 'https://www.instagram.com/' || v_cas,
            (now() at time zone 'America/Sao_Paulo')::date, 'ativo', true)
    returning id into v_alvo;
  else
    update wl_criadores
       set instagram_esp = 'https://www.instagram.com/' || v_esp,
           instagram_cas = 'https://www.instagram.com/' || v_cas,
           atualizado_em = now()
     where id = v_alvo;
  end if;

  update contas set criador_id = v_alvo, perfis_em = coalesce(perfis_em, now()) where id = c.id;
end $$;

-- ---------------------------------------------------------------------------
-- RPC: aceitar o termo de adesão (grava em termos, ligado à conta)
-- ---------------------------------------------------------------------------
create or replace function public.app_aceitar_termo(p_dados jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  c contas;
  v_cpf text := regexp_replace(coalesce(p_dados->>'cpf', ''), '\D', '', 'g');
  v_ig text;
begin
  select * into c from contas where id = auth.uid();
  if not found then raise exception 'Sessão expirada.'; end if;
  if length(v_cpf) <> 11 then raise exception 'CPF precisa ter 11 números.'; end if;
  if coalesce(trim(p_dados->>'nome'), '') = '' then raise exception 'Informe seu nome completo.'; end if;

  select concat_ws(' | ', app_norm_ig(instagram_esp), app_norm_ig(instagram_cas)) into v_ig
  from wl_criadores where id = c.criador_id;

  insert into termos (nome, cpf, cnpj, email, telefone, instagram, versao_termo, aceite, user_agent, origem, conta_id)
  values (trim(p_dados->>'nome'), v_cpf, nullif(regexp_replace(coalesce(p_dados->>'cnpj', ''), '\D', '', 'g'), ''),
          c.email, p_dados->>'telefone', v_ig, '1.0', true, left(p_dados->>'user_agent', 300), 'app', c.id);

  update contas
     set termo_em = now(),
         nome = trim(p_dados->>'nome'),
         telefone = coalesce(nullif(p_dados->>'telefone', ''), telefone)
   where id = c.id;
end $$;

-- ---------------------------------------------------------------------------
-- Imagens dos roteiros (Storage): leitura pública, escrita só admin
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('roteiros', 'roteiros', true)
on conflict (id) do nothing;
create policy roteiros_img_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'roteiros' and public.app_eh_admin());
create policy roteiros_img_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'roteiros' and public.app_eh_admin());
create policy roteiros_img_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'roteiros' and public.app_eh_admin());

-- Só usuário logado chama as RPCs do app
revoke all on function public.app_minha_conta() from public, anon;
revoke all on function public.app_marcar_etapa(text) from public, anon;
revoke all on function public.app_vincular_perfis(text, text) from public, anon;
revoke all on function public.app_aceitar_termo(jsonb) from public, anon;
grant execute on function public.app_minha_conta() to authenticated;
grant execute on function public.app_marcar_etapa(text) to authenticated;
grant execute on function public.app_vincular_perfis(text, text) to authenticated;
grant execute on function public.app_aceitar_termo(jsonb) to authenticated;
revoke all on function public.app_eh_admin() from public, anon;
grant execute on function public.app_eh_admin() to authenticated;
