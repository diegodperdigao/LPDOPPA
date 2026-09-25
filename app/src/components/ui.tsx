import { useEffect, useMemo, useState } from "react";

export function CopyButton({ texto, label = "Copiar" }: { texto: string; label?: string }) {
  const [ok, setOk] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const t = document.createElement("textarea");
      t.value = texto; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    setOk(true);
    navigator.vibrate?.(30);
    setTimeout(() => setOk(false), 1800);
  }
  return (
    <button type="button" className={"copy-btn" + (ok ? " done" : "")} onClick={copiar}>
      {ok ? "✓ Copiado!" : `📋 ${label}`}
    </button>
  );
}

export function Check({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={"check" + (on ? " on" : "")} onClick={onToggle} aria-pressed={on}>
      <span className="check__box">{on ? "✓" : ""}</span>
      <span>{children}</span>
    </button>
  );
}

export function Confetti() {
  const pecas = useMemo(() => {
    const cores = ["#1E3AFF", "#6B3DFF", "#00D1FF", "#22D46E", "#FFD300", "#E040FB"];
    return Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 1.8,
      cor: cores[i % cores.length],
      rot: Math.random() * 360,
    }));
  }, []);
  const [vivo, setVivo] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVivo(false), 4500); return () => clearTimeout(t); }, []);
  if (!vivo) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pecas.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, background: p.cor, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

export function Dock({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="dock-space" />
      <div className="dock"><div className="wrap stack">{children}</div></div>
    </>
  );
}
