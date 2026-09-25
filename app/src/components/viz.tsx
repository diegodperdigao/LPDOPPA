import { useEffect, useRef, useState } from "react";
import { ddmm, type Dia } from "../lib/api";

// Número que "sobe" até o valor (dá vida ao painel).
export function Contador({ valor, formato = (n: number) => Math.round(n).toLocaleString("pt-BR") }: { valor: number; formato?: (n: number) => string }) {
  const [v, setV] = useState(0);
  const ini = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const de = 0, dur = 900;
    ini.current = null;
    const passo = (t: number) => {
      if (ini.current === null) ini.current = t;
      const k = Math.min(1, (t - ini.current) / dur);
      setV(de + (valor - de) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return <>{formato(v)}</>;
}

// Anel de progresso da meta.
export function Anel({ valor, meta, tamanho = 168 }: { valor: number; meta: number; tamanho?: number }) {
  const r = 70, c = 2 * Math.PI * r;
  const pct = meta ? Math.min(1, valor / meta) : 0;
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(pct), 60); return () => clearTimeout(t); }, [pct]);
  const batida = valor >= meta;
  return (
    <svg viewBox="0 0 168 168" width={tamanho} height={tamanho} role="img" aria-label={`${valor} de ${meta} vídeos`}>
      <defs>
        <linearGradient id="gAnel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={batida ? "#22D46E" : "#2A52FF"} />
          <stop offset="1" stopColor={batida ? "#0FB6C6" : "#7B4DFF"} />
        </linearGradient>
      </defs>
      <circle cx="84" cy="84" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" />
      <circle cx="84" cy="84" r={r} fill="none" stroke="url(#gAnel)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 84 84)"
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }} />
      <text x="84" y="80" textAnchor="middle" fill="#fff" fontFamily="Anton" fontSize="44">{valor}</text>
      <text x="84" y="106" textAnchor="middle" fill="#9AA2CC" fontFamily="Poppins" fontSize="13">de {meta} vídeos</text>
    </svg>
  );
}

// Barras por dia do ciclo (Esportes + Notícias empilhados) com a linha da meta.
export function Barras({ dias, meta }: { dias: Dia[]; meta: number }) {
  const max = Math.max(meta * 1.25, ...dias.map((d) => d.videos), 1);
  const [ativo, setAtivo] = useState<Dia | null>(dias[dias.length - 1] ?? null);
  return (
    <div className="bars">
      <div className="bars__info">
        {ativo ? (
          <><b>{ddmm(ativo.date)}</b> · {ativo.videos} vídeos <span className="dim">(⚽ {ativo.esp} · 📰 {ativo.cas})</span> {ativo.ok ? <span className="chip chip--green">Dia perfeito</span> : null}</>
        ) : "—"}
      </div>
      <div className="bars__plot">
        <div className="bars__meta" style={{ bottom: `${(meta / max) * 100}%` }}><span>meta {meta}</span></div>
        {dias.map((d, i) => (
          <button key={d.date} className={"bars__col" + (ativo?.date === d.date ? " on" : "")} onClick={() => setAtivo(d)} onMouseEnter={() => setAtivo(d)}
            aria-label={`${ddmm(d.date)}: ${d.videos} vídeos`}>
            <i className="cas" style={{ height: `${(d.cas / max) * 100}%`, animationDelay: `${i * 18}ms` }} />
            <i className="esp" style={{ height: `${(d.esp / max) * 100}%`, animationDelay: `${i * 18}ms` }} />
          </button>
        ))}
      </div>
      <div className="bars__leg"><span><i className="esp" /> Esportes</span><span><i className="cas" /> Notícias</span></div>
    </div>
  );
}

// Calendário do ciclo: cada dia colorido pela meta.
export function Calendario({ dias, meta }: { dias: Dia[]; meta: number }) {
  return (
    <div className="cal">
      {dias.map((d) => {
        const n = d.ok ? "ok" : d.videos >= meta / 2 ? "meio" : d.videos > 0 ? "pouco" : "zero";
        return (
          <div key={d.date} className={"cal__d " + n} title={`${ddmm(d.date)}: ${d.videos} vídeos`}>
            <span>{d.date.slice(8, 10)}</span>
            <b>{d.videos || ""}</b>
          </div>
        );
      })}
    </div>
  );
}
