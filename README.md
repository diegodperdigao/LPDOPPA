# DOPPA — Landing Page

Landing page do programa de criadores UGC da **Doppa**. Página única, **HTML + CSS + JavaScript puro** — sem build, sem dependências, sem nenhum serviço pago.

> **More you do, more you Doppa.** · Seja visto. Seja recompensado.

---

## ✨ O que ela faz

- Hero recriado em CSS/SVG com a identidade da marca (mascote olho, logo, sunburst, confetes).
- Seções: conceito (Visibilidade → Ação → Recompensa), como funciona, níveis (Starter/Boost/Legend/Icon), benefícios, criadores, FAQ.
- **CTA → formulário embutido** (modal). Ao enviar, o lead vai **ao mesmo tempo** para:
  1. 📨 Um canal do **Discord** (via webhook)
  2. 📊 Uma **planilha do Google Sheets** (via Apps Script)
  3. 🚪 E o usuário é **redirecionado para o convite do Discord**.
- Validação de campos, animações, confete no sucesso, 100% responsivo e acessível.

---

## 🚀 Como colocar no ar (grátis)

Por ser um site estático, sobe em qualquer hospedagem gratuita:

- **Netlify:** arraste a pasta em [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel:** `vercel` na pasta, ou conecte o repositório
- **GitHub Pages:** Settings → Pages → branch `main` → `/root`
- **Local:** é só abrir o `index.html` no navegador

Nenhum passo de build é necessário.

---

## ⚙️ Configuração (só 1 arquivo)

Toda a configuração fica no topo do `js/script.js`, no objeto `CONFIG`:

```js
const CONFIG = {
  DISCORD_WEBHOOK: "https://discord.com/api/webhooks/....",  // já preenchido
  DISCORD_INVITE:  "https://discord.gg/JYGM6zuHhG",          // já preenchido
  SHEET_ENDPOINT:  "",   // cole a URL do Apps Script aqui (veja abaixo)
  REDIRECT_DELAY:  2600, // ms até redirecionar pro Discord
};
```

### Ativar a planilha do Google Sheets

1. Crie uma planilha no Google Sheets.
2. **Extensões → Apps Script**.
3. Apague tudo e cole o conteúdo de [`google-apps-script.gs`](./google-apps-script.gs).
4. **Implantar → Novo implantação → App da Web**
   - *Executar como:* você
   - *Quem tem acesso:* **Qualquer pessoa**
5. Copie a **URL do app da web** e cole em `CONFIG.SHEET_ENDPOINT`.

Pronto — cada cadastro vira uma nova linha na planilha. (Enquanto `SHEET_ENDPOINT` ficar vazio, a planilha fica desligada e o resto continua funcionando.)

---

## 📁 Estrutura

```
LPDOPPA/
├── index.html              # estrutura e conteúdo
├── css/styles.css          # identidade visual completa
├── js/script.js            # interações + envio (Discord + Sheets)
├── google-apps-script.gs   # código pra colar no Google Sheets
└── README.md
```

---

## 🎨 Marca (referência rápida)

| Token | Cor |
|---|---|
| Navy | `#0A0E2B` · `#11163D` |
| Azul | `#1E3AFF` |
| Roxo | `#6B3DFF` |
| Ciano | `#00D1FF` |
| Verde | `#22D46E` |
| Amarelo | `#FFD300` |

Tipografia: **Anton** (títulos) + **Poppins** (texto) — carregadas via Google Fonts.

---

## 🔒 Nota de segurança

Por ser um site estático, a URL do webhook do Discord fica visível no código do navegador — o que é aceitável para um formulário de captação de leads. Se um dia quiser blindar isso, dá pra colocar um proxy gratuito (ex.: Cloudflare Workers) na frente do webhook sem mudar o resto.
