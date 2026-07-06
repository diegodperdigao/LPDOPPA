/* ============================================================
   DOPPA — Página /termo (Termo de Adesão) · termo.js
   ============================================================ */
const CONFIG = {
  // mesmos destinos da LP (reaproveitados)
  DISCORD_WEBHOOK: "https://discord.com/api/webhooks/1521169421106675914/dnGEmdh9uO2Eq580qG5k6A74V2cqz4vjlRFHsLiv3aII6PRpq7LrMPbXI5zwlpUqub4k",
  SHEET_ENDPOINT: "https://script.google.com/macros/s/AKfycbzCqQzGv_DTUR5WsYN6F0Su6P9dBPTqIaKc0gChbiHntuPshW24AVMg94dXaQwJdVGp/exec",
  SUPABASE_URL: "https://ajwfpdprgdcvrkermcwx.supabase.co",
  SUPABASE_KEY: "sb_publishable_7AIcd333tOtfC6hzaoNf2A_leFGCu82",

  // EmailJS (preencha depois de criar o template). Vazio = e-mail desligado.
  EMAILJS: { PUBLIC_KEY: "", SERVICE_ID: "", TEMPLATE_ID: "" },

  VERSAO_TERMO: "v0.1 (provisório)",
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const onlyDigits = v => (v || "").replace(/\D/g, "");

// Modo "só leitura" (/termo?view=1): esconde o formulário, mostra só o contrato.
// Usado no link do e-mail de confirmação.
if (new URLSearchParams(location.search).has("view")) {
  const fc = $("#form-card"); if (fc) fc.hidden = true;
  const hp = document.querySelector(".head p"); if (hp) hp.textContent = "Documento do Termo de Adesão da Doppa.";
}

/* ---------- máscaras ---------- */
const maskCPF = v => onlyDigits(v).slice(0, 11)
  .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskCNPJ = v => onlyDigits(v).slice(0, 14)
  .replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
const maskTel = v => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};
const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener("input", () => { el.value = fn(el.value); }); };
bind("#f-cpf", maskCPF); bind("#f-cnpj", maskCNPJ); bind("#f-tel", maskTel);

/* ---------- validação ---------- */
const validarCPF = v => {
  const c = onlyDigits(v);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let s = 0; for (let i = 0; i < 9; i++) s += +c[i] * (10 - i);
  let d1 = (s * 10) % 11; if (d1 === 10) d1 = 0; if (d1 !== +c[9]) return false;
  s = 0; for (let i = 0; i < 10; i++) s += +c[i] * (11 - i);
  let d2 = (s * 10) % 11; if (d2 === 10) d2 = 0; return d2 === +c[10];
};
const validarEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validarTel = v => { const d = onlyDigits(v); return (d.length === 10 || d.length === 11) && +d.slice(0, 2) >= 11; };
const showErr = (name, msg) => { const s = $(`.err[data-for="${name}"]`); if (s) s.textContent = msg || ""; };
const clearErrs = () => $$(".err").forEach(s => (s.textContent = ""));

/* ---------- perfis do Instagram (múltiplos) ---------- */
$("#ig-add").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "ig-row";
  row.innerHTML = '<input class="inp ig-inp" placeholder="@outro_perfil" /><button type="button" class="ig-del" title="Remover">×</button>';
  row.querySelector(".ig-del").addEventListener("click", () => row.remove());
  $("#ig-list").appendChild(row);
});
const getInstagram = () => $$(".ig-inp").map(i => i.value.trim()).filter(Boolean);

/* ---------- trava: só habilita o aceite após rolar o termo até o fim ---------- */
const box = $("#terms-box"), aceite = $("#f-aceite");
aceite.disabled = true;
const checkScroll = () => {
  if (box.scrollTop + box.clientHeight >= box.scrollHeight - 24) {
    aceite.disabled = false;
    box.removeEventListener("scroll", checkScroll);
  }
};
box.addEventListener("scroll", checkScroll);
// caso o termo já caiba na tela sem rolagem
if (box.scrollHeight <= box.clientHeight + 24) aceite.disabled = false;

/* ---------- coleta + validação ---------- */
const getData = () => ({
  nome: $("#f-nome").value.trim(),
  cpf: $("#f-cpf").value.trim(),
  cnpj: $("#f-cnpj").value.trim(),
  email: $("#f-email").value.trim(),
  telefone: $("#f-tel").value.trim(),
  discord: $("#f-discord").value.trim(),
  instagram: getInstagram(),
  aceite: aceite.checked,
});
const validate = d => {
  clearErrs(); let ok = true;
  const fail = (n, m, sel) => { showErr(n, m); if (sel) $(sel).classList.add("invalid"); ok = false; };
  ["#f-nome", "#f-cpf", "#f-email", "#f-tel", "#f-discord"].forEach(s => $(s).classList.remove("invalid"));
  if (!d.nome) fail("nome", "Informe seu nome completo.", "#f-nome");
  if (!validarCPF(d.cpf)) fail("cpf", "CPF inválido.", "#f-cpf");
  if (!validarEmail(d.email)) fail("email", "E-mail inválido.", "#f-email");
  if (!validarTel(d.telefone)) fail("telefone", "Telefone inválido (com DDD).", "#f-tel");
  if (!d.discord) fail("discord", "Informe seu usuário do Discord.", "#f-discord");
  if (!d.instagram.length) fail("instagram", "Informe ao menos um perfil.");
  if (!d.aceite) fail("aceite", "Você precisa aceitar o termo para continuar.");
  return ok;
};

/* ---------- envios ---------- */
const sendToDiscord = d => {
  if (!CONFIG.DISCORD_WEBHOOK) return Promise.resolve();
  const payload = {
    username: "Doppa · Termo de Adesão",
    embeds: [{
      title: "📄 Novo aceite de Termo de Adesão",
      color: 0x22d46e,
      fields: [
        { name: "👤 Nome", value: d.nome || "—", inline: true },
        { name: "🪪 CPF", value: d.cpf || "—", inline: true },
        { name: "🏢 CNPJ/MEI", value: d.cnpj || "—", inline: true },
        { name: "✉️ Email", value: d.email || "—", inline: true },
        { name: "📱 Telefone", value: d.telefone || "—", inline: true },
        { name: "🎮 Discord", value: d.discord || "—", inline: true },
        { name: "📸 Instagram", value: d.instagram.join(", ") || "—" },
        { name: "📌 Versão", value: CONFIG.VERSAO_TERMO },
      ],
      footer: { text: "Doppa · aceite registrado" },
      timestamp: new Date().toISOString(),
    }],
  };
  return fetch(CONFIG.DISCORD_WEBHOOK, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), keepalive: true,
  }).catch(e => console.warn("Discord:", e));
};

const sendToSheet = d => {
  if (!CONFIG.SHEET_ENDPOINT) return Promise.resolve();
  const body = new URLSearchParams({
    tipo: "termo",
    nome: d.nome, cpf: d.cpf, cnpj: d.cnpj, email: d.email, telefone: d.telefone,
    discord: d.discord, instagram: d.instagram.join(", "),
    versao: CONFIG.VERSAO_TERMO, aceite: "sim",
    user_agent: navigator.userAgent, data: new Date().toISOString(),
  });
  return fetch(CONFIG.SHEET_ENDPOINT, {
    method: "POST", mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body, keepalive: true,
  }).catch(e => console.warn("Planilha:", e));
};

const sendToSupabase = d => {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) return Promise.resolve();
  return fetch(`${CONFIG.SUPABASE_URL}/rest/v1/termos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.SUPABASE_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      nome: d.nome, cpf: d.cpf, cnpj: d.cnpj, email: d.email, telefone: d.telefone,
      discord: d.discord, instagram: d.instagram.join(", "),
      versao_termo: CONFIG.VERSAO_TERMO, aceite: true, user_agent: navigator.userAgent,
    }),
    keepalive: true,
  }).catch(e => console.warn("Supabase:", e));
};

// EmailJS: só dispara se estiver configurado (SDK carregado sob demanda)
const sendEmail = d => {
  const E = CONFIG.EMAILJS;
  if (!E.PUBLIC_KEY || !E.SERVICE_ID || !E.TEMPLATE_ID || !window.emailjs) return Promise.resolve();
  const params = {
    email: d.email, nome: d.nome, cpf: d.cpf, cnpj: d.cnpj || "Não informado",
    instagram: d.instagram.join(", "), discord: d.discord,
    data_aceite: new Date().toLocaleString("pt-BR"), versao_termo: CONFIG.VERSAO_TERMO,
  };
  return window.emailjs.send(E.SERVICE_ID, E.TEMPLATE_ID, params).catch(e => console.warn("EmailJS:", e));
};
// carrega o SDK do EmailJS se houver chave
if (CONFIG.EMAILJS.PUBLIC_KEY) {
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  s.onload = () => window.emailjs && window.emailjs.init({ publicKey: CONFIG.EMAILJS.PUBLIC_KEY });
  document.head.appendChild(s);
}

/* ---------- submit ---------- */
const form = $("#termo-form"), submitBtn = $("#submit-btn");
form.addEventListener("submit", async e => {
  e.preventDefault();
  const data = getData();
  if (!validate(data)) return;
  submitBtn.disabled = true;
  submitBtn.textContent = "Registrando…";

  sendToDiscord(data);
  sendToSheet(data);
  sendToSupabase(data);
  sendEmail(data);

  $("#termo-form").hidden = true;
  const ok = $("#ok");
  if (CONFIG.EMAILJS.PUBLIC_KEY) $("#ok-msg").textContent = "Recebemos o seu aceite. Enviamos a confirmação e o termo para o seu e-mail. Guarde como comprovante.";
  ok.hidden = false;
  ok.scrollIntoView({ behavior: "smooth", block: "center" });
});
