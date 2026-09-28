import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpen, Clapperboard, CornerDownLeft, Flag, Search, UserRound, X, type LucideIcon } from "lucide-react";
import { BIO_TEXTO, MARCAS, PRODUCAO, SEGMENTOS } from "../content";
import { api, hojeSP, type Campanha, type Funil, type Roteiro } from "../lib/api";
import { useAvisos } from "../lib/avisos";
import { useConta } from "../lib/conta";
import Portal from "./Portal";

export type Pagina = { to: string; icon: LucideIcon; nome: string };
type Resultado = { grupo: string; icon: LucideIcon; titulo: string; sub?: string; ir: () => void };

// Sem acento e minúsculo, pra "noticias" achar "Notícias".
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const corta = (s: string, n = 90) => (s.length > n ? s.slice(0, n).trimEnd() + "…" : s);

export default function Busca({ paginas, onFechar }: { paginas: Pagina[]; onFechar: () => void }) {
  const nav = useNavigate();
  const { conta } = useConta();
  const { avisos } = useAvisos();
  const admin = conta?.papel === "admin";
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [funil, setFunil] = useState<Funil | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const fechar = useRef(onFechar);
  fechar.current = onFechar;

  useEffect(() => {
    input.current?.focus();
    api.roteiros(hojeSP()).then(setRoteiros).catch(() => {});
    api.campanhas().then(setCampanhas).catch(() => {});
    if (admin) api.adminCriadores().then(setFunil).catch(() => {});
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar.current();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [admin]);

  const ir = (to: string, state?: unknown) => () => { onFechar(); nav(to, state ? { state } : undefined); };

  const resultados = useMemo<Resultado[]>(() => {
    const t = norm(q.trim());
    if (!t) return paginas.map((p) => ({ grupo: "Páginas", icon: p.icon, titulo: p.nome, ir: ir(p.to) }));
    const bate = (...xs: (string | null | undefined)[]) => xs.some((x) => x && norm(x).includes(t));
    const r: Resultado[] = [];
    paginas.filter((p) => bate(p.nome)).forEach((p) => r.push({ grupo: "Páginas", icon: p.icon, titulo: p.nome, ir: ir(p.to) }));
    roteiros.filter((x) => x.publicado && bate(x.titulo, x.texto, x.legenda, x.marca && MARCAS[x.marca])).slice(0, 8).forEach((x) =>
      r.push({ grupo: "Roteiros de hoje", icon: Clapperboard, titulo: x.titulo, sub: `${SEGMENTOS[x.segmento].curto} · ${corta(x.texto, 70)}`, ir: ir("/roteiros") }));
    campanhas.filter((c) => bate(c.titulo, c.ciclo, c.corpo, ...c.regras, ...c.marcas.map((m) => MARCAS[m] ?? m))).forEach((c) =>
      r.push({ grupo: "Campanhas", icon: Flag, titulo: `${c.ciclo ? c.ciclo + " · " : ""}${c.titulo}`, ir: ir("/campanha") }));
    avisos.filter((a) => bate(a.titulo, a.corpo)).slice(0, 6).forEach((a) =>
      r.push({ grupo: "Avisos", icon: Bell, titulo: a.titulo, sub: corta(a.corpo), ir: ir("/avisos") }));
    PRODUCAO.filter((d) => bate(d.titulo, ...d.passos)).forEach((d) =>
      r.push({ grupo: "Aprender", icon: BookOpen, titulo: d.titulo, sub: corta(d.passos.join(" · ")), ir: ir("/aprender") }));
    if (bate("bio", "link", BIO_TEXTO)) r.push({ grupo: "Aprender", icon: BookOpen, titulo: "Texto e link da bio", ir: ir("/aprender") });
    if (admin && funil) {
      const pessoas = [
        ...funil.contas.map((c) => ({ nome: c.nome, sub: [c.ig_esp && "@" + c.ig_esp, c.email].filter(Boolean).join(" · "), ig: [c.ig_esp, c.ig_cas, c.email] })),
        ...funil.legado.map((c) => ({ nome: c.nome, sub: [c.ig_esp && "@" + c.ig_esp, "legado"].filter(Boolean).join(" · "), ig: [c.ig_esp, c.ig_cas] })),
      ];
      pessoas.filter((p) => bate(p.nome, ...p.ig)).slice(0, 8).forEach((p) =>
        r.push({ grupo: "Criadores", icon: UserRound, titulo: p.nome || "Sem nome", sub: p.sub, ir: ir("/admin/criadores", { busca: p.nome }) }));
    }
    return r;
  }, [q, paginas, roteiros, campanhas, avisos, funil, admin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setSel(0), [q]);

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(resultados.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter") resultados[sel]?.ir();
  }

  let grupoAnterior = "";
  return (
    <Portal>
      <div className="busca" onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <div className="busca__box" role="dialog" aria-modal="true" aria-label="Pesquisar">
          <div className="busca__campo">
            <Search size={18} />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={teclas} placeholder="Pesquisar roteiros, campanhas, avisos…" autoComplete="off" />
            <button className="icon-btn" onClick={onFechar} aria-label="Fechar"><X size={17} /></button>
          </div>
          <div className="busca__lista">
            {resultados.length === 0 && <div className="busca__vazio">Nada encontrado pra “{q}”.</div>}
            {resultados.map((r, k) => {
              const cab = r.grupo !== grupoAnterior ? (grupoAnterior = r.grupo) : null;
              return (
                <div key={k}>
                  {cab && <div className="busca__grupo">{cab}</div>}
                  <button className={"busca__item" + (k === sel ? " on" : "")} onMouseEnter={() => setSel(k)} onClick={r.ir}>
                    <r.icon size={17} strokeWidth={1.9} />
                    <span><b>{r.titulo}</b>{r.sub && <small>{r.sub}</small>}</span>
                    {k === sel && <CornerDownLeft size={14} className="busca__enter" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Portal>
  );
}
