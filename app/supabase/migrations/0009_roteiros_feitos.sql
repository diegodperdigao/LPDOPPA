-- ============================================================================
-- Check do criador nos roteiros que ele já gravou/postou.
-- Cada conta só vê e mexe nos próprios checks.
-- ============================================================================
create table if not exists public.roteiros_feitos (
  conta_id   uuid not null references public.contas(id) on delete cascade,
  roteiro_id uuid not null references public.roteiros(id) on delete cascade,
  feito_em   timestamptz not null default now(),
  primary key (conta_id, roteiro_id)
);
create index if not exists roteiros_feitos_roteiro on public.roteiros_feitos (roteiro_id);

alter table public.roteiros_feitos enable row level security;
create policy feitos_meus_ler on public.roteiros_feitos for select to authenticated using (conta_id = auth.uid());
create policy feitos_meus_criar on public.roteiros_feitos for insert to authenticated with check (conta_id = auth.uid());
create policy feitos_meus_apagar on public.roteiros_feitos for delete to authenticated using (conta_id = auth.uid());
create policy feitos_admin on public.roteiros_feitos for select to authenticated using (public.app_eh_admin());
revoke all on public.roteiros_feitos from anon;
