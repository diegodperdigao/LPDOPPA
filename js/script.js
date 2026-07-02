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
  SHEET_ENDPOINT: "https://script.google.com/macros/s/AKfycbzCqQzGv_DTUR5WsYN6F0Su6P9dBPTqIaKc0gChbiHntuPshW24AVMg94dXaQwJdVGp/exec",

  // Supabase (banco de dados). A chave publishable é pública por design e a
  // tabela `leads` só aceita INSERT via RLS. Deixe vazio pra desligar.
  SUPABASE_URL: "https://ajwfpdprgdcvrkermcwx.supabase.co",
  SUPABASE_KEY: "sb_publishable_7AIcd333tOtfC6hzaoNf2A_leFGCu82",

  // Vídeo da VSL. Cole a URL (qualquer formato funciona):
  //   YouTube:  "https://youtu.be/SEU_ID"  ou  "https://www.youtube.com/watch?v=SEU_ID"
  //   Vimeo:    "https://vimeo.com/SEU_ID"
  //   ou um MP4 direto: "https://.../video.mp4"
  // Enquanto vazio (""), mostra só o player com o botão de play.
  VIDEO_URL: "https://youtu.be/2udUE_b2gus",

  // true = esconde a barra de controles do YouTube (evita pular o vídeo).
  // false = mantém os controles (o usuário pode pausar/ajustar volume).
  VIDEO_HIDE_CONTROLS: false,

  // Capa/thumbnail do vídeo (aparece antes do play). Se vazio e for YouTube,
  // usa a thumb automática do próprio vídeo. Para uma capa personalizada,
  // cole a URL de uma imagem aqui (ex: "assets/capa-vsl.jpg").
  VIDEO_POSTER: "",

  // Tempo (ms) até redirecionar pro Discord depois do sucesso.
  // (o usuário também pode clicar no botão "Entrar no Discord" na hora)
  REDIRECT_DELAY: 1400,

  // Origem do lead (a página /vsl sobrescreve pra "vsl" via overrides abaixo).
  ORIGEM: "landing-page",
};

// Permite que outras páginas (ex.: /vsl) ajustem o CONFIG antes de tudo rodar,
// definindo window.DOPPA_CONFIG_OVERRIDES antes de carregar este script.
if (window.DOPPA_CONFIG_OVERRIDES) Object.assign(CONFIG, window.DOPPA_CONFIG_OVERRIDES);

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
  const wrap = $("#eye-follow");
  const iris = $("#eye-iris");
  if (!wrap || !iris) return;
  // sem efeito em quem prefere menos movimento ou em telas de toque
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(hover: none)").matches) return;

  // limites (% da largura do olho) — assimétricos: o mascote tem pouca folga embaixo
  const MX = (parseFloat(wrap.dataset.maxx) || 4.2) / 100;
  const MUP = (parseFloat(wrap.dataset.maxup) || 4.2) / 100;
  const MDN = (parseFloat(wrap.dataset.maxdown) || 4.2) / 100;
  const MAX_DIST = 460;    // px de cursor p/ deflexão máxima
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

  const onMove = e => {
    const r = wrap.getBoundingClientRect();
    const ex = r.left + r.width / 2;
    const ey = r.top + r.height / 2;
    const dx = e.clientX - ex;
    const dy = e.clientY - ey;
    const dist = Math.min(Math.hypot(dx, dy) / MAX_DIST, 1);
    const ang = Math.atan2(dy, dx);
    tx = Math.cos(ang) * dist * (r.width * MX);
    const vy = Math.sin(ang) * dist;
    ty = vy * r.width * (vy > 0 ? MDN : MUP);
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const tick = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    iris.style.setProperty("--ex", cx.toFixed(2) + "px");
    iris.style.setProperty("--ey", cy.toFixed(2) + "px");
    if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
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
   VÍDEO da VSL
   ============================================================ */
(() => {
  const player = $("#vsl-player");
  const playBtn = $("#vsl-play");
  if (!player || !playBtn) return;

  const url = CONFIG.VIDEO_URL || "";
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{6,})/);
  const ytId = ytMatch ? ytMatch[1] : null;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const vimeoId = vimeoMatch ? vimeoMatch[1] : null;
  const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  // capa/thumb antes do play
  if (url) {
    const poster = CONFIG.VIDEO_POSTER || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "");
    if (poster) {
      const img = document.createElement("img");
      img.className = "vsl__poster";
      img.alt = "";
      img.decoding = "async";
      img.src = poster;
      if (ytId && !CONFIG.VIDEO_POSTER) {
        img.onerror = () => { img.onerror = null; img.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`; };
      }
      player.insertBefore(img, player.firstChild);
    }
  }

  const buildIframe = src => {
    const f = document.createElement("iframe");
    f.src = src;
    f.title = "Vídeo Doppa";
    f.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
    f.allowFullscreen = true;
    return f;
  };

  // tela final própria (evita a grade de sugestões do YouTube)
  const showEnd = () => {
    if (player.querySelector(".vsl__end")) return;
    document.dispatchEvent(new Event("doppa:videoended"));
    const end = document.createElement("div");
    end.className = "vsl__end";
    end.innerHTML =
      '<button class="vsl__replay" type="button" aria-label="Assistir de novo"><svg class="ic"><use href="#i-play"></use></svg></button>' +
      '<button class="btn btn--primary btn--lg" type="button">Quero minha vaga <svg class="ic ic--arrow"><use href="#i-arrow"></use></svg></button>';
    player.appendChild(end);
    end.querySelector(".btn").addEventListener("click", openModal);
    end.querySelector(".vsl__replay").addEventListener("click", () => {
      end.remove();
      if (window.__ytPlayer && window.__ytPlayer.seekTo) { window.__ytPlayer.seekTo(0); window.__ytPlayer.playVideo(); }
      else { const v = player.querySelector("video"); if (v) { v.currentTime = 0; v.play(); } }
    });
  };

  const loadYT = cb => {
    if (window.YT && window.YT.Player) return cb();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof prev === "function") prev(); cb(); };
    if (!document.getElementById("yt-api")) {
      const s = document.createElement("script");
      s.id = "yt-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  };

  const mount = () => {
    if (!url) {
      playBtn.animate(
        [{ transform: "translate(-50%,-50%) scale(1)" }, { transform: "translate(-50%,-50%) scale(.9)" }, { transform: "translate(-50%,-50%) scale(1)" }],
        { duration: 260 }
      );
      console.warn("Defina CONFIG.VIDEO_URL no script.js para ativar o vídeo da VSL.");
      return;
    }
    player.classList.add("vsl__player--playing");

    if (ytId) {
      loadYT(() => {
        const holder = document.createElement("div");
        player.appendChild(holder);
        window.__ytPlayer = new YT.Player(holder, {
          videoId: ytId,
          playerVars: {
            autoplay: 1, rel: 0, modestbranding: 1,
            controls: CONFIG.VIDEO_HIDE_CONTROLS ? 0 : 1,
            disablekb: 1, fs: 1, iv_load_policy: 3, playsinline: 1
          },
          events: {
            onReady: () => document.dispatchEvent(new Event("doppa:videoready")),
            onStateChange: e => { if (e.data === 0) showEnd(); } // 0 = ENDED
          }
        });
      });
    } else if (vimeoId) {
      player.appendChild(buildIframe(`https://player.vimeo.com/video/${vimeoId}?autoplay=1`));
    } else if (isFile) {
      const v = document.createElement("video");
      v.src = url; v.controls = true; v.autoplay = true; v.playsInline = true;
      v.addEventListener("ended", showEnd);
      player.appendChild(v);
    } else {
      player.appendChild(buildIframe(url + (url.includes("?") ? "&" : "?") + "autoplay=1"));
    }
  };

  playBtn.addEventListener("click", mount);
})();

/* ============================================================
   MODAL
   ============================================================ */
const modal = $("#form-modal");
const formEl = $("#lead-form");
const successEl = $("#form-success");
const waitEl = $("#form-wait");
const modalHead = $("#modal-head");
let lastFocused = null;

const openModal = () => {
  lastFocused = document.activeElement;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  // garante estado limpo
  modalHead.hidden = false;
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

// Telefone BR: DDD (11–99) + 8 dígitos (fixo) ou 9 dígitos começando em 9 (celular).
const onlyDigits = v => (v || "").replace(/\D/g, "");
const validatePhone = v => {
  const d = onlyDigits(v);
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = +d.slice(0, 2);
  if (ddd < 11 || ddd > 99) return false;              // DDD válido
  if (d.length === 11 && d[2] !== "9") return false;   // celular tem que ter 9 na frente
  return true;
};

// Máscara enquanto digita: (11) 99999-9999  /  (11) 9999-9999
const maskPhone = v => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};
const phoneInput = $("#f-telefone");
if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    phoneInput.value = maskPhone(phoneInput.value);
  });
}

const getData = () => {
  const fd = new FormData(formEl);
  return {
    email: (fd.get("email") || "").toString().trim(),
    nome: (fd.get("nome") || "").toString().trim(),
    telefone: (fd.get("telefone") || "").toString().trim(),
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
  if (!validatePhone(data.telefone)) { showError("telefone", "Coloca um telefone válido com DDD."); ok = false; $("#f-telefone").classList.toggle("invalid", true); }
  else $("#f-telefone").classList.remove("invalid");
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
          { name: "📱 Telefone", value: data.telefone || "—", inline: true },
          { name: "🎬 Experiência", value: data.experiencia || "—" },
          { name: "🔞 Maioridade", value: data.maioridade || "—" },
          { name: "📍 Origem", value: CONFIG.ORIGEM || "landing-page" },
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
    keepalive: true,
  }).catch(err => console.warn("Discord webhook falhou:", err));
};

const sendToSheet = data => {
  if (!CONFIG.SHEET_ENDPOINT) return Promise.resolve(); // desligado
  // "no-cors" + form-encoded: funciona com Google Apps Script sem erro de CORS.
  const body = new URLSearchParams({
    email: data.email,
    nome: data.nome,
    telefone: data.telefone,
    experiencia: data.experiencia,
    maioridade: data.maioridade,
    origem: CONFIG.ORIGEM || "landing-page",
    data: new Date().toISOString(),
  });
  return fetch(CONFIG.SHEET_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    keepalive: true,
  }).catch(err => console.warn("Planilha falhou:", err));
};

const sendToSupabase = data => {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) return Promise.resolve(); // desligado
  return fetch(`${CONFIG.SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.SUPABASE_KEY,
      Authorization: `Bearer ${CONFIG.SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      experiencia: data.experiencia,
      maioridade: data.maioridade,
      origem: CONFIG.ORIGEM || "landing-page",
    }),
    keepalive: true,
  }).catch(err => console.warn("Supabase falhou:", err));
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

  // trava o botão pra evitar duplo envio (o form é escondido logo abaixo)
  submitBtn.disabled = true;

  // dispara as integrações em background — o keepalive nos fetches garante
  // que elas completam mesmo com o redirect logo em seguida, então NÃO
  // travamos a UX esperando a rede: o sucesso aparece na hora.
  sendToDiscord(data);
  sendToSheet(data);
  sendToSupabase(data);

  const maiorDeIdade = data.maioridade === "De acordo, sou maior de idade";

  if (!maiorDeIdade) {
    // ainda registramos o lead, mas não redirecionamos
    modalHead.hidden = true;
    formEl.hidden = true;
    waitEl.hidden = false;
    return;
  }

  // sucesso → confetes → redireciona
  modalHead.hidden = true;
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
