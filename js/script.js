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

  // Convites do Discord por btag (agências/parceiros).
  // Quem chegar com uma dessas btags recebe um convite dedicado — que já
  // entrega o cargo correspondente no Discord (mais fácil reconhecer a origem).
  // É só adicionar a linha "codigo: 'https://discord.gg/XXXX'".
  DISCORD_INVITE_BY_BTAG: {
    fmg: "https://discord.gg/8wvQM32YQk",   // agência FMG → cargo FMG no Discord
    cmdwpp: "https://discord.gg/yx5bd339dQ", // cmdwpp → convite/cargo dedicado
  },

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
  VIDEO_URL: "https://youtu.be/_MFrFElWmdA",

  // true = esconde a barra de controles do YouTube (evita pular o vídeo).
  // false = mantém os controles (o usuário pode pausar/ajustar volume).
  VIDEO_HIDE_CONTROLS: false,

  // true = pré-carrega o player (usado na /vsl) pra o 1º toque já iniciar a
  // reprodução no mobile, sem o "duplo play" do YouTube.
  VIDEO_PRELOAD: false,

  // Capa/thumbnail do vídeo (aparece antes do play). Se vazio e for YouTube,
  // usa a thumb automática do próprio vídeo. Para uma capa personalizada,
  // cole a URL de uma imagem aqui (ex: "assets/capa-vsl.jpg").
  VIDEO_POSTER: "",

  // Tempo (ms) até redirecionar pro Discord depois do sucesso.
  // (o usuário também pode clicar no botão "Entrar no Discord" na hora)
  REDIRECT_DELAY: 1400,

  // Origem do lead (a página /vsl sobrescreve pra "vsl" via overrides abaixo).
  ORIGEM: "landing-page",

  // EmailJS — e-mail de boas-vindas pra quem preenche o formulário.
  // Use o MESMO service/public key do /termo; crie um TEMPLATE NOVO só de
  // boas-vindas e cole o ID abaixo. Enquanto TEMPLATE_ID estiver vazio (""),
  // o e-mail fica desligado e nada é carregado. Grátis = 200 e-mails/mês.
  EMAILJS: {
    PUBLIC_KEY: "b-kiheaD9OKxbv6-i",
    SERVICE_ID: "service_rhlh8lu",
    TEMPLATE_ID: "template_clxqi8f", // template de boas-vindas da LP
  },
};

// Permite que outras páginas (ex.: /vsl) ajustem o CONFIG antes de tudo rodar,
// definindo window.DOPPA_CONFIG_OVERRIDES antes de carregar este script.
if (window.DOPPA_CONFIG_OVERRIDES) Object.assign(CONFIG, window.DOPPA_CONFIG_OVERRIDES);

/* ============================================================
   Rastreio de afiliado (btag)
   ------------------------------------------------------------
   Link do afiliado:  https://doppa.com.br/?btag=CODIGO
                      https://doppa.com.br/vsl?btag=CODIGO
   Aceita também ?ref= / ?af= / ?aff= como apelidos.
   A btag é guardada no navegador e persiste enquanto a pessoa
   navega/volta. Última divulgação vence (last-touch): só troca
   quando chega uma btag nova na URL. Vai junto no lead enviado.
   ============================================================ */
const BTAG_KEY = "doppa_btag";
(function captureBtag() {
  try {
    const p = new URLSearchParams(location.search);
    const raw = p.get("btag") || p.get("ref") || p.get("af") || p.get("aff") || "";
    // sanitiza: só letras/números/._- e no máx. 64 chars
    const btag = raw.trim().replace(/[^\w.\-]/g, "").slice(0, 64);
    if (btag) localStorage.setItem(BTAG_KEY, btag);
  } catch (e) { /* localStorage bloqueado — ignora */ }
})();
const getBtag = () => {
  try { return localStorage.getItem(BTAG_KEY) || ""; } catch (e) { return ""; }
};
// Convite do Discord conforme a btag: se houver um convite dedicado pra essa
// btag (agência/parceiro), usa ele; senão, o convite padrão da página.
const getDiscordInvite = () => {
  try {
    const map = CONFIG.DISCORD_INVITE_BY_BTAG || {};
    const b = getBtag();
    return (b && map[b]) ? map[b] : CONFIG.DISCORD_INVITE;
  } catch (e) { return CONFIG.DISCORD_INVITE; }
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

  // Rastreio de engajamento (GTM/dataLayer) — dispara mesmo sem conversão.
  // Eventos: doppa_video_play (clicou pra assistir) e doppa_video_complete (assistiu até o fim).
  const track = (event, extra) => {
    // 1) dataLayer (GTM → GA4/anúncios, quando conectado)
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({
        event: event,
        video_page: (CONFIG.ORIGEM || "landing-page"),
        btag: (typeof getBtag === "function" ? getBtag() : "") || "(direto)"
      }, extra || {}));
    } catch (e) {}
    // 2) Supabase (números próprios, sem depender de Google) — tabela video_plays
    try {
      if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
        const evt = event === "doppa_video_complete" ? "complete" : "play";
        fetch(`${CONFIG.SUPABASE_URL}/rest/v1/video_plays`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: CONFIG.SUPABASE_KEY,
            Authorization: `Bearer ${CONFIG.SUPABASE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            evento: evt,
            origem: CONFIG.ORIGEM || "landing-page",
            btag: (typeof getBtag === "function" ? getBtag() : "") || null,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {}
  };
  let playTracked = false;

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
    track("doppa_video_complete");
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

  // Fallback robusto de fim de vídeo: o evento ENDED do YouTube nem sempre
  // dispara (buffer no último segundo, player fica "pausado" no frame final,
  // etc.). Além do ENDED, monitoramos o tempo e liberamos ao chegar no fim.
  let endWatch;
  const startEndWatch = () => {
    if (endWatch) return;
    endWatch = setInterval(() => {
      try {
        const p = window.__ytPlayer;
        if (!p || !p.getDuration) return;
        const d = p.getDuration(), t = p.getCurrentTime();
        if (d > 0 && t >= d - 1.2) { clearInterval(endWatch); endWatch = null; showEnd(); }
      } catch (e) {}
    }, 1000);
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

  let ytReady = false, wantsPlay = false, started = false;

  const startYT = () => {
    started = true;
    try { window.__ytPlayer.unMute(); window.__ytPlayer.setVolume(100); window.__ytPlayer.seekTo(0, true); } catch (e) {}
    window.__ytPlayer.playVideo();
  };

  const createYT = () => {
    const preload = CONFIG.VIDEO_PRELOAD;
    const holder = document.createElement("div");
    if (preload) holder.style.zIndex = "0"; // atrás da capa até o play
    player.appendChild(holder);
    window.__ytPlayer = new YT.Player(holder, {
      videoId: ytId,
      playerVars: {
        autoplay: 1, rel: 0, modestbranding: 1,
        mute: preload ? 1 : 0, // no preload toca mudo pra já bufferizar → tap = som na hora
        controls: CONFIG.VIDEO_HIDE_CONTROLS ? 0 : 1,
        disablekb: 1, fs: 1, iv_load_policy: 3, playsinline: 1
      },
      events: {
        onReady: () => {
          ytReady = true;
          document.dispatchEvent(new Event("doppa:videoready"));
          if (wantsPlay) return startYT();
          // buffieriza mudo por um instante e pausa (não deixa correr até o fim sozinho)
          if (preload) setTimeout(() => {
            if (!started && window.__ytPlayer) {
              try { window.__ytPlayer.pauseVideo(); window.__ytPlayer.seekTo(0, true); } catch (e) {}
            }
          }, 1400);
        },
        onStateChange: e => {
          if (e.data === 0) showEnd();           // 0 = ENDED
          else if (e.data === 1) startEndWatch(); // 1 = PLAYING → arma o fallback por tempo
        }
      }
    });
  };

  const mount = () => {
    if (url && !playTracked) { playTracked = true; track("doppa_video_play"); }
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
      if (CONFIG.VIDEO_PRELOAD) {
        // player já pré-carregado: toca DENTRO do gesto → sem duplo-play no mobile
        ytReady ? startYT() : (wantsPlay = true);
      } else {
        loadYT(() => createYT());
      }
    } else if (vimeoId) {
      player.appendChild(buildIframe(`https://player.vimeo.com/video/${vimeoId}?autoplay=1`));
    } else if (isFile) {
      const v = document.createElement("video");
      v.src = url; v.controls = !CONFIG.VIDEO_HIDE_CONTROLS; v.autoplay = true; v.playsInline = true;
      v.addEventListener("ended", showEnd);
      player.appendChild(v);
    } else {
      player.appendChild(buildIframe(url + (url.includes("?") ? "&" : "?") + "autoplay=1"));
    }
  };

  // pré-carrega o YouTube (cued) atrás da capa, pra o toque já iniciar a reprodução
  if (ytId && CONFIG.VIDEO_PRELOAD) {
    const poster = player.querySelector(".vsl__poster");
    if (poster) poster.style.zIndex = "1";
    loadYT(() => createYT());
  }

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

// Telefone: BR (DDD 11–99 + 8/9 dígitos) OU internacional (começa com "+", 8–15 dígitos).
const onlyDigits = v => (v || "").replace(/\D/g, "");
const isIntlPhone = v => /^\s*\+/.test(v || "");   // começou com + = número internacional
const validatePhone = v => {
  const d = onlyDigits(v);
  if (isIntlPhone(v)) {
    return d.length >= 8 && d.length <= 15;           // E.164: código do país + assinante
  }
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = +d.slice(0, 2);
  if (ddd < 11 || ddd > 99) return false;              // DDD válido
  if (d.length === 11 && d[2] !== "9") return false;   // celular tem que ter 9 na frente
  return true;
};

// Máscara enquanto digita: BR → (11) 99999-9999 ; internacional → +<dígitos> sem forçar formato.
const maskPhone = v => {
  if (isIntlPhone(v)) return ("+" + onlyDigits(v)).slice(0, 16);
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
    btag: getBtag(),
  };
};

const validate = data => {
  clearErrors();
  let ok = true;
  if (!data.nome) { showError("nome", "Conta pra gente seu nome."); ok = false; }
  if (!validateEmail(data.email)) { showError("email", "Coloca um email válido."); ok = false; $("#f-email").classList.toggle("invalid", true); }
  else $("#f-email").classList.remove("invalid");
  if (!validatePhone(data.telefone)) { showError("telefone", "Coloca um telefone válido (com DDD, ou + código do país)."); ok = false; $("#f-telefone").classList.toggle("invalid", true); }
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
          { name: "📍 Origem", value: CONFIG.ORIGEM || "landing-page", inline: true },
          { name: "🔗 Afiliado (btag)", value: data.btag || "—", inline: true },
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
    btag: data.btag || "",
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
      btag: data.btag || null,
    }),
    keepalive: true,
  }).catch(err => console.warn("Supabase falhou:", err));
};

// EmailJS: e-mail de boas-vindas (SDK sob demanda; só dispara se configurado).
const sendWelcomeEmail = data => {
  const E = CONFIG.EMAILJS || {};
  if (!E.PUBLIC_KEY || !E.SERVICE_ID || !E.TEMPLATE_ID || !window.emailjs) return Promise.resolve();
  const params = {
    email: data.email,
    nome: (data.nome || "").split(" ")[0] || data.nome, // primeiro nome, mais pessoal
    discord_invite: getDiscordInvite(),
    origem: CONFIG.ORIGEM || "landing-page",
  };
  return window.emailjs.send(E.SERVICE_ID, E.TEMPLATE_ID, params).catch(e => console.warn("EmailJS:", e));
};
// Carrega o SDK do EmailJS só quando há template configurado.
if (CONFIG.EMAILJS && CONFIG.EMAILJS.PUBLIC_KEY && CONFIG.EMAILJS.TEMPLATE_ID) {
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  s.onload = () => window.emailjs && window.emailjs.init({ publicKey: CONFIG.EMAILJS.PUBLIC_KEY });
  document.head.appendChild(s);
}

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
  const emailSent = sendWelcomeEmail(data); // e-mail de boas-vindas (fire-and-forget)

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
  $("#discord-link").href = getDiscordInvite();
  fireConfetti();

  // Redireciona respeitando o tempo da animação (REDIRECT_DELAY) e, se o
  // e-mail ainda estiver saindo, segura mais um pouco (cap de 3s) pra a
  // navegação não cancelar o envio do EmailJS.
  const minWait = new Promise(r => setTimeout(r, CONFIG.REDIRECT_DELAY));
  const cap = new Promise(r => setTimeout(r, 3000));
  Promise.all([minWait, Promise.race([emailSent, cap])]).then(() => {
    window.location.href = getDiscordInvite();
  });
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

/* ============================================================
   Pop-up / botão flutuante do WhatsApp (ajuda)
   ------------------------------------------------------------
   Botão fixo no canto + balão com a mensagem. Aparece após um
   tempo; fechar guarda a preferência (não reaparece na sessão).
   A classe .js-wpp é isenta da trava da VSL (é canal de suporte).
   ============================================================ */
(() => {
  const WPP_URL = "https://wa.me/message/IG3DKHN5RD4CD1";
  const DISMISS_KEY = "doppa_wpp_dismiss";
  const ICON =
    '<svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">' +
    '<path d="M16.03 4C9.94 4 5 8.94 5 15.03c0 2.13.6 4.12 1.64 5.82L5 28l7.35-1.6a11 11 0 0 0 3.68.64h.01C22.12 27.04 27 22.1 27 16.01 27 9.94 22.1 4 16.03 4Zm6.44 15.57c-.27.76-1.56 1.46-2.17 1.52-.58.06-1.31.08-2.12-.13-.49-.13-1.11-.34-1.92-.68-3.38-1.46-5.58-4.86-5.75-5.09-.17-.23-1.38-1.83-1.38-3.5 0-1.66.87-2.48 1.18-2.82.31-.34.68-.42.9-.42.23 0 .45 0 .65.01.21.01.49-.08.76.58.27.66.93 2.29 1.01 2.46.08.17.14.36.03.59-.11.23-.17.36-.34.56-.17.2-.36.44-.51.59-.17.17-.35.35-.15.69.2.34.9 1.48 1.93 2.4 1.33 1.18 2.45 1.55 2.79 1.72.34.17.54.14.74-.08.2-.23.85-.99 1.08-1.33.23-.34.45-.28.76-.17.31.11 1.96.92 2.3 1.09.34.17.57.25.65.4.08.14.08.82-.19 1.58Z"/></svg>';

  const dismissed = () => { try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) { return false; } };

  // botão flutuante (sempre visível)
  const fab = document.createElement("a");
  fab.className = "wpp-fab js-wpp";
  fab.href = WPP_URL;
  fab.target = "_blank";
  fab.rel = "noopener";
  fab.setAttribute("aria-label", "Falar no WhatsApp");
  fab.innerHTML = ICON;
  document.body.appendChild(fab);

  // balão com a mensagem
  const pop = document.createElement("div");
  pop.className = "wpp-pop js-wpp";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Ajuda pelo WhatsApp");
  pop.innerHTML =
    '<button class="wpp-pop__x" type="button" aria-label="Fechar">&times;</button>' +
    '<p class="wpp-pop__t">Ficou com dúvida? Se perdeu no caminho?</p>' +
    '<p class="wpp-pop__d">Fala agora com a gente pelo WhatsApp!</p>' +
    '<a class="wpp-pop__btn js-wpp" href="' + WPP_URL + '" target="_blank" rel="noopener">' + ICON + '<span>Falar no WhatsApp</span></a>';
  document.body.appendChild(pop);

  pop.querySelector(".wpp-pop__x").addEventListener("click", () => {
    pop.classList.remove("show");
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
  });

  // aparece após 6s, se não tiver sido fechado
  if (!dismissed()) setTimeout(() => { if (!dismissed()) pop.classList.add("show"); }, 6000);

  // estilos (injetados, funcionam em qualquer página)
  const css = document.createElement("style");
  css.textContent = `
    .wpp-fab{position:fixed;right:18px;bottom:18px;z-index:9998;width:58px;height:58px;border-radius:50%;
      background:#25D366;color:#fff;display:grid;place-items:center;text-decoration:none;
      box-shadow:0 10px 26px -6px rgba(37,211,102,.7),0 4px 12px rgba(0,0,0,.35);
      transition:transform .2s ease}
    .wpp-fab:hover{transform:scale(1.08)}
    .wpp-fab::after{content:"";position:absolute;inset:0;border-radius:50%;
      box-shadow:0 0 0 0 rgba(37,211,102,.55);animation:wppPulse 2.4s infinite}
    @keyframes wppPulse{0%{box-shadow:0 0 0 0 rgba(37,211,102,.5)}70%{box-shadow:0 0 0 16px rgba(37,211,102,0)}100%{box-shadow:0 0 0 0 rgba(37,211,102,0)}}
    .wpp-pop{position:fixed;right:18px;bottom:86px;z-index:9999;width:min(290px,calc(100vw - 36px));
      background:#0E1335;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 16px 14px;
      box-shadow:0 20px 48px -12px rgba(0,0,0,.6);opacity:0;transform:translateY(12px) scale(.96);
      pointer-events:none;transition:opacity .28s ease,transform .28s cubic-bezier(.22,1,.36,1);
      font-family:'Poppins',system-ui,Segoe UI,Arial,sans-serif}
    .wpp-pop.show{opacity:1;transform:none;pointer-events:auto}
    .wpp-pop__x{position:absolute;top:8px;right:10px;background:transparent;border:0;color:#8A90B4;
      font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}
    .wpp-pop__x:hover{color:#fff}
    .wpp-pop__t{margin:2px 24px 4px 0;color:#fff;font-weight:700;font-size:14.5px;line-height:1.35}
    .wpp-pop__d{margin:0 0 12px;color:#B9BFE3;font-size:13px;line-height:1.4}
    .wpp-pop__btn{display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;
      text-decoration:none;font-weight:700;font-size:14px;padding:11px 14px;border-radius:11px}
    .wpp-pop__btn:hover{background:#20bd5a}
    .wpp-pop__btn svg{width:20px;height:20px}
    @media(max-width:480px){.wpp-fab{width:52px;height:52px;right:14px;bottom:14px}.wpp-pop{right:14px;bottom:76px}}
    @media(prefers-reduced-motion:reduce){.wpp-fab::after{animation:none}}
  `;
  document.head.appendChild(css);
})();
