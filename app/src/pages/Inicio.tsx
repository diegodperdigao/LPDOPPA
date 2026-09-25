import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, BRL, ddmm, hojeSP, type Roteiro } from "../lib/api";
import { useConta } from "../lib/conta";
import { ultimaContagem, usePainel } from "../lib/painel";
import Shell from "../components/Shell";
import TermoModal from "../components/TermoModal";
import { Confetti } from "../components/ui";
import { Anel, Barras, Contador } from "../components/viz";

function Tile({ ico, rot, valor, sub, cor }: { ico: string; rot: string; valor: React.ReactNode; sub?: string; cor?: string }) {
  return (
    <div className="tile">
      <div className="tile__ico" style={cor ? { background: cor } : undefined}>{ico}</div>
      <div className="tile__rot">{rot}</div>
      <div className="tile__val">{valor}</div>
      {sub && <div className="tile__sub">{sub}</div>}
    </div>
  );
}

export default function Inicio() {
  const { conta } = useConta();
  const liberado = (useLocation().state as { liberado?: boolean } | null)?.liberado;
  const { dados, erro } = usePainel();
  const [roteiros, setRoteiros] = useState<Roteiro[] | null>(null);
  const [termo, setTermo] = useState(false);

  useEffect(() => { api.roteiros(hojeSP()).then(setRoteiros).catch(() => setRoteiros([])); }, []);
  useEffect(() => {
    if (!conta || conta.termo_em) return;
    let visto = false;
    try { visto = sessionStorage.getItem("termo_pop") === "1"; sessionStorage.setItem("termo_pop", "1"); } catch { /* sem storage */ }
    if (visto) return;
    const t = setTimeout(() => setTermo(true), liberado ? 3500 : 1500);
    return () => clearTimeout(t);
  }, [conta, liberado]);

  const ult = dados ? ultimaContagem(dados) : null;
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()));
  const saud = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Shell titulo="Início">
      {liberado && <Confetti />}
      <div className="hello-big">
        <span className="muted">{saud},</span>
        <h2 className="h-display">{(conta?.nome || "criador").split(" ")[0]} 👋</h2>
      </div>

      {liberado && (
        <div className="card card--glow center" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 40 }}>🔓</div>
          <b style={{ fontSize: 18 }}>Roteiros liberados!</b>
          <p className="muted" style={{ fontSize: 14 }}>Escolha um, copie, grave e poste. Bora pro primeiro vídeo!</p>
          <Link to="/roteiros" className="btn" style={{ marginTop: 12 }}>Ver roteiros de hoje →</Link>
        </div>
      )}

      {conta && !conta.termo_em && (
        <button className="banner" style={{ marginBottom: 16 }} onClick={() => setTermo(true)}>
          <span className="banner__ico">📝</span>
          <span style={{ flex: 1 }}><b>Assine o termo pra receber</b><span>Seus vídeos já contam. O pagamento só sai com o termo assinado.</span></span>
          <span>›</span>
        </button>
      )}

      <div className="grid-home">
        <section className="card meta-card">
          <div className="row" style={{ justifyContent: "space-between", width: "100%" }}>
            <b>🎯 Meta do dia</b>
            {ult && <span className="chip">{ult.date === hojeSP() ? "hoje" : `última contagem ${ddmm(ult.date)}`}</span>}
          </div>
          {dados ? <Anel valor={ult?.videos ?? 0} meta={dados.params.meta} /> : <div className="skel" style={{ width: 168, height: 168, borderRadius: "50%" }} />}
          <p className="dim center">A contagem é atualizada pelo time ao longo do dia.</p>
        </section>

        <div className="tiles">
          <Tile ico="🎬" rot="Vídeos no ciclo" valor={dados ? <Contador valor={dados.my.total} /> : <span className="skel skel--txt" />} sub={dados?.cycle.label} />
          <Tile ico="✅" rot="Dias perfeitos" valor={dados ? <Contador valor={dados.my.perfect} /> : <span className="skel skel--txt" />} sub={`meta ${dados?.params.meta ?? 30}/dia`} cor="linear-gradient(135deg,#22D46E,#0FB6C6)" />
          <Tile ico="🔥" rot="Melhor sequência" valor={dados ? <><Contador valor={dados.my.streak} /> <small>dias</small></> : <span className="skel skel--txt" />} cor="linear-gradient(135deg,#FF8A00,#FF3D71)" />
          <Tile ico="🎟️" rot="Tickets" valor={dados ? <Contador valor={dados.my.tickets} /> : <span className="skel skel--txt" />} sub="perfeitos × sequência" cor="linear-gradient(135deg,#FFD300,#FF8A00)" />
        </div>
      </div>

      {dados && dados.incentivo.diasRestantes > 0 && !dados.pagamento?.pago && (
        <div className="incentivo">
          <div>
            <span>Complete os <b>{dados.incentivo.diasRestantes} dias</b> que faltam e receba até</span>
            <strong><Contador valor={dados.incentivo.potencial} formato={BRL} /></strong>
          </div>
          <Link to="/carteira" className="btn btn--sm btn--green">Carteira →</Link>
        </div>
      )}

      {dados && dados.my.days.length > 0 && (
        <section className="card" style={{ marginTop: 16 }}>
          <b>📊 Seu ciclo dia a dia</b>
          <Barras dias={dados.my.days} meta={dados.params.meta} />
        </section>
      )}
      {erro && <div className="alert" style={{ marginTop: 16 }}>{erro}</div>}

      <section style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <h3 className="h-display h2">Roteiros de hoje</h3>
          <Link to="/roteiros" className="link-btn" style={{ padding: 0 }}>ver todos →</Link>
        </div>
        <div className="rot-mini">
          {roteiros === null && [0, 1].map((i) => <div key={i} className="skel" style={{ height: 76, borderRadius: 18 }} />)}
          {roteiros?.length === 0 && <div className="card muted center">Os roteiros de hoje ainda não saíram. Te avisamos no grupo. 🌙</div>}
          {roteiros?.slice(0, 3).map((r) => (
            <Link key={r.id} to="/roteiros" className="rot-mini__i">
              <span className="rot-mini__ico">{r.segmento === "esp" ? "⚽" : "📰"}</span>
              <span style={{ flex: 1, minWidth: 0 }}><b>{r.titulo}</b><span>{r.texto.slice(0, 70)}…</span></span>
              <span>›</span>
            </Link>
          ))}
        </div>
      </section>

      {termo && <TermoModal onFechar={() => setTermo(false)} />}
    </Shell>
  );
}
