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
    bigplay: '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="rgba(10,14,43,.55)" stroke="#fff" stroke-width="2.5"/><polygon points="29 22 53 36 29 50" fill="#fff"/></svg>',
    play:  '<svg viewBox="0 0 24 24"><polygon points="7 5 19 12 7 19" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>',
    vol:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 8 9 13 5 13 19 8 15 4 15" fill="currentColor" stroke="none"/><path d="M16.5 8.5a4 4 0 0 1 0 7"/><path d="M18.6 6a7 7 0 0 1 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 8 9 13 5 13 19 8 15 4 15" fill="currentColor" stroke="none"/><line x1="17" y1="9.5" x2="21" y2="14.5"/><line x1="21" y1="9.5" x2="17" y2="14.5"/></svg>',
  };

  const buildControls = () => {
    const player = document.getElementById("vsl-player");
    const yt = window.__ytPlayer;
    if (!player || !yt || player.querySelector(".vsl-ctrl")) return;

    const toggle = () => (yt.getPlayerState && yt.getPlayerState() === 1) ? yt.pauseVideo() : yt.playVideo();

    // camada sobre o vídeo: toque = pausar/continuar (via API, funciona no mobile)
    // e cobre o play do YouTube quando pausado (com um play central único).
    const shield = document.createElement("div");
    shield.className = "vsl-shield";
    shield.innerHTML = '<span class="vsl-shield__play">' + ICON.bigplay + "</span>";
    player.appendChild(shield);
    shield.addEventListener("click", toggle);

    const mkBtn = (html, label) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "vsl-ctrl__btn";
      b.setAttribute("aria-label", label); b.innerHTML = html;
      return b;
    };
    const bar = document.createElement("div");
    bar.className = "vsl-ctrl";
    const ppBtn = mkBtn(ICON.pause, "Pausar ou continuar");
    const muteBtn = mkBtn(ICON.vol, "Ativar/desativar som");
    const vol = document.createElement("input");
    vol.type = "range"; vol.min = "0"; vol.max = "100"; vol.value = "100";
    vol.className = "vsl-ctrl__vol"; vol.setAttribute("aria-label", "Volume");
    bar.append(ppBtn, muteBtn, vol);
    player.appendChild(bar);

    ppBtn.addEventListener("click", toggle);
    muteBtn.addEventListener("click", () => {
      if (yt.isMuted && yt.isMuted()) { yt.unMute(); if (+vol.value === 0) { yt.setVolume(100); vol.value = "100"; } }
      else { yt.mute(); }
    });
    vol.addEventListener("input", () => {
      const v = +vol.value;
      yt.setVolume(v);
      if (v === 0) yt.mute();
      else if (yt.isMuted && yt.isMuted()) yt.unMute();
    });

    // sincroniza play/pause (barra + centro) e o ícone de som com o estado real
    const sync = setInterval(() => {
      if (!document.body.contains(bar)) return clearInterval(sync);
      const playing = yt.getPlayerState && (yt.getPlayerState() === 1 || yt.getPlayerState() === 3);
      ppBtn.innerHTML = playing ? ICON.pause : ICON.play;
      shield.classList.toggle("is-paused", !playing);
      muteBtn.innerHTML = (yt.isMuted && yt.isMuted()) ? ICON.mute : ICON.vol;
    }, 400);

    // ao terminar, remove os controles (a tela final assume)
    document.addEventListener("doppa:videoended", () => {
      clearInterval(sync); bar.remove(); shield.remove();
    }, { once: true });
  };
  document.addEventListener("doppa:videoready", buildControls);

  /* ---------- init ---------- */
  document.body.classList.add("is-locked");
  addBadges();
  addHint();
})();
