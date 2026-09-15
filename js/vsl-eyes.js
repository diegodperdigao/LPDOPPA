/* ============================================================
   DOPPA — Chuva de olhos (VSL) · js/vsl-eyes.js
   ------------------------------------------------------------
   Ao clicar em "Quero minha vaga" (já liberado), os olhos da Doppa
   caem com física real (colidem, rolam, se acomodam) até cobrir a
   tela inteira; quando a pilha encosta no topo, um olho gigante nasce
   no botão clicado e a pupila engole a tela → o modal abre "dentro".

   USO (no script.js):
     DoppaEyes.play(botaoClicado, () => openModal());

   Se prefers-reduced-motion estiver ativo, ou se os sprites não
   carregarem em 1,5s, chama o callback direto (sem animação).

   Assets (mesmos já usados no olho do hero):
     assets/eye-base.webp  — anel roxo + esclera (SEM íris)
     assets/eye-iris.webp  — íris + pupila, quadrada, transparente
   Aprovado no protótipo "Doppa Chuva de Olhos" (v15 · calmo).
   ============================================================ */
(function () {
  "use strict";

  const CFG = {
    BASE: "assets/eye-base.webp",
    IRIS: "assets/eye-iris.webp",
    LID_COLOR: "#4712C9",                          // cor da pálpebra (roxo do anel)
    COLORS: ["#FF9A1F","#1E3AFF","#22D46E","#8A3FFF","#FF3FB4","#FFD300"], // confete do gigante
    Z_INDEX: 9000,                                 // acima da página, ABAIXO do modal (10000)
    MOBILE_BP: 560,
    // tempos (ms)
    SETTLE_MS: 500,        // respiro com a tela cheia antes do gigante
    GIANT_MS: 800,         // pupila engolindo a tela
    SAFETY_MS: 5200,       // se por algum motivo não encher, vai pro gigante
    SWALLOW_HOLD_MS: 350,  // quanto o canvas fica após abrir o modal
  };

  // ---------- sprites ----------
  const S_BASE = new Image(), S_IRIS = new Image();
  S_BASE.decoding = S_IRIS.decoding = "async";
  let loaded = 0;
  S_BASE.onload = S_IRIS.onload = () => { loaded++; };
  const warm = () => { if (!S_BASE.src) { S_BASE.src = CFG.BASE; S_IRIS.src = CFG.IRIS; } };
  // aquece no primeiro gesto (não entra no caminho crítico do LCP)
  ["pointerdown","touchstart","keydown"].forEach(ev => window.addEventListener(ev, warm, { once: true, passive: true }));
  if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 3000);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // PADRÃO = modo C: o olho gigante da transição cresce centralizado e congela de
  // fundo do modal. Pra testar o modo A (engole a tela), use ?eyes=giant.
  const FREEZE = new URLSearchParams(location.search).get("eyes") !== "giant";
  const easeIO = k => (k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3) / 2);

  // ---------- desenho ----------
  function drawEye(ctx, x, y, r, rot, lx, ly, lid) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.drawImage(S_BASE, -r, -r, r*2, r*2);
    const ir = r*.41, ix = lx*r*.3, iy = ly*r*.3;          // íris olha para o botão
    ctx.drawImage(S_IRIS, ix-ir, iy-ir, ir*2, ir*2);
    if (lid > 0) { ctx.fillStyle = CFG.LID_COLOR; ctx.beginPath(); ctx.ellipse(0, -r*.86 + r*.86*lid, r*.88, r*.88*lid, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function makeRays(tx, ty, n) {
    const out = [];
    for (let i = 0; i < n; i++) { const a = Math.random()*Math.PI*2, sp = 7 + Math.random()*10;
      out.push({ x: tx, y: ty, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 3, len: 14 + Math.random()*24, w: 5 + Math.random()*7, col: CFG.COLORS[i % CFG.COLORS.length], rot: a, life: 1 }); }
    return out;
  }
  function drawGiant(ctx, S, e1, rays, dt) {
    const { tx, ty, W, H } = S; const R = Math.hypot(W, H); const r = Math.max(30, 60 + e1*R*1.15);
    rays.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.vy += .35*dt; p.life -= .012*dt; p.rot += .05*dt;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.moveTo(0, -p.w/2); ctx.lineTo(p.len, 0); ctx.lineTo(0, p.w/2); ctx.closePath(); ctx.fill(); ctx.restore(); });
    ctx.save();
    // olho gigante VETORIAL (círculos + gradientes) — nítido em qualquer tamanho, sem distorcer no upscale
    const ring = ctx.createRadialGradient(tx, ty, r*.74, tx, ty, r);
    ring.addColorStop(0, "#6a2df0"); ring.addColorStop(.55, "#4712C9"); ring.addColorStop(1, "#280a86");
    ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(tx, ty, r, 0, 7); ctx.fill();
    // sheen (brilho suave no topo do anel, pra não ficar chapado)
    const sheen = ctx.createLinearGradient(tx, ty - r, tx, ty);
    sheen.addColorStop(0, "rgba(255,255,255,.28)"); sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen; ctx.beginPath(); ctx.arc(tx, ty, r, 0, 7); ctx.fill();
    // esclera
    ctx.fillStyle = "#eef0fb"; ctx.beginPath(); ctx.arc(tx, ty, r*.82, 0, 7); ctx.fill();
    // pupila (radial escura → roxo)
    const ir = r*(.41 + e1*.7);
    const g = ctx.createRadialGradient(tx, ty, ir*.35, tx, ty, ir); g.addColorStop(0, "#070a22"); g.addColorStop(.75, "#1a0f6b"); g.addColorStop(1, "#3d18c4");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx, ty, ir, 0, 7); ctx.fill();
    // brilho
    ctx.globalAlpha = Math.max(0, 1 - e1*1.3); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(tx + ir*.28, ty - ir*.3, ir*.14, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ---------- canvas fixo (viewport inteira) ----------
  let canvas = null, playing = false, stopReq = false;
  function getCanvas() {
    if (canvas) return canvas;
    canvas = document.createElement("canvas");
    canvas.className = "vsl-eyes";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;z-index:${CFG.Z_INDEX};pointer-events:none;display:none`;
    document.body.appendChild(canvas);
    return canvas;
  }

  // ---------- a animação ----------
  function play(fromEl, done) {
    if (playing) return;
    if (reduced()) { done(); return; }
    warm();
    if (loaded < 2) { // espera os sprites (máx. 1,5s), senão abre direto
      const t = Date.now();
      const wait = () => { if (loaded >= 2) run(fromEl, done); else if (Date.now() - t > 1500) done(); else setTimeout(wait, 50); };
      wait(); return;
    }
    run(fromEl, done);
  }

  function run(fromEl, done) {
    playing = true; stopReq = false;
    const c = getCanvas(), ctx = c.getContext("2d"); const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight; c.width = W*dpr; c.height = H*dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); c.style.display = "block";
    const br = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : { left: W/2, top: H/2, width: 0, height: 0 };
    const tx = br.left + br.width/2, ty = br.top + br.height/2; // ponto de onde o gigante nasce
    const S = { c, ctx, W, H, tx, ty };
    const mobile = W < CFG.MOBILE_BP, TOP = 0, BOT = H;

    const R0 = mobile ? 17 : 23, R1 = mobile ? 25 : 34, RA = (R0 + R1)/2;
    const target = Math.floor((W*(BOT - TOP)) / (Math.PI*RA*RA) * 1.35); // teto; quem manda é a pilha tocar o topo
    const G = mobile ? .7 : .8, VMAX = mobile ? 13 : 16, RATE = mobile ? 3.2 : 5;
    const eyes = []; const CS = R1*2, GW = Math.ceil(W/CS) + 1, GH = Math.ceil((H + 400)/CS) + 1; let grid;
    let pileTop = BOT;

    const spawn = () => {
      const r = R0 + Math.random()*(R1 - R0); const x = r + Math.random()*(W - 2*r); const y = TOP - r - Math.random()*700;
      if (eyes.length > 0 && pileTop < TOP + R1*1.2) return false;                // pilha chegou no topo
      for (let i = eyes.length - 1; i >= 0 && i > eyes.length - 60; i--) {       // não nasce em cima de outro
        const e = eyes[i]; if (Math.hypot(e.x - x, e.y - y) < (e.r + r)*1.02) return false; }
      eyes.push({ x, y, px: x - (Math.random() - .5)*1.2, py: y - (2 + Math.random()*3), r, rot: Math.random()*6.28, lid: 0,
        blink: 1500 + Math.random()*4000, asleep: false, still: 0 });
      return true;
    };

    function solve() {
      grid = new Array(GW*GH);
      const cellOf = e => Math.min(GH-1, Math.max(0, ((e.y - TOP + 400)/CS)|0))*GW + Math.min(GW-1, Math.max(0, (e.x/CS)|0));
      eyes.forEach((e, i) => { const k = cellOf(e); (grid[k] || (grid[k] = [])).push(i); });
      for (let it = 0; it < 4; it++) {
        for (let i = 0; i < eyes.length; i++) {
          const a = eyes[i]; const gx = Math.min(GW-1, Math.max(0, (a.x/CS)|0)), gy = Math.min(GH-1, Math.max(0, ((a.y - TOP + 400)/CS)|0));
          for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
            const cx = gx + ox, cy = gy + oy; if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue; const cell = grid[cy*GW + cx]; if (!cell) continue;
            for (const j of cell) {
              if (j <= i) continue; const b = eyes[j]; if (a.asleep && b.asleep) continue;
              let dx = b.x - a.x, dy = b.y - a.y; const md = (a.r + b.r)*.97; const d2 = dx*dx + dy*dy; if (d2 >= md*md || d2 === 0) continue;
              const d = Math.sqrt(d2), pen = md - d; const o = pen/d*.42; dx *= o; dy *= o;
              // dormentes são estáticos: só acordam com pancada de verdade
              if (a.asleep) { if (pen > 2.5) { a.asleep = false; a.still = 0; } else { b.x += dx*2; b.y += dy*2; continue; } }
              if (b.asleep) { if (pen > 2.5) { b.asleep = false; b.still = 0; } else { a.x -= dx*2; a.y -= dy*2; continue; } }
              a.x -= dx; a.y -= dy; b.x += dx; b.y += dy;
            }
          }
          // paredes absorvem; chão zera a velocidade vertical (sem quique)
          if (a.x < a.r) { a.x = a.r; a.px = a.x + (a.x - a.px)*.3; }
          if (a.x > W - a.r) { a.x = W - a.r; a.px = a.x + (a.x - a.px)*.3; }
          if (a.y > BOT - a.r) { a.y = BOT - a.r; a.py = a.y; }
        }
      }
    }

    // física em passo FIXO de 16,7ms → igual em 60Hz e 120Hz
    let acc = 0, physAcc = 0, phase = 0, tFull = 0, settledSince = 0;
    function step(el) {
      if (phase === 0) { const rate = el < 300 ? .06 : RATE; acc += rate; let tries = 0;
        while (acc >= 1 && eyes.length < target && tries < 20) { if (spawn()) acc--; tries++; } if (tries >= 20) acc = 0; }
      eyes.forEach(e => {
        if (e.asleep) { e.px = e.x; e.py = e.y; return; }
        let vx = e.x - e.px, vy = e.y - e.py; let sp = Math.hypot(vx, vy);
        const damp = sp < 1.5 ? .75 : .985; vx *= damp; vy *= damp; sp *= damp; if (sp > VMAX) { vx *= VMAX/sp; vy *= VMAX/sp; }
        if (sp < .3) { e.still++; if (e.still > 10) { e.asleep = true; vx = 0; vy = 0; } } else e.still = 0;
        e.px = e.x; e.py = e.y; e.x += vx; e.y += vy + G; e.rot += vx/e.r*.6;
      });
      solve();
      pileTop = BOT; eyes.forEach(e => { if (Math.abs(e.y - e.py) < .6 && e.y > TOP + e.r && e.y < pileTop) pileTop = e.y; });
    }

    const rays = makeRays(tx, ty, 30); const t0 = performance.now(); let last = t0;
    let frozen = false;
    function frame(now) {
      if (stopReq) { playing = false; return; }
      if (frozen) return;   // modo C: olho gigante estático de fundo — nada a redesenhar
      const elapsed = Math.min(50, now - last); last = now; const dt = elapsed/16.7; const el = now - t0;

      physAcc += elapsed; let steps = 0; while (physAcc >= 16.7 && steps < 3) { step(el); physAcc -= 16.7; steps++; }
      const filled = eyes.length >= target || pileTop < TOP + R1*2.5;
      if (phase === 0 && filled) { if (!settledSince) settledSince = el; if (el - settledSince > CFG.SETTLE_MS) { phase = 2; tFull = el; } }
      if (phase === 0 && el > CFG.SAFETY_MS) { phase = 2; tFull = el; }
      ctx.clearRect(0, 0, W, H);
      eyes.forEach(e => {
        const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
        // piscadas esporádicas, lentas
        e.blink -= 16*dt;
        if (e.blink < 0) { e.lid = Math.min(1, e.lid + .11*dt); if (e.lid >= 1) e.blink = 2500 + Math.random()*4000; }
        else if (e.lid > 0) e.lid = Math.max(0, e.lid - .11*dt);
        drawEye(ctx, e.x, e.y, e.r, e.rot, dx/d, dy/d, e.lid);
      });
      if (phase >= 2) {
        const k = Math.min(1, (el - tFull)/CFG.GIANT_MS);
        if (FREEZE) {
          // MESMO olho da transição (drawGiant), mas CENTRALIZADO e parando parcial
          // (~0.42) — vira um olho gigante preenchendo a tela, sem engolir de vez.
          drawGiant(ctx, { c: c, ctx: ctx, W: W, H: H, tx: W/2, ty: H/2 }, easeIO(k)*0.42, [], dt);
          if (k >= 1) { frozen = true; document.body.classList.add("is-eyefield"); done(); return; } // congela de fundo, abre o modal
        } else {
          drawGiant(ctx, S, easeIO(k), rays, dt);  // modo A: engole a tela
          if (k >= 1) { finish(); return; }
        }
      }
      requestAnimationFrame(frame);
    }
    function finish() {
      document.body.classList.add("is-swallowed"); // o CSS do modal usa isso pro fundo "dentro do olho"
      done();
      setTimeout(() => { c.style.display = "none"; ctx.clearRect(0, 0, W, H); playing = false; }, CFG.SWALLOW_HOLD_MS);
    }
    requestAnimationFrame(frame);
  }

  // tira o canvas de olhos usado como fundo (modo B) — chamado no closeModal
  function clear() {
    stopReq = true; // encerra o loop idle do modo B
    if (canvas) { canvas.style.display = "none"; try { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); } catch (e) {} }
    document.body.classList.remove("is-eyefield");
    playing = false;
  }

  window.DoppaEyes = { play, warm, clear };
})();
