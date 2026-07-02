/* ============================================================
   DOPPA — Página VSL (/vsl) · vsl.js
   ------------------------------------------------------------
   Página focada no vídeo: player sem controles (no-skip),
   e o conteúdo + formulário só liberam quando o vídeo termina.
   O CONFIG abaixo espelha o do script.js da LP principal.
   ============================================================ */
const CONFIG = {
  DISCORD_WEBHOOK: "https://discord.com/api/webhooks/1521169421106675914/dnGEmdh9uO2Eq580qG5k6A74V2cqz4vjlRFHsLiv3aII6PRpq7LrMPbXI5zwlpUqub4k",
  DISCORD_INVITE: "https://discord.gg/JYGM6zuHhG",
  SHEET_ENDPOINT: "https://script.google.com/macros/s/AKfycbzCqQzGv_DTUR5WsYN6F0Su6P9dBPTqIaKc0gChbiHntuPshW24AVMg94dXaQwJdVGp/exec",
  SUPABASE_URL: "https://ajwfpdprgdcvrkermcwx.supabase.co",
  SUPABASE_KEY: "sb_publishable_7AIcd333tOtfC6hzaoNf2A_leFGCu82",

  VIDEO_URL: "https://youtu.be/2udUE_b2gus",
  VIDEO_POSTER: "",

  // Segundos até liberar o conteúdo. 0 = só quando o vídeo TERMINA.
  // Para revelar o CTA num momento específico (ex.: no ponto da oferta),
  // coloque o tempo em segundos aqui (ex.: 600 = aos 10 min).
  REVEAL_AT_SECONDS: 0,

  // Marca de origem do lead (pra separar da LP principal nos dados).
  ORIGEM: "vsl",

  REDIRECT_DELAY: 1400,
};

const $ = (s, c = document) => c.querySelector(s);

/* ============================================================
   VÍDEO da VSL — no-skip + liberação do conteúdo
   ============================================================ */
(() => {
  const player = $("#vsl-player");
  const playBtn = $("#vsl-play");
  const gate = $("#vsl-gate");
  const hint = $("#vsl-hint");
  if (!player || !playBtn) return;

  const url = CONFIG.VIDEO_URL || "";
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{6,})/);
  const ytId = ytMatch ? ytMatch[1] : null;
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

  // libera o conteúdo (uma vez só)
  let revealed = false;
  const revealGate = () => {
    if (revealed || !gate) return;
    revealed = true;
    gate.hidden = false;
    requestAnimationFrame(() => gate.classList.add("reveal-in"));
    if (hint) {
      hint.classList.add("is-done");
      const span = hint.querySelector("span");
      if (span) span.textContent = "Vídeo concluído — sua vaga está liberada!";
    }
    setTimeout(() => gate.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  };

  // camada que impede pausar/mexer no vídeo (no-skip)
  const addShield = () => {
    if (player.querySelector(".vslp__shield")) return;
    const sh = document.createElement("div");
    sh.className = "vslp__shield";
    sh.style.cssText = "position:absolute;inset:0;z-index:3;cursor:default;background:transparent";
    player.appendChild(sh);
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

  // se REVEAL_AT_SECONDS > 0, vigia o tempo e libera antes do fim
  const watchTime = getTime => {
    if (!(CONFIG.REVEAL_AT_SECONDS > 0)) return;
    const iv = setInterval(() => {
      const t = getTime();
      if (typeof t === "number" && t >= CONFIG.REVEAL_AT_SECONDS) { revealGate(); clearInterval(iv); }
    }, 1000);
  };

  const mount = () => {
    if (!url) { console.warn("Defina CONFIG.VIDEO_URL em vsl.js."); return; }
    player.classList.add("vsl__player--playing");

    if (ytId) {
      loadYT(() => {
        const holder = document.createElement("div");
        player.appendChild(holder);
        window.__ytPlayer = new YT.Player(holder, {
          videoId: ytId,
          playerVars: {
            autoplay: 1, rel: 0, modestbranding: 1,
            controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, playsinline: 1
          },
          events: {
            onReady: () => { addShield(); watchTime(() => window.__ytPlayer.getCurrentTime && window.__ytPlayer.getCurrentTime()); },
            onStateChange: e => { if (e.data === 0) revealGate(); } // 0 = ENDED
          }
        });
      });
    } else if (isFile) {
      const v = document.createElement("video");
      v.src = url; v.autoplay = true; v.playsInline = true; v.controls = false;
      v.addEventListener("ended", revealGate);
      player.appendChild(v);
      addShield();
      watchTime(() => v.currentTime);
    } else {
      const f = document.createElement("iframe");
      f.src = url + (url.includes("?") ? "&" : "?") + "autoplay=1";
      f.title = "Vídeo Doppa";
      f.allow = "autoplay; encrypted-media; picture-in-picture";
      player.appendChild(f);
      addShield();
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

document.querySelectorAll(".js-open-form").forEach(btn => btn.addEventListener("click", openModal));
document.querySelectorAll(".js-close-form").forEach(btn => btn.addEventListener("click", closeModal));
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
const clearErrors = () => document.querySelectorAll(".field__error").forEach(s => (s.textContent = ""));

const validateEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const onlyDigits = v => (v || "").replace(/\D/g, "");
const validatePhone = v => {
  const d = onlyDigits(v);
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = +d.slice(0, 2);
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
};
const maskPhone = v => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{0,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};
const phoneInput = $("#f-telefone");
if (phoneInput) {
  phoneInput.addEventListener("input", () => { phoneInput.value = maskPhone(phoneInput.value); });
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
   Envio (Discord + planilha + Supabase)
   ============================================================ */
const sendToDiscord = data => {
  if (!CONFIG.DISCORD_WEBHOOK) return Promise.resolve();
  const payload = {
    username: "Doppa · Novo Lead (VSL)",
    embeds: [{
      title: "🎯 Novo cadastro na VSL",
      color: 0x6b3dff,
      fields: [
        { name: "👤 Nome", value: data.nome || "—", inline: true },
        { name: "✉️ Email", value: data.email || "—", inline: true },
        { name: "📱 Telefone", value: data.telefone || "—", inline: true },
        { name: "🎬 Experiência", value: data.experiencia || "—" },
        { name: "🔞 Maioridade", value: data.maioridade || "—" },
        { name: "📍 Origem", value: CONFIG.ORIGEM },
      ],
      footer: { text: "Doppa · More you do, more you Doppa." },
      timestamp: new Date().toISOString(),
    }],
  };
  return fetch(CONFIG.DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(err => console.warn("Discord webhook falhou:", err));
};

const sendToSheet = data => {
  if (!CONFIG.SHEET_ENDPOINT) return Promise.resolve();
  const body = new URLSearchParams({
    email: data.email,
    nome: data.nome,
    telefone: data.telefone,
    experiencia: data.experiencia,
    maioridade: data.maioridade,
    origem: CONFIG.ORIGEM,
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
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) return Promise.resolve();
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
      origem: CONFIG.ORIGEM,
    }),
    keepalive: true,
  }).catch(err => console.warn("Supabase falhou:", err));
};

/* ============================================================
   Submit
   ============================================================ */
const submitBtn = $("#submit-btn");

formEl.addEventListener("submit", async e => {
  e.preventDefault();
  const data = getData();
  if (!validate(data)) return;

  submitBtn.disabled = true;
  sendToDiscord(data);
  sendToSheet(data);
  sendToSupabase(data);

  const maiorDeIdade = data.maioridade === "De acordo, sou maior de idade";

  if (!maiorDeIdade) {
    modalHead.hidden = true;
    formEl.hidden = true;
    waitEl.hidden = false;
    return;
  }

  modalHead.hidden = true;
  formEl.hidden = true;
  successEl.hidden = false;
  $("#discord-link").href = CONFIG.DISCORD_INVITE;
  fireConfetti();

  setTimeout(() => { window.location.href = CONFIG.DISCORD_INVITE; }, CONFIG.REDIRECT_DELAY);
});

/* ============================================================
   Confetti
   ============================================================ */
function fireConfetti() {
  const colors = ["#1E3AFF", "#6B3DFF", "#00D1FF", "#22D46E", "#FFD300", "#E040FB"];
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();

  const pieces = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2, y: innerHeight / 2,
    vx: (Math.random() - 0.5) * 14, vy: Math.random() * -16 - 4,
    size: Math.random() * 8 + 4, color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));

  let frame = 0;
  const gravity = 0.45;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.vy += gravity; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
    frame++;
    if (frame < 160) requestAnimationFrame(tick);
    else canvas.remove();
  };
  tick();
}
