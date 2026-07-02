/* ============================================================
   DOPPA — Trava da página VSL (/vsl) · vsl-lock.js
   ------------------------------------------------------------
   A página é idêntica à LP, mas fica BLOQUEADA até o vídeo
   terminar. Enquanto travado:
     - clicar em "Quero minha vaga"  → pop-up "…desbloquear sua vaga"
     - clicar em qualquer outro botão → pop-up "…desbloquear as informações"
     - os botões de CTA mostram um cadeado dentro
   Ao terminar o vídeo (evento "doppa:videoended" disparado pelo
   script.js), tudo é liberado.
   ============================================================ */
(() => {
  const CTA_MSG  = "Assista até o final para desbloquear sua vaga";
  const INFO_MSG = "Assista até o final para desbloquear as informações";

  const LOCK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.4"/>' +
    '<path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>';

  const CTA_SEL = ".js-open-form";
  const INTERACTIVE = "a[href], button, summary, [role='button']";

  let locked = true;

  /* ---------- pop-up (toast) ---------- */
  let toast, toastTimer;
  const ensureToast = () => {
    if (toast) return;
    toast = document.createElement("div");
    toast.className = "vsl-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML =
      '<span class="vsl-toast__ico">' + LOCK_SVG + '</span>' +
      '<span class="vsl-toast__msg"></span>';
    document.body.appendChild(toast);
  };
  const showToast = (msg, ok) => {
    ensureToast();
    toast.classList.toggle("vsl-toast--ok", !!ok);
    toast.querySelector(".vsl-toast__msg").textContent = msg;
    // reinicia a animação
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  };

  /* ---------- cadeado dentro dos CTAs ---------- */
  const addBadges = () => {
    document.querySelectorAll(CTA_SEL).forEach(btn => {
      if (btn.querySelector(".vsl-lock-badge")) return;
      const b = document.createElement("span");
      b.className = "vsl-lock-badge";
      b.innerHTML = LOCK_SVG;
      btn.appendChild(b);
    });
  };
  const removeBadges = () =>
    document.querySelectorAll(".vsl-lock-badge").forEach(el => el.remove());

  /* ---------- interceptação de cliques ---------- */
  const isVideo = el => el.closest("#vsl-player"); // deixa o vídeo tocar/replay
  document.addEventListener("click", e => {
    if (!locked) return;
    const el = e.target.closest(INTERACTIVE);
    if (!el || isVideo(el)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showToast(el.closest(CTA_SEL) ? CTA_MSG : INFO_MSG);
  }, true); // fase de captura: roda antes dos handlers do script.js

  /* ---------- liberação ---------- */
  const unlock = () => {
    if (!locked) return;
    locked = false;
    removeBadges();
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-unlocked");
    // garante que todas as seções (que usam .reveal) fiquem visíveis
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("in"));
    showToast("Tudo liberado! Garanta sua vaga. 🎉", true);
  };
  document.addEventListener("doppa:videoended", unlock);

  /* ---------- aviso abaixo do vídeo ---------- */
  const addHint = () => {
    const host = document.querySelector(".hero__inner") || document.getElementById("hero");
    if (!host || document.querySelector(".vsl-locked-hint")) return;
    const hint = document.createElement("div");
    hint.className = "vsl-locked-hint";
    hint.innerHTML =
      '<span class="vsl-locked-hint__pill">' + LOCK_SVG +
      "<span>Assista ao vídeo até o final para desbloquear o conteúdo e sua vaga.</span></span>";
    host.appendChild(hint);
  };

  /* ---------- controles próprios do vídeo (pausar/volume/tela cheia, SEM seek) ---------- */
  const ICON = {
    play:  '<svg viewBox="0 0 24 24"><polygon points="7 5 19 12 7 19" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>',
    vol:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 8 9 13 5 13 19 8 15 4 15" fill="currentColor" stroke="none"/><path d="M16.5 8.5a4 4 0 0 1 0 7"/><path d="M18.5 6a7 7 0 0 1 0 12"/></svg>',
    mute:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 8 9 13 5 13 19 8 15 4 15" fill="currentColor" stroke="none"/><line x1="17" y1="9.5" x2="21" y2="14.5"/><line x1="21" y1="9.5" x2="17" y2="14.5"/></svg>',
    full:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/></svg>',
  };

  const buildControls = () => {
    const player = document.getElementById("vsl-player");
    const yt = window.__ytPlayer;
    if (!player || !yt || player.querySelector(".vsl-ctrl")) return;

    // camada que impede interação direta com o vídeo (só nossos botões controlam)
    const shield = document.createElement("div");
    shield.className = "vsl-shield";
    player.appendChild(shield);

    const mkBtn = (cls, html, label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vsl-ctrl__btn " + cls;
      b.setAttribute("aria-label", label);
      b.innerHTML = html;
      return b;
    };
    const bar = document.createElement("div");
    bar.className = "vsl-ctrl";
    const ppBtn = mkBtn("", ICON.pause, "Pausar ou continuar");
    const muteBtn = mkBtn("", ICON.vol, "Ativar/desativar som");
    const spacer = document.createElement("span");
    spacer.className = "vsl-ctrl__spacer";
    const fsBtn = mkBtn("", ICON.full, "Tela cheia");
    bar.append(ppBtn, muteBtn, spacer, fsBtn);
    player.appendChild(bar);

    ppBtn.addEventListener("click", () => {
      (yt.getPlayerState && yt.getPlayerState() === 1) ? yt.pauseVideo() : yt.playVideo();
    });
    muteBtn.addEventListener("click", () => {
      (yt.isMuted && yt.isMuted()) ? yt.unMute() : yt.mute();
    });
    fsBtn.addEventListener("click", () => {
      if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); return; }
      if (player.requestFullscreen) player.requestFullscreen();
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
    });

    // mantém os ícones sincronizados com o estado real do player
    const sync = setInterval(() => {
      if (!document.body.contains(bar)) return clearInterval(sync);
      ppBtn.innerHTML = (yt.getPlayerState && yt.getPlayerState() === 1) ? ICON.pause : ICON.play;
      muteBtn.innerHTML = (yt.isMuted && yt.isMuted()) ? ICON.mute : ICON.vol;
    }, 500);

    // ao terminar, remove os controles (a tela final assume)
    document.addEventListener("doppa:videoended", () => {
      clearInterval(sync);
      bar.remove();
      shield.remove();
    }, { once: true });
  };
  document.addEventListener("doppa:videoready", buildControls);

  /* ---------- init ---------- */
  document.body.classList.add("is-locked");
  addBadges();
  addHint();
})();
