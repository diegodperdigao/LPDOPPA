/* ============================================================
   DOPPA — Landing Page · script.js
   ------------------------------------------------------------
   CONFIGURAÇÃO RÁPIDA (edite só esta parte):
   ============================================================ */
const CONFIG = {
  // URL do Webhook do seu canal no Discord (recebe cada lead).
  DISCORD_WEBHOOK: "https://discord.com/api/webhooks/1521169421106675914/dnGEmdh9uO2Eq580qG5k6A74V2cqz4vjlRFHsLiv3aII6PRpq7LrMPbXI5zwlpUqub4k",

  // Destino após o cadastro: agora é a COMUNIDADE NO WHATSAPP (antes era o Discord).
  // Vale para todas as páginas e origens.
  DISCORD_INVITE: "https://whatsapp.com/channel/0029Vb8QH7j2P59rJDonLM31",

  // Convite dedicado do Discord usado NO E-MAIL de boas-vindas (Caminho 2),
  // dá o cargo "e-mail" pra rastrear origem. Trocar se o convite expirar.
  EMAIL_DISCORD_INVITE: "https://discord.gg/vgXQTkFuNg",

  // (Desativado) Destinos dedicados por btag. Hoje TODOS vão pra mesma comunidade
  // no WhatsApp (DISCORD_INVITE acima). A btag continua sendo registrada no lead
  // (Discord/planilha/Supabase); só o destino é único. Pra voltar a ter destinos
  // por origem, é só preencher aqui de novo ("codigo: 'https://...'").
  DISCORD_INVITE_BY_BTAG: {
    // fmg: "...", cmdwpp: "...", pilhado: "...", jon: "...",
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
  VIDEO_URL: "https://youtu.be/aV7ctWpg948",

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

  // "Pitch delay": segundos do vídeo em que o CTA/conteúdo é liberado (o botão
  // "Quero minha vaga" aparece), mesmo com o vídeo ainda tocando. 0 = só no fim.
  // Ex: 528 = 8min48s. A /vsl sobrescreve abaixo.
  CTA_AT_SECONDS: 0,

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

// MOBILE: NÃO pré-carrega o YouTube. Medido (throttle 4G+CPU 4x): nosso render pinta em
// ~0,6s, mas o base.js do YouTube (~1-2MB) carregado antes do toque saturava a banda e
// travava a main thread durante o 1º paint → FCP ia pra 7s. No celular o player só é criado
// quando a pessoa toca em play; a barra nativa (controls) fica ligada como fallback do
// autoplay do iOS. No desktop segue o pré-aquecimento (lá não há gargalo de banda/CPU).
if (window.matchMedia && window.matchMedia("(hover: none), (max-width: 767px)").matches) {
  CONFIG.VIDEO_PRELOAD = false;
  CONFIG.VIDEO_HIDE_CONTROLS = false;
}

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
    const btag = raw.trim().replace(/[^\w.\-]/g, "").slice(0, 64).toLowerCase();
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
    const b = (getBtag() || "").toLowerCase();
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
  // Teste A/B: ?player=vturb troca o player do YouTube pelo do VTurb (ver bloco inline
  // no index.html). Aqui o caminho do YouTube não roda pra não carregar os dois.
  if (new URLSearchParams(location.search).get("player") === "vturb") return;

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

  /* ---- Medição de RETENÇÃO (estilo VTurb): visitante único, marcos %, saída ---- */
  const VISITOR_KEY = "doppa_visitor";
  const getVisitor = () => {
    try {
      let v = localStorage.getItem(VISITOR_KEY);
      if (!v) { v = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem(VISITOR_KEY, v); }
      return v;
    } catch (e) { return "anon"; }
  };
  const MILESTONES = [10, 25, 50, 75, 90];
  let viewId = "", vidDur = 0, maxSec = 0, milestonesSent = {}, exitSent = false, ctaShown = false;

  const progressBody = (evento, pct, seconds) => JSON.stringify({
    visitor: getVisitor(), sid: viewId,
    evento: evento, pct: Math.round(pct || 0), segundos: Math.round(seconds || 0), duracao: Math.round(vidDur || 0),
    origem: CONFIG.ORIGEM || "landing-page",
    btag: (typeof getBtag === "function" ? getBtag() : "") || null,
  });
  const logProgress = (evento, pct, seconds) => {
    try {
      if (!viewId || !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) return;
      fetch(`${CONFIG.SUPABASE_URL}/rest/v1/video_progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_KEY}`, Prefer: "return=minimal" },
        body: progressBody(evento, pct, seconds),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {}
  };
  // registra o ponto de saída quando a pessoa deixa a página antes de terminar
  const logExit = () => {
    if (exitSent || !viewId) return;
    const pct = vidDur ? (maxSec / vidDur * 100) : 0;
    if (pct >= 98) { exitSent = true; return; } // terminou; não é abandono
    exitSent = true;
    logProgress("exit", pct, maxSec);
  };
  window.addEventListener("pagehide", logExit);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") logExit(); });

  const url = CONFIG.VIDEO_URL || "";
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{6,})/);
  const ytId = ytMatch ? ytMatch[1] : null;
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const vimeoId = vimeoMatch ? vimeoMatch[1] : null;
  const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  // capa/thumb antes do play. A VSL já traz a capa ESTÁTICA no HTML (paint imediato,
  // é o LCP) — aqui só criamos se não existir, ou trocamos a src caso o vídeo tenha
  // sido sobrescrito por ?v=.
  if (url) {
    const poster = CONFIG.VIDEO_POSTER || (ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : "");
    let img = player.querySelector(".vsl__poster");
    const wireFallback = el => {
      if (ytId && !CONFIG.VIDEO_POSTER) el.onerror = () => { el.onerror = null; el.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`; };
    };
    if (poster && !img) {
      img = document.createElement("img");
      img.className = "vsl__poster";
      img.alt = "";
      img.decoding = "async";
      img.fetchPriority = "high"; // capa é o LCP da VSL
      wireFallback(img);
      img.src = poster;
      player.insertBefore(img, player.firstChild);
    } else if (poster && img && ytId && !CONFIG.VIDEO_POSTER && img.src.indexOf(ytId) === -1) {
      wireFallback(img);
      img.src = poster; // override de vídeo (?v=): ajusta a capa estática
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
    logProgress("complete", 100, vidDur);
    exitSent = true; // terminou: não registra saída
    const end = document.createElement("div");
    end.className = "vsl__end";
    end.innerHTML =
      '<button class="vsl__replay" type="button" aria-label="Assistir de novo"><svg class="ic"><use href="#i-play"></use></svg></button>' +
      '<button class="btn btn--primary btn--lg" type="button">Quero minha vaga <svg class="ic ic--arrow"><use href="#i-arrow"></use></svg></button>';
    player.appendChild(end);
    end.querySelector(".btn").addEventListener("click", ev => openFormFromCTA(ev.currentTarget));
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
        if (d > 0) {
          vidDur = d;
          if (t > maxSec) maxSec = t;
          const pct = t / d * 100;
          MILESTONES.forEach(m => { if (pct >= m && !milestonesSent[m]) { milestonesSent[m] = 1; logProgress("milestone", m, t); } });
          // progresso rumo à liberação (pitch em CTA_AT_SECONDS, ou fim do vídeo) → barra no botão trancado
          const target = CONFIG.CTA_AT_SECONDS > 0 ? CONFIG.CTA_AT_SECONDS : d;
          if (target > 0) { const _v = Math.min(1, t / target).toFixed(4); document.querySelectorAll(".vsl-lock-prog").forEach(_el => _el.style.setProperty("--vsl-progress", _v)); }
          // pitch delay: libera o CTA no tempo configurado (vídeo continua tocando)
          if (!ctaShown && CONFIG.CTA_AT_SECONDS > 0 && t >= CONFIG.CTA_AT_SECONDS) {
            ctaShown = true;
            document.dispatchEvent(new Event("doppa:videoended"));
          }
          if (t >= d - 1.2) { clearInterval(endWatch); endWatch = null; showEnd(); }
        }
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

  // Toque/celular: sem cursor. No iOS o playVideo() via API é bloqueado com frequência,
  // então deixamos os controles nativos ligados no mobile pra a pessoa dar play manual.
  const isTouch = window.matchMedia("(hover: none)").matches || innerWidth < 768;

  // registra falha de player (tabela video_plays, evento "error")
  const logPlayEvent = evento => {
    try {
      if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) return;
      fetch(`${CONFIG.SUPABASE_URL}/rest/v1/video_plays`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_KEY, Authorization: `Bearer ${CONFIG.SUPABASE_KEY}`, Prefer: "return=minimal" },
        body: JSON.stringify({ evento: evento, origem: CONFIG.ORIGEM || "landing-page", btag: (typeof getBtag === "function" ? getBtag() : "") || null }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {}
  };

  // Watchdog: se 6s após o play o estado ainda for unstarted(-1)/cued(5)/buffering-parado(3@0s),
  // trata como falha (tela preta muda). Cancelado no primeiro estado PLAYING.
  let watchdog = null, errored = false;
  const clearWatchdog = () => { if (watchdog) { clearTimeout(watchdog); watchdog = null; } };
  const armWatchdog = () => {
    if (isTouch) return; // no mobile o play via API é bloqueado (iOS) e a pessoa usa os controles nativos → sem "timeout de falha"
    clearWatchdog();
    watchdog = setTimeout(() => {
      try {
        const p = window.__ytPlayer;
        const st = p && p.getPlayerState ? p.getPlayerState() : -1;
        const t = p && p.getCurrentTime ? p.getCurrentTime() : 0;
        if (st === -1 || st === 5 || (st === 3 && (t || 0) === 0)) handlePlayerError("timeout");
      } catch (e) { handlePlayerError("timeout"); }
    }, 6000);
  };
  const showErrorOverlay = () => {
    if (player.querySelector(".vsl__err")) return;
    const box = document.createElement("div");
    box.className = "vsl__err";
    box.innerHTML =
      '<button type="button" class="vsl__err-retry">Não carregou. Toque para tentar de novo.</button>' +
      '<a class="vsl__err-yt" href="https://youtu.be/' + ytId + '" target="_blank" rel="noopener">Abrir no YouTube</a>';
    player.appendChild(box);
    box.querySelector(".vsl__err-retry").addEventListener("click", () => { box.remove(); errored = false; mount(); });
  };
  const handlePlayerError = () => {
    if (errored) return; errored = true;
    clearWatchdog();
    logPlayEvent("error");
    player.classList.remove("vsl__player--playing"); // volta a capa
    try { window.__ytPlayer && window.__ytPlayer.destroy && window.__ytPlayer.destroy(); } catch (e) {}
    window.__ytPlayer = null; ytReady = false; started = false; wantsPlay = false;
    showErrorOverlay();
  };

  const startYT = () => {
    started = true; errored = false;
    // Ordem importa no iOS: seek + PLAY primeiro (dentro do gesto), desmutar só depois.
    try { window.__ytPlayer.seekTo(0, true); } catch (e) {}
    try { window.__ytPlayer.playVideo(); } catch (e) {}
    try { window.__ytPlayer.unMute(); window.__ytPlayer.setVolume(100); } catch (e) {}
    armWatchdog();
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
        controls: (CONFIG.VIDEO_HIDE_CONTROLS && !isTouch) ? 0 : 1, // mobile mantém controles (play manual)
        disablekb: 1, fs: 0, iv_load_policy: 3, playsinline: 1
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
          if (e.data === 1) clearWatchdog();      // PLAYING → cancela o watchdog
          if (e.data === 0) showEnd();            // 0 = ENDED
          else if (e.data === 1) startEndWatch(); // 1 = PLAYING → arma o fallback por tempo
        },
        onError: () => handlePlayerError()        // vídeo indisponível/erro → capa de "tentar de novo"
      }
    });
  };

  const mount = () => {
    if (url && !playTracked) {
      playTracked = true;
      track("doppa_video_play");
      // inicia a visualização para a medição de retenção
      viewId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      milestonesSent = {}; maxSec = 0; exitSent = false;
      logProgress("play", 0, 0);
    }
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
      if (window.__ytPlayer && ytReady) {
        startYT();                       // player pronto (pré-carregado) → toca no gesto
      } else if (window.__ytPlayer && !ytReady) {
        wantsPlay = true;                // criado, ainda carregando → toca no onReady
      } else {
        wantsPlay = true;                // sem player (1º clique sem preload, ou após erro) → cria e toca
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

  // Lite-embed: o player do YouTube NÃO entra no caminho crítico de render.
  // Só é "aquecido" (cued, mudo, atrás da capa) quando a página fica ociosa OU no
  // primeiro gesto do usuário — o que vier primeiro. Assim o toque em "play" ainda
  // dispara DENTRO do gesto (som imediato, sem duplo-play no mobile), mas o render
  // inicial não carrega o iframe_api + iframe junto (LCP mais rápido).
  if (ytId && CONFIG.VIDEO_PRELOAD) {
    let warmed = false;
    const evs = ["pointerdown", "touchstart", "keydown", "scroll", "pointermove"];
    const warm = () => {
      if (warmed) return; warmed = true;
      evs.forEach(ev => window.removeEventListener(ev, warm));
      const poster = player.querySelector(".vsl__poster");
      if (poster) poster.style.zIndex = "1";
      loadYT(() => createYT());
    };
    // Aquece no 1º gesto (scroll/toque) OU quando a página fica ociosa — nunca num timer
    // fixo curto. No 4G do mobile, aquecer cedo demais fazia o base.js do YouTube (~1-2MB)
    // saturar a banda e travar a main thread DURANTE o 1º paint → FCP ia pra 7s. Ocioso/gesto
    // garante que o YouTube só entra DEPOIS que a página pintou, sem atrasar o play (a pessoa
    // lê/assiste alguns segundos antes de tocar em "play", tempo de sobra pra aquecer).
    evs.forEach(ev => window.addEventListener(ev, warm, { passive: true }));
    if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 3000 });
    else setTimeout(warm, 2500);
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
  document.body.classList.add("modal-open"); // esconde os flutuantes (float CTA / WhatsApp) enquanto o modal está aberto
  // modal aberto: mantém o vídeo PAUSADO (a pessoa preenche sem ouvir o vídeo repetindo).
  // Retoma de onde parou ao fechar sem enviar (não reinicia).
  if (window.DoppaVideo && window.DoppaVideo.pause) window.DoppaVideo.pause();
  ensureEmailJS(); // carrega o SDK do EmailJS agora (sob demanda), pronto pro envio
  // garante estado limpo
  modalHead.hidden = false;
  formEl.hidden = false;
  successEl.hidden = true;
  waitEl.hidden = true;
  setTimeout(() => $("#f-nome")?.focus(), 80);
};
const closeModal = () => {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.body.classList.remove("modal-open");
  document.body.classList.remove("is-swallowed"); // desfaz o fundo "dentro do olho"
  document.body.classList.remove("eyes-playing");
  window.DoppaEyes && window.DoppaEyes.clear && window.DoppaEyes.clear(); // tira o campo de olhos (modo B)
  // fechou sem enviar: mostra e RETOMA o vídeo de onde parou (não reinicia)
  if (window.DoppaVideo) { window.DoppaVideo.hide && window.DoppaVideo.hide(false); window.DoppaVideo.resume && window.DoppaVideo.resume(); }
  lastFocused?.focus();
};

// Rota do CTA liberado: na VSL destravada, roda a "chuva de olhos" antes do modal;
// senão (LP, reduced-motion, sprites ausentes, ou sem o vsl-eyes) abre direto.
const openFormFromCTA = el => {
  if (window.DoppaEyes && document.body.classList.contains("is-unlocked")) {
    document.body.classList.add("eyes-playing"); // esconde float/WhatsApp durante a chuva
    // pausa E ESCONDE o vídeo durante a animação → no iOS tira a camada do vídeo da composição
    // e libera a GPU pro canvas (só pausar não bastava). Volta ao abrir o modal.
    if (window.DoppaVideo) { window.DoppaVideo.pause && window.DoppaVideo.pause(); window.DoppaVideo.hide && window.DoppaVideo.hide(true); }
    window.DoppaEyes.play(el || null, openModal);
  } else {
    openModal();
  }
};

$$(".js-open-form").forEach(btn => btn.addEventListener("click", e => openFormFromCTA(e.currentTarget)));
$$(".js-close-form").forEach(btn => btn.addEventListener("click", closeModal));

/* ============================================================
   CTA flutuante da VSL — aparece no "pitch" (evento doppa:videoended,
   disparado aos 8:48). Fica FIXO e sempre visível. É o único CTA da VSL
   (o header fica só com a logo). Só é criado na /vsl.
   ============================================================ */
(() => {
  if (!$("#vsl-player")) return; // só na VSL
  const cta = document.createElement("button");
  cta.type = "button";
  cta.className = "vsl-float-cta";
  cta.textContent = "Quero minha vaga →";
  cta.addEventListener("click", () => openFormFromCTA(cta));
  document.body.appendChild(cta);
  let shown = false;
  document.addEventListener("doppa:videoended", () => {
    if (shown) return; shown = true;
    cta.classList.add("show");
    document.body.classList.add("has-float-cta"); // reserva espaço no rodapé pra não ficar embaixo do botão
  });
})();
document.addEventListener("keydown", e => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") { closeModal(); return; }
  if (e.key !== "Tab") return;
  // focus trap: Tab não escapa do modal
  const foc = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter(el => el.offsetParent !== null && !el.hidden);
  if (!foc.length) return;
  const first = foc[0], last = foc[foc.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
  if (!data.maioridade) { showError("maioridade", "Confirme que você tem 18 anos ou mais."); ok = false; }
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
    whatsapp_url: getDiscordInvite(),                    // comunidade no WhatsApp (Caminho 1)
    discord_url: CONFIG.EMAIL_DISCORD_INVITE,            // convite dedicado do e-mail (Caminho 2)
    discord_invite: getDiscordInvite(),                 // compat com template antigo
    origem: CONFIG.ORIGEM || "landing-page",
  };
  return window.emailjs.send(E.SERVICE_ID, E.TEMPLATE_ID, params).catch(e => console.warn("EmailJS:", e));
};
// Carrega o SDK do EmailJS SOB DEMANDA (na 1ª abertura do modal), não no load da
// página — assim ele não compete com o render. Chamado em openModal.
let emailjsRequested = false;
function ensureEmailJS() {
  if (emailjsRequested) return;
  const E = CONFIG.EMAILJS || {};
  if (!E.PUBLIC_KEY || !E.SERVICE_ID || !E.TEMPLATE_ID) return;
  emailjsRequested = true;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  s.onload = () => window.emailjs && window.emailjs.init({ publicKey: E.PUBLIC_KEY });
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
  sendWelcomeEmail(data); // e-mail de boas-vindas (fire-and-forget)

  const maiorDeIdade = data.maioridade === "De acordo, sou maior de idade";

  if (!maiorDeIdade) {
    // ainda registramos o lead, mas não redirecionamos
    modalHead.hidden = true;
    formEl.hidden = true;
    waitEl.hidden = false;
    return;
  }

  // sucesso: abre a comunidade numa NOVA aba (dentro do gesto do submit → sem
  // bloqueio de pop-up). A VSL continua viva nesta aba, então se algo falhar a
  // pessoa só toca no botão de novo — sem precisar rever o vídeo.
  const dest = getDiscordInvite();
  try { window.open(dest, "_blank", "noopener"); } catch (e) {}

  modalHead.hidden = true;
  formEl.hidden = true;
  successEl.hidden = false;
  $("#discord-link").href = dest;
  fireConfetti();
});

/* ============================================================
   Confetti (puro canvas, sem libs)
   ============================================================ */
function fireConfetti() {
  const colors = ["#1E3AFF", "#6B3DFF", "#00D1FF", "#22D46E", "#FFD300", "#E040FB"];
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:10001"; // acima do modal (z-index 10000)
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
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "wpp-fab js-wpp";
  fab.setAttribute("aria-label", "Abrir ajuda pelo WhatsApp");
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

  // clicar no botão flutuante abre/fecha o balão (não vai direto pro WhatsApp)
  fab.addEventListener("click", () => { pop.classList.toggle("show"); });

  // estilos (injetados, funcionam em qualquer página)
  const css = document.createElement("style");
  css.textContent = `
    .wpp-fab{position:fixed;right:18px;bottom:18px;z-index:9998;width:58px;height:58px;border-radius:50%;
      background:#25D366;color:#fff;display:grid;place-items:center;text-decoration:none;border:0;padding:0;cursor:pointer;
      box-shadow:0 10px 26px -6px rgba(37,211,102,.7),0 4px 12px rgba(0,0,0,.35);
      transition:transform .2s ease}
    .wpp-fab:hover{transform:scale(1.08)}
    .wpp-fab::after{content:"";position:absolute;inset:0;border-radius:50%;
      border:2px solid rgba(37,211,102,.5);animation:wppPulse 2.4s ease-out infinite}
    @keyframes wppPulse{0%{transform:scale(1);opacity:.6}70%{transform:scale(1.55);opacity:0}100%{transform:scale(1.55);opacity:0}}
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
