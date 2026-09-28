import { useEffect, useState } from "react";
import { CalendarRange, Check, ChevronDown, Flag, ListChecks, Target, Timer, Wallet } from "lucide-react";
import { MARCAS } from "../content";
import { api, BRL, ddmm, hojeSP, type Campanha as TCampanha } from "../lib/api";
import Shell from "../components/Shell";
import { IconTile } from "../components/Icon";

const periodo = (c: TCampanha) => (c.fim ? `${ddmm(c.inicio)} a ${ddmm(c.fim)}` : `desde ${ddmm(c.inicio)}`);

// Vale a que já começou e não terminou; senão, a mais recente.
function atualDe(lista: TCampanha[]) {
  const hoje = hojeSP();
  return lista.find((c) => c.inicio <= hoje && (!c.fim || c.fim >= hoje)) ?? lista[0] ?? null;
}

function Detalhe({ c }: { c: TCampanha }) {
  const numeros = [
    c.meta_dia && { icon: Target, tom: "violet" as const, v: `${c.meta_dia}`, r: "vídeos por dia" },
    c.duracao_min && { icon: Timer, tom: "yellow" as const, v: `${c.duracao_min}s`, r: "mínimo por vídeo" },
    c.valor_mes != null && { icon: Wallet, tom: "green" as const, v: BRL(c.valor_mes).replace(",00", ""), r: "por mês" },
  ].filter(Boolean) as { icon: typeof Target; tom: "violet" | "yellow" | "green"; v: string; r: string }[];
  return (
    <>
      {numeros.length > 0 && (
        <div className="camp-nums">
          {numeros.map((n) => (
            <div key={n.r} className="camp-num"><IconTile icon={n.icon} tom={n.tom} size={32} /><b>{n.v}</b><span>{n.r}</span></div>
          ))}
        </div>
      )}
      {c.regras.length > 0 && (
        <section className="card" style={{ marginTop: 12 }}>
          <div className="card-h"><IconTile icon={ListChecks} tom="pink" size={30} /> Regras do ciclo</div>
          <ul className="camp-regras">{c.regras.map((r) => <li key={r}><Check size={16} strokeWidth={2.6} />{r}</li>)}</ul>
        </section>
      )}
      {c.corpo.trim() && <section className="card camp-corpo" style={{ marginTop: 12 }}>{c.corpo}</section>}
    </>
  );
}

export default function Campanha() {
  const [lista, setLista] = useState<TCampanha[] | null>(null);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);
  useEffect(() => { api.campanhas().then(setLista).catch((e) => { setErro(e.message); setLista([]); }); }, []);

  const atual = lista && atualDe(lista);
  const anteriores = lista?.filter((c) => c !== atual) ?? [];

  return (
    <Shell titulo="Campanha">
      {erro && <div className="alert">{erro}</div>}
      {lista === null && <div className="skel" style={{ height: 200, borderRadius: 22 }} />}
      {lista && !atual && <div className="empty"><IconTile icon={Flag} tom="violet" size={52} />A campanha do ciclo ainda não foi publicada. A gente avisa assim que sair.</div>}

      {atual && (
        <>
          <section className="camp-hero">
            <span className="eyebrow">Campanha atual{atual.ciclo ? ` · ${atual.ciclo}` : ""}</span>
            <h2 className="h-display">{atual.titulo}</h2>
            <span className="row dim" style={{ gap: 6 }}><CalendarRange size={15} /> {periodo(atual)}</span>
            {atual.marcas.length > 0 && <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{atual.marcas.map((m) => <span key={m} className="chip chip--violet">{MARCAS[m] ?? m}</span>)}</div>}
          </section>
          <Detalhe c={atual} />
        </>
      )}

      {anteriores.length > 0 && (
        <>
          <div className="sec-t"><h3>Campanhas anteriores</h3></div>
          <div className="stack">
            {anteriores.map((c) => (
              <section key={c.id} className="guide">
                <button className="guide__head" onClick={() => setAberta(aberta === c.id ? null : c.id)} aria-expanded={aberta === c.id}>
                  <IconTile icon={Flag} tom="neutral" size={30} />
                  <b>{c.ciclo ? `${c.ciclo} · ` : ""}{c.titulo}<span className="dim" style={{ display: "block", fontWeight: 400, fontSize: 12.5 }}>{periodo(c)}</span></b>
                  <ChevronDown size={18} style={{ transform: aberta === c.id ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </button>
                {aberta === c.id && <div className="guide__body ob-body"><Detalhe c={c} /></div>}
              </section>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
