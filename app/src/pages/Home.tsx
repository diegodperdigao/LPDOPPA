import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SEGMENTOS } from "../content";
import { api, type Roteiro, type Segmento } from "../lib/api";
import { useConta } from "../lib/conta";
import { igUrl } from "../lib/ig";
import TermoModal from "../components/TermoModal";
import { Confetti, CopyButton } from "../components/ui";
import BottomNav from "../components/BottomNav";

const MARCAS: Record<string, string> = { kingpanda: "🐼 King Panda", superbet: "⚡ Superbet", doppa: "👁️ Doppa" };

function Card({ r, perfil }: { r: Roteiro; perfil: string | null }) {
  const [aberto, setAberto] = useState(false);
  return (
    <article className="rot">
      <div className="rot__head">
        <span className="chip">{r.marca ? MARCAS[r.marca] ?? r.marca : "Roteiro"}</span>
      </div>
      <div className="rot__title">{r.titulo}</div>
      <div className={"rot__text" + (aberto ? " open" : "")}>{r.texto}</div>
      {r.imagem_url && aberto && <img src={r.imagem_url} alt="" loading="lazy" style={{ borderRadius: 14 }} />}
      <div className="rot__actions">
        <CopyButton texto={r.texto} label="Copiar roteiro" />
        <button className="copy-btn" onClick={() => setAberto(!aberto)}>{aberto ? "Fechar" : "👁️ Ver tudo"}</button>
        {r.imagem_url && <a className="copy-btn" href={r.imagem_url} download style={{ textDecoration: "none", color: "inherit" }}>⬇️ Imagem</a>}
        {perfil && <a className="copy-btn" href={igUrl(perfil)} target="_blank" rel="noopener" style={{ textDecoration: "none", color: "inherit" }}>📲 Abrir @{perfil}</a>}
      </div>
    </article>
  );
}

export default function Home() {
  const { conta } = useConta();
  const liberado = (useLocation().state as { liberado?: boolean } | null)?.liberado;
  const [seg, setSeg] = useState<Segmento>("esp");
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);
  const [termo, setTermo] = useState(false);

  useEffect(() => { api.roteirosDoDia().then(setRoteiros).catch(() => setRoteiros([])); }, []);

  // Termo: pop-up uma vez por sessão, depois fica só o banner.
  useEffect(() => {
    if (!conta || conta.termo_em) return;
    let visto = false;
    try { visto = sessionStorage.getItem("termo_pop") === "1"; sessionStorage.setItem("termo_pop", "1"); } catch { /* sem storage */ }
    if (visto) return;
    const t = setTimeout(() => setTermo(true), liberado ? 3500 : 1200);
    return () => clearTimeout(t);
  }, [conta, liberado]);

  const lista = (roteiros ?? []).filter((r) => r.segmento === seg);
  const perfil = seg === "esp" ? conta?.ig_esp ?? null : conta?.ig_cas ?? null;
  const hoje = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());

  return (
    <main className="wrap">
      {liberado && <Confetti />}
      <header className="app-top">
        <div className="hello">Oi,<b>{(conta?.nome || "criador").split(" ")[0]} 👋</b></div>
        <img src="/doppa-logo.webp" alt="DOPPA" style={{ height: 24, width: "auto" }} />
      </header>

      {liberado && (
        <div className="card card--glow center" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 40 }}>🔓</div>
          <b style={{ fontSize: 18 }}>Roteiros liberados!</b>
          <p className="muted" style={{ fontSize: 14 }}>Escolha um, copie, grave e poste. Bora pro primeiro vídeo!</p>
        </div>
      )}

      {conta && !conta.termo_em && (
        <button className="banner" style={{ marginBottom: 16 }} onClick={() => setTermo(true)}>
          <span className="banner__ico">📝</span>
          <span style={{ flex: 1 }}><b>Assine o termo pra receber</b><span>Seus vídeos já contam. O pagamento só sai com o termo assinado.</span></span>
          <span>›</span>
        </button>
      )}

      <h1 className="h-display h2">Roteiros do dia</h1>
      <p className="dim" style={{ marginBottom: 14, textTransform: "capitalize" }}>{hoje}</p>

      <div className="seg-tabs" style={{ marginBottom: 16 }}>
        {(["esp", "cas"] as Segmento[]).map((k) => {
          const n = (roteiros ?? []).filter((r) => r.segmento === k).length;
          return <button key={k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}>{SEGMENTOS[k].emoji} {SEGMENTOS[k].curto} {roteiros ? `(${n})` : ""}</button>;
        })}
      </div>

      <div className="stack">
        {roteiros === null && <div className="empty"><div>⏳</div>Carregando roteiros…</div>}
        {roteiros !== null && lista.length === 0 && (
          <div className="empty"><div>🌙</div>Os roteiros de hoje ainda não saíram.<br />A gente te avisa assim que chegarem.</div>
        )}
        {lista.map((r) => <Card key={r.id} r={r} perfil={perfil} />)}
      </div>

      <div className="bnav-space" />
      <BottomNav />
      {termo && <TermoModal onFechar={() => setTermo(false)} />}
    </main>
  );
}
