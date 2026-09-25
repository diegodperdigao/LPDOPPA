# DOPPA App — `app.doppa.com.br`

Plataforma do criador (substitui o Discord). Separada da LP: a LP continua na raiz do repositório
(Worker `doppa`), o app vive nesta pasta e sobe como outro Worker (`doppa-app`).

React + Vite + TypeScript · Supabase (mesmo projeto da LP e da carteira) · mobile-first.

## Rodar

```bash
cd app
npm install
npm run dev          # http://localhost:5173
```

Sem `.env.local` o app roda em **modo demo**: tudo fica no navegador, qualquer e-mail e
qualquer código de 6 números entram. Serve pra clicar no fluxo antes do banco estar pronto.
Com as variáveis (ver `.env.example`) ele usa o Supabase de verdade. `?demo=1` força o demo.

## Fluxo

1. **Conta** — criada no formulário da VSL (código por e-mail). Quem volta usa `/entrar`.
2. **Boas-vindas e regras** — aceite (18+).
3. **Crie seus 2 perfis** — guia visual com celulares desenhados; destaque pra conta profissional.
4. **Vincule seus perfis** — @ ou link de Esportes e Notícias/Variedades. Aprovação automática.
5. **Monte seu perfil** — bio, rodapé legal, destaques (botões de copiar).
6. **Como gravar** — dicas de produção.
7. **Roteiros do dia** liberados. O **termo de adesão** aparece como pop-up/banner e só trava o pagamento.

Textos editáveis em `src/content.ts` (⚠️ bio, rodapé e dicas ainda são rascunho).

## Banco

`supabase/migrations/0001_app_onboarding.sql` — **ainda não aplicada**. Cria `contas`, `roteiros`
e as funções (RPC) que o app chama. Ao vincular, o criador antigo da carteira é reconhecido pelo @.

## Deploy (Cloudflare)

Novo Worker apontando pra este repositório: diretório raiz `app`, build `npm run build`,
deploy `npx wrangler deploy`, domínio `app.doppa.com.br`. O `app/` está no `.assetsignore`
da raiz, então nada daqui é publicado em doppa.com.br.
