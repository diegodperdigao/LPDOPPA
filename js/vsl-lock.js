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

  /* ---------- init ---------- */
  document.body.classList.add("is-locked");
  addBadges();
  addHint();
})();
