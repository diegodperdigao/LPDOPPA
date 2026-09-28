-- ============================================================================
-- Roteiros com tudo num lugar só (antes: Doc dos roteiros + Drive das artes).
-- Cada roteiro pode ter várias mídias (imagens pra inserir e vídeos base pro
-- React), legenda pronta e instruções de postagem.
-- ============================================================================
alter table public.roteiros
  add column if not exists midias     jsonb not null default '[]'::jsonb,
  add column if not exists legenda    text,
  add column if not exists instrucoes text;

-- Migra a imagem única antiga pra lista de mídias.
update public.roteiros
   set midias = jsonb_build_array(jsonb_build_object('url', imagem_url, 'tipo', 'imagem', 'nome', 'imagem'))
 where imagem_url is not null and midias = '[]'::jsonb;

-- Bucket aceita vídeo também (vídeos base pro React).
update storage.buckets
   set file_size_limit = 52428800,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm']
 where id = 'roteiros';
