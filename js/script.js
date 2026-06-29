/* ============================================================
   DOPPA — Landing Page · script.js
   ------------------------------------------------------------
   CONFIGURAÇÃO RÁPIDA (edite só esta parte):
   ============================================================ */
const CONFIG = {
  // URL do Webhook do seu canal no Discord (recebe cada lead).
  DISCORD_WEBHOOK: "https://discord.com/api/webhooks/1521169421106675914/dnGEmdh9uO2Eq580qG5k6A74V2cqz4vjlRFHsLiv3aII6PRpq7LrMPbXI5zwlpUqub4k",

  // Link de convite do servidor (pra onde o usuário é levado após enviar).
  DISCORD_INVITE: "https://discord.gg/JYGM6zuHhG",

  // URL do Google Apps Script (planilha). Cole depois de implantar.
  // Enquanto estiver vazia (""), a integração com a planilha fica desligada
  // e o resto continua funcionando normalmente.
  SHEET_ENDPOINT: "",

  // Tempo (ms) até redirecionar pro Discord depois do sucesso.
  REDIRECT_DELAY: 2600,
};

/* ============================================================
   Helpers
   ============================================================ */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ============================================================
   Navbar: shrink no scroll + menu mobile
   ============================================================ */
const nav = $("#nav");
const mobileCta = $(".mobile-cta");
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle("scrolled", y > 30);
  // mostra a barra fixa mobile depois de passar do hero
  if (mobileCta) mobileCta.classList.toggle("show", y > 520);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const burger = $("#burger");
const navLinks = $(".nav__links");
burger?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
});
$$(".nav__links a").forEach(a =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
  })
);

/* ============================================================
   Reveal on scroll
   ============================================================ */
const io = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
$$(".reveal").forEach(el => io.observe(el));

/* ============================================================
   Contadores animados (stats)
   ============================================================ */
const animateCount = el => {
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const dur = 1400;
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.floor(eased * target);
    el.textContent = prefix + val.toLocaleString("pt-BR") + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + target.toLocaleString("pt-BR") + suffix;
  };
  requestAnimationFrame(tick);
};
const countIO = new IntersectionObserver(
  entries =>
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        countIO.unobserve(e.target);
      }
    }),
  { threshold: 0.6 }
);
$$(".stat__num").forEach(el => countIO.observe(el));

/* ============================================================
   Ano no footer
   ============================================================ */
$("#year").textContent = new Date().getFullYear();

/* ============================================================
   Olho que segue o cursor (hero)
   ------------------------------------------------------------
   Move a íris/pupila dentro da esclera na direção do mouse.
   ============================================================ */
(() => {
  const eye = $("#hero-eye");
  const iris = $("#eye-iris");
  if (!eye || !iris) return;
  // sem efeito em quem prefere menos movimento ou em telas de toque
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(hover: none)").matches) return;

  const MAX_OFFSET = 11;   // unidades do viewBox (esclera 41 − íris 25 ≈ folga)
  const MAX_DIST = 420;    // px de cursor p/ deflexão máxima
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

  const onMove = e => {
    const r = eye.getBoundingClientRect();
    const ex = r.left + r.width / 2;
    const ey = r.top + r.height / 2;
    const dx = e.clientX - ex;
    const dy = e.clientY - ey;
    const dist = Math.min(Math.hypot(dx, dy) / MAX_DIST, 1);
    const ang = Math.atan2(dy, dx);
    tx = Math.cos(ang) * dist * MAX_OFFSET;
    ty = Math.sin(ang) * dist * MAX_OFFSET;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const tick = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    iris.setAttribute("transform", `translate(${cx.toFixed(2)} ${cy.toFixed(2)})`);
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  };

  window.addEventListener("mousemove", onMove, { passive: true });
  // volta ao centro quando o mouse sai da janela
  document.addEventListener("mouseleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
})();

/* ============================================================
   MODAL
   ============================================================ */
const modal = $("#form-modal");
const formEl = $("#lead-form");
const successEl = $("#form-success");
const waitEl = $("#form-wait");
let lastFocused = null;

const openModal = () => {
  lastFocused = document.activeElement;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  // garante estado limpo
  formEl.hidden = false;
  successEl.hidden = true;
  waitEl.hidden = true;
  setTimeout(() => $("#f-email")?.focus(), 80);
};
const closeModal = () => {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocused?.focus();
};

$$(".js-open-form").forEach(btn => btn.addEventListener("click", openModal));
$$(".js-close-form").forEach(btn => btn.addEventListener("click", closeModal));
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

/* ============================================================
   Validação
   ============================================================ */
const showError = (name, msg) => {
  const span = $(`.field__error[data-for="${name}"]`);
  if (span) span.textContent = msg;
};
const clearErrors = () => $$(".field__error").forEach(s => (s.textContent = ""));

const validateEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const getData = () => {
  const fd = new FormData(formEl);
  return {
    email: (fd.get("email") || "").toString().trim(),
    nome: (fd.get("nome") || "").toString().trim(),
    experiencia: (fd.get("experiencia") || "").toString(),
    maioridade: (fd.get("maioridade") || "").toString(),
  };
};

const validate = data => {
  clearErrors();
  let ok = true;
  if (!data.nome) { showError("nome", "Conta pra gente seu nome."); ok = false; }
  if (!validateEmail(data.email)) { showError("email", "Coloca um email válido."); ok = false; $("#f-email").classList.toggle("invalid", true); }
  else $("#f-email").classList.remove("invalid");
  if (!data.experiencia) { showError("experiencia", "Escolhe uma opção."); ok = false; }
  if (!data.maioridade) { showError("maioridade", "Selecione uma opção."); ok = false; }
  return ok;
};

/* ============================================================
   Envio
   ============================================================ */
const sendToDiscord = data => {
  if (!CONFIG.DISCORD_WEBHOOK || CONFIG.DISCORD_WEBHOOK.includes("COLE_AQUI")) return Promise.resolve();
  const payload = {
    username: "Doppa · Novo Lead",
    embeds: [
      {
        title: "🎯 Novo cadastro na LP",
        color: 0x6b3dff,
        fields: [
          { name: "👤 Nome", value: data.nome || "—", inline: true },
          { name: "✉️ Email", value: data.email || "—", inline: true },
          { name: "🎬 Experiência", value: data.experiencia || "—" },
          { name: "🔞 Maioridade", value: data.maioridade || "—" },
        ],
        footer: { text: "Doppa · More you do, more you Doppa." },
        timestamp: new Date().toISOString(),
      },
    ],
  };
  return fetch(CONFIG.DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(err => console.warn("Discord webhook falhou:", err));
};

const sendToSheet = data => {
  if (!CONFIG.SHEET_ENDPOINT) return Promise.resolve(); // desligado
  // "no-cors" + form-encoded: funciona com Google Apps Script sem erro de CORS.
  const body = new URLSearchParams({
    email: data.email,
    nome: data.nome,
    experiencia: data.experiencia,
    maioridade: data.maioridade,
    origem: "landing-page",
    data: new Date().toISOString(),
  });
  return fetch(CONFIG.SHEET_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }).catch(err => console.warn("Planilha falhou:", err));
};

/* ============================================================
   Submit handler
   ============================================================ */
const submitBtn = $("#submit-btn");
const btnLabel = $(".form__submit-label");
const btnLoader = $(".form__submit-loader");

formEl.addEventListener("submit", async e => {
  e.preventDefault();
  const data = getData();
  if (!validate(data)) return;

  // estado de loading
  submitBtn.disabled = true;
  btnLabel.hidden = true;
  btnLoader.hidden = false;

  // dispara as duas integrações em paralelo (não bloqueia a UX)
  await Promise.allSettled([sendToDiscord(data), sendToSheet(data)]);

  submitBtn.disabled = false;
  btnLabel.hidden = false;
  btnLoader.hidden = true;

  const maiorDeIdade = data.maioridade === "De acordo, sou maior de idade";

  if (!maiorDeIdade) {
    // ainda registramos o lead, mas não redirecionamos
    formEl.hidden = true;
    waitEl.hidden = false;
    return;
  }

  // sucesso → confetes → redireciona
  formEl.hidden = true;
  successEl.hidden = false;
  $("#discord-link").href = CONFIG.DISCORD_INVITE;
  fireConfetti();

  setTimeout(() => {
    window.location.href = CONFIG.DISCORD_INVITE;
  }, CONFIG.REDIRECT_DELAY);
});

/* ============================================================
   Confetti (puro canvas, sem libs)
   ============================================================ */
function fireConfetti() {
  const colors = ["#1E3AFF", "#6B3DFF", "#00D1FF", "#22D46E", "#FFD300", "#E040FB"];
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:200";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  };
  resize();

  const pieces = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2,
    y: innerHeight / 2,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -16 - 4,
    size: Math.random() * 8 + 4,
    color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));

  let frame = 0;
  const gravity = 0.45;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    frame++;
    if (frame < 160) requestAnimationFrame(tick);
    else canvas.remove();
  };
  tick();
}
