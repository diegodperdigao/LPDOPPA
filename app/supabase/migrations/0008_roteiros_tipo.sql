-- ============================================================================
-- Campos que vêm do Doc de roteiros: tipo (roteiro falado, React em cima de
-- vídeo, fofoca com 2 imagens), créditos da foto/vídeo e dica de pronúncia.
-- Vídeos base do Drive passam de 50MB (ex.: 54MB): bucket vai a 100MB.
-- ============================================================================
alter table public.roteiros
  add column if not exists tipo      text not null default 'roteiro' check (tipo in ('roteiro', 'react', 'fofoca')),
  add column if not exists creditos  text,
  add column if not exists pronuncia text;

update storage.buckets set file_size_limit = 104857600 where id = 'roteiros';
